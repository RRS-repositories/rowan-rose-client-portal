import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/format";
import type { TimelineEntry } from "@/data/types";

function RowBody({ e }: { e: TimelineEntry }) {
  return (
    <div className="flex items-start gap-md p-md">
      <span className="mt-1 grid h-8 w-8 flex-none place-items-center rounded-full border border-outline-variant/30 bg-surface-container text-on-surface-variant">
        <Icon name={e.icon} size={18} />
      </span>
      <div>
        <p className="font-body-lg text-body-lg text-on-surface">{e.text}</p>
        <p className="mt-1 font-body text-label font-normal text-on-surface-variant">{formatDate(e.date)}</p>
      </div>
    </div>
  );
}

/** "Your claim story" — narrative activity (brief §5.3), reverse-chronological.
 *  Shows the most recent `maxVisible` and lets the client reveal earlier events. */
export function Timeline({ entries, maxVisible = 5 }: { entries: TimelineEntry[]; maxVisible?: number }) {
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) {
    return (
      <section aria-label="Your claim story" className="mt-md">
        <h3 className="mb-md font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Your Claim Story</h3>
        <div className="skeuo-card rounded-xl p-md">
          <p className="font-body text-body-md text-on-surface-variant">No activity recorded yet.</p>
        </div>
      </section>
    );
  }

  const visible = entries.slice(0, maxVisible);
  const hidden = entries.slice(maxVisible);
  const hasMore = hidden.length > 0;

  return (
    <section aria-label="Your claim story" className="mt-md">
      <h3 className="mb-md font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Your Claim Story</h3>
      <div className="skeuo-card overflow-hidden rounded-xl">
        <ol className="divide-y divide-outline-variant/20">
          {visible.map((e) => (
            <li key={e.id}>
              <RowBody e={e} />
            </li>
          ))}
          <AnimatePresence initial={false}>
            {expanded &&
              hidden.map((e) => (
                <motion.li
                  key={e.id}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <RowBody e={e} />
                </motion.li>
              ))}
          </AnimatePresence>
        </ol>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex min-h-[48px] w-full items-center justify-center gap-1.5 border-t border-outline-variant/20 px-md font-button text-button text-primary hover:bg-surface-container-high"
          >
            <Icon name={expanded ? "expand_less" : "expand_more"} size={20} />
            {expanded ? "Show fewer events" : `Show earlier events (${hidden.length})`}
          </button>
        )}
      </div>
    </section>
  );
}
