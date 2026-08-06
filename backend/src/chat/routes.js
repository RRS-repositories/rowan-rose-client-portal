/**
 * Chat REST (history + conversation list) behind the same JWT middleware as
 * every other /client route. The socket carries live traffic; these exist for
 * first paint and the unread badge. Read-only — there is deliberately no export
 * endpoint (spec §8.8).
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listConversations, getOwnedConversation, getMessages } from "./db.js";

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
