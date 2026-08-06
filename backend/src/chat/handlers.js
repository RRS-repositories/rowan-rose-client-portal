/**
 * Socket event handlers (Notes/Chat/CHAT_ARCHITECTURE.md §3).
 *
 * THE authorisation boundary: the server decides room membership; the client
 * never names a room. Every handler resolves the conversation by
 * (id, socket.data.contactId) — a client naming someone else's conversation
 * gets FORBIDDEN and joins nothing. contactId comes from the JWT handshake and
 * from nowhere else.
 */
import {
  findOrCreateConversation, getOwnedConversation, getMessages, getMessagesSince,
  insertClientMessage, insertMessage, markClientRead, countRecentClientMessages,
  setConversationStatus,
} from "./db.js";
import { runAgent, handoff } from "./hermes/agent.js";
import { markEmitted, notifyTyping } from "./listener.js";
import { greeting } from "./hermes/prompt.js";
import { crmEnabled, crmQuery } from "../crmdb.js";
import { mapStatus } from "../crm/statusMap.js";

const MAX_BODY = 2000;
const RATE_LIMIT = Number(process.env.CHAT_RATE_LIMIT_PER_MIN || 10);
const room = (id) => `conv:${id}`;

/**
 * The AI assistant is OFF unless explicitly switched on (Brad, 2026-08-06:
 * human↔human chat first, the bot comes later). When off, conversations open
 * straight into the human queue, the greeting is from the claims team, and the
 * agent is never invoked — the client never sees Sarah at all.
 */
const assistantEnabled = () =>
  process.env.CHAT_ASSISTANT_ENABLED === "true" && Boolean(process.env.ANTHROPIC_API_KEY);

const fail = (socket, code, message, conversationId) =>
  socket.emit("chat:error", { code, message, conversationId });

/** A claim is the client's own AND client-visible, or it doesn't exist to them. */
async function ownsClaim(contactId, claimId) {
  if (claimId == null) return true; // general enquiry
  if (!crmEnabled()) return false;
  const { rows } = await crmQuery(
    "SELECT status FROM public.cases WHERE id = $1 AND contact_id = $2",
    [Number(claimId), contactId],
  );
  return Boolean(rows[0]) && mapStatus(rows[0].status) !== null;
}

export function registerHandlers(io, socket) {
  const contactId = socket.data.contactId;

  socket.on("conversation:open", async ({ claimId = null } = {}) => {
    try {
      const id = claimId == null ? null : Number(claimId);
      if (!(await ownsClaim(contactId, id))) {
        return fail(socket, "FORBIDDEN", "That claim isn't available.");
      }
      let conversation = await findOrCreateConversation(contactId, id);
      socket.join(room(conversation.id));

      const withAssistant = assistantEnabled();
      // Assistant off → the thread belongs to the team from the start, so it
      // shows up in the CS queue and nothing ever routes to the agent.
      if (!withAssistant && conversation.status === "bot") {
        conversation = (await setConversationStatus(conversation.id, "human_queued", {
          handoffReason: "assistant_disabled",
        })) || conversation;
      }

      let messages = await getMessages(conversation.id, { limit: 50 });
      // Server-generated greeting so the thread works the moment it opens.
      if (messages.length === 0) {
        const first = withAssistant
          ? await insertMessage(conversation.id, "hermes", null, greeting(socket.data.firstName), {})
          : await insertMessage(
              conversation.id, "system", null,
              `Hi ${socket.data.firstName} — send us a message here and a member of your claims team will reply.`,
              {},
            );
        messages = [first];
      }
      socket.emit("conversation:opened", { conversation, messages, assistant: withAssistant });
    } catch (err) {
      console.error("[chat] conversation:open failed:", err.message);
      fail(socket, "NOT_FOUND", "We couldn't open that conversation.");
    }
  });

  socket.on("conversation:sync", async ({ conversationId, sinceMessageId = 0 } = {}) => {
    try {
      const conversation = await getOwnedConversation(conversationId, contactId);
      if (!conversation) return fail(socket, "FORBIDDEN", "That conversation isn't available.", conversationId);
      socket.join(room(conversation.id));
      const messages = await getMessagesSince(conversation.id, sinceMessageId);
      socket.emit("conversation:synced", { conversationId: conversation.id, messages, status: conversation.status });
    } catch (err) {
      console.error("[chat] conversation:sync failed:", err.message);
      fail(socket, "NOT_FOUND", "We couldn't refresh that conversation.", conversationId);
    }
  });

  socket.on("message:send", async ({ conversationId, body, clientMsgUuid } = {}) => {
    try {
      const conversation = await getOwnedConversation(conversationId, contactId);
      if (!conversation) return fail(socket, "FORBIDDEN", "That conversation isn't available.", conversationId);

      const text = String(body || "").trim();
      if (!text) return;
      if (text.length > MAX_BODY) {
        return fail(socket, "TOO_LONG", `Please keep messages under ${MAX_BODY} characters.`, conversationId);
      }
      if ((await countRecentClientMessages(contactId)) >= RATE_LIMIT) {
        return fail(socket, "RATE_LIMITED", "You're sending messages very quickly — please wait a moment.", conversationId);
      }

      const { row, isNew } = await insertClientMessage(conversation.id, contactId, text, clientMsgUuid);
      if (!row) return fail(socket, "NOT_FOUND", "We couldn't send that message.", conversationId);

      // Ack before the agent runs — a 4-second model call must never look
      // like a 4-second send.
      socket.emit("message:ack", { clientMsgUuid, messageId: row.id, createdAt: row.created_at });
      if (!isNew) return; // retry of an already-stored message: never re-run the agent
      markEmitted(row.id); // the NOTIFY bridge skips what we broadcast here
      io.to(room(conversation.id)).emit("message:new", row);

      if (conversation.status === "bot" && assistantEnabled()) {
        // Async, non-blocking: the ack is already out.
        void runAgent(io, {
          conversationId: conversation.id,
          contactId,
          firstName: socket.data.firstName,
          triggerMessageId: row.id,
        });
      }
    } catch (err) {
      console.error("[chat] message:send failed:", err.message);
      fail(socket, "AGENT_UNAVAILABLE", "We couldn't send that just now. Please try again.", conversationId);
    }
  });

  // Client is composing. Relayed to the CRM over Postgres NOTIFY so the agent
  // sees the dots in the Communication tab — the CRM isn't in the socket room,
  // and the DB is the one thing both processes share.
  socket.on("typing", async ({ conversationId } = {}) => {
    const conversation = await getOwnedConversation(conversationId, contactId).catch(() => null);
    if (!conversation) return;
    socket.to(room(conversation.id)).emit("typing", { conversationId: conversation.id });
    notifyTyping(conversation.id, contactId, "client").catch(() => {});
  });

  socket.on("messages:read", async ({ conversationId, upToMessageId } = {}) => {
    try {
      await markClientRead(conversationId, contactId, upToMessageId);
    } catch (err) {
      console.error("[chat] messages:read failed:", err.message);
    }
  });

  socket.on("handoff:request", async ({ conversationId } = {}) => {
    try {
      const conversation = await getOwnedConversation(conversationId, contactId);
      if (!conversation) return fail(socket, "FORBIDDEN", "That conversation isn't available.", conversationId);
      if (conversation.status !== "bot") return; // already with a person
      await handoff(io, conversation, "client_requested");
    } catch (err) {
      console.error("[chat] handoff:request failed:", err.message);
      fail(socket, "AGENT_UNAVAILABLE", "We couldn't pass this on just now. Please try again.", conversationId);
    }
  });
}

export { setConversationStatus };
