import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useFontSize } from "@/theme/useFontSize";
import type { FontScale } from "@/theme/FontSizeProvider";

const OPTIONS: { value: FontScale; label: string; glyph: string }[] = [
  { value: "default", label: "Default", glyph: "text-[15px]" },
  { value: "large", label: "Large", glyph: "text-[19px]" },
  { value: "xlarge", label: "Extra Large", glyph: "text-[23px]" },
];

/** Segmented Default / Large / Extra Large text-size control. Mirrors ThemeToggle
 *  (`bar` layout) with a sliding active indicator. Drives the FontSizeProvider,
 *  which scales the rem-based type scale via data-font-scale on <html>. */
export function FontSizeToggle({ className }: { className?: string }) {
  const { scale, setScale } = useFontSize();
  const indicatorId = useId();

  return (
    <div role="radiogroup" aria-label="Text size" className={cn("flex w-full gap-1", className)}>
      {OPTIONS.map((opt) => {
        const active = scale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.label}
            onClick={() => setScale(opt.value)}
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
            <span aria-hidden="true" className={cn("relative z-10 font-display font-bold leading-none", opt.glyph)}>
              A
            </span>
            <span className="relative z-10 font-label-caps text-label-caps">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
