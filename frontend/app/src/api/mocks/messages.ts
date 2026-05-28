/**
 * In-memory message-thread mocks — fallback while VITE_USE_MOCKS is on (real
 * delivery lands later via the firm's CRM). The store mutates in place so that
 * sends and mark-as-read persist for the SPA lifetime and the notification bell
 * reflects them in real time via `notifyUnread()`.
 *
 * Seeded for Sarah Holden's four active-unread claims (Vanquis /21, NewDay /31,
 * 118 118 Money /09, QuidMarket /28). Other claims have no thread record;
 * `getMessageThreads` synthesises empty threads for them so the selector lists
 * every claim.
 */
import type { Message, MessageThread } from "@/data/types";
import { CLIENT, notifyUnread } from "@/data/mock";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let seq = 0;
const newId = (): string => `msg-${Date.now()}-${++seq}`;

const CLIENT_NAME = `${CLIENT.firstName} ${CLIENT.lastName}`; // "Sarah Holden"

/** Module-scoped store keyed by claimId. Mutated by `sendMessage` and
 *  `markThreadAsRead` so subsequent reads reflect the latest state. */
const THREADS: Record<string, Message[]> = {
  // ── Vanquis /21 — DSAR Sent — 4 msgs, msg 4 unread (Emma reminding about ID) ──
  "RR-676687-554/21": [
    {
      id: "van-1",
      claimId: "RR-676687-554/21",
      sender: "firm",
      senderName: "James Taylor",
      senderRole: "Claims Handler",
      content:
        "Welcome to your Vanquis claim. We've written to Vanquis requesting your full lending records — that usually takes around 30 days. While we wait, please upload your ID and proof of address from the Documents page so we can verify your identity.",
      timestamp: "2026-05-14T10:30:00Z",
      read: true,
    },
    {
      id: "van-2",
      claimId: "RR-676687-554/21",
      sender: "client",
      senderName: CLIENT_NAME,
      content:
        "Thank you. Quick question about the proof of address — does a mobile phone bill count, or does it need to be a utility bill?",
      timestamp: "2026-05-14T14:12:00Z",
      read: true,
    },
    {
      id: "van-3",
      claimId: "RR-676687-554/21",
      sender: "firm",
      senderName: "James Taylor",
      senderRole: "Claims Handler",
      content:
        "A mobile phone bill works as long as it's dated within the last 3 months and shows your full name and current address. A council tax letter, utility bill, or recent bank statement would also be fine.",
      timestamp: "2026-05-14T15:05:00Z",
      read: true,
    },
    {
      id: "van-4",
      claimId: "RR-676687-554/21",
      sender: "firm",
      senderName: "Emma Roberts",
      senderRole: "Senior Claims Handler",
      content:
        "Hi Sarah — just a quick reminder, we're still waiting on your ID document. As soon as you upload it we can keep things moving on your Vanquis claim.",
      timestamp: "2026-05-26T09:20:00Z",
      read: false,
    },
  ],

  // ── NewDay (Aqua) /31 — Complaint Submitted — 6 msgs, msgs 5 & 6 unread ──
  "RR-676687-554/31": [
    {
      id: "nd-1",
      claimId: "RR-676687-554/31",
      sender: "firm",
      senderName: "James Taylor",
      senderRole: "Claims Handler",
      content:
        "Your complaint has gone in to NewDay. Under the rules they have up to 8 weeks to respond — we'll let you know the moment we hear anything.",
      timestamp: "2026-03-12T11:00:00Z",
      read: true,
    },
    {
      id: "nd-2",
      claimId: "RR-676687-554/31",
      sender: "client",
      senderName: CLIENT_NAME,
      content: "Thanks for the update. Is there anything I need to do in the meantime?",
      timestamp: "2026-03-18T09:45:00Z",
      read: true,
    },
    {
      id: "nd-3",
      claimId: "RR-676687-554/31",
      sender: "firm",
      senderName: "James Taylor",
      senderRole: "Claims Handler",
      content:
        "Nothing required from you for now. We'll be in touch as soon as NewDay come back to us. If they don't respond within the deadline we'll chase them on your behalf.",
      timestamp: "2026-03-18T10:30:00Z",
      read: true,
    },
    {
      id: "nd-4",
      claimId: "RR-676687-554/31",
      sender: "client",
      senderName: CLIENT_NAME,
      content: "It's been a while now — have you heard anything back from NewDay?",
      timestamp: "2026-05-23T16:08:00Z",
      read: true,
    },
    {
      id: "nd-5",
      claimId: "RR-676687-554/31",
      sender: "firm",
      senderName: "James Taylor",
      senderRole: "Claims Handler",
      content:
        "We chased NewDay earlier this week. They've now acknowledged the complaint and indicated they'll provide a full response within the next 10 working days.",
      timestamp: "2026-05-25T10:14:00Z",
      read: false,
    },
    {
      id: "nd-6",
      claimId: "RR-676687-554/31",
      sender: "firm",
      senderName: "Emma Roberts",
      senderRole: "Senior Claims Handler",
      content:
        "Update — NewDay have requested a 2-week extension to review your complaint properly. This isn't unusual; we've agreed to it. We'll follow up if we don't hear back by the new deadline.",
      timestamp: "2026-05-27T14:42:00Z",
      read: false,
    },
  ],

  // ── 118 118 Money /09 — Offer Received £3,480 — 3 msgs, msg 3 unread ──
  "RR-676687-554/09": [
    {
      id: "one-1",
      claimId: "RR-676687-554/09",
      sender: "firm",
      senderName: "James Taylor",
      senderRole: "Claims Handler",
      content:
        "Good news — we've received an offer from 118 118 Money on your claim. The offer is £3,480.00. You can review the full details and accept or decline on your claim page.",
      timestamp: "2026-05-22T11:20:00Z",
      read: true,
    },
    {
      id: "one-2",
      claimId: "RR-676687-554/09",
      sender: "client",
      senderName: CLIENT_NAME,
      content: "That's great news! I'll read through it now. Is this a good offer in your opinion?",
      timestamp: "2026-05-23T08:55:00Z",
      read: true,
    },
    {
      id: "one-3",
      claimId: "RR-676687-554/09",
      sender: "firm",
      senderName: "James Taylor",
      senderRole: "Claims Handler",
      content:
        "Based on our review of your lending history with 118 118 Money, this offer is a fair settlement — it covers the interest and charges on the loans we identified as irresponsibly lent. I'd recommend accepting, but the decision is entirely yours. If you'd like a breakdown of how the figure was reached, just say.",
      timestamp: "2026-05-24T12:10:00Z",
      read: false,
    },
  ],

  // ── QuidMarket /28 — Documents Required — 3 msgs, msg 3 unread ──
  "RR-676687-554/28": [
    {
      id: "quid-1",
      claimId: "RR-676687-554/28",
      sender: "firm",
      senderName: "James Taylor",
      senderRole: "Claims Handler",
      content:
        "Welcome to your QuidMarket claim. To get started we'll need your bank statements covering the period of your QuidMarket borrowing. You can upload them from the Documents page.",
      timestamp: "2026-05-20T13:30:00Z",
      read: true,
    },
    {
      id: "quid-2",
      claimId: "RR-676687-554/28",
      sender: "client",
      senderName: CLIENT_NAME,
      content: "Okay — how many months back should they cover?",
      timestamp: "2026-05-21T19:14:00Z",
      read: true,
    },
    {
      id: "quid-3",
      claimId: "RR-676687-554/28",
      sender: "firm",
      senderName: "James Taylor",
      senderRole: "Claims Handler",
      content:
        "Roughly 12 months either side of when you were borrowing with QuidMarket. PDFs from your bank's app work best — just make sure your name and account number are visible at the top.",
      timestamp: "2026-05-27T10:08:00Z",
      read: false,
    },
  ],
};

/** Set the claim-level unread count to match what's in the thread store. Keeps
 *  CLIENT.claims[i].unreadMessages (which drives the SideNav bell) in lock-step
 *  with the actual unread firm messages in the thread. */
function syncUnreadFor(claimId: string): void {
  const claim = CLIENT.claims.find((c) => c.id === claimId);
  if (!claim) return;
  const unread = (THREADS[claimId] ?? []).filter((m) => m.sender === "firm" && !m.read).length;
  claim.unreadMessages = unread;
}

/** Build a MessageThread summary from a claim — synthesising empty threads for
 *  claims with no entry in `THREADS` so the selector lists every claim. */
function threadFor(claimId: string, lenderName: string): MessageThread {
  const messages = THREADS[claimId] ?? [];
  const unreadCount = messages.filter((m) => m.sender === "firm" && !m.read).length;
  const lastMessageAt = messages.length > 0 ? messages[messages.length - 1].timestamp : null;
  return { claimId, lenderName, messages, unreadCount, lastMessageAt };
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getMessageThreads(): Promise<MessageThread[]> {
  await delay(700);
  return CLIENT.claims.map((c) => threadFor(c.id, c.lender.name));
}

export async function getClaimMessages(claimId: string): Promise<Message[]> {
  await delay(500);
  // Return a copy so consumers don't accidentally mutate the store.
  return [...(THREADS[claimId] ?? [])];
}

export async function sendMessage(claimId: string, content: string): Promise<Message> {
  await delay(1000);
  // Manual failure injection for retry testing — flip in browser devtools:
  //   localStorage.setItem("mockFailSend", "1")
  if (typeof window !== "undefined" && window.localStorage?.getItem("mockFailSend") === "1") {
    throw new Error("Couldn't send your message. Please try again.");
  }
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message can't be empty.");
  const message: Message = {
    id: newId(),
    claimId,
    sender: "client",
    senderName: CLIENT_NAME,
    content: trimmed,
    timestamp: new Date().toISOString(),
    read: true,
  };
  if (!THREADS[claimId]) THREADS[claimId] = [];
  THREADS[claimId].push(message);
  return message;
}

export async function markThreadAsRead(claimId: string): Promise<{ success: boolean }> {
  await delay(300);
  const list = THREADS[claimId];
  if (list) {
    for (const m of list) {
      if (m.sender === "firm") m.read = true;
    }
  }
  syncUnreadFor(claimId);
  notifyUnread();
  return { success: true };
}
