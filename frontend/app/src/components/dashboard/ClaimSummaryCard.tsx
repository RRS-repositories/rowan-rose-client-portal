import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { phaseOf } from "@/data/statusMap";
import { relativeDays } from "@/lib/format";
import type { Claim } from "@/data/types";

/** Claim summary card — faithful to the Stitch mobile dashboard card. The
 *  unread-messages pill (when present) jumps straight to /chat/:claimId rather
 *  than the claim detail view; it sits beside the status pill and uses
 *  stopPropagation so the surrounding Link doesn't fire. */
export function ClaimSummaryCard({ claim }: { claim: Claim }) {
  const navigate = useNavigate();
  const phase = phaseOf(claim);
  const isOffer = phase === "Offer Received";
  const lastUpdated = claim.timeline[0]?.date;
  const unread = claim.unreadMessages ?? 0;

  return (
    <Link
      to={`/claims/${encodeURIComponent(claim.id)}`}
      aria-label={`${claim.lender.name} claim ${claim.id}, ${phase}, ${isOffer ? "action required: review your offer" : `updated ${relativeDays(lastUpdated)}`}${unread > 0 ? `, ${unread} unread message${unread === 1 ? "" : "s"}` : ""}`}
      className="block rounded-[20px]"
    >
      <div className="skeuo-card skeuo-card-interactive flex flex-col gap-sm rounded-[20px] p-md">
        <div className="flex items-start justify-between gap-sm">
          <div className="flex min-w-0 items-center gap-sm">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-primary skeuo-inner-highlight">
              <Icon name={claim.lender.icon} size={26} />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-button text-button text-on-surface">{claim.lender.name}</h3>
              <p className="font-mono text-label text-on-surface-variant">{claim.id}</p>
            </div>
          </div>
          <div className="flex flex-none flex-col items-end gap-1">
            <StatusPill phase={phase} />
            {unread > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/chat/${encodeURIComponent(claim.id)}`);
                }}
                aria-label={`View ${unread} unread message${unread === 1 ? "" : "s"} from ${claim.lender.name}`}
                className="badge-3d flex items-center gap-1 rounded-full px-2 py-0.5 font-button text-label-caps font-bold text-on-error-container hover:opacity-90"
              >
                <Icon name="forum" size={12} />
                {unread} new
              </button>
            )}
          </div>
        </div>
        <div className="flex h-12 items-center justify-between gap-sm rounded-xl bg-surface-container-lowest px-sm skeuo-recessed">
          <span className={isOffer ? "truncate font-button text-label text-primary" : "truncate font-body text-label text-on-surface-variant"}>
            {isOffer ? "Action required: review your offer" : `Last updated ${relativeDays(lastUpdated)}`}
          </span>
          <Icon name="chevron_right" size={22} className={isOffer ? "text-primary" : "text-on-surface-variant"} />
        </div>
      </div>
    </Link>
  );
}
