/**
 * Client-facing notifications (portal.notifications). Rows arrive from the CRM
 * via DB triggers (backend/sql/crm_notification_triggers.sql) or direct CRM
 * inserts — this module only reads them and flips read_at. Everything is scoped
 * to a single contact_id, same isolation rule as the CRM repo.
 */
import { query } from "../db.js";
import { crmEnabled, crmQuery } from "../crmdb.js";
import { mapStatus } from "../crm/statusMap.js";

const iso = (d) => (d ? new Date(d).toISOString() : undefined);

const toNotification = (r) => ({
  id: String(r.id),
  kind: r.kind,
  title: r.title,
  body: r.body,
  link: r.link,
  claimId: r.claim_id == null ? undefined : String(r.claim_id),
  createdAt: iso(r.created_at),
  read: Boolean(r.read_at),
});

/**
 * A claim-level notification must never reveal a claim the client can't see
 * (hidden internal status → mapStatus null). Moot for bank statements (visible
 * status) but keeps the pipe safe for future kinds; with the CRM link down,
 * claim-level rows are withheld rather than shown unverified.
 */
async function dropHiddenClaims(rows) {
  const claimIds = [...new Set(rows.filter((r) => r.claim_id != null).map((r) => Number(r.claim_id)))];
  if (claimIds.length === 0) return rows;
  if (!crmEnabled()) return rows.filter((r) => r.claim_id == null);
  const { rows: cases } = await crmQuery(
    `SELECT id, status FROM public.cases WHERE id = ANY($1::int[])`,
    [claimIds],
  );
  const visible = new Set(
    cases.filter((c) => mapStatus(c.status) !== null).map((c) => String(c.id)),
  );
  return rows.filter((r) => r.claim_id == null || visible.has(String(r.claim_id)));
}

/** Most recent notifications for a contact (visible ones only), plus the
 *  unread count over the same set — one number, so badge and feed always agree. */
export async function getNotificationsByContactId(contactId, limit = 50) {
  const { rows } = await query(
    `SELECT id, contact_id, claim_id, kind, title, body, link, created_at, read_at
       FROM notifications
      WHERE contact_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT $2`,
    [contactId, limit],
  );
  const visibleRows = await dropHiddenClaims(rows);
  const notifications = visibleRows.map(toNotification);
  return { notifications, unread: notifications.filter((n) => !n.read).length };
}

/** Mark the given notification ids read — or all unread when ids is empty.
 *  Scoped to the contact; ids belonging to anyone else are silently ignored. */
export async function markNotificationsRead(contactId, ids = []) {
  const numeric = (ids || []).map(Number).filter(Number.isInteger);
  const { rowCount } = numeric.length
    ? await query(
        `UPDATE notifications SET read_at = now()
          WHERE contact_id = $1 AND read_at IS NULL AND id = ANY($2::bigint[])`,
        [contactId, numeric],
      )
    : await query(
        `UPDATE notifications SET read_at = now()
          WHERE contact_id = $1 AND read_at IS NULL`,
        [contactId],
      );
  return rowCount;
}
