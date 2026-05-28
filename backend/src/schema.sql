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
