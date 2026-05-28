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
          {/* App name in Times New Roman to read as a legal/firm wordmark. */}
          <span
            className="block text-[18px] font-bold text-on-surface"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            Rowan Rose Solicitors
          </span>
        </span>
      )}
    </span>
  );
}
