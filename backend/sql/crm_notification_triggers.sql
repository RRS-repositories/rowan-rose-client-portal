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

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2 — run as admin (owner of public.contacts / public.cases)
-- ═══════════════════════════════════════════════════════════════════════════

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
