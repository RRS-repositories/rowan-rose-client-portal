import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FontSizeToggle } from "@/components/ui/FontSizeToggle";

/** Settings panel content — Appearance (theme) + Text size. Both controls write
 *  straight to their providers, so changes apply instantly and persist to
 *  localStorage. Used inside SettingsMenu (header gear) and reusable elsewhere. */
export function SettingsPanel({ headingId }: { headingId?: string }) {
  return (
    <div className="flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-md">
      <h2 id={headingId} className="font-headline-md text-headline-md text-on-surface">
        Settings
      </h2>

      <section className="flex flex-col gap-2">
        <span className="font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
          Appearance
        </span>
        <ThemeToggle variant="bar" />
      </section>

      <section className="flex flex-col gap-2">
        <span className="font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
          Text size
        </span>
        <FontSizeToggle />
        <p className="font-body text-label font-normal text-on-surface-variant">
          Make text easier to read across the whole app.
        </p>
      </section>
    </div>
  );
}
