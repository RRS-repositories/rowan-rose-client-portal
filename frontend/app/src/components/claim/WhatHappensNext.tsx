import { Icon } from "@/components/ui/Icon";
import { CLAIM_GUIDANCE } from "@/data/claimGuidance";
import type { ClaimPhase } from "@/data/types";

/** Reassures the client about the current wait + the very next step (with jargon explained). */
export function WhatHappensNext({ phase }: { phase: ClaimPhase }) {
  const g = CLAIM_GUIDANCE[phase];
  if (!g) return null;
  return (
    <section className="skeuo-card rounded-xl p-md" aria-label="What happens next">
      <div className="mb-sm flex items-center gap-sm">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-secondary-container text-on-secondary-container skeuo-inner-highlight">
          <Icon name="trending_flat" size={22} />
        </span>
        <h3 className="font-headline-md text-headline-md text-on-surface">What happens next</h3>
      </div>
      {g.timeframe && (
        <span className="mb-sm inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-sm py-[5px] font-label-caps text-label-caps font-bold text-on-surface skeuo-inner-highlight">
          <Icon name="schedule" size={15} />
          {g.timeframe}
        </span>
      )}
      <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{g.next}</p>
    </section>
  );
}
