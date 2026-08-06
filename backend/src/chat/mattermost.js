/**
 * Mattermost alert for the CS channel on handoff.
 *
 * Payload carries name + case ref + reason + link and NOTHING else — no message
 * bodies, no claim values (spec §8.7). Mattermost sits outside the client-data
 * boundary. A webhook failure is logged loudly and swallowed: the DB queue is
 * the source of truth, the webhook is a convenience.
 */
const PORTAL_URL = process.env.PORTAL_PUBLIC_URL || "https://clientportal.rowanroseclaims.co.uk";

export async function notifyHandoff({ conversation, reason }) {
  const url = process.env.CHAT_MM_WEBHOOK_URL;
  if (!url) return;
  const ref = conversation.claim_id ? `claim ${conversation.claim_id}` : "general enquiry";
  const text = [
    "**Portal chat — handed to CS**",
    `Contact: ${conversation.contact_id}`,
    `Ref: ${ref}`,
    `Reason: ${reason}`,
    `Conversation: ${conversation.id} (${PORTAL_URL})`,
  ].join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
  } catch (e) {
    console.error("[chat] Mattermost alert failed (handoff still completed):", e.message);
  } finally {
    clearTimeout(timer);
  }
}
