-- CRM → portal notification triggers.
--
-- Turns CRM document-request signals into rows in portal.notifications (the
-- portal bell feed). Two sections with DIFFERENT roles — run them separately:
--
--   SECTION 1 (functions)  — run as portal_app  (backend/.env DATABASE_URL).
--       portal_app owns portal.notifications, so SECURITY DEFINER functions it
--       owns can insert regardless of which CRM role performed the write.
--   SECTION 2 (triggers)   — run as an admin role that owns public.contacts /
--       public.cases (postgres). CREATE TRIGGER requires the table owner.
--
-- Design rules (mirrors the CRM's own audit_case_status_change):
--   * A notification failure must NEVER break the CRM write — every function
--     swallows errors with RAISE WARNING.
--   * Fire on genuine transitions only (WHEN clauses below).
--   * Bulk scripts can suppress notifications for their transaction with:
--         SET LOCAL portal.suppress_notifications = 'on';
--   * zz_ prefix keeps these after the CRM's audit trigger (alphabetical order).
--
-- Idempotent: safe to re-run either section.

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1 — run as portal_app
-- ═══════════════════════════════════════════════════════════════════════════

-- ID verification ask: contacts trigger fires on the id_chase_active false→true
-- flip (the CRM's arm/re-arm signal — id_chase_started_at is COALESCE-kept and
-- never advances on re-arm, so it must not be used).
CREATE OR REPLACE FUNCTION portal.notify_id_request() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = portal, public, pg_temp
AS $$
BEGIN
  IF current_setting('portal.suppress_notifications', true) = 'on' THEN
    RETURN NEW;
  END IF;

  INSERT INTO portal.notifications (contact_id, claim_id, kind, title, body, link)
  VALUES (
    NEW.id, NULL, 'id_request',
    'Please verify your identity',
    'Please upload photo ID (passport or driving licence), or a recent utility or council-tax bill.',
    '/documents'
  )
  ON CONFLICT (contact_id, COALESCE(claim_id, 0), kind) WHERE read_at IS NULL
  DO UPDATE SET created_at = now(),
                title = EXCLUDED.title,
                body  = EXCLUDED.body,
                link  = EXCLUDED.link;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'portal.notify_id_request: failed for contact %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Bank statements ask: cases trigger fires when status transitions into
-- 'Bank Statements Requested' (set by staff dropdown, not-upheld routing, or
-- any other writer — the transition catches them all; the CRM worker then
-- issues bank_statement_token and sends the email independently).
CREATE OR REPLACE FUNCTION portal.notify_bank_statements_request() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = portal, public, pg_temp
AS $$
DECLARE
  lender_name text;
BEGIN
  IF current_setting('portal.suppress_notifications', true) = 'on' THEN
    RETURN NEW;
  END IF;
  -- Belt-and-braces re-checks of the trigger WHEN conditions.
  IF NEW.contact_id IS NULL
     OR lower(btrim(COALESCE(NEW.status, ''))) <> 'bank statements requested' THEN
    RETURN NEW;
  END IF;

  lender_name := COALESCE(NULLIF(btrim(NEW.lender), ''),
                          NULLIF(btrim(NEW.lender_other), ''),
                          'your lender');

  INSERT INTO portal.notifications (contact_id, claim_id, kind, title, body, link)
  VALUES (
    NEW.contact_id, NEW.id, 'bank_statements_request',
    'We need your bank statements — ' || lender_name,
    'Please upload your bank statements for your ' || lender_name || ' claim so we can progress it.',
    '/documents'
  )
  ON CONFLICT (contact_id, COALESCE(claim_id, 0), kind) WHERE read_at IS NULL
  DO UPDATE SET created_at = now(),
                title = EXCLUDED.title,
                body  = EXCLUDED.body,
                link  = EXCLUDED.link;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'portal.notify_bank_statements_request: failed for case %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Offer acceptance ask (Phase 7.3 Slice A): fires when a case is armed for
-- acceptance — offer_accept_token minted by Verify Outcome — and sits in a
-- status the acceptance email flow considers sendable. Two paths reach it:
--   * status transitions into a sendable status while the token exists;
--   * Verify mints the token while the case is parked at 'Upheld' (Verify does
--     NOT change status, so the token-mint itself must fire the trigger).
-- 'CHASING DEBT' is deliberately excluded (Brad, 2026-08-05): the portal
-- renders those claims as "Claim Closed", so an accept ask there is incoherent.
-- Reads client_communications_tracking to skip already-accepted offers — the
-- GRANT for that lives in Section 2.
CREATE OR REPLACE FUNCTION portal.notify_offer_ask() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = portal, public, pg_temp
AS $$
DECLARE
  lender_name text;
BEGIN
  IF current_setting('portal.suppress_notifications', true) = 'on' THEN
    RETURN NEW;
  END IF;
  -- Belt-and-braces re-checks of the trigger WHEN conditions, plus the checks
  -- that need queries. Mirrors lib/offer-acceptance-email.js: armed = token
  -- present, £0 offers never surface.
  IF NEW.contact_id IS NULL
     OR NEW.offer_accept_token IS NULL
     OR COALESCE(NEW.offer_made, 0) <= 0
     OR lower(btrim(COALESCE(NEW.status, ''))) NOT IN
        ('upheld', 'offer accepted', 'awaiting payment') THEN
    RETURN NEW;
  END IF;
  -- Already accepted (signing page completed) → never re-ask.
  IF EXISTS (
    SELECT 1 FROM public.client_communications_tracking
     WHERE claim_id = NEW.id AND type = 'offer_acceptance' AND status = 'Completed'
  ) THEN
    RETURN NEW;
  END IF;

  lender_name := COALESCE(NULLIF(btrim(NEW.lender), ''),
                          NULLIF(btrim(NEW.lender_other), ''),
                          'your lender');

  INSERT INTO portal.notifications (contact_id, claim_id, kind, title, body, link)
  VALUES (
    NEW.contact_id, NEW.id, 'offer_acceptance',
    'Your offer is ready to accept — ' || lender_name,
    'Good news: ' || lender_name || ' has made an offer to settle your claim. Review the details and accept it when you''re ready.',
    '/claims/' || NEW.id
  )
  ON CONFLICT (contact_id, COALESCE(claim_id, 0), kind) WHERE read_at IS NULL
  DO UPDATE SET created_at = now(),
                title = EXCLUDED.title,
                body  = EXCLUDED.body,
                link  = EXCLUDED.link;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'portal.notify_offer_ask: failed for case %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Signature / Letter of Authority ask (Phase 7.3 Slice B): fires when the CRM's
-- Resend LOA flow mints (or re-mints) cases.resign_token — the firm deciding
-- this client's LoA needs (re-)signing. Every arm mints a NEW token, so the
-- token-change is the signal; the token is never nulled after signing, so
-- "already signed" is judged per-token via the tracking row the send creates
-- (type 'resend_loa', flipped to Completed by the signing page).
CREATE OR REPLACE FUNCTION portal.notify_signature_request() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = portal, public, pg_temp
AS $$
DECLARE
  lender_name text;
BEGIN
  IF current_setting('portal.suppress_notifications', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.contact_id IS NULL OR NEW.resign_token IS NULL THEN
    RETURN NEW;
  END IF;
  -- This exact token already signed → never re-ask.
  IF EXISTS (
    SELECT 1 FROM public.client_communications_tracking
     WHERE token::text = NEW.resign_token::text
       AND type = 'resend_loa' AND status = 'Completed'
  ) THEN
    RETURN NEW;
  END IF;

  lender_name := COALESCE(NULLIF(btrim(NEW.lender), ''),
                          NULLIF(btrim(NEW.lender_other), ''),
                          'your lender');

  INSERT INTO portal.notifications (contact_id, claim_id, kind, title, body, link)
  VALUES (
    NEW.contact_id, NEW.id, 'signature_request',
    'We need your signature — ' || lender_name,
    'Please sign your updated Letter of Authority for your ' || lender_name || ' claim so we can keep things moving. It only takes a minute.',
    '/claims/' || NEW.id
  )
  ON CONFLICT (contact_id, COALESCE(claim_id, 0), kind) WHERE read_at IS NULL
  DO UPDATE SET created_at = now(),
                title = EXCLUDED.title,
                body  = EXCLUDED.body,
                link  = EXCLUDED.link;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'portal.notify_signature_request: failed for case %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Questionnaire / extra-lender asks (Phase 7.3 Slice C, revised 2026-08-06):
-- originally fired on chase-workflow ARMING, but the first chase action runs
-- ~48h later and the form token is only minted at send time — the ask sat with
-- nothing to open. Both now fire on their READY signal, like every other ask:
-- the questionnaire when its token row appears, the extra-lender when the first
-- send's tracking row appears. (portal.notify_chase_workflow is retired; the
-- orphaned function can be dropped by portal_app at leisure.)
CREATE OR REPLACE FUNCTION portal.notify_questionnaire_ready() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = portal, public, pg_temp
AS $$
BEGIN
  IF current_setting('portal.suppress_notifications', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.contact_id IS NULL OR COALESCE(NEW.submitted, false) THEN
    RETURN NEW;
  END IF;

  INSERT INTO portal.notifications (contact_id, claim_id, kind, title, body, link)
  VALUES (
    NEW.contact_id, NULL, 'questionnaire_request',
    'Please fill in your questionnaire',
    'We need a few details from you to progress your claim. It only takes a few minutes.',
    '/dashboard'
  )
  ON CONFLICT (contact_id, COALESCE(claim_id, 0), kind) WHERE read_at IS NULL
  DO UPDATE SET created_at = now(),
                title = EXCLUDED.title,
                body  = EXCLUDED.body,
                link  = EXCLUDED.link;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'portal.notify_questionnaire_ready: failed for contact %: %', NEW.contact_id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION portal.notify_extra_lender_ready() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = portal, public, pg_temp
AS $$
BEGIN
  IF current_setting('portal.suppress_notifications', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.client_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO portal.notifications (contact_id, claim_id, kind, title, body, link)
  VALUES (
    NEW.client_id, NULL, 'extra_lender_request',
    'Do you have claims with other lenders?',
    'Tell us which other lenders you borrowed from so we can check whether you have further claims.',
    '/dashboard'
  )
  ON CONFLICT (contact_id, COALESCE(claim_id, 0), kind) WHERE read_at IS NULL
  DO UPDATE SET created_at = now(),
                title = EXCLUDED.title,
                body  = EXCLUDED.body,
                link  = EXCLUDED.link;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'portal.notify_extra_lender_ready: failed for contact %: %', NEW.client_id, SQLERRM;
  RETURN NEW;
END;
$$;

-- FOS referral ask (Phase 7.3 Slice C): the worker mints cases.fos_referral_token
-- when a case reaches 'FOS Acceptance Form Sent' and emails the /fos-retainer
-- e-sign page — same token-mint signal as offers/resign. Skips tokens already
-- completed on the signing tracking table (token-keyed; tokens are unique).
CREATE OR REPLACE FUNCTION portal.notify_fos_referral() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = portal, public, pg_temp
AS $$
DECLARE
  lender_name text;
BEGIN
  IF current_setting('portal.suppress_notifications', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.contact_id IS NULL OR NEW.fos_referral_token IS NULL THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.client_communications_tracking
     WHERE token::text = NEW.fos_referral_token::text AND status = 'Completed'
  ) THEN
    RETURN NEW;
  END IF;

  lender_name := COALESCE(NULLIF(btrim(NEW.lender), ''),
                          NULLIF(btrim(NEW.lender_other), ''),
                          'your lender');

  INSERT INTO portal.notifications (contact_id, claim_id, kind, title, body, link)
  VALUES (
    NEW.contact_id, NEW.id, 'fos_referral',
    'Your claim can go to the Ombudsman — ' || lender_name,
    'The lender''s response wasn''t good enough. Review and approve referring your ' || lender_name || ' claim to the Financial Ombudsman Service.',
    '/claims/' || NEW.id
  )
  ON CONFLICT (contact_id, COALESCE(claim_id, 0), kind) WHERE read_at IS NULL
  DO UPDATE SET created_at = now(),
                title = EXCLUDED.title,
                body  = EXCLUDED.body,
                link  = EXCLUDED.link;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'portal.notify_fos_referral: failed for case %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2 — run as admin (owner of public.contacts / public.cases)
-- ═══════════════════════════════════════════════════════════════════════════

-- Phase 7.3 Slice A: the offer trigger function (and the portal's requirement
-- derivation via portal_ro) read acceptance state from the signing-page
-- tracking table. Read-only on one table — no other automation table is opened.
GRANT SELECT ON public.client_communications_tracking TO portal_app, portal_ro;

-- Phase 7.3 Slice C: the requirement derivation reads the chase-workflow
-- registry (is a questionnaire / extra-lender chase active?) and the
-- questionnaire token table (to serve the client their form link).
GRANT SELECT ON public.workflow_triggers TO portal_app, portal_ro;
GRANT SELECT ON public.questionnaire_tokens TO portal_ro;

-- Revised 2026-08-06: the workflow-arming trigger is retired (fired before the
-- form existed) — the two ready-signal triggers below replace it.
DROP TRIGGER IF EXISTS zz_portal_notify_workflow_chases ON public.workflow_triggers;

DROP TRIGGER IF EXISTS zz_portal_notify_questionnaire_ready ON public.questionnaire_tokens;
CREATE TRIGGER zz_portal_notify_questionnaire_ready
  AFTER INSERT ON public.questionnaire_tokens
  FOR EACH ROW
  WHEN (COALESCE(NEW.submitted, false) = false)
  EXECUTE FUNCTION portal.notify_questionnaire_ready();

DROP TRIGGER IF EXISTS zz_portal_notify_extra_lender_ready ON public.client_communications_tracking;
CREATE TRIGGER zz_portal_notify_extra_lender_ready
  AFTER INSERT ON public.client_communications_tracking
  FOR EACH ROW
  WHEN (NEW.type = 'extra_lender')
  EXECUTE FUNCTION portal.notify_extra_lender_ready();

DROP TRIGGER IF EXISTS zz_portal_notify_cases_fos ON public.cases;
CREATE TRIGGER zz_portal_notify_cases_fos
  AFTER UPDATE OF fos_referral_token ON public.cases
  FOR EACH ROW
  WHEN (NEW.fos_referral_token IS NOT NULL
        AND NEW.fos_referral_token IS DISTINCT FROM OLD.fos_referral_token)
  EXECUTE FUNCTION portal.notify_fos_referral();

DROP TRIGGER IF EXISTS zz_portal_notify_contacts ON public.contacts;
CREATE TRIGGER zz_portal_notify_contacts
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  WHEN (NEW.id_chase_active
        AND NOT COALESCE(OLD.id_chase_active, false)
        AND NEW.identity_confirmed_at IS NULL)
  EXECUTE FUNCTION portal.notify_id_request();

DROP TRIGGER IF EXISTS zz_portal_notify_cases_ins ON public.cases;
CREATE TRIGGER zz_portal_notify_cases_ins
  AFTER INSERT ON public.cases
  FOR EACH ROW
  WHEN (lower(btrim(COALESCE(NEW.status, ''))) = 'bank statements requested')
  EXECUTE FUNCTION portal.notify_bank_statements_request();

DROP TRIGGER IF EXISTS zz_portal_notify_cases_upd ON public.cases;
CREATE TRIGGER zz_portal_notify_cases_upd
  AFTER UPDATE OF status ON public.cases
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status
        AND lower(btrim(COALESCE(NEW.status, ''))) = 'bank statements requested')
  EXECUTE FUNCTION portal.notify_bank_statements_request();

DROP TRIGGER IF EXISTS zz_portal_notify_cases_offer_ins ON public.cases;
CREATE TRIGGER zz_portal_notify_cases_offer_ins
  AFTER INSERT ON public.cases
  FOR EACH ROW
  WHEN (NEW.offer_accept_token IS NOT NULL
        AND lower(btrim(COALESCE(NEW.status, ''))) IN
            ('upheld', 'offer accepted', 'awaiting payment'))
  EXECUTE FUNCTION portal.notify_offer_ask();

-- Signature ask: arming is always an UPDATE (Resend LOA mints a fresh token on
-- an existing case), so no INSERT trigger is needed.
DROP TRIGGER IF EXISTS zz_portal_notify_cases_resign ON public.cases;
CREATE TRIGGER zz_portal_notify_cases_resign
  AFTER UPDATE OF resign_token ON public.cases
  FOR EACH ROW
  WHEN (NEW.resign_token IS NOT NULL
        AND NEW.resign_token IS DISTINCT FROM OLD.resign_token)
  EXECUTE FUNCTION portal.notify_signature_request();

-- Fires on BOTH arms: a status transition into a sendable status with the token
-- already minted, AND the token being minted (Verify Outcome) while the case is
-- parked in a sendable status — Verify does not change status, so without the
-- token arm a case left at 'Upheld' would never notify.
DROP TRIGGER IF EXISTS zz_portal_notify_cases_offer_upd ON public.cases;
CREATE TRIGGER zz_portal_notify_cases_offer_upd
  AFTER UPDATE OF status, offer_accept_token ON public.cases
  FOR EACH ROW
  WHEN (NEW.offer_accept_token IS NOT NULL
        AND lower(btrim(COALESCE(NEW.status, ''))) IN
            ('upheld', 'offer accepted', 'awaiting payment')
        AND (NEW.status IS DISTINCT FROM OLD.status
             OR NEW.offer_accept_token IS DISTINCT FROM OLD.offer_accept_token))
  EXECUTE FUNCTION portal.notify_offer_ask();
