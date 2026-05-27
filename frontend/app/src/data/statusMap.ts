import type { ClaimPhase, InternalStatus, Claim } from "./types";

/** Brief §7 — the ONLY thing the client sees. Messages verbatim. */
export const STATUS_MAP: Record<InternalStatus, { phase: ClaimPhase; message: string }> = {
  Onboarding: { phase: "Getting Started", message: "We're setting up your claim. Please check the items we need from you below." },
  "Documents Required": { phase: "Getting Started", message: "We need some documents from you to get started. Please upload the items listed below." },
  "Awaiting Bank Statements": { phase: "Getting Started", message: "We're waiting for your bank statements. Once they arrive we'll begin our assessment." },
  "DSAR Sent": { phase: "Investigation", message: "We've asked the lender for your full lending records. This usually takes about 30 days." },
  "DSAR Received": { phase: "Investigation", message: "Your lending records have arrived. We're going through them now." },
  "DSAR Chased": { phase: "Investigation", message: "We're chasing the lender — they haven't sent your records within the time they're supposed to." },
  "Complaint Submitted": { phase: "Claim In Progress", message: "Your complaint has gone in. We're now waiting for the lender's formal response." },
  "Complaint Chased": { phase: "Claim In Progress", message: "We're chasing the lender for their response." },
  "FRL Received": { phase: "Claim In Progress", message: "The lender has responded. We're reviewing what they've said." },
  "Counter Response Sent": { phase: "Claim In Progress", message: "We've sent a detailed challenge to the lender's response." },
  "FOS Submitted": { phase: "Escalated to Ombudsman", message: "Your case has gone to the Financial Ombudsman for an independent decision." },
  "FOS Chased": { phase: "Escalated to Ombudsman", message: "We're chasing the Ombudsman for an update." },
  "FOS Awaiting Decision": { phase: "Escalated to Ombudsman", message: "The Ombudsman is reviewing your case. We'll let you know as soon as there's a decision." },
  "Offer Received": { phase: "Offer Received", message: "An offer has been made. Please review the details and the acceptance form below." },
  "Offer Accepted": { phase: "Offer Received", message: "You've accepted the offer. We're now waiting for payment from the lender." },
  "Offer Rejected": { phase: "Offer Received", message: "The offer was rejected and we're pursuing the next step on your behalf." },
  "Payment Received": { phase: "Settlement", message: "Payment has arrived from the lender. We're processing your settlement now." },
  "Fee Deducted": { phase: "Settlement", message: "Our fee has been deducted. Your payment is being prepared." },
  "Client Paid": { phase: "Completed", message: "All done — your settlement has been paid to you. See the breakdown below." },
  "Claim Closed": { phase: "Closed", message: "This claim is closed. If you have any questions, please contact us." },
};

export const phaseOf = (c: Claim): ClaimPhase => STATUS_MAP[c.internalStatus].phase;
export const clientMessage = (c: Claim): string => STATUS_MAP[c.internalStatus].message;
