/** Phase 4.1 — Offer Review & E-Signature mock data and API.
 *
 *  Offers are keyed by claim ID and held in a module-scoped record so that
 *  acceptOffer/rejectOffer can mutate the underlying claim's internalStatus
 *  (and push a timeline event) — the dashboard + claim detail then reflect
 *  the change on their next mock-query fetch.
 *
 *  All numbers come from the existing computeFee() helper (Band 2, 28% + VAT,
 *  cap £2,500 for £3,480) — never hardcoded.
 */
import { CLIENT, notifyUnread } from "./mock";
import { computeFee } from "./financials";
import { fakeDelay } from "@/lib/fakeNetwork";
import type { Claim, InternalStatus, TimelineEntry } from "./types";

export interface OfferDetails {
  claimId: string;
  lenderName: string;
  offerAmount: number;
  offerDate: string;
  expiryDate: string;
  offerReference: string;
  termsOfAcceptance: string;
  /** Display percentage (band rate, ex-VAT). Real fee/net come from computeFee. */
  feePercentage: number;
  /** Fee inclusive of VAT — what the client actually loses. */
  estimatedFeeAmount: number;
  /** Offer minus fee inc VAT. */
  estimatedNetToClient: number;
  status: "pending" | "accepted" | "rejected" | "expired";
}

export interface OfferAcceptancePayload {
  claimId: string;
  offerReference: string;
  /** Base64 PNG data URL of the drawn signature. */
  signatureData: string;
  agreedToTerms: boolean;
  acceptedAt: string;
}

export interface OfferAcceptanceResponse {
  success: boolean;
  message: string;
  /** Plain-English status label after acceptance (display only). */
  updatedStatus: string;
}

export interface OfferRejectionResponse {
  success: boolean;
  message: string;
}

function buildTermsText(lenderName: string, offerAmount: number, feePct: number, feeInc: number, net: number): string {
  const amountWords = currencyToWords(offerAmount);
  return `TERMS OF ACCEPTANCE

By accepting this offer, you ("the Client") agree to the following terms:

1. SETTLEMENT AMOUNT
The lender, ${lenderName}, has offered a settlement of ${formatGbp(offerAmount)} (${amountWords}) in full and final settlement of your complaint regarding irresponsible lending.

2. FULL AND FINAL SETTLEMENT
Acceptance of this offer constitutes a full and final settlement of your complaint. You will not be able to pursue any further claims against the lender in relation to this matter.

3. FEES
Rowan Rose Solicitors will deduct their agreed fee of ${feePct}% (plus VAT) from the settlement amount. The estimated fee, inclusive of VAT, is ${formatGbp(feeInc)}, leaving an estimated net payment to you of ${formatGbp(net)}.

4. PAYMENT TIMELINE
The lender has agreed to make payment within 28 days of receiving the signed acceptance. Rowan Rose Solicitors will process your payment within 5 working days of receiving the funds from the lender.

5. WITHDRAWAL
Once this acceptance is signed and submitted, it cannot be withdrawn. Please ensure you are satisfied with the terms before signing.

6. DATA PROCESSING
Your signed acceptance will be stored securely in compliance with GDPR. The signature and acceptance record will be shared with the lender as proof of your agreement.

7. GOVERNING LAW
This agreement is governed by the laws of England and Wales.

If you have any questions about these terms, please contact your claims handler before signing.`;
}

function formatGbp(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);
}

function currencyToWords(n: number): string {
  // Compact words form for the terms preamble. Not exhaustive — covers the
  // small set of offer amounts we surface in mock.
  const pounds = Math.floor(n);
  const pence = Math.round((n - pounds) * 100);
  const poundsWords = numberToWords(pounds);
  const penceWords = pence > 0 ? ` and ${pence} pence` : "";
  return `${poundsWords} pounds${penceWords}`.replace(/^./, (c) => c.toLowerCase());
}

function numberToWords(n: number): string {
  if (n === 0) return "zero";
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const parts: string[] = [];
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  if (thousands > 0) parts.push(`${numberToWords(thousands)} thousand`);
  if (rest >= 100) {
    parts.push(`${ones[Math.floor(rest / 100)]} hundred`);
  }
  const lastTwo = rest % 100;
  if (lastTwo > 0) {
    if (parts.length > 0) parts.push("and");
    if (lastTwo < 20) parts.push(ones[lastTwo]);
    else parts.push(tens[Math.floor(lastTwo / 10)] + (lastTwo % 10 ? `-${ones[lastTwo % 10]}` : ""));
  }
  return parts.join(" ");
}

/** Build an OfferDetails for a claim that has financials.offer set. The
 *  computeFee helper drives the fee/net so we stay consistent with the rest
 *  of the app. */
function buildOfferFor(claim: Claim, reference: string, offerDate: string, expiryDate: string): OfferDetails {
  const offer = claim.financials?.offer ?? 0;
  const breakdown = computeFee(offer);
  return {
    claimId: claim.id,
    lenderName: claim.lender.name,
    offerAmount: offer,
    offerDate,
    expiryDate,
    offerReference: reference,
    termsOfAcceptance: buildTermsText(claim.lender.name, offer, Math.round(breakdown.pct * 100), breakdown.feeIncVat, breakdown.net),
    feePercentage: Math.round(breakdown.pct * 100),
    estimatedFeeAmount: breakdown.feeIncVat,
    estimatedNetToClient: breakdown.net,
    status:
      claim.internalStatus === "Offer Accepted"
        ? "accepted"
        : claim.internalStatus === "Offer Rejected"
          ? "rejected"
          : "pending",
  };
}

/** Per-claim mock offer table. Keyed by claim ID. */
const OFFER_TABLE: Record<string, { reference: string; offerDate: string; expiryDate: string }> = {
  "RR-676687-554/09": {
    reference: "118-OFF-2026-0091",
    offerDate: "2026-05-20",
    expiryDate: "2026-06-20",
  },
};

/** Mock GET /client/offers/:claimId — returns offer details for any claim with
 *  an OFFER_TABLE entry. Returns null otherwise. */
export async function getOfferDetails(claimId: string): Promise<OfferDetails | null> {
  await fakeDelay(400, 800);
  const claim = CLIENT.claims.find((c) => c.id === claimId);
  const entry = OFFER_TABLE[claimId];
  if (!claim || !entry) return null;
  return buildOfferFor(claim, entry.reference, entry.offerDate, entry.expiryDate);
}

/** Mock POST /client/offers/:claimId/accept — flips status, pushes timeline,
 *  returns success payload. Mutates CLIENT in place so consumers see the
 *  update on next mock-query fetch. */
export async function acceptOffer(claimId: string, payload: OfferAcceptancePayload): Promise<OfferAcceptanceResponse> {
  await fakeDelay(1800, 2200);
  const claim = CLIENT.claims.find((c) => c.id === claimId);
  if (!claim) {
    return { success: false, message: "We couldn't find that claim. Please try again.", updatedStatus: "" };
  }
  if (claim.internalStatus !== "Offer Received") {
    return {
      success: false,
      message: "This offer has already been actioned. Please refresh and try again.",
      updatedStatus: clientFacingStatus(claim.internalStatus),
    };
  }
  const offer = claim.financials?.offer ?? 0;
  claim.internalStatus = "Offer Accepted";
  claim.offerActionedAt = payload.acceptedAt;
  const newEntry: TimelineEntry = {
    id: `t-accept-${Date.now()}`,
    text: `You accepted the offer of ${formatGbp(offer)} from ${claim.lender.name}.`,
    date: payload.acceptedAt.slice(0, 10),
    icon: "task_alt",
  };
  claim.timeline = [newEntry, ...claim.timeline];
  notifyUnread();
  return {
    success: true,
    message: "Offer accepted successfully. The lender will process payment within 28 days.",
    updatedStatus: "Offer Accepted",
  };
}

/** Mock POST /client/offers/:claimId/reject — flips status to rejected with
 *  an optional reason captured in the timeline narrative. */
export async function rejectOffer(claimId: string, reason?: string): Promise<OfferRejectionResponse> {
  await fakeDelay(800, 1200);
  const claim = CLIENT.claims.find((c) => c.id === claimId);
  if (!claim) {
    return { success: false, message: "We couldn't find that claim. Please try again." };
  }
  if (claim.internalStatus !== "Offer Received") {
    return { success: false, message: "This offer has already been actioned." };
  }
  const offer = claim.financials?.offer ?? 0;
  const now = new Date().toISOString();
  claim.internalStatus = "Offer Rejected";
  claim.offerActionedAt = now;
  const reasonClause = reason && reason.trim() ? ` Your reason: "${reason.trim()}"` : "";
  const newEntry: TimelineEntry = {
    id: `t-reject-${Date.now()}`,
    text: `You rejected the offer of ${formatGbp(offer)} from ${claim.lender.name}. We will pursue further action on your behalf.${reasonClause}`,
    date: now.slice(0, 10),
    icon: "block",
  };
  claim.timeline = [newEntry, ...claim.timeline];
  notifyUnread();
  return { success: true, message: "Offer rejected. We will continue pursuing your claim." };
}

function clientFacingStatus(status: InternalStatus): string {
  if (status === "Offer Accepted") return "Offer Accepted";
  if (status === "Offer Rejected") return "Offer Rejected";
  return "Updated";
}
