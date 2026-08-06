/**
 * Chat REST (history + conversation list) behind the same JWT middleware as
 * every other /client route. The socket carries live traffic; these exist for
 * first paint and the unread badge. Read-only — there is deliberately no export
 * endpoint (spec §8.8).
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listConversations, getOwnedConversation, getMessages, insertMessage, setConversationStatus } from "./db.js";
import { query } from "../db.js";

/**
 * STAFF ROUTES (mounted before requireAuth — they are NOT client-authenticated).
 *
 * This is the seam the CRM Customer Service Hub will use in Phase 3: post a
 * reply into a conversation as a human agent. Auth is a shared secret in
 * CHAT_AGENT_TOKEN, checked in constant-ish time; without it set, the route is
 * disabled entirely rather than open.
 *
 * Delivery is via the NOTIFY trigger, so a reply written straight into
 * portal.chat_messages by the CRM reaches the client the same way this does.
 */
export const chatStaffRouter = Router();

chatStaffRouter.use((req, res, next) => {
  const expected = process.env.CHAT_AGENT_TOKEN;
  if (!expected) return res.status(503).json({ message: "Staff chat API is not enabled." });
  const given = req.headers["x-agent-token"];
  if (given !== expected) return res.status(401).json({ message: "Unauthorised." });
  next();
});

/** Conversations waiting for a human (the CS queue). */
chatStaffRouter.get("/queue", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.id, c.contact_id, c.claim_id, c.status, c.handoff_reason, c.last_message_at,
              (SELECT body FROM chat_messages m WHERE m.conversation_id = c.id
                ORDER BY m.id DESC LIMIT 1) AS last_message
         FROM chat_conversations c
        WHERE c.status IN ('human_queued','human_active')
        ORDER BY c.last_message_at ASC NULLS LAST`,
    );
    res.json({ conversations: rows });
  } catch (err) {
    next(err);
  }
});

/** Full transcript for one conversation (staff view). */
chatStaffRouter.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const messages = await getMessages(req.params.id, { limit: 100 });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

/** Post a reply as a human agent. Claims the conversation on first reply. */
chatStaffRouter.post("/conversations/:id/reply", async (req, res, next) => {
  try {
    const body = String(req.body?.body || "").trim();
    if (!body) return res.status(400).json({ message: "Message body is required." });
    if (body.length > 4000) return res.status(400).json({ message: "Message is too long." });

    const { rows } = await query("SELECT * FROM chat_conversations WHERE id = $1", [req.params.id]);
    const conversation = rows[0];
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    // A human replying owns the conversation — this also keeps Sarah silent.
    if (conversation.status !== "human_active") {
      await setConversationStatus(conversation.id, "human_active");
    }
    const agentId = Number.isInteger(Number(req.body?.agentUserId)) ? Number(req.body.agentUserId) : null;
    const message = await insertMessage(conversation.id, "agent", agentId, body, {
      agentName: req.body?.agentName ? String(req.body.agentName).slice(0, 80) : undefined,
    });
    // Broadcast happens via the NOTIFY trigger → listener.
    res.json({ success: true, message });
  } catch (err) {
    next(err);
  }
});

export const chatRouter = Router();
chatRouter.use(requireAuth);

/** This client's conversations + unread total (drives the Chat nav badge). */
chatRouter.get("/conversations", async (req, res, next) => {
  try {
    if (!req.contact) return res.json({ conversations: [], unread: 0 });
    const rows = await listConversations(req.contact.id);
    const conversations = rows.map((c) => ({
      id: String(c.id),
      claimId: c.claim_id == null ? null : String(c.claim_id),
      status: c.status,
      lastMessage: c.last_message_body || "",
      lastMessageAt: c.last_message_at,
      unread: c.unread,
    }));
    res.json({
      conversations,
      unread: conversations.reduce((sum, c) => sum + c.unread, 0),
    });
  } catch (err) {
    next(err);
  }
});

/** Paginated history for one conversation (ownership-checked). */
chatRouter.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    if (!req.contact) return res.status(404).json({ message: "Conversation not found." });
    const conversation = await getOwnedConversation(req.params.id, req.contact.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    const before = req.query.before ? Number(req.query.before) : null;
    const messages = await getMessages(conversation.id, { beforeId: before, limit: Number(req.query.limit) || 50 });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});
