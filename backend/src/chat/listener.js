/**
 * Postgres LISTEN → socket bridge.
 *
 * Any INSERT into portal.chat_messages fires a NOTIFY (see sql/chat_notify.sql);
 * we re-read the row and broadcast it to that conversation's room. This is what
 * lets a message written by the CRM — or by the staff reply endpoint, or by raw
 * SQL — reach the client instantly, without the CRM needing to know anything
 * about sockets.
 *
 * De-dupe: the portal already emits its own inserts synchronously, so we keep a
 * short-lived set of ids emitted that way and skip them here. The client also
 * ignores duplicate message ids, so a double-emit is harmless either way.
 *
 * A dedicated pg client (not the pool) is required — LISTEN is per-connection.
 * On connection loss we reconnect with backoff; on the way back up, clients
 * reconcile through conversation:sync, so a gap costs no messages.
 */
import pg from "pg";
import { query } from "../db.js";

const { Client } = pg;
const RECONNECT_MS = 3000;

/** Ids the socket layer already broadcast; skip them when the NOTIFY arrives. */
const recentlyEmitted = new Set();
export function markEmitted(messageId) {
  const id = String(messageId);
  recentlyEmitted.add(id);
  setTimeout(() => recentlyEmitted.delete(id), 30_000).unref?.();
}

/** Publish a typing signal both processes can hear (portal ↔ CRM). */
export async function notifyTyping(conversationId, contactId, from) {
  await query("SELECT pg_notify('chat_typing', $1)", [
    JSON.stringify({ conversation_id: conversationId, contact_id: contactId, from }),
  ]);
}

async function handleTyping(io, payload) {
  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return;
  }
  // Only the agent's typing needs relaying INTO the portal; the client's own
  // keystrokes came from here in the first place.
  if (parsed.from !== "agent") return;
  let conversationId = parsed.conversation_id;
  // The CRM knows the contact, not necessarily which thread is open.
  if (!conversationId && parsed.contact_id) {
    const { rows } = await query(
      `SELECT id FROM chat_conversations
        WHERE contact_id = $1 AND status <> 'resolved'
        ORDER BY last_message_at DESC NULLS LAST LIMIT 1`,
      [parsed.contact_id],
    );
    conversationId = rows[0]?.id;
  }
  if (conversationId) {
    io.to(`conv:${conversationId}`).emit("agent:typing", { conversationId: String(conversationId) });
  }
}

async function handleNotification(io, payload) {
  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return;
  }
  const messageId = String(parsed.message_id ?? "");
  if (!messageId || recentlyEmitted.has(messageId)) return;

  const { rows } = await query("SELECT * FROM chat_messages WHERE id = $1", [messageId]);
  const message = rows[0];
  if (!message) return;

  io.to(`conv:${message.conversation_id}`).emit("message:new", message);

  // A staff reply means a human owns this conversation now — tell the client so
  // the composer stops implying they're talking to Sarah.
  if (message.sender_type === "agent") {
    const { rows: conv } = await query(
      "SELECT status FROM chat_conversations WHERE id = $1",
      [message.conversation_id],
    );
    if (conv[0]) {
      io.to(`conv:${message.conversation_id}`).emit("conversation:status", {
        conversationId: String(message.conversation_id),
        status: conv[0].status,
      });
    }
  }
}

export function startListener(io) {
  let client = null;
  let stopped = false;

  const connect = async () => {
    if (stopped) return;
    client = new Client({ connectionString: process.env.DATABASE_URL });
    client.on("error", (err) => {
      console.error("[chat] listener connection error:", err.message);
      try { client.end(); } catch { /* already gone */ }
      if (!stopped) setTimeout(connect, RECONNECT_MS).unref?.();
    });
    client.on("notification", (msg) => {
      const handler = msg.channel === "chat_message" ? handleNotification
        : msg.channel === "chat_typing" ? handleTyping
        : null;
      if (handler) {
        void handler(io, msg.payload).catch((e) =>
          console.error(`[chat] ${msg.channel} handling failed:`, e.message),
        );
      }
    });
    try {
      await client.connect();
      await client.query("LISTEN chat_message");
      await client.query("LISTEN chat_typing");
      console.log("✔ chat listener attached (LISTEN chat_message, chat_typing)");
    } catch (err) {
      console.error("[chat] listener connect failed:", err.message);
      setTimeout(connect, RECONNECT_MS).unref?.();
    }
  };

  void connect();
  return () => { stopped = true; client?.end().catch(() => {}); };
}
