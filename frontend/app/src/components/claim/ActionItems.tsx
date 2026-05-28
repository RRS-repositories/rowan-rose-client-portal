import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { phaseOf } from "@/data/statusMap";
import type { Claim, Requirement } from "@/data/types";

/** Claim-scoped to-do list. Mirrors the dashboard "What We Need" card —
 *  surfaces every outstanding requirement on each active claim. The offer-
 *  review nudge lives above this in <OfferBanner>; Closed/Completed claims
 *  show reassurance. */
export function ActionItems({ claim, requirements }: { claim: Claim; requirements: Requirement[] }) {
  const phase = phaseOf(claim);
  const inactive = phase === "Closed" || phase === "Completed";
  // Client-level requirements (ID, Proof of Address) show on every claim; lender-
  // specific ones (bank statements) only on the claim they belong to.
  const outstanding = inactive ? [] : requirements.filter((r) => !r.done && (!r.claimId || r.claimId === claim.id));
  // Offer review is surfaced by <OfferBanner> directly above this section, so we
  // no longer duplicate it here — ActionItems is for outstanding requirements
  // (ID, address, bank statements) only.
  const hasActions = outstanding.length > 0;

  if (!hasActions) {
    return (
      <section aria-label="Action items" className="skeuo-card relative overflow-hidden rounded-xl p-md">
        <span className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden />
        <div className="flex items-start gap-md">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-primary-container text-on-primary-container skeuo-inner-highlight">
            <Icon name="check_circle" size={24} fill />
          </span>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">All up to date</h3>
            <p className="mt-1 font-body-lg text-body-md text-on-surface-variant">
              No actions needed right now. We'll let you know as soon as there's an update.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Action required" role="alert" className="space-y-sm">
      <h3 className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Action Required</h3>

      {outstanding.map((r) => (
        <div key={r.id} className="skeuo-card relative overflow-hidden rounded-xl p-md">
          <span className="absolute left-0 top-0 h-full w-1 bg-tertiary-fixed-dim" aria-hidden />
          <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-md">
              <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-surface-container-high text-on-surface skeuo-inner-highlight">
                <Icon name={r.icon} size={24} />
              </span>
              <div>
                <h4 className="font-button text-body-lg text-on-surface">{r.title}</h4>
                <p className="mt-0.5 font-body text-body-md text-on-surface-variant">{r.description}</p>
              </div>
            </div>
            <Link
              to={`${r.action}?highlight=${r.id}`}
              aria-label={`Upload — ${r.title}`}
              className="inline-flex min-h-[48px] flex-none items-center justify-center gap-2 rounded-lg bg-primary px-md font-button text-button text-on-primary skeuo-raise skeuo-primary-glow skeuo-press hover:opacity-95"
            >
              <Icon name="upload_file" size={20} />
              Upload
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}
