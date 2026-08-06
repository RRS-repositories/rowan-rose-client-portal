---
phase: "7.3"
area: backend
title: "Remaining client asks — offer acceptance, signature/LoA, questionnaire, extra-lender, FOS"
status: in-progress
depends_on: ["7.2"]
created: 2026-08-05
updated: 2026-08-05
---

# Phase 7.3 — Remaining client asks on the portal

<context>
Phase 7.2 (commit `291854e`, LIVE) built the generic CRM→portal ask pipe: Postgres
triggers on CRM tables insert into `portal.notifications` (the table IS the API),
the bell feed renders any kind, and the Documents/Home requirement cards derive
asks from live CRM state in `backend/src/crm/repo.js` (`getRequirementsByContactId`).
Two asks are live: **ID verification** (contact-level, `id_chase_active` false→true)
and **bank statements** (case status → 'Bank Statements Requested').

The frontend type system already anticipates more: `RequirementKind` includes
`questionnaire` and `extra-lender`; Phase 4.1 built the **Offer Review +
E-Signature** UI (currently mock). This phase wires the remaining asks, one slice
at a time, reusing the exact Phase 7.2 pattern. The CRM codebase lives at
`~/CRM-Finalised` on **51.21.50.24** (NOT sales_crm); both apps share the same RDS.
</context>

## Goal

Every remaining firm→client ask (offer acceptance first, then signature/LoA, then
questionnaire / extra-lender / FOS) raises a portal notification + requirement
card from a real CRM signal, and the client's action lands back in the CRM —
leaving only Brad's end-to-end testing.

## Architecture constants (do NOT deviate)

- **Notification pipe:** SECURITY DEFINER functions owned by `portal_app`
  (Section 1 of `backend/sql/crm_notification_triggers.sql`), triggers created by
  the table owner `postgres` (Section 2), `zz_` prefix, error-swallowing
  (`RAISE WARNING`, never break the CRM write), `SET LOCAL
  portal.suppress_notifications = 'on'` opt-out for bulk scripts,
  one-unread-per-(contact, claim, kind) dedupe via the partial unique index.
- **No psql on either host** — apply DDL via node+pg scripts from the app dirs.
- **Portal DDL** lives in `backend/src/schema.sql`, applied by `npm run migrate`
  as `portal_app`.
- **Requirement derivation** stays in `getRequirementsByContactId` — asks derive
  from CRM state, "received/done" derives from Portal-tagged `documents` rows or
  the CRM's own completion signal. Never store ask state portal-side.
- **Hidden statuses never reach the client** (statusMap filtering stands).
- Notification `kind` is open-ended — the bell renders unknown kinds, so a new
  trigger can ship before its requirement card.

## Slice A — Offer acceptance (do this first; CRM signal is concrete)

**CRM signal (verified in CRM-Finalised):**
- The email flow lives in `lib/offer-acceptance-email.js`. The worker sends the
  acceptance signing-link email when a case reaches
  `OFFER_ACCEPT_SENDABLE_STATUSES = ['Upheld', 'Offer Accepted', 'CHASING DEBT',
  'Awaiting Payment']` ('Upheld' is where Verify leaves the case; agents move it
  to the others within seconds).
- Cases carry an `offer_accept_token`; sends are tracked (token table kind
  `offer_acceptance`) and action-logged as `offer_acceptance_email_sent`.
- On acceptance the CRM writes `{Client_Folder}/Signatures/signature_acceptance_form.png`
  to S3 + a `documents` row tagged `['Signature', 'Offer Acceptance']`
  (server.js ~27247), then generates the acceptance form.

**Tasks:**
1. Trigger `zz_portal_notify_cases_offer` (INSERT + UPDATE OF status) firing on
   transition into any sendable status. Function `portal.notify_offer_ask()`
   re-checks inside (Phase 7.2 belt-and-braces style): contact_id present, status
   still sendable, **no acceptance already recorded** (no 'Offer Acceptance'-tagged
   documents row / offer not actioned). Kind `offer_acceptance`, lender-named
   title, link `/claims/:id` (the Phase 4.1 offer screen), `claim_id` set.
2. Requirement card: per-claim "Review and accept your offer — {lender}" while the
   case sits in a sendable status with no acceptance recorded; flips to done when
   the acceptance artifacts exist.
3. **Accept action — reuse the CRM's existing token flow, do not re-implement
   e-sign.** The portal backend reads `cases.offer_accept_token` (ownership-checked)
   and either deep-links the client to the existing signing URL or POSTs to the
   same public accept endpoint the email link hits. All CRM-side artifact writing
   (S3 signature PNG, documents row, status flip, action logs, form generation)
   stays in the CRM. Wire the Phase 4.1 UI to this; delete/bypass its mock accept.
4. ⚠ Decision for Brad before building: does 'CHASING DEBT' still warrant a
   portal "accept your offer" ask (gone_to_debt clients), or fire on
   'Upheld'/'Offer Accepted'/'Awaiting Payment' only? Default to excluding
   'CHASING DEBT' until he says otherwise.

## Slice B — Signature / Letter of Authority

**CRM signal: NOT yet established — discovery first, build second.**
- Verified: there is **no** `signature_status`/`has_signature` column on contacts.
  Signature presence = `documents` rows / S3 `Signatures/` folder contents; the
  CRM has signature-chase workflows and LOA regeneration tooling.
- Discovery task (read-only, in CRM-Finalised + RDS): find the authoritative
  "client has no usable signature/LoA" signal and what arms a chase (mirror the
  ID-chase pattern: is there a workflow_triggers type? a flag?). Write findings
  into Build notes BEFORE any DDL.
- Then: trigger + `signature_request` kind + requirement card. In-portal **LoA
  e-signing is out of scope** for this phase (it's a legal-document flow — same
  reason Debt C3 e-sign is its own work); V1 is notify + route to the CRM's
  existing signing/upload path.

## Slice C — Questionnaire, extra-lender, FOS asks

- `RequirementKind` already has `questionnaire` and `extra-lender`; FOS asks would
  be a new kind. CRM signals for all three are unconfirmed — each needs the same
  discovery-first treatment as Slice B, plus **Brad's confirmation of wording and
  trigger points** before DDL. Ship each as its own trigger + card when confirmed.
- Do not invent CRM columns or statuses for these — if no clean signal exists,
  report that back instead of building one into the CRM from the portal repo.

## Out of scope

- Portal-sent email/SMS (CRM automation keeps chasing on every ask).
- FCM/APNs push (Phase 8.2 — `portal.notifications` remains its future source).
- Real Messages threads.
- In-portal LoA e-signing (V1 routes to existing CRM flows).
- Any schema change to CRM tables (`public.*`) — triggers only.

## Build notes — what actually happened

**Slice A — built 2026-08-05; DDL approved by Brad and APPLIED + DEPLOYED same day.
Live: 3 portal functions, 5 `zz_portal_*` triggers on cases/contacts, tracking GRANT
(`portal_ro` verified reading it — 301 historical completed acceptances), backend +
frontend deployed, health up. Verified: test claim renders unchanged (not armed), no
token in API output, `GET /client/offers/227003` → 404 pre-Verify, no-op saves fire
nothing. Awaiting Brad's end-to-end drill (Verify Outcome on case 227003).**

- Decisions (Brad, 2026-08-05): CHASING DEBT **excluded** from the ask (portal maps
  it to "Claim Closed"); accept is **in-app via backend proxy** (token stays
  server-side, POST to the CRM's public `/api/submit-offer-accept`); reject swapped
  for **"speak to your handler"** guidance on real auth (no CRM reject pathway).
- Verify-Outcome timing catch: the token is minted **without a status change**
  (status is already 'Upheld'; agents advance it ~55s later). The UPDATE trigger
  therefore fires on `UPDATE OF status, offer_accept_token` — the token-mint arm is
  what catches cases parked at 'Upheld'.
- Acceptance signal: `client_communications_tracking` (type `offer_acceptance`,
  status `Completed`) — the only per-claim signal; the acceptance `documents` row is
  contact-level (name-keyed, overwritten per contact). Gated `GRANT SELECT` to
  `portal_app` + `portal_ro` ships with the DDL. All portal code degrades to
  feature-dark (no asks, no override) while the GRANT is missing — never guesses.
- Claim-mapping override in `mapCaseToClaim`: armed + unsigned → "Offer Received"
  (fixes 'Upheld'→"FRL Received" dead-end AND premature "Offer Accepted" display);
  armed + signed → "Offer Accepted" with `offerActionedAt` from `completed_at`.
  `offer_accept_token` added to CASE_COLS for the check but never serialised.
- New: `getOfferByClaimId` (CRM's own verified fee figures + server-built terms
  text; no expiry — field made optional, UI hides it), `GET /client/offers/:claimId`,
  `POST /client/offers/:claimId/accept` (validates PNG data-URL + terms flag,
  25s timeout, plain-English failures; re-accept returns success idempotently).
  Requirement kind `offer-acceptance` (Home card "Review" action → claim page;
  excluded from Documents grid and ActionItems — OfferBanner is its claim surface).
  `api/offers.ts` fronts mock/real; real accept re-pulls the bootstrap client after
  ~1.2s (covers the CRM's fire-and-forget tracking update).
- Drive-by fix: live ID/bank requirement `action` was the literal string "Upload",
  which WhatWeNeedCard used as a route (`/Upload?...` → broken link). Now
  `/documents`.
- Notification `link` uses the numeric case id (`/claims/{id}`) — `getClaimById`
  accepts case_number or id, so the route resolves either way.
- Slice A field finding: the app cached the bootstrap client from login, so Brad's
  Verify raised the bell but Home/claims stayed stale. Fixed (`d22dac6`): real
  client re-hydrates on window focus; `useMockQuery` re-reads silently via a
  `subscribeData` pub/sub — no skeleton flash.

**Slice B — built 2026-08-05; DDL approved and APPLIED + DEPLOYED same day.**
Live: 4 portal functions, 6 `zz_portal_*` triggers (new: `zz_portal_notify_cases_resign`).
Verified post-deploy: health up; test account shows the offer ask done (Brad's Slice A
accept completed the full pipeline); no signature ask / resign-link 404 while not
armed. **Brad ran the Resend-LOA drill 2026-08-05 — verified working end-to-end.**
Drill also caught a stale-PWA-bundle gotcha (old bundle rendered a dead Upload
button on the signature card): fixed in `75ad95a` — the app reloads once when a
new deploy's service worker takes over and checks for updates on focus.

**Slice B discovery (2026-08-05, read-only in CRM-Finalised — done BEFORE DDL):**

- There is **no signature-chase workflow** (`workflow_triggers` types are ID Chase,
  Questionnaire Chase, Extra Lender Chase, document_chase). The signature ask
  mechanism is the **Resend LOA flow**:
  - **Arm** (multiple server.js sites, all via the `decideResendLoa` per-client
    throttle — queued cases get NO token until their turn): mint
    `cases.resign_token = uuid, resign_email_sent = false`. Re-arms mint a NEW
    token every time → token-change is the reliable trigger signal.
  - **Send** (worker.js ~3990): email from the worker with link
    `rowanroseclaims.co.uk/resign/{token}`; inserts
    `client_communications_tracking (client_id, claim_id, type='resend_loa',
    token, email)`; a Day-N reminder system keys off that row's `created_at`.
  - **Sign** (`POST` behind `/resign/:token`, server.js ~26860): S3
    `Signatures/signature.png` (overwrites intake signature), documents row
    `signature.png` tags `['Signature','Resign']` (contact-level),
    `contacts.signature_url`, action log `signature_resign`, tracking →
    `Completed`. **`resign_token` is deliberately NOT nulled** ("allow re-signing")
    — so armed-ness must be judged per-token via tracking Completed, never by
    token presence.
  - **Post-sign propagation**: the case + early-stage siblings (no DSAR/complaint/
    FOS) → status 'New Lead' for LOA re-papering. Portal-side that maps to
    "Onboarding" (visible) — as do all LOA statuses — so nothing vanishes.
- Portal design locked from this: trigger on `UPDATE OF resign_token` (non-null,
  changed) → kind `signature_request`; requirement kind `signature` shown while
  the CURRENT token has no Completed tracking row, dropped (not "done") once
  signed — the token living forever means a done-card would live forever too.
  V1 sign action routes to the CRM's existing `/resign/{token}` page (spec: no
  in-portal LoA e-sign); the link is served per-claim by the portal backend,
  ownership-checked. No new GRANTs needed — tracking SELECT shipped with Slice A.

**Resumed 2026-08-06.** Brad approved the test bump + timing fix ("everything as
per the timing"): test contact's questionnaire chase `next_action_at` bumped to
NOW (workflow id 28625); ready-signal redesign implemented — notification
triggers moved to `questionnaire_tokens` INSERT / tracking `extra_lender`
INSERT (old `zz_portal_notify_workflow_chases` dropped in the revised DDL,
`portal.notify_chase_workflow` left orphaned, droppable by portal_app), and the
two requirement cards now ALSO require the form link to exist. DDL at the gate.

**⏸ PARKED 2026-08-05 evening — resume here.** Brad's drill found a timing gap:
the Questionnaire Chase's FIRST action runs +48h after arming (test workflow
armed 16:55, `next_action_at` Aug 7), and the worker only mints the
`questionnaire_tokens` row at send time — so the card sat with a dead Start
button ("still preparing" toast) for the 2-day window. Extra-lender has the same
risk. **Agreed fix direction (designed, NOT yet implemented/applied):** move both
asks to their "ready" signals like every other trigger — notification on
`questionnaire_tokens` INSERT (unsubmitted) and on `client_communications_tracking`
INSERT (type `extra_lender`); drop `zz_portal_notify_workflow_chases`; gate the
two requirement cards on link availability (token/tracking row exists) AND the
chase workflow still being live. No new GRANTs. Frontend unchanged. Also offered:
one-off bump of the test workflow's `next_action_at` to NOW so Brad can test
without waiting until Aug 7. **Both awaiting Brad's go.** FOS + offer + signature
asks are unaffected (already token-mint driven). FOS + extra-lender drill parts
not yet run.

**Slice C — built 2026-08-05; DDL approved and APPLIED + DEPLOYED same day.**
Live: 6 portal functions, 8 `zz_portal_*` triggers (new: `zz_portal_notify_workflow_chases`
on `workflow_triggers` — first trigger on that table — and `zz_portal_notify_cases_fos`),
GRANTs on `workflow_triggers` + `questionnaire_tokens`. Verified post-deploy: health up,
requirements correctly empty on the test contact (the Slice B signing re-papered the test
case to 'New Lead', dropping the stale offer ask — designed behaviour), all three link
endpoints 404 while unarmed. Awaiting Brad's three-part drill.

**Slice C discovery (2026-08-05, read-only in CRM-Finalised — done BEFORE DDL;
wording + scope approved by Brad same day, all three asks):**

- **Questionnaire** (contact-level): armed by a `workflow_triggers` INSERT, type
  'Questionnaire Chase'/'questionnaire_chase' (staff manual or Nova). The worker
  mints a `questionnaire_tokens` row (type 2 = IRL) at SEND time and emails
  `/questionnaire/token/{token}` (47h throttle); it self-completes the workflow if
  `document_checklist.questionnaire` is already ticked. Ask clears when the
  workflow leaves pending/active/awaiting_response.
- **Extra lender** (contact-level): armed by `workflow_triggers` type 'Extra
  Lender Chase'/'extra_lender_chase'; a 4-step reminder engine (day-based, off the
  tracking row type `extra_lender`) emails `/loa-form/{token}`. Multiple server
  submit paths complete the workflow.
- **FOS referral** (per claim): when a case hits status 'FOS Acceptance Form Sent'
  (maps to visible "FOS Submitted"), the worker mints `cases.fos_referral_token`
  and emails the `/fos-retainer/{token}` e-sign page — same token-mint pattern as
  offers/resign. Completion judged per-token via tracking Completed (token-keyed,
  type left unfiltered — tokens are unique uuids).
- New DDL scope (gated): `zz_portal_notify_workflow_chases` (INSERT on
  `workflow_triggers`, both chase types → one function with per-type wording) and
  `zz_portal_notify_cases_fos` (UPDATE OF fos_referral_token); GRANT SELECT on
  `workflow_triggers` (portal_app + portal_ro) and `questionnaire_tokens`
  (portal_ro, link lookup). Form links are served per-contact/claim by the portal
  backend (resign-link pattern) and open the CRM's existing pages — no in-portal
  forms this slice.

## Verification

Mirror Phase 7.2's drill — test contact **234852**, case **227003**, plus a second
account that must see nothing:

1. **Offer:** move the test case into 'Upheld' from the main CRM → bell +
   lender-named offer notification + requirement card; accept via the portal →
   CRM shows `Signatures/signature_acceptance_form.png`, tagged documents row,
   status/action logs; card flips to done; re-trigger raises nothing new
   (dedupe) once accepted.
2. **No spurious fires:** no-op saves on the test contact/case fire nothing
   (`spuriousFire:false` script pattern from 7.2).
3. **Bulk safety:** a script wrapped in `SET LOCAL portal.suppress_notifications='on'`
   mass-flipping statuses raises zero notifications (the FRL worker and mass-flip
   scripts touch these statuses — this is load-bearing, not theoretical).
4. **Isolation:** second portal account sees no notification, card, or claim.
5. Each later slice repeats 1–4 with its own trigger action.
