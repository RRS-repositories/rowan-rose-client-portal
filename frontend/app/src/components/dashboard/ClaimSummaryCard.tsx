import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { phaseOf } from "@/data/statusMap";
import { relativeDays } from "@/lib/format";
import type { Claim } from "@/data/types";

/** Claim summary card — faithful to the Stitch mobile dashboard card. */
export function ClaimSummaryCard({ claim }: { claim: Claim }) {
  const phase = phaseOf(claim);
  const isOffer = phase === "Offer Received";
  const lastUpdated = claim.timeline[0]?.date;

  return (
    <Link to={`/claims/${encodeURIComponent(claim.id)}`} aria-label={`${claim.lender.name} claim ${claim.id}`} className="block rounded-[20px]">
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
          <StatusPill phase={phase} />
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
