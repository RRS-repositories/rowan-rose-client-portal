import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useFontSize } from "@/theme/useFontSize";
import { FONT_PRESETS } from "@/theme/FontSizeProvider";

const GLYPH_SIZES = ["text-[15px]", "text-[19px]", "text-[23px]"] as const;

/** Compact 3-preset text-size control used in the header SettingsPanel popover.
 *  The fine-grained slider lives on /profile (AppearanceSection). A preset is
 *  "active" when the current percent matches its preset value exactly — if the
 *  user has dialed in a custom value via the slider, no preset is highlighted. */
export function FontSizeToggle({ className }: { className?: string }) {
  const { percent, setPercent } = useFontSize();
  const indicatorId = useId();

  return (
    <div role="radiogroup" aria-label="Text size" className={cn("flex w-full gap-1", className)}>
      {FONT_PRESETS.map((preset, i) => {
        const active = percent === preset.value;
        return (
          <button
            key={preset.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={preset.label}
            onClick={() => setPercent(preset.value)}
            className={cn(
              "relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors",
              active ? "text-on-primary focus-on-primary" : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {active && (
              <motion.span
                layoutId={indicatorId}
                className="absolute inset-0 rounded-lg bg-primary skeuo-raise"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span aria-hidden="true" className={cn("relative z-10 font-display font-bold leading-none", GLYPH_SIZES[i])}>
              A
            </span>
            <span className="relative z-10 font-label-caps text-label-caps">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}
