/** Wire types for the Hermes chat socket. Mirrors backend/src/chat/db.js rows. */

/** Client-facing persona name. The word "Hermes" must never reach the UI. */
export const ASSISTANT_DISPLAY_NAME = "Sarah";

export type ChatSenderType = "client" | "hermes" | "agent" | "system";
export type ChatStatus = "bot" | "human_queued" | "human_active" | "resolved";

export interface ChatCard {
  title: string;
  rows: Array<{ k: string; v: string; hl?: boolean }>;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: ChatSenderType;
  body: string;
  meta?: { card?: ChatCard; handoff?: { reason: string } };
  created_at: string;
  /** Present only on locally-added optimistic bubbles. */
  pending?: boolean;
  clientMsgUuid?: string;
}

export interface ChatConversation {
  id: string;
  claim_id: string | null;
  status: ChatStatus;
}

export type ChatErrorCode =
  | "RATE_LIMITED" | "TOO_LONG" | "NOT_FOUND" | "FORBIDDEN" | "AGENT_UNAVAILABLE";

/** Friendly copy per error code — clients never see a raw code. */
export const CHAT_ERROR_COPY: Record<ChatErrorCode, string> = {
  RATE_LIMITED: "You're sending messages very quickly — please wait a moment.",
  TOO_LONG: "That message is a bit long. Please shorten it and try again.",
  NOT_FOUND: "We couldn't find that conversation. Please try again.",
  FORBIDDEN: "That conversation isn't available on your account.",
  AGENT_UNAVAILABLE: "We couldn't send that just now. Please try again.",
};

/** Contact routes for "Talk to a person" — one place to change them. */
export const CONTACT_OPTIONS = {
  email: "irl@rowanrose.co.uk",
  phone: "0161 505 0150",
  phoneHref: "tel:01615050150",
  hours: "Mon–Fri, 9am–5pm",
};
