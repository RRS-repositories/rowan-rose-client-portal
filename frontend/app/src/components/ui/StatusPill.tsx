import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { shortPhase, SOLID_PHASES, AMBER_DOT_PHASES } from "@/data/phaseTracker";
import type { ClaimPhase } from "@/data/types";

const SOLID_ICON: Partial<Record<ClaimPhase, string>> = {
  "Offer Received": "mark_email_unread",
  Completed: "check_circle",
};

/** Stitch status pill — colour ALWAYS paired with a dot/icon + text label. */
export function StatusPill({ phase, className }: { phase: ClaimPhase; className?: string }) {
  const label = shortPhase(phase).toUpperCase();

  if (SOLID_PHASES.includes(phase)) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-primary-container px-sm py-[5px] skeuo-inner-highlight", className)}>
        <Icon name={SOLID_ICON[phase] ?? "check_circle"} size={15} fill className="text-on-primary-container" />
        <span className="font-label-caps text-label-caps font-bold tracking-wider text-on-primary-container">{label}</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-high px-sm py-[5px] skeuo-inner-highlight", className)}>
      <span aria-hidden className={cn("h-2 w-2 rounded-full", AMBER_DOT_PHASES.includes(phase) ? "bg-tertiary-fixed-dim" : "bg-primary")} />
      <span className="font-label-caps text-label-caps font-bold tracking-wider text-on-surface">{label}</span>
    </span>
  );
}
