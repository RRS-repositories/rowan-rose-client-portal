import { cn } from "@/lib/cn";

/** Rowan Rose monogram + wordmark. Theme-safe (bg-primary / on-primary). */
export function Logo({ withWordmark = true, className }: { withWordmark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-sm", className)}>
      <span
        aria-hidden="true"
        className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-primary text-[15px] font-bold text-on-primary skeuo-raise"
        style={{ fontFamily: "var(--font-display)" }}
      >
        RR
      </span>
      {withWordmark && (
        <span className="leading-none">
          <span className="block font-display text-[18px] font-bold text-on-surface">Rowan Rose</span>
          <span className="mt-0.5 block font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            Fast Action Claims
          </span>
        </span>
      )}
    </span>
  );
}
