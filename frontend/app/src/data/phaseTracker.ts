import type { ClaimPhase } from "./types";

const BASE: ClaimPhase[] = ["Getting Started", "Investigation", "Claim In Progress", "Offer Received", "Settlement", "Completed"];
const ESCALATED: ClaimPhase[] = ["Getting Started", "Investigation", "Claim In Progress", "Escalated to Ombudsman", "Offer Received", "Settlement", "Completed"];

export const trackerPhases = (escalated: boolean): ClaimPhase[] => (escalated ? ESCALATED : BASE);

export type StepState = "done" | "current" | "upcoming";
export interface TrackerStep { phase: ClaimPhase; index: number; state: StepState }

export function buildTracker(current: ClaimPhase, escalated: boolean): TrackerStep[] {
  const phases = trackerPhases(escalated);
  let cur = phases.indexOf(current);
  if (cur === -1) cur = phases.length - 1;
  return phases.map((phase, index) => ({ phase, index, state: index < cur ? "done" : index === cur ? "current" : "upcoming" }));
}

export function trackerProgress(current: ClaimPhase, escalated: boolean): number {
  const phases = trackerPhases(escalated);
  const i = Math.max(0, phases.indexOf(current));
  return phases.length > 1 ? i / (phases.length - 1) : 0;
}

export function shortPhase(phase: ClaimPhase): string {
  if (phase === "Claim In Progress") return "In Progress";
  if (phase === "Escalated to Ombudsman") return "Ombudsman";
  return phase;
}

/** Solid primary pill (positive/actionable) vs outlined neutral pill. */
export const SOLID_PHASES: ClaimPhase[] = ["Offer Received", "Completed"];
export const AMBER_DOT_PHASES: ClaimPhase[] = ["Getting Started", "Investigation"];
export function phaseIcon(phase: ClaimPhase): string {
  switch (phase) {
    case "Getting Started": return "flag";
    case "Investigation": return "search";
    case "Claim In Progress": return "gavel";
    case "Escalated to Ombudsman": return "balance";
    case "Offer Received": return "mark_email_unread";
    case "Settlement": return "account_balance";
    case "Completed": return "check_circle";
    case "Closed": return "lock";
  }
}
