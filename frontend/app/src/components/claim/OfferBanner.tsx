import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { gbp, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Claim } from "@/data/types";
import type { OfferDetails } from "@/data/offers";

interface Props {
  claim: Claim;
  offer: OfferDetails | null;
  onReject: () => void;
}

/** Top-of-action-items banner. Three visual states keyed off the claim's
 *  internal status: Offer Received (pending — CTAs), Offer Accepted
 *  (success card), Offer Rejected (muted card). */
export function OfferBanner({ claim, offer, onReject }: Props) {
  const navigate = useNavigate();

  if (claim.internalStatus === "Offer Accepted") {
    return (
      <section
        role="status"
        aria-label="Offer accepted"
        className="skeuo-card relative overflow-hidden rounded-xl p-md"
      >
        <span className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden />
        <div className="flex items-start gap-md">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-primary-container text-on-primary-container skeuo-inner-highlight">
            <Icon name="task_alt" size={24} fill />
          </span>
          <div>
            <h3 className="font-headline-md text-headline-md text-primary">Offer Accepted</h3>
            <p className="mt-1 font-body text-body-md text-on-surface">
              You accepted this offer{claim.offerActionedAt ? ` on ${formatDate(claim.offerActionedAt)}` : ""}. The lender will process payment within 28 days.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (claim.internalStatus === "Offer Rejected") {
    return (
      <section
        role="status"
        aria-label="Offer rejected"
        className="skeuo-card relative overflow-hidden rounded-xl p-md"
      >
        <span className="absolute left-0 top-0 h-full w-1 bg-outline-variant" aria-hidden />
        <div className="flex items-start gap-md">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-surface-container-high text-on-surface-variant skeuo-inner-highlight">
            <Icon name="info" size={24} />
          </span>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Offer Rejected</h3>
            <p className="mt-1 font-body text-body-md text-on-surface-variant">
              This offer was rejected. We are pursuing further action on your behalf.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (claim.internalStatus !== "Offer Received") return null;

  const amount = claim.financials?.offer ?? offer?.offerAmount ?? 0;
  return <PendingOfferBanner claim={claim} amount={amount} offer={offer} onReject={onReject} onReview={() => navigate(`/claims/${encodeURIComponent(claim.id)}/accept-offer`)} />;
}

function PendingOfferBanner({
  claim,
  amount,
  offer,
  onReview,
  onReject,
}: { claim: Claim; amount: number; offer: OfferDetails | null; onReview: () => void; onReject: () => void }) {
  const expiry = useMemo(() => (offer ? expiryStatus(offer.expiryDate) : null), [offer]);

  return (
    <section
      role="status"
      aria-label="Settlement offer received"
      className="skeuo-card relative overflow-hidden rounded-xl p-md"
    >
      <span className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden />
      <div className="flex flex-col gap-md md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-md">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-primary-container text-on-primary-container skeuo-inner-highlight">
            <Icon name="redeem" size={24} fill />
          </span>
          <div className="min-w-0">
            <h3 className="font-headline-md text-headline-md text-on-surface">Settlement Offer Received</h3>
            <p className="mt-2 font-display text-display-lg-mobile font-bold tabular-nums text-primary md:text-display-lg">
              {gbp(amount)}
            </p>
            <p className="font-body text-body-md text-on-surface-variant">from {claim.lender.name}</p>
            {offer && (
              <>
                <p className="mt-2 font-body text-label text-on-surface-variant">
                  Received on {formatDate(offer.offerDate)}
                </p>
                <p
                  className={cn(
                    "mt-0.5 font-body text-label",
                    expiry?.tone === "critical" && "text-error font-semibold",
                    expiry?.tone === "warning" && "text-on-tertiary-container font-semibold",
                    (!expiry || expiry.tone === "ok") && "text-on-surface-variant",
                  )}
                >
                  This offer expires on {formatDate(offer.expiryDate)} ({expiry?.label})
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-sm md:items-end">
          <Button onClick={onReview} leadingIcon="visibility" size="lg">Review & Accept</Button>
          <Button onClick={onReject} variant="ghost" size="md">Reject Offer</Button>
        </div>
      </div>
    </section>
  );
}

function expiryStatus(expiryDate: string): { tone: "ok" | "warning" | "critical"; label: string } {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const days = Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000);
  if (days <= 0) return { tone: "critical", label: "expired" };
  if (days <= 3) return { tone: "critical", label: `${days} day${days === 1 ? "" : "s"} left` };
  if (days <= 7) return { tone: "warning", label: `${days} days left` };
  return { tone: "ok", label: `${days} days left` };
}
