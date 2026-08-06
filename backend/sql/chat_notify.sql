-- Live delivery for messages written by ANY writer (Phase 7.4, staff side).
-- Run once as portal_app.
--
-- Why: the portal broadcasts over the socket only for its own inserts. A row
-- written by the CRM (or by psql, or by a future Customer Service Hub) would
-- otherwise sit in the table until the client happened to refresh. This makes
-- portal.chat_messages the API — exactly like portal.notifications: insert a
-- row from anywhere and the client sees it immediately.
--
-- The payload is deliberately tiny (ids only, 8KB NOTIFY limit): the backend
-- re-reads the row and applies its own ownership scoping before broadcasting.

BEGIN;

CREATE OR REPLACE FUNCTION portal.chat_notify_message() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'chat_message',
    json_build_object('message_id', NEW.id, 'conversation_id', NEW.conversation_id)::text
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let delivery break the write. A missed NOTIFY costs a refresh;
  -- a failed INSERT loses a client's message.
  RAISE WARNING 'portal.chat_notify_message: %', SQLERRM;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_notify ON portal.chat_messages;
CREATE TRIGGER trg_chat_notify
AFTER INSERT ON portal.chat_messages
FOR EACH ROW EXECUTE FUNCTION portal.chat_notify_message();

COMMIT;
