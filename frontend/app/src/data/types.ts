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
  /** Unread client-facing messages on this claim (mock — drives the notification bell). */
  unreadMessages?: number;
  /** ISO timestamp of when the client accepted or rejected the offer (Phase 4.1). */
  offerActionedAt?: string;
}

export type RequirementKind = "id" | "address" | "bank-statements" | "questionnaire" | "extra-lender";
export interface Requirement {
  id: string;
  kind: RequirementKind;
  title: string;
  description: string;
  icon: string;
  done: boolean;
  /** When done — the date we received the satisfying document (ISO). */
  receivedOn?: string;
  /** Bank statements are lender-specific — the lender/claim this requirement is for.
   *  Absent on client-level requirements (ID, Proof of Address). */
  lenderName?: string;
  claimId?: string;
  action: string;
}

/** What an uploaded document is, for the type selector / requirement matching. */
export type DocumentType = "id" | "address" | "bank-statement" | "loan-agreement" | "other";
/** Server-side processing state shown as a status badge. */
export type DocStatus = "received" | "processing" | "verified" | "rejected";
export type DocKind = "pdf" | "image";

export interface UploadedDoc {
  id: string;
  name: string;
  mime: string;              // MIME type, e.g. "application/pdf"
  fileSize: number;          // bytes
  documentType: DocumentType;
  uploadedOn: string;        // ISO date
  status: DocStatus;
  rejectionReason?: string;  // present when status === "rejected"
  lenderName?: string;       // for lender-specific docs (bank statements)
  kind: DocKind;             // coarse class for icon choice
}

/** Mocked POST /client/documents/upload result. */
export interface UploadResponse {
  success: boolean;
  document: UploadedDoc;
  /** Requirement satisfied by this upload, if any (matches Requirement.kind). */
  requirementUpdated: RequirementKind | null;
  message: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  claims: Claim[];
  requirements: Requirement[];
  documents: UploadedDoc[];
}

// ── Messages (Phase 3.1 — per-claim conversation between client and handler) ──

export type MessageSender = "firm" | "client";

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

export interface Message {
  id: string;
  claimId: string;
  sender: MessageSender;
  senderName: string;
  /** Firm-side role badge (e.g. "Claims Handler"). Absent on client messages. */
  senderRole?: string;
  content: string;
  timestamp: string;             // ISO date string
  read: boolean;
  attachments?: MessageAttachment[];
}

/** Per-claim conversation summary used by the thread selector. `lastMessageAt` is
 *  null for claims with no messages so they sort last. */
export interface MessageThread {
  claimId: string;
  lenderName: string;
  messages: Message[];
  unreadCount: number;
  lastMessageAt: string | null;
}

// ── Profile (Phase 5.1 — personal details, password, preferences) ──────────

/** Client profile shown on /profile. The clientId / firstName / lastName mirror
 *  Client (data/mock.ts); the rest is portal-account metadata only the Profile
 *  page needs. `passwordLastChanged` is null until the client changes it. */
export interface ClientProfile {
  clientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;        // ISO
  email: string;
  phone: string;              // full E.164 — masked at display
  registeredAt: string;       // ISO — when the portal account was created
  totalClaims: number;
  activeClaims: number;
  passwordLastChanged: string | null; // ISO or null
}

/** Email notification preferences. Defaults: everything on except marketing. */
export interface NotificationPreferences {
  statusChanges: boolean;
  newMessages: boolean;
  documentRequests: boolean;
  offerNotifications: boolean;
  paymentUpdates: boolean;
  marketingEmails: boolean;
}
