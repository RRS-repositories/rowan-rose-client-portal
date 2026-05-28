import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import type { Claim } from "@/data/types";

/** Prominent offer alert (brief §8) — an offer needs the client's attention, so this
 *  is non-dismissible and announces itself (role="alert"). One per offer claim.
 *  Surface card + on-surface text (skeuo-card overrides background, so container
 *  on-colours would be the wrong polarity); prominence comes from the primary
 *  left-bar accent, the container icon tile, and the solid action button. */
export function OfferBanner({ claim }: { claim: Claim }) {
  return (
    <section
      role="alert"
      aria-label={`An offer has been received for your claim against ${claim.lender.name}`}
      className="skeuo-card relative flex flex-col gap-md overflow-hidden rounded-[20px] p-md sm:flex-row sm:items-center"
    >
      <span className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden />
      <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-primary-container text-on-primary-container skeuo-inner-highlight">
        <Icon name="redeem" size={26} fill />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-headline-md text-headline-md text-on-surface">An offer has arrived</h2>
        <p className="mt-0.5 font-body text-body-md text-on-surface-variant">
          An offer has been received for your claim against {claim.lender.name}. Review the details and respond.
        </p>
      </div>
      <Link
        to={`/claims/${encodeURIComponent(claim.id)}`}
        className="flex min-h-[48px] flex-none items-center justify-center gap-xs rounded-lg bg-primary px-md font-button text-button text-on-primary skeuo-raise skeuo-press"
      >
        Review your offer
        <Icon name="arrow_forward" size={20} />
      </Link>
    </section>
  );
}
