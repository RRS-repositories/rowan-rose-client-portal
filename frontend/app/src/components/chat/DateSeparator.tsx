import { formatRelativeDay } from "@/lib/format";

/** Subtle divider between messages on different days — "Today" / "Yesterday" /
 *  "18 May 2026". A11y: role="separator" with the date as the label. */
export function DateSeparator({ iso }: { iso: string }) {
  const label = formatRelativeDay(iso);
  return (
    <div role="separator" aria-label={label} className="my-md flex items-center gap-sm">
      <span aria-hidden className="h-px flex-1 bg-outline-variant/40" />
      <span className="font-label-caps text-label-caps font-bold tracking-wider text-on-surface-variant">
        {label}
      </span>
      <span aria-hidden className="h-px flex-1 bg-outline-variant/40" />
    </div>
  );
}
