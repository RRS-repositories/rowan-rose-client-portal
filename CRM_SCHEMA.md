# CRM Schema — Live Investigation

Status: **investigated against the live production CRM** (read-only) on 2026-06-03.
Source: `crm` MCP server — read-only SQL + source-read into the CRM Postgres + Express monolith.
Supersedes the earlier "pending connection" stub.

> Scope note: this documents the CRM as it actually is, and how the portal maps onto it.
> The portal stores only its own auth data; all claim/document/financial data is **read** from the CRM (single source of truth).

---

## 1. Scale (live counts, 2026-06-03)

| table | rows |
|---|---|
| `contacts` (clients) | 89,431 |
| `cases` (claims) | 154,275 |
| `documents` | 383,438 |
| `notes` | 331,044 |
| `communications` | 69,262 |
| total tables in `public` schema | 143 |

Relationship is one-to-many: a contact has 1..30 cases. 45,926 contacts have exactly 1 case; the long tail goes to 30.

---

## 2. Core data model

### `contacts` — the client record (71 columns)
PK `id` **integer**. Portal-relevant columns:

| column | type | notes |
|---|---|---|
| `id` | integer PK | **stable internal key — this is what the portal links to** |
| `reference` | text | human client ref; **unique where present** (77,594 populated, 77,594 distinct). Display ref. |
| `client_id` | varchar | nearly empty (852 rows) — **ignore** |
| `first_name`, `last_name`, `full_name` | varchar | |
| `email` | varchar | 78,177 present, **77,355 distinct → ~820 duplicates** (not unique) |
| `phone`, `normalised_phone` | varchar | `normalised_phone` is E.164; dominant shape `+44`+10-digit NSN |
| `dob` | date | **46% NULL; dirty** (impossible years e.g. 0968/7984; 2,039 under-18) |
| address: `address_line_1/2`, `city`, `postal_code`, `street_address` | | |
| `identification`, `poa`, `questionnaire`, `extra_lender_form` | boolean | requirement tick-boxes |
| `document_checklist` | jsonb | per-client requirement state |
| `lead_status` | varchar | |

### `cases` — the claim record (432 columns)
PK `id` integer, FK `contact_id` → `contacts.id`. Portal-relevant columns:

| column | type | notes |
|---|---|---|
| `id` | integer PK | |
| `contact_id` | integer FK | → `contacts.id` |
| `case_number` | varchar | claim ref |
| `lender` | varchar | free text; resolve aliases via `lender_aliases` |
| `status` | varchar | **free-text, 67 distinct values in use** — see §4 |
| `claim_value` | numeric | |
| `offer_made`, `redress_amount` | numeric | offer / settlement |
| `frl_outcome`, `frl_overall_outcome`, `frl_date`, `redress_amount` | | Final Response Letter outcome |
| `fee_band`, `fee_percentage`, `fee_amount`, `fee_vat`, `fee_total` | | firm fee breakdown |
| `client_payout`, `client_owes`, `payout_scenario` | | settlement maths |
| `offer_accept_token` | uuid | existing CRM token-based acceptance flow |
| `parent_claim_id` | integer | claim-splitting |
| per-loan blocks `account_number_N`, `value_of_loan_N`, `apr_N` … (N=1..20) | | wide denormalised loan detail |

---

## 3. Identity & registration matching

| field | verdict for matching |
|---|---|
| `contacts.id` (int) | **link key** — always present, always unique. Store on the portal user. |
| `contacts.reference` (text) | unique where present (~77.6k); use as the human-facing ref shown in the UI |
| `contacts.email` | match input, but **NOT unique** (~820 dupes) → must be combined with a second factor |
| `contacts.dob` | weak second factor (46% NULL) — use only when present |
| `contacts.normalised_phone` | good second factor (E.164) |

**Matching strategy (email-first signup):** normalise email → look up `contacts` by `lower(email)`.
- exactly 1 match → link (store `contacts.id` + `reference`).
- multiple matches → disambiguate by `dob` and/or `normalised_phone`/surname; if still ambiguous, leave unlinked + flag for manual review.
- no match → the registrant signs up in the portal, completes onboarding, and is **written back to the CRM as a new `contacts` row** (so the portal needs insert access, not just reads). Duplicate-email junk records are excluded from matching so nobody links to the wrong record.

---

## 4. Status taxonomy → client phases

`cases.status` is **uncontrolled free text** (67 distinct values live, incl. casing dupes like `Payment Plan Setup`/`PAYMENT PLAN SET UP`, test junk `test`/`SELECT T`/`Temp`). Do **not** map status strings one by one.

Instead, `claim_statuses` (80 rows) assigns each status a `workflow_stage_id`, and `workflow_stages` names the stages:

| stage id | CRM stage name | → portal client phase | client-visible? |
|---|---|---|---|
| 398 | Pre-Verification | (not started) | **hidden** |
| 1 | Lead Generation | (not started) | **hidden** — incl. New Lead, Contact Attempted, Not Qualified, SALE |
| 2 | Client Onboarding | "Getting your claim set up" | visible |
| 3 | DSAR Process | "Gathering your lending records" | visible |
| 4 | Complaint Submission & Processing | "Your complaint is with the lender" | visible |
| 5 | FOS Escalation | "Escalated to the Ombudsman" | visible |
| 6 | Payments | "Outcome & payment" (offer/settled/unsuccessful) | visible |
| 7 | Debt Recovery | "Payment plan" | visible |
| 8 | Deduplication | — | **hidden** |
| 220 | Hold - Manual Review | map to nearest prior visible phase | **hidden state** |

**Statuses that must never reach a client** (filter server-side regardless of stage): `New Lead`, `New Facebook Lead`, `Contact Attempted`, `Not Qualified`, `SALE`, `Weak Case Cannot Continue`, `Counter team`, `Deduplicate Claim - Cannot Continue`, `Manual Review - Possible Duplicate`, all `* Error - Manual Review`, `Temp`, `Temporary Hold`, `test`, `SELECT T`. A claim whose status is hidden either drops out of the client's list or maps to a safe generic phase.

Outcome nuance within stage 6: `Offer Received`/`Offer Accepted`/`Awaiting Payment`/`Payment Received`/`Client Paid` are positive; `Claim Unsuccessful`/`Claim Withdrawn`/`Not upheld` are closed-negative — the portal needs distinct messaging for these even though they share a stage.

---

## 5. Documents & requirements

### `documents` (27 cols)
`id`, `contact_id`, `claim_id`, `lender`, `name`, `type`, `category`, `s3_key`, `url`, `file_extension`, `file_size_bytes`, `document_status`, `is_deleted`, `archived`, `is_current_loa`, `tracking_token` (uuid), timestamps.
- Files live in **S3** (`s3_key`); portal serves them via time-limited pre-signed URLs.
- Link to client via `contact_id`, to claim via `claim_id`.

### `required_documents` (8 cols)
`id`, `contact_id`, `claim_id`, `lender`, `category`, `is_satisfied` (bool), `satisfied_by_document_id`, `created_at`.
- This is the authoritative "what's outstanding" table — drives the portal "What We Need From You" card.
- Plus the contact-level booleans `identification`, `poa`, `questionnaire`, `extra_lender_form` and `document_checklist` jsonb.

Portal upload model (unchanged): **ID + Proof of Address = client-level**; **Bank Statement = per-lender/claim**. Questionnaire / Extra Lender / Acceptance Form are **CRM-generated links** (token columns on `cases`: `bank_statement_token`, `questionnaire_tokens`/`intake_tokens` tables, `id_upload_tokens`), surfaced only once generated CRM-side — deferred.

---

## 6. Financials & offers

- Per-claim financials live on `cases` (`claim_value`, `offer_made`, `redress_amount`, `frl_*`, `fee_band/percentage/amount/vat/total`, `client_payout`, `client_owes`, `payout_scenario`). There is also an analytics-oriented `case_financials` table (uuid id, `claim_amount`, `compensation_awarded`, `fee_*`, `profit`, `roi_percentage`) — **marketing/ROI attribution, not the client-facing figure**; use the `cases` columns for what the client sees.
- Offer acceptance already exists CRM-side via `cases.offer_accept_token` (uuid) + `offer_accept_email_sent`. The portal's accept action should reuse this token flow (or a CRM endpoint) so the CRM's own offer-acceptance handling runs — not a raw status write. (Note: there are **no Windmill triggers** in this flow.)
- Fee bands (firm, +VAT): B1 30%/cap£420 · B2 28%/£2,500 · B3 25%/£5,000 · B4 20%/£7,500 · B5 15%/£10,000. The frontend already computes these (`data/financials.ts`) — keep server responses consistent, don't double-apply.

---

## 7. Portal screen → CRM source mapping

| portal screen | reads from |
|---|---|
| Auth / profile | portal `users` (account) + `contacts` (name, dob, email, phone, `reference`) via the link |
| Dashboard claim cards | `cases` filtered by `contact_id`, hidden statuses removed, status→phase mapped |
| Claim detail + timeline | `cases` row + `notes`/`communications`/status history for the narrative timeline |
| Documents | `documents` (+ `required_documents`) by `contact_id`/`claim_id` |
| "What We Need From You" | `required_documents.is_satisfied = false` + contact tick-boxes |
| Offers | `cases.offer_made`/`redress_amount`/`offer_accept_token` + fee fields |

---

## 8. Production connection options (decision pending — see §10)

The `crm` MCP is how the **agent** explores; the **running portal** needs its own connection. Because new (unmatched) registrants must be written into the CRM as new `contacts`, the portal needs **read + scoped write** (read clients/claims/documents; insert/update `contacts`), not read-only.

- **A. Direct Postgres connection (recommended)** — portal connects to the CRM Postgres with a dedicated role (read clients/claims/documents; insert/update `contacts`). Simplest and fastest; supports both matching/reads and new-signup write-back. The portal's own auth/session tables live in a `portal` schema in the same database — no second database, no Docker.
- **B. CRM REST API** — portal calls CRM endpoints for all reads and writes. More work on the CRM side; only if you'd rather the portal never touch the DB directly.

There are **no Windmill triggers** involved, so writes do not need to route through a workflow engine.

---

## 9. Validation rules (implemented 2026-06-03)

- **Phone — 10 digits (UK):** `backend/src/lib/auth.js` `normalizePhoneUK()`/`phoneError()` + frontend `validatePhone()`. Accepts `07…`, `+44…`, `0044…`, bare 10-digit; requires exactly 10 significant digits (UK national number); stores E.164 `+44XXXXXXXXXX` (matches `ClientProfile.phone`).
- **DOB 18+:** enforced at registration (existing `dobError`) **and now at login** (`ageFrom(user.dob)` gate in `/auth/login`). Login blocks only a confirmed under-18; a missing/garbled DOB doesn't lock an existing client out.

---

## 10. Open decisions for Brad

1. **Connection method** (§8) — direct Postgres connection (recommended) vs CRM REST API. The running app needs its own credential (read + insert/update `contacts`); the MCP read access is the agent's, not the server's.
2. ~~Registration match policy~~ — **decided 2026-06-03:** match existing clients on email + a second factor, excluding duplicate-email junk records; unmatched registrants sign up, onboard, and are **written into the CRM as a new contact**.
