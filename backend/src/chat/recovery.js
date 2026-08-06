/**
 * Orphaned-run recovery (Notes/Chat/CHAT_ARCHITECTURE.md §8).
 *
 * A process restart mid-reply leaves a chat_agent_runs row stuck in 'running'
 * and a client watching a typing indicator that will never stop. The sweep runs
 * at boot and every 60s: any run older than its timeout is marked abandoned,
 * and each affected conversation gets typing-off plus an apology and a handoff.
 * That turns an unbounded hang into a bounded 90-second failure.
 */
import { sweepOrphanedRuns, getOwnedConversation } from "./db.js";
import { query } from "../db.js";
import { handoff } from "./hermes/agent.js";

const INTERVAL_MS = 60_000;

async function sweep(io) {
  try {
    const conversationIds = await sweepOrphanedRuns();
    for (const id of conversationIds) {
      io.to(`conv:${id}`).emit("hermes:typing", { conversationId: id, on: false });
      const { rows } = await query("SELECT * FROM chat_conversations WHERE id = $1", [id]);
      const conversation = rows[0];
      if (!conversation || conversation.status !== "bot") continue;
      await handoff(io, conversation, "agent_interrupted", {
        text: "Sorry — something interrupted me while I was replying.",
      });
      console.warn(`[chat] recovered orphaned run on conversation ${id}`);
    }
  } catch (err) {
    console.error("[chat] recovery sweep failed:", err.message);
  }
}

export function startRecovery(io) {
  void sweep(io);
  const timer = setInterval(() => void sweep(io), INTERVAL_MS);
  timer.unref?.();
  return timer;
}

export { getOwnedConversation };
