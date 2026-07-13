import type { Client, Claim, Lender, Requirement } from "./types";

const VANQUIS: Lender = { name: "Vanquis", initials: "V", brand: "#6b3fa0", product: "Credit Card", icon: "account_balance" };
const ONE18: Lender = { name: "118 118 Money", initials: "118", brand: "#0369a1", product: "Personal Loan", icon: "payments" };
const LENDING_STREAM: Lender = { name: "Lending Stream", initials: "LS", brand: "#0f766e", product: "Short-term Loan", icon: "payments" };
const QUIDMARKET: Lender = { name: "QuidMarket", initials: "QM", brand: "#b45309", product: "Short-term Loan", icon: "request_quote" };
const NEWDAY: Lender = { name: "NewDay (Aqua)", initials: "ND", brand: "#0891b2", product: "Credit Card", icon: "credit_card" };
const LENDABLE: Lender = { name: "Lendable", initials: "L", brand: "#16a34a", product: "Personal Loan", icon: "savings" };
const MONEYBOAT: Lender = { name: "Moneyboat", initials: "MB", brand: "#2563eb", product: "Short-term Loan", icon: "payments" };
const CASHFLOAT: Lender = { name: "Cashfloat", initials: "CF", brand: "#7c3aed", product: "Short-term Loan", icon: "payments" };

/** Sarah Holden — eight claims so every ClaimPhase / StatusPill state demos:
 *  /28 Getting Started · /21 Investigation · /31 Claim In Progress
 *  /18 Escalated to Ombudsman · /09 Offer Received · /11 Settlement
 *  /14 Completed (escalated) · /05 Closed.
 *  unreadMessages drives the notification bell (total = 5). */
export const CLIENT: Client = {
  id: "RR-676687-554",
  firstName: "Sarah",
  lastName: "Holden",
  claims: [
    {
      id: "RR-676687-554/21",
      lender: VANQUIS,
      internalStatus: "DSAR Sent",
      escalated: false,
      openedOn: "2026-04-28",
      unreadMessages: 1,
      timeline: [
        { id: "t1", text: "We wrote to Vanquis requesting your full lending records.", date: "2026-05-14", icon: "outgoing_mail" },
        { id: "t2", text: "Your claim passed our initial affordability checks.", date: "2026-05-02", icon: "fact_check" },
        { id: "t3", text: "We set up your claim and confirmed your personal details.", date: "2026-04-28", icon: "person_check" },
      ],
    },
    {
      id: "RR-676687-554/09",
      lender: ONE18,
      internalStatus: "Offer Received",
      escalated: false,
      openedOn: "2026-01-09",
      unreadMessages: 1,
      financials: { offer: 3480 },
      timeline: [
        { id: "t1", text: "118 118 Money has made an offer to settle your claim.", date: "2026-05-20", icon: "mark_email_unread" },
        { id: "t2", text: "We sent a detailed challenge to the lender's response.", date: "2026-03-18", icon: "gavel" },
        { id: "t3", text: "Your complaint was submitted to 118 118 Money.", date: "2026-02-14", icon: "send" },
        { id: "t4", text: "We finished reviewing your lending records.", date: "2026-01-30", icon: "fact_check" },
      ],
    },
    {
      id: "RR-676687-554/14",
      lender: LENDING_STREAM,
      internalStatus: "Client Paid",
      escalated: true,
      openedOn: "2025-09-02",
      unreadMessages: 0,
      financials: { gross: 6400, paymentDate: "2026-05-12" },
      timeline: [
        { id: "t1", text: "All done — your settlement has been paid to you.", date: "2026-05-12", icon: "paid" },
        { id: "t2", text: "Our fee was deducted and your payment was prepared.", date: "2026-05-09", icon: "receipt_long" },
        { id: "t3", text: "Payment arrived from Lending Stream.", date: "2026-05-06", icon: "account_balance" },
        { id: "t4", text: "You accepted the offer of £6,400 from Lending Stream.", date: "2026-04-21", icon: "task_alt" },
        { id: "t5", text: "The Ombudsman upheld your complaint.", date: "2026-04-02", icon: "balance" },
        { id: "t6", text: "Your case was escalated to the Financial Ombudsman.", date: "2026-01-15", icon: "gavel" },
      ],
    },
    {
      id: "RR-676687-554/28",
      lender: QUIDMARKET,
      internalStatus: "Documents Required",
      escalated: false,
      openedOn: "2026-05-20",
      unreadMessages: 1,
      timeline: [
        { id: "t1", text: "We need a few documents from you before we can begin. Please upload the items we've listed.", date: "2026-05-22", icon: "upload_file" },
        { id: "t2", text: "We set up your claim and confirmed your personal details.", date: "2026-05-20", icon: "person_check" },
      ],
    },
    {
      id: "RR-676687-554/31",
      lender: NEWDAY,
      internalStatus: "Complaint Submitted",
      escalated: false,
      openedOn: "2026-02-20",
      unreadMessages: 2,
      timeline: [
        { id: "t1", text: "Your complaint has gone in to NewDay. We're now waiting for their formal response.", date: "2026-05-18", icon: "send" },
        { id: "t2", text: "We answered a question you sent us about your claim.", date: "2026-05-06", icon: "forum" },
        { id: "t3", text: "We finished reviewing your lending records.", date: "2026-04-30", icon: "fact_check" },
        { id: "t4", text: "We confirmed all your documents had been received and were in order.", date: "2026-04-22", icon: "task_alt" },
        { id: "t5", text: "NewDay sent us your full lending records.", date: "2026-04-10", icon: "mail" },
        { id: "t6", text: "We chased NewDay for your lending records.", date: "2026-03-25", icon: "forward_to_inbox" },
        { id: "t7", text: "We wrote to NewDay requesting your full lending records.", date: "2026-03-12", icon: "outgoing_mail" },
        { id: "t8", text: "We set up your claim and confirmed your personal details.", date: "2026-02-20", icon: "person_check" },
      ],
    },
    {
      id: "RR-676687-554/18",
      lender: LENDABLE,
      internalStatus: "FOS Awaiting Decision",
      escalated: true,
      openedOn: "2025-11-15",
      unreadMessages: 0,
      timeline: [
        { id: "t1", text: "The Ombudsman is now reviewing your case. We'll let you know as soon as there's a decision.", date: "2026-05-10", icon: "balance" },
        { id: "t2", text: "Your case was escalated to the Financial Ombudsman.", date: "2026-04-15", icon: "gavel" },
        { id: "t3", text: "Lendable rejected your complaint, so we're taking it further on your behalf.", date: "2026-03-20", icon: "mail" },
        { id: "t4", text: "Your complaint was submitted to Lendable.", date: "2026-01-22", icon: "send" },
        { id: "t5", text: "We set up your claim and confirmed your personal details.", date: "2025-11-15", icon: "person_check" },
      ],
    },
    {
      id: "RR-676687-554/11",
      lender: MONEYBOAT,
      internalStatus: "Fee Deducted",
      escalated: false,
      openedOn: "2025-10-01",
      unreadMessages: 0,
      financials: { gross: 1850, paymentDate: "2026-05-15" },
      timeline: [
        { id: "t1", text: "Our fee has been deducted and your payment is being prepared.", date: "2026-05-15", icon: "receipt_long" },
        { id: "t2", text: "Payment of £1,850 arrived from Moneyboat.", date: "2026-05-11", icon: "account_balance" },
        { id: "t3", text: "You accepted the offer of £1,850 from Moneyboat.", date: "2026-04-28", icon: "task_alt" },
        { id: "t4", text: "Moneyboat made an offer to settle your claim.", date: "2026-04-10", icon: "mark_email_unread" },
        { id: "t5", text: "We set up your claim and confirmed your personal details.", date: "2025-10-01", icon: "person_check" },
      ],
    },
    {
      id: "RR-676687-554/05",
      lender: CASHFLOAT,
      internalStatus: "Claim Closed",
      escalated: false,
      openedOn: "2025-06-01",
      unreadMessages: 0,
      timeline: [
        { id: "t1", text: "This claim is now closed. If you have any questions, please get in touch.", date: "2026-02-28", icon: "lock" },
        { id: "t2", text: "After reviewing your records, there wasn't enough to take this claim further.", date: "2026-02-10", icon: "info" },
        { id: "t3", text: "We set up your claim and confirmed your personal details.", date: "2025-06-01", icon: "person_check" },
      ],
    },
  ],
  // Client-uploaded document requirements. ID and Proof of Address are
  // client-level (one each). Bank statements are LENDER-SPECIFIC — one per
  // lender/claim that needs them (tagged with lenderName + claimId).
  // Questionnaire, Extra Lender Form and Acceptance Form are NOT uploads — they
  // arrive as CRM-generated links and surface only once generated CRM-side.
  // Deferred until the portal is wired to the CRM (see phase 7.1).
  requirements: [
    { id: "r-id", kind: "id", title: "ID Verification", description: "Upload a photo of your passport, driving licence, or national ID card.", icon: "id_card", done: false, action: "/documents" },
    { id: "r-addr", kind: "address", title: "Proof of Address", description: "Upload a recent utility bill, bank statement, or council tax letter (dated within the last 3 months).", icon: "home_pin", done: false, action: "/documents" },
    { id: "r-bank-quid", kind: "bank-statements", title: "Bank Statement — QuidMarket", description: "Upload your bank statements covering your QuidMarket borrowing.", icon: "account_balance", done: false, lenderName: "QuidMarket", claimId: "RR-676687-554/28", action: "/documents" },
    { id: "r-bank-vanquis", kind: "bank-statements", title: "Bank Statement — Vanquis", description: "Upload your bank statements covering your Vanquis borrowing.", icon: "account_balance", done: true, receivedOn: "2026-05-17", lenderName: "Vanquis", claimId: "RR-676687-554/21", action: "/documents" },
  ],
  documents: [
    { id: "d1", name: "bank-statement-jan2026.pdf", mime: "application/pdf", fileSize: 2_516_582, documentType: "bank-statement", uploadedOn: "2026-05-17", status: "verified", lenderName: "Vanquis", kind: "pdf" },
    { id: "d2", name: "bank-statement-dec2025.pdf", mime: "application/pdf", fileSize: 2_201_472, documentType: "bank-statement", uploadedOn: "2026-05-10", status: "verified", lenderName: "Vanquis", kind: "pdf" },
    { id: "d3", name: "vanquis-agreement.pdf", mime: "application/pdf", fileSize: 1_887_437, documentType: "loan-agreement", uploadedOn: "2026-05-19", status: "verified", lenderName: "Vanquis", kind: "pdf" },
  ],
};

/** Real client data, loaded from the backend after login (Phase 7.1). When set,
 *  the getters below return it instead of the mock CLIENT. Null = mock/demo. */
let REAL: Client | null = null;
export const setRealClient = (c: Client | null): void => { REAL = c; };
const active = (): Client => REAL ?? CLIENT;

export const getClient = (): Client => active();
export const getClaim = (id: string): Claim | undefined => active().claims.find((c) => c.id === id);

/** Client-level outstanding requirements — surfaced on the dashboard and on each active claim. */
export const getRequirements = (): Requirement[] => active().requirements;

/** Total unread client-facing messages across all claims — drives the notification bell. */
export const getUnreadCount = (): number => active().claims.reduce((s, c) => s + (c.unreadMessages ?? 0), 0);

/** Simple pub/sub so React contexts can re-read `getUnreadCount()` when the mock
 *  messages module mutates `Claim.unreadMessages` (mark-as-read, future sends).
 *  NotificationContext subscribes via `useSyncExternalStore`. */
const unreadListeners = new Set<() => void>();
export function subscribeUnread(listener: () => void): () => void {
  unreadListeners.add(listener);
  return () => { unreadListeners.delete(listener); };
}
export function notifyUnread(): void {
  unreadListeners.forEach((l) => l());
}
