---
phase: "7.2"
area: backend
title: "CRM-triggered portal notifications"
status: done
depends_on: ["6.1"]
created: 2026-08-04
updated: 2026-08-04
---

# Phase 7.2 — CRM-triggered portal notifications

<context>
The Documents/Home tabs already derive doc asks (ID, bank statements) from live CRM
state, but nothing told the client anything happened — the bell was mock message
counts. Brad's requirement: a trigger in the main CRM (e.g. ID doc required, bank
statements required) lands a notification on the portal, the ask shows on Home +
Documents, CRM re-triggers re-raise it, and uploads land back in the CRM.
</context>

## Goal

Any document-request trigger fired in the main CRM raises an in-portal notification
(bell badge + feed) for that client, with a generic pipe future CRM automations can
reuse without portal code changes.

## Tasks

1. `portal.notifications` table (portal schema, owned by `portal_app`) — the table IS
   the CRM↔portal API. One-unread-per-(contact, claim, kind) dedupe; read rows keep history.
2. Postgres triggers on CRM tables: `zz_portal_notify_contacts` (ID chase armed:
   `id_chase_active` false→true, identity unconfirmed) and `zz_portal_notify_cases_ins/_upd`
   (status transition into 'Bank Statements Requested'). SECURITY DEFINER functions owned by
   `portal_app`, error-swallowing, `SET LOCAL portal.suppress_notifications = 'on'` opt-out.
3. Backend: `GET /client/notifications`, `POST /client/notifications/read`
   (contact-scoped, hidden-status claims filtered), bootstrap carries `unreadNotifications`.
4. Frontend: bell badge counts real unread; popover lists rows (unread dot + bold,
   mark-all-read); tap marks read and navigates to Documents. Refetch on login + window focus.

## Out of scope

Portal-sent email/SMS (CRM automation keeps chasing) · FCM push (Phase 8.2 — this
table is its future source) · real Messages threads · ask kinds beyond ID + bank
statements (the pipe is generic; the Documents-tab ask derivation is unchanged).

## Build notes — what actually happened

- Shipped 2026-08-04, commit `291854e`, live on production (portal EC2 + RDS).
- **Claims CRM topology discovery:** the automation engine (ID chase, bank statement
  sends) is NOT `~/sales_crm` on 13.63.133.202 — it's `~/CRM-Finalised` on
  **51.21.50.24** (`server.js` + pm2 `worker`). Both apps write the same RDS DB, which
  is why DB triggers (not app hooks) are the right catch-all.
- **Key code finding:** ID-chase arming (`server.js:37948` manual, `:38637` Nova bot)
  keeps `id_chase_started_at` via COALESCE — it NEVER advances on re-arm. The trigger
  fires on the `id_chase_active` false→true flip only.
- `public.notifications` / `persistent_notifications` are CRM **staff** inboxes
  (keyed on staff `user_id`) — deliberately untouched.
- Table DDL lives in `backend/src/schema.sql` (applied by `npm run migrate` as
  `portal_app`), not a separate file as first planned — one source of truth, correct
  owner by construction. Trigger DDL: `backend/sql/crm_notification_triggers.sql`
  (Section 1 as `portal_app`, Section 2 as `postgres`; no psql on either host — applied
  via node+pg scripts from the app dirs).
- Verified: functions/triggers present with correct owners; endpoints return
  `{notifications:[],unread:0}` for the test account; no-op updates on the test
  contact/case fire nothing (`spuriousFire:false`).

## Verification

Brad fires real triggers from the main CRM on the test contact (id 234852, case
227003): arm ID chase → bell + "Verify your identity"; set case to 'Bank Statements
Requested' → bell + lender-named ask (note: the CRM worker will also issue a
`bank_statement_token` and email the test address — expected). Upload → "Received" +
tagged `documents` row in CRM. Re-trigger → notification re-raised. Second account
sees nothing.
