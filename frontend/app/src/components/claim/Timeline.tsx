import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/format";
import type { TimelineEntry } from "@/data/types";

/** "Your claim story" — narrative activity (brief §5.3), Stitch divided card. */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <section aria-label="Your claim story" className="mt-md">
      <h3 className="mb-md font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Your Claim Story</h3>
      <div className="skeuo-card divide-y divide-outline-variant/20 overflow-hidden rounded-xl">
        {entries.map((e) => (
          <div key={e.id} className="flex items-start gap-md p-md">
            <span className="mt-1 grid h-8 w-8 flex-none place-items-center rounded-full border border-outline-variant/30 bg-surface-container text-on-surface-variant">
              <Icon name={e.icon} size={18} />
            </span>
            <div>
              <p className="font-body-lg text-body-lg text-on-surface">{e.text}</p>
              <p className="mt-1 font-body text-label font-normal text-on-surface-variant">{formatDate(e.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
