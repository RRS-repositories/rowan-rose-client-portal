/**
 * Builds Sarah's per-message context from the live CRM.
 *
 * Rules that are not negotiable (Notes/Chat/HERMES-CHAT-SPEC.md §5.2):
 *  - Built server-side, fresh for EVERY message. Never cached across
 *    conversations — a shared context object is a cross-client data leak.
 *  - No financials. `mapCaseToClaim` returns offer/settlement figures; they are
 *    stripped here, because a money figure that never enters the context can
 *    never be repeated to a client (and postCheck blocks any that appear).
 *  - No internal statuses, notes, fees, or other clients' data. Claims already
 *    arrive status-mapped and hidden-status-filtered by the CRM repo.
 *  - Compact: target well under 2k tokens.
 *
 * The status card is pre-built HERE, never model-generated — a model emitting
 * its own JSON figures is how a wrong number reaches a client in writing.
 */
import { getClaimsByContactId, getRequirementsByContactId } from "../../crm/repo.js";

const shortDate = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : undefined);

export async function buildContext(contactId, firstName, claimId) {
  const [claims, requirements] = await Promise.all([
    getClaimsByContactId(contactId),
    getRequirementsByContactId(contactId).catch(() => []),
  ]);

  // claimId is the CRM case id; claim.id is case_number-or-id, so match either.
  const active =
    claims.find((c) => String(c.id) === String(claimId)) ||
    (claimId == null ? claims[0] : null);

  const outstanding = requirements
    .filter((r) => !r.done)
    .map((r) => r.title);

  const context = {
    client: { firstName },
    claim: active
      ? {
          reference: active.id,
          lender: active.lender?.name,
          product: active.lender?.product,
          stage: active.internalStatus, // already the client-facing phase
          escalatedToOmbudsman: Boolean(active.escalated),
          openedOn: shortDate(active.openedOn),
          recentUpdates: (active.timeline || []).slice(-5).map((t) => ({
            date: shortDate(t.date),
            what: t.text,
          })),
        }
      : null,
    otherClaims: claims
      .filter((c) => !active || c.id !== active.id)
      .map((c) => ({ reference: c.id, lender: c.lender?.name, stage: c.internalStatus })),
    weAreWaitingOnYouFor: outstanding,
  };

  // Pre-built status card — deterministic, safe, rendered by the UI as-is.
  const card = active
    ? {
        title: "Your claim right now",
        rows: [
          { k: "Lender", v: active.lender?.name || "—" },
          { k: "Reference", v: String(active.id) },
          { k: "Stage", v: active.internalStatus, hl: true },
          ...(outstanding.length
            ? [{ k: "We need from you", v: outstanding.join(", ") }]
            : []),
        ],
      }
    : null;

  return { context, card };
}
