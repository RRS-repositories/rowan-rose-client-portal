import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { useTheme } from "@/theme/useTheme";
import type { Theme } from "@/theme/ThemeProvider";

const OPTIONS: { value: Theme; icon: string; label: string }[] = [
  { value: "light", icon: "light_mode", label: "Light" },
  { value: "dark", icon: "dark_mode", label: "Dark" },
  { value: "system", icon: "contrast", label: "System" },
];

/** Segmented Light / Dark / System control with a sliding active indicator.
 *  The page-wide theme animation (circular reveal) is driven from the click
 *  position by ThemeProvider.
 *
 *  - `pill` (default): compact recessed rounded-full track, fixed square buttons
 *    — for headers / inline use.
 *  - `bar`: full-width segmented row with a visible Light/Dark/System label per
 *    button — for the sidebar footer, where it sits inside a shared track.
 */
export function ThemeToggle({
  className,
  variant = "pill",
}: {
  className?: string;
  variant?: "pill" | "bar";
}) {
  const { theme, setTheme } = useTheme();
  const pillId = useId();
  const bar = variant === "bar";

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        bar
          ? "flex w-full gap-1"
          : "skeuo-recessed inline-flex gap-0.5 rounded-full bg-surface-container-low p-1",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            title={opt.label}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "relative transition-colors",
              bar
                ? "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg font-button text-button"
                : "grid h-11 w-11 place-items-center rounded-full",
              active ? "text-on-primary focus-on-primary" : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                className={cn("absolute inset-0 bg-primary skeuo-raise", bar ? "rounded-lg" : "rounded-full")}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon name={opt.icon} size={20} fill={active} className="relative z-10" />
            {bar ? <span className="relative z-10">{opt.label}</span> : <span className="sr-only">{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
