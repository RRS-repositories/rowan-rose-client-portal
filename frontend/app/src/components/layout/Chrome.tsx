import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

/** Notification bell with unread count badge (mock — no real delivery, brief §10). */
export function BellButton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`${count} unread notifications`}
      className={cn(
        "relative grid h-12 w-12 place-items-center rounded-xl bg-surface-container-lowest text-primary skeuo-raise skeuo-press transition-colors hover:bg-surface-container-high",
        className,
      )}
    >
      <Icon name="notifications" size={22} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-error px-1 text-[11px] font-bold leading-none text-on-error ring-2 ring-surface-container-lowest"
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Round monogram avatar. */
export function Avatar({ initials = "SH", className }: { initials?: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-12 w-12 flex-none place-items-center rounded-full bg-secondary-container font-display text-button font-bold text-on-secondary-container skeuo-inner-highlight",
        className,
      )}
    >
      {initials}
    </span>
  );
}
