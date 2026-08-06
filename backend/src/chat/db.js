/**
 * Chat table queries (portal.chat_* — portal_app pool). Every function that
 * reads or mutates a conversation takes the OWNER's contactId and enforces it
 * in SQL — the contactId always comes from the socket/REST auth layer, never
 * from a client payload. Messages are append-only: no UPDATE on body, no
 * DELETE anywhere in this module (or the schema grants).
 */
import { query } from "../db.js";

/** Find-or-create the live conversation for (contact, claim). Upsert against
 *  the partial unique index so two tabs can never create two threads. */
export async function findOrCreateConversation(contactId, claimId) {
  const { rows } = await query(
    `INSERT INTO chat_conversations (contact_id, claim_id)
     VALUES ($1, $2)
     ON CONFLICT (contact_id, COALESCE(claim_id, 0)) WHERE status <> 'resolved'
     DO UPDATE SET updated_at = now()
     RETURNING *`,
    [contactId, claimId ?? null],
  );
  return rows[0];
}

/** The conversation, only if this contact owns it. Null otherwise. */
export async function getOwnedConversation(conversationId, contactId) {
  const { rows } = await query(
    `SELECT * FROM chat_conversations WHERE id = $1 AND contact_id = $2`,
    [conversationId, contactId],
  );
  return rows[0] ?? null;
}

/** This contact's conversations, newest activity first, with a last-message
 *  preview and the unread count driven off the high-water mark (indexed —
 *  never a read_at scan). */
export async function listConversations(contactId) {
  const { rows } = await query(
    `SELECT c.*,
            (SELECT body FROM chat_messages m
              WHERE m.conversation_id = c.id
              ORDER BY m.id DESC LIMIT 1) AS last_message_body,
            (SELECT count(*)::int FROM chat_messages m
              WHERE m.conversation_id = c.id
                AND m.id > COALESCE(c.last_client_read_id, 0)
                AND m.sender_type <> 'client') AS unread
       FROM chat_conversations c
      WHERE c.contact_id = $1
      ORDER BY c.last_message_at DESC NULLS LAST`,
    [contactId],
  );
  return rows;
}

/** Latest messages (ascending order for rendering). id is the cursor. */
export async function getMessages(conversationId, { beforeId = null, limit = 50 } = {}) {
  const { rows } = await query(
    `SELECT * FROM (
       SELECT * FROM chat_messages
        WHERE conversation_id = $1 AND ($2::bigint IS NULL OR id < $2)
        ORDER BY id DESC LIMIT $3
     ) latest ORDER BY id ASC`,
    [conversationId, beforeId, Math.min(Number(limit) || 50, 100)],
  );
  return rows;
}

/** Everything after sinceMessageId — the reconnect backfill. */
export async function getMessagesSince(conversationId, sinceMessageId) {
  const { rows } = await query(
    `SELECT * FROM chat_messages
      WHERE conversation_id = $1 AND id > $2
      ORDER BY id ASC LIMIT 200`,
    [conversationId, Number(sinceMessageId) || 0],
  );
  return rows;
}

/**
 * Idempotent client message insert. A retried socket emit after a dropped ack
 * conflicts on (conversation_id, client_msg_uuid) and yields no row — the
 * caller re-acks the existing row and MUST NOT re-run the agent.
 * Returns { row, isNew }.
 */
export async function insertClientMessage(conversationId, contactId, body, clientMsgUuid) {
  const { rows } = await query(
    `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, body, client_msg_uuid)
     VALUES ($1, 'client', $2, $3, $4)
     ON CONFLICT (conversation_id, client_msg_uuid) WHERE client_msg_uuid IS NOT NULL
     DO NOTHING
     RETURNING *`,
    [conversationId, contactId, body, clientMsgUuid ?? null],
  );
  if (rows[0]) return { row: rows[0], isNew: true };
  const { rows: existing } = await query(
    `SELECT * FROM chat_messages
      WHERE conversation_id = $1 AND client_msg_uuid = $2`,
    [conversationId, clientMsgUuid],
  );
  return { row: existing[0] ?? null, isNew: false };
}

/** Hermes / system / (later) agent messages. */
export async function insertMessage(conversationId, senderType, senderId, body, meta = {}) {
  const { rows } = await query(
    `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, body, meta)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *`,
    [conversationId, senderType, senderId, body, JSON.stringify(meta)],
  );
  return rows[0];
}

/** Client read high-water mark (drives the unread badge). Monotonic. */
export async function markClientRead(conversationId, contactId, upToMessageId) {
  await query(
    `UPDATE chat_conversations
        SET last_client_read_id = GREATEST(COALESCE(last_client_read_id, 0), $3)
      WHERE id = $1 AND contact_id = $2`,
    [conversationId, contactId, Number(upToMessageId) || 0],
  );
}

/** Server-side rate limit: client messages across all conversations. */
export async function countRecentClientMessages(contactId, windowSeconds = 60) {
  const { rows } = await query(
    `SELECT count(*)::int AS n
       FROM chat_messages m
       JOIN chat_conversations c ON c.id = m.conversation_id
      WHERE c.contact_id = $1 AND m.sender_type = 'client'
        AND m.created_at > now() - make_interval(secs => $2)`,
    [contactId, windowSeconds],
  );
  return rows[0].n;
}

/** Handoff / status transitions. */
export async function setConversationStatus(conversationId, status, { handoffReason = null } = {}) {
  const { rows } = await query(
    `UPDATE chat_conversations
        SET status = $2,
            handoff_reason = COALESCE($3, handoff_reason),
            handoff_at = CASE WHEN $2 = 'human_queued' THEN now() ELSE handoff_at END,
            resolved_at = CASE WHEN $2 = 'resolved' THEN now() ELSE resolved_at END,
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [conversationId, status, handoffReason],
  );
  return rows[0];
}

// ── Agent run audit rows ─────────────────────────────────────────────────────

export async function createRun(conversationId, triggerMessageId) {
  const { rows } = await query(
    `INSERT INTO chat_agent_runs (conversation_id, trigger_message_id)
     VALUES ($1, $2) RETURNING id`,
    [conversationId, triggerMessageId],
  );
  return rows[0].id;
}

export async function finishRun(runId, fields) {
  const { status, model, inputTokens, outputTokens, latencyMs, preFilterHit, postFilterHit, handoffReason, error, replyMessageId } = fields;
  await query(
    `UPDATE chat_agent_runs
        SET status = $2, model = $3, input_tokens = $4, output_tokens = $5,
            latency_ms = $6, pre_filter_hit = $7, post_filter_hit = $8,
            handoff_reason = $9, error = $10, reply_message_id = $11,
            finished_at = now()
      WHERE id = $1`,
    [runId, status, model ?? null, inputTokens ?? null, outputTokens ?? null,
     latencyMs ?? null, preFilterHit ?? null, postFilterHit ?? null,
     handoffReason ?? null, error ?? null, replyMessageId ?? null],
  );
}

/** Orphaned runs (left 'running' past the agent timeout by a restart). Marks
 *  them abandoned and returns the affected conversation ids for apology +
 *  handoff — this is what bounds "client stares at a typing indicator". */
export async function sweepOrphanedRuns() {
  const { rows } = await query(
    `UPDATE chat_agent_runs
        SET status = 'abandoned', finished_at = now(),
            error = 'orphaned by restart or timeout'
      WHERE status = 'running' AND started_at < now() - INTERVAL '90 seconds'
      RETURNING conversation_id`,
  );
  return [...new Set(rows.map((r) => r.conversation_id))];
}
