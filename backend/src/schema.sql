-- Portal accounts (Phase 1.4 — basic auth store; CRM linkage comes later).
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name     text NOT NULL,
  phone         text NOT NULL,
  dob           date NOT NULL,
  email_verified boolean NOT NULL DEFAULT true,
  client_id     text,            -- reserved for future CRM contact/claim linkage
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- One-time codes for email verification during signup (and reusable for resends).
CREATE TABLE IF NOT EXISTS email_verifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  code        text NOT NULL,
  expires_at  timestamptz NOT NULL,
  consumed    boolean NOT NULL DEFAULT false,
  attempts    int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications (email);

-- Client-facing notifications. Rows are inserted by SECURITY DEFINER triggers on
-- the CRM's contacts/cases tables (backend/sql/crm_notification_triggers.sql) —
-- and, by design, by any future CRM automation directly: this table is the API
-- between the CRM and the portal's bell feed. Distinct from the CRM's own
-- public.notifications / persistent_notifications, which are staff-facing.
CREATE TABLE IF NOT EXISTS notifications (
  id          bigserial PRIMARY KEY,
  contact_id  integer     NOT NULL,  -- public.contacts.id (no FK: CRM tables stay untouched)
  claim_id    integer,               -- public.cases.id; NULL = contact-level (e.g. ID)
  kind        text        NOT NULL,  -- 'id_request' | 'bank_statements_request' | future
  title       text        NOT NULL,
  body        text        NOT NULL,
  link        text        NOT NULL DEFAULT '/documents',
  created_at  timestamptz NOT NULL DEFAULT now(),
  read_at     timestamptz
);

CREATE INDEX IF NOT EXISTS notifications_contact_created_idx
  ON notifications (contact_id, created_at DESC);

-- One UNREAD row per (contact, claim, kind): a re-trigger while unread refreshes
-- the existing row (no stacking); once read, a re-trigger inserts a fresh row so
-- re-requests always re-notify.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_unread_dedupe_idx
  ON notifications (contact_id, (COALESCE(claim_id, 0)), kind)
  WHERE read_at IS NULL;
