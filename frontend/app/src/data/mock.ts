import type { Client, Claim, Lender } from "./types";

const VANQUIS: Lender = { name: "Vanquis", initials: "V", brand: "#6b3fa0", product: "Credit Card", icon: "account_balance" };
const ONE18: Lender = { name: "118 118 Money", initials: "118", brand: "#0369a1", product: "Personal Loan", icon: "payments" };
const LENDING_STREAM: Lender = { name: "Lending Stream", initials: "LS", brand: "#0f766e", product: "Short-term Loan", icon: "payments" };

/** Sarah Holden — three claims so every state demos:
 *  /21 Investigation (financials hidden) · /09 Offer Received (offer + acceptance)
 *  /14 Completed, escalated (full breakdown + Ombudsman tracker step). */
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
  ],
  requirements: [
    { id: "r-id", kind: "id", title: "Photo of your ID", description: "A passport or driving licence", icon: "id_card", done: false, action: "/documents" },
    { id: "r-addr", kind: "address", title: "Recent proof of address", description: "A recent bill or bank statement", icon: "home_pin", done: false, action: "/documents" },
    { id: "r-bank", kind: "bank-statements", title: "Bank statements for Aug 2023", description: "Your statements for August 2023", icon: "account_balance", done: false, action: "/documents" },
  ],
  documents: [
    { id: "d1", name: "letter-of-authority.pdf", sizeLabel: "312 KB", uploadedOn: "2026-04-28", kind: "pdf" },
    { id: "d2", name: "income-summary.pdf", sizeLabel: "1.1 MB", uploadedOn: "2026-05-02", kind: "pdf" },
  ],
};

export const getClient = (): Client => CLIENT;
export const getClaim = (id: string): Claim | undefined => CLIENT.claims.find((c) => c.id === id);
