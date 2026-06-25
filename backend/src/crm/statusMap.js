/**
 * CRM raw status  →  client-facing InternalStatus  (read-only integration).
 *
 * The live CRM (`public.claim_statuses`) has 80+ internal statuses. The portal
 * frontend only understands the 20 `InternalStatus` values in
 * frontend/app/src/data/types.ts, which it maps to a ClaimPhase + plain-English
 * message via statusMap.ts. This file is the bridge.
 *
 * SECURITY: statuses that must NEVER reach a client (leads/sales, internal
 * review, "weak case", debt-chasing, dedup, error states) map to `null`.
 * A claim whose status maps to null is filtered OUT of the client's claim list
 * server-side — the sensitive status string never leaves this server.
 *
 * NOTE FOR BRAD/HANDLERS: these mappings are product/comms decisions. They're
 * a best-effort default — review and adjust. Unknown/new CRM statuses default
 * to HIDDEN (safe) and are logged so we notice and classify them.
 */

/** @type {Record<string, string|null>} keyed by lower-cased, trimmed CRM status. */
const RAW_MAP = {
  // ── Stage 1: leads / sale / intake — HIDDEN (not yet a real, signed client) ──
  "new lead": null,
  "new facebook lead": null,
  "contact attempted": null,
  "not qualified": null,
  "sale": null,
  "overdraft claim sent": null,
  "scam claim sent": null,
  "ccj claim sent": null,
  "pba claim sent": null,
  "bank gambling claim sent": null,
  "h&t pledge claim sent": null,
  "loa sent": "Onboarding",

  // ── Stage 2: onboarding ──
  "resend loa": "Onboarding",
  "loa uploaded": "Onboarding",
  "loa signed": "Onboarding",
  "id request sent": "Documents Required",
  "id verification pending": "Documents Required",
  "poa required": "Documents Required",
  "extra lender selection form sent": "Documents Required",
  "extra lender selection form completed": "Onboarding",
  "questionnaire sent": "Documents Required",
  "questionnaire completed": "Onboarding",
  "onboarding complete": "Onboarding",
  "dsar prepare error - manual review": null,

  // ── Stage 3: DSAR (investigation) ──
  "dsar prepared": "DSAR Sent",
  "dsar prepared awaiting i.d": "Documents Required",
  "dsar sent to lender": "DSAR Sent",
  "unable to locate": "DSAR Chased",
  "unable to locate account number": "DSAR Chased",
  "unable to locate - completed": "DSAR Chased",
  "dsar overdue": "DSAR Chased",
  "dsar response received": "DSAR Received",
  "dsar escalated (ico)": "DSAR Chased",
  "dsar review completed": "DSAR Received",
  "weak case cannot continue": null,
  "missing data from dsar": "DSAR Received",
  "timebarred": null,
  "dsar review error - manual review": null,

  // ── Stage 4: complaint ──
  "complaint drafted": "Complaint Submitted",
  "complaint drafted awaiting questionnaire": "Documents Required",
  "complaint submitted": "Complaint Submitted",
  "complaint overdue": "Complaint Chased",
  "upheld": "FRL Received",
  "not upheld": "FRL Received",
  "bank statements requested": "Awaiting Bank Statements",
  "counter team": null,
  "counter response sent": "Counter Response Sent",
  "frl received": "FRL Received",
  "frl extraction error": null,
  "complaint draft error - manual review": null,

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
  "offer accepted": "Offer Accepted",
  "awaiting payment": "Offer Accepted",
  "awaiting payment - upheld": "Offer Accepted",
  "payment received": "Payment Received",
  "payment received verification": "Payment Received",
  "payment error - manual review": null,
  "invoice generated": "Fee Deducted",
  "client paid": "Client Paid",
  "claim unsuccessful": "Claim Closed",
  "claim withdrawn": "Claim Closed",

  // ── Stage 7: debt / fee collection — HIDDEN (delicate, staff-handled) ──
  "debt contact required": null,
  "failed payment plan": null,
  "debt letter sent": null,
  "irl/payments/cancellation fee paid": "Client Paid",
  "chasing debt": null,
  "payment plan setup": null,
  "payment plan completed": "Client Paid",

  // ── Stage 8 / misc — HIDDEN ──
  "deduplicate claim - cannot continue": null,
  "manual review - possible duplicate": null,
  "temp": null,
  "temporary hold": null,
  "pre verification": null,

  // ── Real-data variants (cases.status drifts from the claim_statuses table) ──
  "i.d request sent": "Documents Required",
  "lender selection form completed": "Onboarding",
  "fee deducted": "Fee Deducted",
  "offer under negotiation": "Offer Received",
  // Known junk / staff-only test values — explicitly hidden to keep logs quiet.
  "loa signature error - manual review": null,
  "awaiting callback": null,
  "select t": null,
  "test": null,
};

/** Statuses (mapped, client-facing) that count as "escalated to the Ombudsman". */
const FOS_STATUSES = new Set(["FOS Submitted", "FOS Awaiting Decision", "FOS Chased"]);

const seenUnknown = new Set();

/**
 * Map a raw CRM status string to a client-facing InternalStatus.
 * Returns null when the status is hidden (claim should be filtered out).
 * Unknown statuses are treated as hidden and logged once.
 */
export function mapStatus(rawStatus) {
  const key = String(rawStatus || "").trim().toLowerCase();
  if (key in RAW_MAP) return RAW_MAP[key];
  if (key && !seenUnknown.has(key)) {
    seenUnknown.add(key);
    console.warn(`[crm] unmapped status "${rawStatus}" → hidden. Add it to statusMap.js.`);
  }
  return null;
}

export const isEscalatedStatus = (internalStatus) => FOS_STATUSES.has(internalStatus);
export { RAW_MAP };
