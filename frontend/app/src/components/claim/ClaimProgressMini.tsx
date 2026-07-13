import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { buildTracker, shortPhase, trackerPhases } from "@/data/phaseTracker";
import type { ClaimPhase } from "@/data/types";

// Right-pointing "process arrow" segments that interlock like chevrons. The
// first segment has a straight left edge; the rest notch in to nest with the
// segment before. Inline clip-path keeps the comma/paren-heavy value out of the
// Tailwind class string.
const ARROW = "polygon(0% 0%, calc(100% - 6px) 0%, 100% 50%, calc(100% - 6px) 100%, 0% 100%, 6px 50%)";
const ARROW_FIRST = "polygon(0% 0%, calc(100% - 6px) 0%, 100% 50%, calc(100% - 6px) 100%, 0% 100%)";

// Number of stops in the --prog-* spectrum defined in tokens.css.
const SPECTRUM = 7;
/** Colour for segment `i` of `total`, sampled evenly across the spectrum so the
 *  ribbon always spans the full violet→green range whether there are 6 or 7. */
function segmentColor(i: number, total: number): string {
  const stop = total <= 1 ? 0 : Math.round((i / (total - 1)) * (SPECTRUM - 1));
  return `rgb(var(--prog-${stop}))`;
}

/**
 * Compact claim-progress ribbon for the summary card — a row of arrow segments
 * that fill with a colourful violet→green gradient up to the current stage,
 * plus the current stage and its position in small letters tinted to match.
 * Colour comes from a dedicated spectrum (not the single brand colour) so the
 * card reads as a vivid journey in both light and dark modes.
 */
export function ClaimProgressMini({ current, escalated }: { current: ClaimPhase; escalated: boolean }) {
  const closed = current === "Closed";
  const phases = trackerPhases(escalated);
  const total = phases.length;
  const steps = buildTracker(current, escalated);
  const currentIndex = steps.findIndex((s) => s.state === "current");
  const position = closed || currentIndex < 0 ? "" : `${currentIndex + 1}/${total}`;
  const label = closed ? "Closed" : shortPhase(current);
  const labelColor = closed || currentIndex < 0 ? undefined : segmentColor(currentIndex, total);

  return (
    <div aria-label={`Progress: ${label}${position ? `, step ${position}` : ""}`}>
      <div className="mb-1.5 flex items-center justify-between gap-sm">
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Progress</span>
        <span
          style={{ color: labelColor }}
          className={cn(
            "inline-flex items-center gap-1 font-label-caps text-label-caps font-bold uppercase tracking-wider",
            closed && "text-on-surface-variant",
          )}
        >
          <Icon name={closed ? "lock" : "arrow_forward"} size={13} fill />
          {label}{position ? ` · ${position}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-[3px]" aria-hidden>
        {steps.map((step, i) => {
          const reached = !closed && currentIndex >= 0 && i <= currentIndex;
          return (
            <span
              key={step.phase}
              title={shortPhase(step.phase)}
              style={{
                clipPath: i === 0 ? ARROW_FIRST : ARROW,
                backgroundColor: reached ? segmentColor(i, total) : undefined,
              }}
              className={cn("h-2.5 flex-1 rounded-[1px] transition-colors", !reached && "bg-surface-container-high")}
            />
          );
        })}
      </div>
    </div>
  );
}
