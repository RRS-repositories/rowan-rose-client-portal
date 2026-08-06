/**
 * Hermes orchestration (Notes/Chat/CHAT_ARCHITECTURE.md §5).
 *
 * Pipeline: run row → typing on → preCheck → context → Claude → postCheck →
 * persist → run completed. The run row is written BEFORE the model call so a
 * process restart mid-reply is recoverable (recovery.js sweeps it), which is
 * what bounds "client stares at a typing indicator forever" to 90 seconds.
 *
 * Two invariants:
 *  1. If conversation.status !== 'bot', the agent NEVER runs. Guarded at the
 *     top of this function, not only at the call site — call sites multiply.
 *  2. Every failure path ends in a handoff. Never silence, never a hung
 *     typing indicator.
 */
import {
  getOwnedConversation, insertMessage, setConversationStatus,
  createRun, finishRun, getMessages,
} from "../db.js";
import { buildContext } from "./contextBuilder.js";
import { buildSystemPrompt, buildContextBlock } from "./prompt.js";
import { preCheck, postCheck, handoffMessage } from "./guardrails.js";
import { complete, claudeEnabled } from "./claude.js";
import { notifyHandoff } from "../mattermost.js";

// Inline execution with no queue is the spec, but unbounded concurrency against
// the Anthropic API is not. Saturation fails to handoff rather than piling up.
const MAX_CONCURRENT = 8;
let running = 0;

const emit = (io, conversationId, event, payload) =>
  io.to(`conv:${conversationId}`).emit(event, payload);

/** Flip to human, post the notice, alert CS. Used by every failure path. */
export async function handoff(io, conversation, reason, { text = null } = {}) {
  const updated = await setConversationStatus(conversation.id, "human_queued", { handoffReason: reason });
  if (text) {
    const msg = await insertMessage(conversation.id, "hermes", null, text, {});
    emit(io, conversation.id, "message:new", msg);
  }
  const notice = await insertMessage(
    conversation.id, "system", null, handoffMessage(reason),
    { handoff: { reason } },
  );
  emit(io, conversation.id, "message:new", notice);
  emit(io, conversation.id, "conversation:status", { conversationId: conversation.id, status: "human_queued" });
  // Webhook failure must never block the handoff — the DB queue is the truth.
  notifyHandoff({ conversation: updated || conversation, reason }).catch(() => {});
  return notice;
}

/**
 * Handle one client message. Never throws — the socket handler awaits nothing
 * from it, and every internal failure resolves into a handoff.
 */
export async function runAgent(io, { conversationId, contactId, firstName, triggerMessageId }) {
  let conversation = await getOwnedConversation(conversationId, contactId);
  if (!conversation || conversation.status !== "bot") return; // invariant 1

  const runId = await createRun(conversationId, triggerMessageId);
  const startedAt = Date.now();
  emit(io, conversationId, "hermes:typing", { conversationId, on: true });

  try {
    if (running >= MAX_CONCURRENT) {
      await handoff(io, conversation, "agent_busy");
      await finishRun(runId, { status: "handoff", handoffReason: "agent_busy", latencyMs: Date.now() - startedAt });
      return;
    }
    running += 1;

    const history = await getMessages(conversationId, { limit: 20 });
    const last = [...history].reverse().find((m) => m.sender_type === "client");
    const body = last?.body || "";

    // Pre-filter: skip the model entirely on hard-handoff topics.
    const pre = preCheck(body);
    if (pre) {
      await handoff(io, conversation, pre.reason);
      await finishRun(runId, { status: "handoff", preFilterHit: pre.reason, handoffReason: pre.reason, latencyMs: Date.now() - startedAt });
      return;
    }

    if (!claudeEnabled()) {
      await handoff(io, conversation, "agent_unavailable");
      await finishRun(runId, { status: "failed", error: "no_api_key", handoffReason: "agent_unavailable", latencyMs: Date.now() - startedAt });
      return;
    }

    const { context, card } = await buildContext(contactId, firstName, conversation.claim_id);
    const contextText = JSON.stringify(context);

    // Conversation history for the model: the context block rides as the first
    // user turn, then the real transcript (client + Sarah only).
    const turns = [
      { role: "user", content: buildContextBlock(context) },
      ...history
        .filter((m) => m.sender_type === "client" || m.sender_type === "hermes")
        .map((m) => ({ role: m.sender_type === "client" ? "user" : "assistant", content: m.body })),
    ];

    const res = await complete({ system: buildSystemPrompt(), history: turns });
    if (!res.ok) {
      await handoff(io, conversation, "agent_error");
      await finishRun(runId, { status: "failed", error: res.error, handoffReason: "agent_error", latencyMs: Date.now() - startedAt });
      return;
    }

    const checked = postCheck(res.text, { contextText });
    if (checked.blocked) {
      await handoff(io, conversation, checked.handoff || checked.blocked);
      await finishRun(runId, {
        status: "handoff", postFilterHit: checked.blocked,
        handoffReason: checked.handoff || checked.blocked,
        model: res.model, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens,
        latencyMs: Date.now() - startedAt,
      });
      return;
    }

    // Attach the pre-built card when the client asked about status.
    const wantsStatus = /\b(status|update|what'?s happening|how(?:'s| is) (?:my|the) claim|progress)\b/i.test(body);
    const meta = {
      model: res.model,
      usage: res.usage,
      ...(wantsStatus && card ? { card } : {}),
    };

    const msg = await insertMessage(conversationId, "hermes", null, checked.text, meta);
    emit(io, conversationId, "message:new", msg);

    if (checked.handoff) {
      await handoff(io, conversation, checked.handoff);
      await finishRun(runId, {
        status: "handoff", handoffReason: checked.handoff, replyMessageId: msg.id,
        model: res.model, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens,
        latencyMs: Date.now() - startedAt,
      });
      return;
    }

    await finishRun(runId, {
      status: "completed", replyMessageId: msg.id, model: res.model,
      inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens,
      latencyMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error("[hermes] run failed:", err.message);
    try {
      conversation = (await getOwnedConversation(conversationId, contactId)) || conversation;
      if (conversation?.status === "bot") await handoff(io, conversation, "agent_error");
      await finishRun(runId, { status: "failed", error: err.message, handoffReason: "agent_error", latencyMs: Date.now() - startedAt });
    } catch { /* nothing further we can do; the sweep will catch it */ }
  } finally {
    if (running > 0) running -= 1;
    emit(io, conversationId, "hermes:typing", { conversationId, on: false });
  }
}
