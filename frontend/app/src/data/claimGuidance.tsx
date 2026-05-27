import type { ReactNode } from "react";
import { InfoTerm } from "@/components/ui/InfoTerm";
import type { ClaimPhase } from "./types";

/** "What happens next" per phase — expected timeframe + the literal next step,
 *  in plain English, with jargon explained inline. */
export const CLAIM_GUIDANCE: Partial<Record<ClaimPhase, { timeframe?: string; next: ReactNode }>> = {
  "Getting Started": {
    timeframe: "A few days, once we have everything",
    next: (
      <>Once we have your documents, we write to the lender for your{" "}
        <InfoTerm term="lending records">lending records</InfoTerm>.</>
    ),
  },
  Investigation: {
    timeframe: "Lenders usually take about 30 days",
    next: (
      <>When your records arrive, we read every line to check for{" "}
        <InfoTerm term="irresponsible lending">irresponsible lending</InfoTerm> — where you were lent more than you could afford.</>
    ),
  },
  "Claim In Progress": {
    timeframe: "Lenders have up to 8 weeks to respond",
    next: (
      <>We wait for the lender's <InfoTerm term="final response">final response</InfoTerm>. If it isn't fair, we challenge it on your behalf.</>
    ),
  },
  "Escalated to Ombudsman": {
    timeframe: "This can take several months — that's normal",
    next: (
      <>The <InfoTerm term="Financial Ombudsman">Financial Ombudsman</InfoTerm> reviews your case independently and makes a decision the lender must follow.</>
    ),
  },
  "Offer Received": {
    timeframe: "Take your time — there's no deadline today",
    next: (
      <>Review the offer above. If you're happy, accept it and we'll arrange your{" "}
        <InfoTerm term="redress">redress</InfoTerm>.</>
    ),
  },
  Settlement: {
    timeframe: "Usually a couple of weeks",
    next: <>Once payment arrives and our fee is applied, we send the rest straight to your bank account.</>,
  },
  Completed: {
    next: <>Nothing more to do. Keep your settlement statement for your records — and tell us if anything looks wrong.</>,
  },
  Closed: {
    next: <>If anything changes, or you have any questions, just contact us.</>,
  },
};
