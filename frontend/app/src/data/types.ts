/** UK consumer-credit irresponsible-lending claims. Client sees ClaimPhase + the
 *  §7 plain-English message only; InternalStatus / HiddenStatus never surface. */

export type ClaimPhase =
  | "Getting Started"
  | "Investigation"
  | "Claim In Progress"
  | "Escalated to Ombudsman"
  | "Offer Received"
  | "Settlement"
  | "Completed"
  | "Closed";

export type InternalStatus =
  | "Onboarding" | "Documents Required" | "Awaiting Bank Statements"
  | "DSAR Sent" | "DSAR Received" | "DSAR Chased"
  | "Complaint Submitted" | "Complaint Chased" | "FRL Received" | "Counter Response Sent"
  | "FOS Submitted" | "FOS Chased" | "FOS Awaiting Decision"
  | "Offer Received" | "Offer Accepted" | "Offer Rejected"
  | "Payment Received" | "Fee Deducted"
  | "Client Paid" | "Claim Closed";

export interface Lender { name: string; initials: string; brand: string; product: string; icon: string }
export interface TimelineEntry { id: string; text: string; date: string; icon: string }
export interface Financials { offer?: number; gross?: number; paymentDate?: string }

export interface Claim {
  id: string;
  lender: Lender;
  internalStatus: InternalStatus;
  escalated: boolean;
  openedOn: string;
  financials?: Financials;
  timeline: TimelineEntry[];
}

export type RequirementKind = "id" | "address" | "bank-statements" | "questionnaire" | "extra-lender";
export interface Requirement {
  id: string;
  kind: RequirementKind;
  title: string;
  description: string;
  icon: string;
  done: boolean;
  action: string;
}

export type DocKind = "pdf" | "image";
export interface UploadedDoc { id: string; name: string; sizeLabel: string; uploadedOn: string; kind: DocKind }

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  claims: Claim[];
  requirements: Requirement[];
  documents: UploadedDoc[];
}
