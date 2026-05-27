export interface FaqItem {
  id: string;
  q: string;
  a: string;
  /** glossary terms relevant to this answer (rendered as tappable chips) */
  terms?: string[];
}

/** Plain-English help (brief §4 screen 8). Searchable; no internal jargon left unexplained. */
export const FAQS: FaqItem[] = [
  {
    id: "how-long",
    q: "How long will my claim take?",
    a: "Every claim is different, but a rough guide: about 30 days for the lender to send your records, then up to 8 weeks for them to respond to the complaint. If we have to go to the Ombudsman it can take several months. We'll keep your claim updated at every step so you don't have to chase us.",
  },
  {
    id: "ombudsman",
    q: "What is the Financial Ombudsman?",
    a: "The Financial Ombudsman Service is a free, independent body that settles disputes between people and financial companies. If a lender won't put things right, we can ask the Ombudsman to decide. Their decision is binding on the lender if you accept it.",
    terms: ["Financial Ombudsman"],
  },
  {
    id: "redress",
    q: "How do you work out what I could get back?",
    a: "If a lender lent to you irresponsibly, you're usually owed back the interest and charges you paid on that borrowing, plus 8% statutory interest a year on top. The exact amount depends on your lending history — we'll only show figures once there's a real offer.",
    terms: ["redress", "statutory interest", "irresponsible lending"],
  },
  {
    id: "fees",
    q: "What are your fees?",
    a: "We only charge if we win money for you — no win, no fee. Our fee is a percentage of your settlement (plus VAT), and it's capped: 30% up to £1,499, 28% from £1,500–£9,999, 25% from £10,000–£24,999, 20% from £25,000–£49,999, and 15% for £50,000 or more. We'll always confirm the fee before anything is deducted.",
  },
  {
    id: "documents",
    q: "What documents do you need, and why?",
    a: "Usually a photo of your ID, a recent proof of address, and your bank statements for the period in question. These let us confirm who you are and show how the borrowing affected you. You can upload them from the Documents screen.",
  },
  {
    id: "lending-records",
    q: "What are 'lending records'?",
    a: "These are the full history of what you borrowed and repaid with a lender. We request them so we can check whether the lender should have realised the borrowing wasn't affordable for you.",
    terms: ["lending records", "affordability"],
  },
  {
    id: "data-safe",
    q: "Is my information safe?",
    a: "Yes. Your documents are stored securely and only used for your claim. We will never ask for your online banking password or full card details — if anyone does, it isn't us.",
  },
  {
    id: "lender-says-no",
    q: "What happens if the lender says no?",
    a: "That isn't the end. If we believe the lender is wrong, we send a detailed challenge to their response, and if needed we take your case to the Financial Ombudsman for an independent decision.",
    terms: ["final response", "Financial Ombudsman"],
  },
  {
    id: "multiple-lenders",
    q: "Can I claim against more than one lender?",
    a: "Yes. Each lender is a separate claim with its own progress, documents and outcome. You can add another lender any time from the Claims screen.",
  },
  {
    id: "do-i-do-anything",
    q: "Do I need to do anything while I wait?",
    a: "Only send us anything we ask for on the home screen — that's the one thing that speeds your claim up. Otherwise you can sit back; we'll write to you the moment there's news.",
  },
  {
    id: "updates",
    q: "How will I know when there's an update?",
    a: "We'll update your claim here in the portal, and the timeline on each claim shows everything we've done in plain English. You can turn on email or text alerts in your profile.",
  },
];
