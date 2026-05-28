import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import type { Requirement } from "@/data/types";

interface Props {
  requirements: Requirement[];
  /** Requirement id to scroll to + pulse (from a ?highlight= deep link). */
  highlightId?: string | null;
  onUpload: (r: Requirement) => void;
}

/** Outstanding-requirements grid — amber "action needed" vs emerald "completed"
 *  cards. Mirrors the left-accent-bar treatment of ActionItems / WhatWeNeedCard. */
export function RequirementsGrid({ requirements, highlightId, onUpload }: Props) {
  const pending = requirements.filter((r) => !r.done).length;
  const allDone = pending === 0;

  return (
    <section aria-labelledby="reqs-heading">
      <h2 id="reqs-heading" className="sr-only">Outstanding requirements</h2>
      <div className="mb-md flex items-center gap-sm">
        <Icon
          name={allDone ? "check_circle" : "warning"}
          size={24}
          fill
          className={allDone ? "text-primary" : "text-tertiary"}
        />
        <p className="font-body-lg text-body-lg text-on-surface">
          {allDone
            ? "All requirements are complete. Thank you!"
            : `${pending} of ${requirements.length} requirements need your attention`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        {requirements.map((r) => (
          <RequirementCard key={r.id} r={r} highlighted={highlightId === r.id} onUpload={onUpload} />
        ))}
      </div>
    </section>
  );
}

function RequirementCard({ r, highlighted, onUpload }: { r: Requirement; highlighted: boolean; onUpload: (r: Requirement) => void }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const done = r.done;

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }
  }, [highlighted, reduce]);

  const ariaLabel = done
    ? `${r.title} — completed${r.receivedOn ? `, received on ${formatDate(r.receivedOn)}` : ""}`
    : `${r.title} — action needed. ${r.description}`;

  return (
    <motion.article
      ref={ref}
      aria-label={ariaLabel}
      className={cn(
        "skeuo-card relative overflow-hidden rounded-xl p-md",
        done ? "opacity-90" : "ring-1 ring-inset ring-tertiary-fixed-dim/30",
      )}
    >
      <span className={cn("absolute left-0 top-0 h-full w-1", done ? "bg-primary" : "bg-tertiary-fixed-dim")} aria-hidden />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-primary"
        initial={{ opacity: 0 }}
        animate={highlighted && !reduce ? { opacity: [0, 1, 0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 1.8, times: [0, 0.2, 0.45, 0.7, 1] }}
      />
      <div className="flex items-start gap-sm">
        <span
          className={cn(
            "grid h-12 w-12 flex-none place-items-center rounded-lg skeuo-inner-highlight",
            done ? "bg-primary-container text-on-primary-container" : "bg-tertiary-fixed text-on-tertiary-fixed-variant",
          )}
        >
          <Icon name={done ? "check_circle" : r.icon} size={24} fill={done} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-xs">
            <h3 className="font-button text-body-lg text-on-surface">{r.title}</h3>
            {done && (
              <span className="rounded-full bg-primary-container px-2 py-0.5 font-label-caps text-label-caps uppercase text-on-primary-container">
                Completed
              </span>
            )}
          </div>
          <p className="mt-1 font-body text-body-md text-on-surface-variant">
            {done ? (r.receivedOn ? `Received on ${formatDate(r.receivedOn)}` : "Completed") : r.description}
          </p>
          {!done && (
            <Button size="md" variant="primary" leadingIcon="upload_file" onClick={() => onUpload(r)} className="mt-sm">
              Upload
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
