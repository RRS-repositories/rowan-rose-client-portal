import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { buildTracker, trackerProgress, phaseIcon, shortPhase, type TrackerStep } from "@/data/phaseTracker";
import type { ClaimPhase } from "@/data/types";

/** small node for the vertical (mobile) rail */
function VNode({ step }: { step: TrackerStep }) {
  if (step.state === "done")
    return <span className="grid h-8 w-8 flex-none place-items-center rounded-full skeuo-badge-completed"><Icon name="check" size={16} fill className="text-primary" /></span>;
  if (step.state === "current")
    return <span className="grid h-8 w-8 flex-none place-items-center rounded-full skeuo-badge-active"><span className="h-3 w-3 rounded-full bg-primary" /></span>;
  return <span className="grid h-8 w-8 flex-none place-items-center rounded-full skeuo-badge-pending"><span className="h-2 w-2 rounded-full bg-outline" /></span>;
}

/** large icon node for the horizontal (desktop) tracker */
function HNode({ step }: { step: TrackerStep }) {
  const base = "grid h-12 w-12 flex-none place-items-center rounded-full";
  if (step.state === "done")
    return <span className={cn(base, "bg-primary text-on-primary skeuo-raise")}><Icon name={phaseIcon(step.phase)} size={24} fill /></span>;
  if (step.state === "current")
    return <span className={cn(base, "border-2 border-primary bg-surface-container-lowest text-primary skeuo-recessed")}><Icon name={phaseIcon(step.phase)} size={24} fill /></span>;
  return <span className={cn(base, "border border-outline-variant/30 bg-surface-container-high text-on-surface-variant skeuo-recessed")}><Icon name={phaseIcon(step.phase)} size={24} /></span>;
}

export function PhaseProgressTracker({ current, escalated }: { current: ClaimPhase; escalated: boolean }) {
  const steps = buildTracker(current, escalated);
  const progress = trackerProgress(current, escalated);
  const reduce = useReducedMotion();
  const fill = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 120, damping: 26, delay: 0.15 };

  return (
    <section aria-label="Claim progress">
      <h3 className="mb-md font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Claim Progress</h3>

      {/* Mobile: vertical rail */}
      <div className="relative space-y-6 lg:hidden">
        <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-surface-container-high" aria-hidden />
        <motion.div className="absolute left-[15px] top-4 w-0.5 origin-top bg-primary shadow-[0_0_8px_rgb(var(--c-primary)/0.5)]" aria-hidden initial={{ height: 0 }} animate={{ height: `calc(${progress} * (100% - 2rem))` }} transition={fill} />
        {steps.map((step) => (
          <div key={step.phase} className="relative z-10 flex items-center gap-sm">
            <VNode step={step} />
            <span className={cn(step.state === "current" ? "font-body-lg text-body-lg font-semibold text-primary" : "font-body text-body-md text-on-surface-variant", step.state === "upcoming" && "opacity-60")}>
              {step.phase}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop: horizontal milestones */}
      <div className="skeuo-card hidden rounded-xl p-md lg:block">
        <div className="relative flex items-start justify-between">
          <div className="absolute left-6 right-6 top-6 h-1 -translate-y-1/2 rounded-full bg-surface-container-high" aria-hidden>
            <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={fill} />
          </div>
          {steps.map((step) => (
            <div key={step.phase} className="relative z-10 flex flex-1 flex-col items-center gap-2 text-center">
              <HNode step={step} />
              <span className={cn("mt-1 max-w-[8rem] font-button text-label", step.state === "current" ? "font-bold text-primary" : step.state === "done" ? "text-on-surface" : "text-on-surface-variant opacity-70")}>
                {shortPhase(step.phase)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
