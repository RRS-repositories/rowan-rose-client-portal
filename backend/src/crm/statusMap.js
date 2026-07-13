/**
 * CRM raw status  →  client-facing InternalStatus  (read-only integration).
 *
 * The live CRM has 80+ internal statuses. The portal frontend understands the
 * 20 `InternalStatus` values in frontend/app/src/data/types.ts, which it maps to
 * a ClaimPhase + plain-English message (statusMap.ts). This file is the bridge.
 *
 * VISIBILITY POLICY (Brad, 2026-06-25): show EVERY claim — nothing is hidden.
 * BUT we never leak the raw internal status to the client: each CRM status is
 * mapped to a safe client-facing phase. Dead/rejected/sensitive statuses
 * (Not Qualified, Weak Case Cannot Continue, Timebarred, duplicates) map to
 * "Claim Closed" so the client just sees a neutral "this claim is closed"
 * rather than the harsh internal wording. Lead/intake stages map to
 * "Onboarding" (Getting Started). This keeps the portal's claim list aligned
 * with the CRM while protecting the client from internal language.
 *
 * NOTE: these mappings are product/comms decisions — review and adjust freely.
 */

const ONBOARDING = "Onboarding";
const DOCS = "Documents Required";
const CLOSED = "Claim Closed";

/** @type {Record<string, string>} keyed by lower-cased, trimmed CRM status. */
const RAW_MAP = {
  // ── Stage 1: leads / sale / intake → Getting Started ──
  "new lead": ONBOARDING,
  "new facebook lead": ONBOARDING,
  "contact attempted": ONBOARDING,
  "not qualified": CLOSED,
  "sale": ONBOARDING,
  "overdraft claim sent": ONBOARDING,
  "scam claim sent": ONBOARDING,
  "ccj claim sent": ONBOARDING,
  "pba claim sent": ONBOARDING,
  "bank gambling claim sent": ONBOARDING,
  "h&t pledge claim sent": ONBOARDING,
  "loa sent": ONBOARDING,

  // ── Stage 2: onboarding ──
  "resend loa": ONBOARDING,
  "loa uploaded": ONBOARDING,
  "loa signed": ONBOARDING,
  "id request sent": DOCS,
  "id verification pending": DOCS,
  "poa required": DOCS,
  "extra lender selection form sent": DOCS,
  "extra lender selection form completed": ONBOARDING,
  "questionnaire sent": DOCS,
  "questionnaire completed": ONBOARDING,
  "onboarding complete": ONBOARDING,
  "dsar prepare error - manual review": "DSAR Sent",

  // ── Stage 3: DSAR (investigation) ──
  "dsar prepared": "DSAR Sent",
  "dsar prepared awaiting i.d": DOCS,
  "dsar sent to lender": "DSAR Sent",
  "unable to locate": "DSAR Chased",
  "unable to locate account number": "DSAR Chased",
  "unable to locate - completed": "DSAR Chased",
  "dsar overdue": "DSAR Chased",
  "dsar response received": "DSAR Received",
  "dsar escalated (ico)": "DSAR Chased",
  "dsar review completed": "DSAR Received",
  "weak case cannot continue": CLOSED,
  "missing data from dsar": "DSAR Received",
  "timebarred": CLOSED,
  "dsar review error - manual review": "DSAR Received",

  // ── Stage 4: complaint ──
  "complaint drafted": "Complaint Submitted",
  "complaint drafted awaiting questionnaire": DOCS,
  "complaint submitted": "Complaint Submitted",
  "complaint overdue": "Complaint Chased",
  "upheld": "FRL Received",
  "not upheld": "FRL Received",
  "bank statements requested": "Awaiting Bank Statements",
  "counter team": "Counter Response Sent",
  "counter response sent": "Counter Response Sent",
  "frl received": "FRL Received",
  "frl extraction error": "FRL Received",
  "complaint draft error - manual review": "Complaint Submitted",

  // ── Stage 5: FOS (ombudsman) ──
  "fos acceptance form sent": "FOS Submitted",
  "fos referral prepared": "FOS Submitted",
  "fos submitted": "FOS Submitted",
  "fos case number received": "FOS Awaiting Decision",
  "fos investigation": "FOS Awaiting Decision",
  "fos provisional decision": "FOS Awaiting Decision",
  "fos final decision": "FOS Awaiting Decision",
  "fos appeal": "FOS Chased",

  // ── Stage 6: offer / settlement / payment ──
  "offer received": "Offer Received",
  "offer under negotiation": "Offer Received",
  "offer accepted": "Offer Accepted",
  "awaiting payment": "Offer Accepted",
  "awaiting payment - upheld": "Offer Accepted",
  "payment received": "Payment Received",
  "payment received verification": "Payment Received",
  "payment error - manual review": "Payment Received",
  "invoice generated": "Fee Deducted",
  "fee deducted": "Fee Deducted",
  "client paid": "Client Paid",
  "claim unsuccessful": CLOSED,
  "claim withdrawn": CLOSED,

  // ── Stage 7: debt / fee collection ──
  "irl/payments/cancellation fee paid": "Client Paid",
  "payment plan completed": "Client Paid",
  "payment plan setup": "Client Paid",
  "debt contact required": CLOSED,
  "failed payment plan": CLOSED,
  "debt letter sent": CLOSED,
  "chasing debt": CLOSED,

  // ── Stage 8 / misc ──
  "deduplicate claim - cannot continue": CLOSED,
  "manual review - possible duplicate": CLOSED,
  "temp": ONBOARDING,
  "temporary hold": ONBOARDING,
  "pre verification": ONBOARDING,

  // ── Real-data variants (cases.status drifts from the claim_statuses table) ──
  "i.d request sent": DOCS,
  "lender selection form completed": ONBOARDING,
  "loa signature error - manual review": ONBOARDING,
  "awaiting callback": ONBOARDING,
  "select t": ONBOARDING,
  "test": ONBOARDING,
};

/** Statuses (mapped, client-facing) that count as "escalated to the Ombudsman". */
const FOS_STATUSES = new Set(["FOS Submitted", "FOS Awaiting Decision", "FOS Chased"]);

/** Unknown/new CRM statuses default to a safe generic phase (and are logged). */
const DEFAULT_STATUS = ONBOARDING;
const seenUnknown = new Set();

/**
 * Map a raw CRM status string to a client-facing InternalStatus. Never returns
 * null under the show-everything policy: unknown statuses fall back to a safe
 * generic phase and are logged once so we can classify them.
 */
export function mapStatus(rawStatus) {
  const key = String(rawStatus || "").trim().toLowerCase();
  if (key in RAW_MAP) return RAW_MAP[key];
  if (key && !seenUnknown.has(key)) {
    seenUnknown.add(key);
    console.warn(`[crm] unmapped status "${rawStatus}" → ${DEFAULT_STATUS}. Add it to statusMap.js.`);
  }
  return DEFAULT_STATUS;
}

export const isEscalatedStatus = (internalStatus) => FOS_STATUSES.has(internalStatus);
export { RAW_MAP };
