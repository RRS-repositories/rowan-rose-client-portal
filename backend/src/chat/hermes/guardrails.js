/**
 * Two layers, different jobs (Notes/Chat/CHAT_ARCHITECTURE.md §7):
 *
 *  - preCheck  runs BEFORE the model. Cheap, deterministic, saves an API call,
 *              and catches the categories that must never reach a bot answer.
 *  - postCheck runs AFTER the model, before anything is persisted or shown.
 *              The prompt is instruction; THIS is enforcement. A message clever
 *              enough to talk the prompt around still cannot talk a regex
 *              around — which is what makes "client text is data, not
 *              instructions" actually true.
 *
 * Vulnerability detection is deliberately over-sensitive: a false handoff costs
 * a CS minute; a missed one is a client in hardship being answered by a bot.
 */

const RULES = [
  {
    reason: "settlement_figure",
    // "how much", any £ amount, compensation/payout/redress/fee wording.
    re: /\b(how much|what will i get|payout|pay out|redress|compensation|settlement (amount|figure)|fee|fees|charge|%|percent)\b|£\s?\d/i,
  },
  {
    reason: "legal_advice",
    re: /\b(should i|do i have to|can they legally|is it legal|my rights|sue|court|solicitor's advice|what do you advise)\b/i,
  },
  {
    reason: "complaint_about_firm",
    re: /\b(complain(t|ing)? about (you|the firm|rowan|fast action)|you (lot )?(are|'re) (useless|rubbish|a scam)|scam|rip ?off|negligent|ombudsman about you)\b/i,
  },
  {
    reason: "vulnerability",
    re: /\b(suicid|kill myself|end my life|self.?harm|depress|mental health|can'?t cope|desperate|homeless|evict|bailiff|food ?bank|starv|terminal|cancer|bereave|died|passed away|disab|carer|struggling to (eat|pay|cope))\b/i,
  },
  {
    reason: "abuse",
    re: /\b(fuck|shit|cunt|bastard|wanker|piss off|idiot|moron)\b/i,
  },
];

/** Returns { reason } when the message must skip the model, else null. */
export function preCheck(body) {
  const text = String(body || "");
  for (const rule of RULES) {
    if (rule.re.test(text)) return { reason: rule.reason };
  }
  return null;
}

const HANDOFF_RE = /<<\s*HANDOFF\s*:?\s*([^>]*)>>/i;
// Any £ figure, and internal-status leakage (raw CRM statuses / stage codes).
const MONEY_RE = /£\s?[\d,]+(\.\d+)?/g;
const INTERNAL_RE = /\b(DSAR|FRL|LOA|CONC|spec_status|workflow_trigger|case_number|contact_id|New Lead|Not Qualified|Counter team|Weak Case)\b/i;

/**
 * Strips the handoff token and enforces the output rules.
 * Returns { text, handoff: reason|null, blocked: rule|null }.
 * `blocked` means the reply must NOT be shown — hand off instead.
 */
export function postCheck(raw, { contextText = "" } = {}) {
  let text = String(raw || "").trim();
  let handoff = null;

  const m = text.match(HANDOFF_RE);
  if (m) {
    handoff = (m[1] || "agent_requested").trim().slice(0, 100) || "agent_requested";
    text = text.replace(HANDOFF_RE, "").trim();
  }

  // Any money figure not present verbatim in the context we supplied is a
  // fabricated number in writing to a client — block the whole reply.
  const figures = text.match(MONEY_RE) || [];
  for (const fig of figures) {
    if (!contextText.includes(fig.replace(/\s/g, "")) && !contextText.includes(fig)) {
      return { text: "", handoff: handoff || "money_figure", blocked: "money_figure" };
    }
  }

  if (INTERNAL_RE.test(text)) {
    return { text: "", handoff: handoff || "internal_leak", blocked: "internal_leak" };
  }

  if (!text) {
    return { text: "", handoff: handoff || "empty_reply", blocked: handoff ? null : "empty_reply" };
  }

  return { text, handoff, blocked: null };
}

/** Client-facing copy for each handoff reason. Warm, never a code. */
export function handoffMessage(reason) {
  switch (reason) {
    case "settlement_figure":
      return "That's a question about figures, so I'm passing it to your claims team — they'll come back to you here with the right answer.";
    case "legal_advice":
      return "I can't give advice on that one. I've passed it to your claims team and someone will reply here.";
    case "complaint_about_firm":
      return "I'm sorry you've had that experience. I've passed this straight to the team so a person can look into it properly.";
    case "vulnerability":
      return "Thank you for telling me. I've passed this to your claims team so a person can help you properly — they'll be in touch here.";
    case "abuse":
      return "I've passed this conversation to your claims team, and someone will reply here.";
    default:
      return "I've passed this to your claims team — a case handler will reply here.";
  }
}
