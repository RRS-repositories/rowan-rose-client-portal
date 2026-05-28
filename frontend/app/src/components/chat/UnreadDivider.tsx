/** Renders above the first unread message in a thread. Disappears once
 *  mark-as-read fires. A11y: role="separator" with a descriptive label. */
export function UnreadDivider() {
  return (
    <div role="separator" aria-label="New messages below" className="my-md flex items-center gap-sm">
      <span aria-hidden className="h-px flex-1 bg-primary/40" />
      <span className="rounded-full bg-primary px-sm py-0.5 font-label-caps text-label-caps font-bold tracking-wider text-on-primary skeuo-raise">
        New messages
      </span>
      <span aria-hidden className="h-px flex-1 bg-primary/40" />
    </div>
  );
}
