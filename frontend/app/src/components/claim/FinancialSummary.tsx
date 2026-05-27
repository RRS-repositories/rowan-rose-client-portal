import { Icon } from "@/components/ui/Icon";
import { computeFee, financialVisibility } from "@/data/financials";
import { gbp, formatDate } from "@/lib/format";
import type { Claim } from "@/data/types";

/** Progressive financial reveal (brief §8). Hidden entirely before an offer. */
export function FinancialSummary({ claim }: { claim: Claim }) {
  const vis = financialVisibility(claim.internalStatus);
  const f = claim.financials ?? {};
  if (vis === "none") return null;

  if (vis === "offerOnly" && f.offer != null) {
    return (
      <section aria-label="Offer" className="skeuo-card overflow-hidden rounded-xl">
        <div className="flex items-center gap-sm bg-primary px-md py-sm text-on-primary">
          <Icon name="mark_email_unread" size={20} fill />
          <h3 className="font-headline-md text-headline-md">An offer has been made</h3>
        </div>
        <div className="p-md">
          <p className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">{claim.lender.name} has offered</p>
          <p className="font-display-lg-mobile text-display-lg-mobile tabular-nums text-on-surface">{gbp(f.offer)}</p>
          <p className="mt-sm border-t border-outline-variant/30 pt-sm font-body text-body-md text-on-surface-variant">
            This is the amount the lender has offered to settle your claim. If you accept, we'll confirm the next steps —
            including any fee — before anything is deducted. Take your time; there's no rush to decide today.
          </p>
        </div>
      </section>
    );
  }

  if (vis === "gross" && f.gross != null) {
    return (
      <section aria-label="Settlement received" className="skeuo-card rounded-xl p-md">
        <p className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Settlement received</p>
        <p className="font-display-lg-mobile text-display-lg-mobile tabular-nums text-on-surface">{gbp(f.gross)}</p>
        <p className="mt-xs font-body text-body-md text-on-surface-variant">Payment has arrived from {claim.lender.name}. We're processing your settlement now.</p>
      </section>
    );
  }

  if (vis === "full" && f.gross != null) {
    const fee = computeFee(f.gross);
    const pctLabel = `${Math.round(fee.pct * 100)}% + VAT`;
    return (
      <section aria-label="Settlement breakdown" className="skeuo-card overflow-hidden rounded-xl">
        <div className="flex items-center gap-sm p-md">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-primary-container text-on-primary-container skeuo-inner-highlight">
            <Icon name="paid" size={24} fill />
          </span>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Your settlement, paid</h3>
            {f.paymentDate && <p className="font-body text-label font-normal text-on-surface-variant">Paid to your account on {formatDate(f.paymentDate)}</p>}
          </div>
        </div>
        <dl className="px-md pb-md">
          <div className="flex items-baseline justify-between border-t border-outline-variant/30 py-sm">
            <dt className="font-body text-body-md text-on-surface-variant">Settlement from {claim.lender.name}</dt>
            <dd className="font-button text-body-lg tabular-nums text-on-surface">{gbp(fee.gross)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-outline-variant/30 py-sm">
            <dt className="font-body text-body-md text-on-surface-variant">
              Our fee<span className="block font-body text-label font-normal text-on-surface-variant/80">{pctLabel} (capped at {gbp(fee.cap)})</span>
            </dt>
            <dd className="font-button text-body-lg tabular-nums text-on-surface">−{gbp(fee.feeIncVat)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-outline-variant/30 py-sm">
            <dt className="font-button text-body-lg text-on-surface">Paid to you</dt>
            <dd className="font-display-lg-mobile text-headline-md font-bold tabular-nums text-primary">{gbp(fee.net)}</dd>
          </div>
        </dl>
      </section>
    );
  }
  return null;
}
