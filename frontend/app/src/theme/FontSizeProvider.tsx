import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";

/** Font-size lever — a percentage of the base root font-size. The base is
 *  18px web / 17px mobile-narrow (≤360px); the percent multiplies BOTH. The
 *  rem-based type scale in tailwind.config.ts inherits the change so every
 *  surface scales together.
 *
 *  Range / step are exported so the slider on /profile and the preset buttons
 *  in the header SettingsPanel stay in sync. */
export const FONT_PERCENT_MIN = 100;
export const FONT_PERCENT_MAX = 160;
/** 1% per step — fine enough that the drag feels continuous, coarse enough
 *  that localStorage doesn't accumulate decimal noise. */
export const FONT_PERCENT_STEP = 1;
export const FONT_PERCENT_DEFAULT = 100;

/** Named presets surfaced by FontSizeToggle (compact popover control). */
export interface FontPreset {
  value: number;
  label: string;
}
/** Spread evenly across the slider range so the labels balance visually
 *  under the track. The slider can still land anywhere in between thanks to
 *  the 5% step — these are just the named anchor points. */
export const FONT_PRESETS: readonly FontPreset[] = [
  { value: 100, label: "Default" },
  { value: 130, label: "Large" },
  { value: 160, label: "Extra Large" },
];

export interface FontSizeCtx {
  percent: number;
  setPercent: (p: number) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const FontSizeContext = createContext<FontSizeCtx | null>(null);

const KEY = "rr-font-percent";
const KEY_LEGACY = "rr-font-size"; // pre-refactor enum: "default" | "large" | "xlarge"
const BASE_DESKTOP_PX = 18;
const BASE_MOBILE_PX = 17;

function clampStep(p: number): number {
  const clamped = Math.min(FONT_PERCENT_MAX, Math.max(FONT_PERCENT_MIN, p));
  return Math.round(clamped / FONT_PERCENT_STEP) * FONT_PERCENT_STEP;
}

function loadInitial(): number {
  const stored = localStorage.getItem(KEY);
  if (stored) {
    const n = Number(stored);
    if (!Number.isNaN(n)) return clampStep(n);
  }
  // One-time migration from the old 3-value enum so users who set a size
  // before this refactor don't snap back to Default. Map onto the new
  // anchor points (100 / 130 / 160).
  const legacy = localStorage.getItem(KEY_LEGACY);
  if (legacy === "large") return 130;
  if (legacy === "xlarge") return 160;
  return FONT_PERCENT_DEFAULT;
}

/** Apply the percent to the root via two CSS custom properties — globals.css
 *  consumes them so the mobile-narrow media query keeps working. Computed
 *  values are pre-rounded to 0.1px so sub-pixel drift can't accumulate. */
function applyPercent(percent: number) {
  const root = document.documentElement;
  const desktopPx = Math.round(BASE_DESKTOP_PX * percent) / 100;
  const mobilePx = Math.round(BASE_MOBILE_PX * percent) / 100;
  root.style.setProperty("--rr-font-size-desktop", `${desktopPx}px`);
  root.style.setProperty("--rr-font-size-mobile", `${mobilePx}px`);
  // Expose the raw multiplier too — handy for any future component that
  // wants to size something proportional to the user's chosen text scale.
  root.style.setProperty("--rr-font-scale", `${percent / 100}`);
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [percent, setPercentState] = useState<number>(() => loadInitial());

  const setPercent = useCallback((p: number) => {
    const next = clampStep(p);
    localStorage.setItem(KEY, String(next));
    applyPercent(next);
    setPercentState(next);
  }, []);

  useEffect(() => {
    applyPercent(percent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <FontSizeContext.Provider value={{ percent, setPercent }}>{children}</FontSizeContext.Provider>;
}
