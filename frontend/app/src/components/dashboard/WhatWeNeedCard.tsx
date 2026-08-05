import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/useToast";
import { getQuestionnaireLink, getExtraLenderLink, openAskPage } from "@/api/asks";
import type { Requirement } from "@/data/types";

/** Contact-level asks whose row opens the firm's form page directly — their
 *  `action` route is the dashboard itself, so a link would go nowhere. */
const DIRECT_OPEN: Record<string, { label: string; icon: string; get: () => Promise<string | null> }> = {
  questionnaire: { label: "Start", icon: "assignment", get: getQuestionnaireLink },
  "extra-lender": { label: "Choose", icon: "playlist_add", get: getExtraLenderLink },
};

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
            {DIRECT_OPEN[r.kind] ? (
              <DirectOpenRow requirement={r} open={DIRECT_OPEN[r.kind]} />
            ) : (
              <Link to={`${r.action}?highlight=${r.id}`} className="flex items-center justify-between gap-sm rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-sm skeuo-recessed">
                <RowBody requirement={r} />
                <span className="flex min-h-[48px] flex-none items-center gap-xs rounded-lg bg-primary px-3 font-button text-label text-on-primary skeuo-raise skeuo-press">
                  {r.kind === "offer-acceptance" ? (
                    <>Review <Icon name="visibility" size={18} /></>
                  ) : r.kind === "signature" ? (
                    <>Sign <Icon name="stylus_note" size={18} /></>
                  ) : r.kind === "fos-referral" ? (
                    <>Review <Icon name="gavel" size={18} /></>
                  ) : (
                    <>Upload <Icon name="upload" size={18} /></>
                  )}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RowBody({ requirement }: { requirement: Requirement }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-sm">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-lg border border-error/10 bg-error-container/40 text-error skeuo-inner-highlight">
        <Icon name={requirement.icon} size={22} />
      </span>
      <span className="min-w-0 break-words font-button text-button text-on-surface">{requirement.title}</span>
    </span>
  );
}

/** Row that opens the firm's secure form page in a new tab (popup-safe). */
function DirectOpenRow({
  requirement, open,
}: {
  requirement: Requirement;
  open: (typeof DIRECT_OPEN)[string];
}) {
  const { push } = useToast();
  const [opening, setOpening] = useState(false);

  async function act() {
    if (opening) return;
    setOpening(true);
    const ok = await openAskPage(open.get);
    setOpening(false);
    if (!ok) {
      push({
        title: "Couldn't open that page",
        description: "We may still be preparing it. Please try again shortly, or contact us and we'll help.",
        tone: "error",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={act}
      disabled={opening}
      aria-label={`${open.label} — ${requirement.title}`}
      className="flex w-full items-center justify-between gap-sm rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-sm text-left skeuo-recessed disabled:opacity-60"
    >
      <RowBody requirement={requirement} />
      <span className="flex min-h-[48px] flex-none items-center gap-xs rounded-lg bg-primary px-3 font-button text-label text-on-primary skeuo-raise skeuo-press">
        {open.label} <Icon name={opening ? "progress_activity" : open.icon} size={18} className={opening ? "animate-spin" : undefined} />
      </span>
    </button>
  );
}
