import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import type { Requirement } from "@/data/types";

/** Sacred "What We Need From You" card (brief §5.1) — faithful to the Stitch markup:
 *  gradient card, red left-bar, pink badge-3d count, recessed task rows, primary Upload. */
export function WhatWeNeedCard({ requirements }: { requirements: Requirement[] }) {
  const count = requirements.length;
  if (count === 0) return null;
  return (
    <section aria-labelledby="wwn-title" className="skeuo-card relative overflow-hidden rounded-[24px] p-md">
      <div className="absolute left-0 top-0 h-full w-1 bg-error" aria-hidden />
      <div className="mb-sm flex items-start justify-between gap-sm">
        <div>
          <h2 id="wwn-title" className="mb-xs font-headline-md text-headline-md text-on-surface">What We Need From You</h2>
          <p className="font-body text-body-md text-on-surface-variant">Please provide these documents to proceed.</p>
        </div>
        <div className="badge-3d flex flex-none items-center gap-xs rounded-full px-sm py-[5px]" aria-label={`${count} items needed`}>
          <Icon name="error" size={16} fill className="text-on-error-container" />
          <span className="font-label-caps text-label-caps font-bold text-on-error-container">{count} {count === 1 ? "ITEM" : "ITEMS"}</span>
        </div>
      </div>
      <ul className="mt-md space-y-sm">
        {requirements.map((r) => (
          <li key={r.id}>
            <Link to={r.action} className="flex items-center justify-between gap-sm rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-sm skeuo-recessed">
              <span className="flex min-w-0 items-center gap-sm">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-lg border border-error/10 bg-error-container/40 text-error skeuo-inner-highlight">
                  <Icon name={r.icon} size={22} />
                </span>
                <span className="truncate font-button text-button text-on-surface">{r.title}</span>
              </span>
              <span className="flex min-h-[48px] flex-none items-center gap-xs rounded-lg bg-primary px-3 font-button text-label text-on-primary skeuo-raise skeuo-press">
                Upload <Icon name="upload" size={18} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
