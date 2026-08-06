-- Hermes chat — data model (Phase 7.4, spec: Notes/Chat/CHAT_SCHEMA.md).
-- Run ONCE as portal_app (backend/.env DATABASE_URL) — everything lives in the
-- portal schema, owned by portal_app, matching the notifications precedent.
--
-- Adaptations from CHAT_SCHEMA.md (placeholders → this database, verified):
--   * contacts.id / cases.id are INTEGER → INT columns here (schema doc §0 Q1).
--   * No cross-schema FKs to public.contacts/public.cases — portal_app holds no
--     REFERENCES privilege on CRM tables, and portal.notifications set the
--     precedent: ownership is enforced by contactId scoping in every query.
--   * Tables are portal.chat_* (greppable, snapshot-scoped with the schema).
--
-- Append-only: no UPDATE path for chat_messages.body, no DELETE grants, ever.
-- Transcripts are client communications and must remain reconstructible.

BEGIN;

-- ── Conversations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal.chat_conversations (
  id                    BIGSERIAL PRIMARY KEY,
  contact_id            INT NOT NULL,              -- public.contacts.id
  claim_id              INT,                       -- public.cases.id; NULL = general enquiry
  status                TEXT NOT NULL DEFAULT 'bot',
  assigned_user_id      INT,                       -- CRM user id once a human owns it
  handoff_reason        TEXT,
  handoff_at            TIMESTAMPTZ,
  resolved_at           TIMESTAMPTZ,
  returned_to_bot_at    TIMESTAMPTZ,
  last_message_at       TIMESTAMPTZ,
  last_client_read_id   BIGINT,                    -- unread badge high-water mark (client)
  last_agent_read_id    BIGINT,                    -- high-water mark (CRM side, Phase 3)
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chat_conv_status_chk CHECK (
    status IN ('bot', 'human_queued', 'human_active', 'resolved')
  )
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_contact
  ON portal.chat_conversations (contact_id, last_message_at DESC);

-- The CS queue is the only hot status lookup (Phase 3 Hub reads this).
CREATE INDEX IF NOT EXISTS idx_chat_conv_queue
  ON portal.chat_conversations (status, last_message_at)
  WHERE status IN ('human_queued', 'human_active');

-- One live conversation per (contact, claim); COALESCE covers the nullable
-- general-enquiry thread. Without this, two tabs = two threads.
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_conv_open
  ON portal.chat_conversations (contact_id, COALESCE(claim_id, 0))
  WHERE status <> 'resolved';

-- ── Messages (append-only) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal.chat_messages (
  id                BIGSERIAL PRIMARY KEY,
  conversation_id   BIGINT NOT NULL REFERENCES portal.chat_conversations(id),
  sender_type       TEXT NOT NULL,
  sender_id         INT,                 -- contact_id | CRM user id | NULL (hermes/system)
  body              TEXT NOT NULL,
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_msg_uuid   UUID,                -- client-generated; dedupes socket retries
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at           TIMESTAMPTZ,

  CONSTRAINT chat_msg_sender_chk CHECK (
    sender_type IN ('client', 'hermes', 'agent', 'system')
  ),
  CONSTRAINT chat_msg_body_len_chk CHECK (
    char_length(body) <= 4000   -- server enforces 2000 for client sends; headroom for cards
  )
);

-- id (not created_at) is the pagination cursor.
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv
  ON portal.chat_messages (conversation_id, id);

-- Idempotent sends: a retried emit after a dropped ack is a no-op and must
-- never re-run the agent.
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_msg_client_uuid
  ON portal.chat_messages (conversation_id, client_msg_uuid)
  WHERE client_msg_uuid IS NOT NULL;

-- ── Agent runs (the audit record) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal.chat_agent_runs (
  id                 BIGSERIAL PRIMARY KEY,
  conversation_id    BIGINT NOT NULL REFERENCES portal.chat_conversations(id),
  trigger_message_id BIGINT REFERENCES portal.chat_messages(id),
  reply_message_id   BIGINT REFERENCES portal.chat_messages(id),
  status             TEXT NOT NULL DEFAULT 'running',
  model              TEXT,
  input_tokens       INT,
  output_tokens      INT,
  latency_ms         INT,
  pre_filter_hit     TEXT,
  post_filter_hit    TEXT,
  handoff_reason     TEXT,
  error              TEXT,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at        TIMESTAMPTZ,

  CONSTRAINT chat_run_status_chk CHECK (
    status IN ('running', 'completed', 'handoff', 'failed', 'abandoned')
  )
);

CREATE INDEX IF NOT EXISTS idx_chat_run_conv
  ON portal.chat_agent_runs (conversation_id, started_at DESC);

-- Crash recovery: runs left 'running' past their timeout were orphaned by a
-- restart and are swept by recovery.js (boot + every 60s).
CREATE INDEX IF NOT EXISTS idx_chat_run_orphans
  ON portal.chat_agent_runs (started_at) WHERE status = 'running';

-- ── Attachments (table now, uploads land in spec Phase 2) ───────────────────
CREATE TABLE IF NOT EXISTS portal.chat_attachments (
  id            BIGSERIAL PRIMARY KEY,
  message_id    BIGINT NOT NULL REFERENCES portal.chat_messages(id),
  s3_key        TEXT NOT NULL,
  filename      TEXT NOT NULL,
  content_type  TEXT NOT NULL,
  size_bytes    BIGINT NOT NULL,
  scanned_at    TIMESTAMPTZ,     -- NULL = not AV-scanned: never serve
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_att_msg ON portal.chat_attachments (message_id);

-- ── Keep conversation freshness honest without app-layer discipline ─────────
CREATE OR REPLACE FUNCTION portal.chat_touch_conversation() RETURNS TRIGGER AS $$
BEGIN
  UPDATE portal.chat_conversations
     SET last_message_at = NEW.created_at, updated_at = now()
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_touch ON portal.chat_messages;
CREATE TRIGGER trg_chat_touch
AFTER INSERT ON portal.chat_messages
FOR EACH ROW EXECUTE FUNCTION portal.chat_touch_conversation();

-- ── CRM communications contract (Phase 3 Hub reads this; built now so Phase 3
--    is a UI job, not a migration) ────────────────────────────────────────────
CREATE OR REPLACE VIEW portal.v_chat_communications AS
SELECT
  m.id              AS message_id,
  c.id              AS conversation_id,
  c.contact_id,
  c.claim_id,
  'portal_chat'     AS channel,
  CASE m.sender_type WHEN 'client' THEN 'inbound' ELSE 'outbound' END AS direction,
  m.sender_type,
  m.sender_id,
  m.body,
  m.created_at,
  c.status          AS conversation_status
FROM portal.chat_messages m
JOIN portal.chat_conversations c ON c.id = m.conversation_id;

COMMIT;

-- ── Rollback (ONLY safe before the first real client message) ───────────────
-- BEGIN;
-- DROP VIEW IF EXISTS portal.v_chat_communications;
-- DROP TRIGGER IF EXISTS trg_chat_touch ON portal.chat_messages;
-- DROP FUNCTION IF EXISTS portal.chat_touch_conversation();
-- DROP TABLE IF EXISTS portal.chat_attachments, portal.chat_agent_runs,
--                      portal.chat_messages, portal.chat_conversations;
-- COMMIT;
