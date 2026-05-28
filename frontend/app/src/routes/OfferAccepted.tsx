import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Page } from "@/components/layout/Page";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { getOfferDetails, type OfferDetails } from "@/data/offers";
import { gbp } from "@/lib/format";

/** Phase 4.1 — Offer accepted success page. Shown immediately after the
 *  acceptance is submitted. Reuses the spring-checkmark pattern from
 *  PasswordResetSuccess. */
export default function OfferAccepted() {
  const { id: rawId = "" } = useParams();
  const claimId = decodeURIComponent(rawId);
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();

  // Prefer the offer details handed over by the acceptance page so we don't
  // double-fetch; fall back to a re-fetch if someone deep-links here.
  const handover = (location.state as { offer?: OfferDetails } | null)?.offer ?? null;
  const [offer, setOffer] = useState<OfferDetails | null>(handover);
  const [loading, setLoading] = useState(!handover);

  useEffect(() => {
    if (handover) return;
    let cancelled = false;
    (async () => {
      const res = await getOfferDetails(claimId);
      if (cancelled) return;
      setOffer(res);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [claimId, handover]);

  return (
    <Page label="Offer accepted">
      <MobileHeader variant="back" title="Offer Accepted" />
      <div className="mx-auto w-full max-w-2xl px-margin-mobile py-md md:px-lg md:py-lg">
        {loading || !offer ? (
          <div className="space-y-md">
            <Skeleton className="mx-auto h-20 w-20 rounded-full" />
            <Skeleton className="mx-auto h-10 w-1/2" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <motion.span
                aria-hidden="true"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="grid h-20 w-20 place-items-center rounded-full bg-primary text-on-primary skeuo-raise"
              >
                <Icon name="check" size={44} fill />
              </motion.span>
              <h1 className="mt-md font-display text-headline-md font-bold text-primary md:text-display-lg-mobile">Offer Accepted!</h1>
              <p className="mt-2 font-body text-body-lg text-on-surface-variant">
                Your acceptance has been submitted to {offer.lenderName}.
              </p>
            </div>

            <section aria-label="What happens next" className="skeuo-card mt-lg rounded-xl p-md">
              <h2 className="font-headline-md text-headline-md text-on-surface">What happens next</h2>
              <ol className="mt-sm space-y-2">
                <NextStep n={1} text={`Your signed acceptance has been sent to ${offer.lenderName}.`} />
                <NextStep n={2} text="The lender will process your payment within 28 days." />
                <NextStep n={3} text={`Once we receive the funds, our fee of ${offer.feePercentage}% + VAT (${gbp(offer.estimatedFeeAmount)}) will be deducted.`} />
                <NextStep n={4} text={`Your net settlement of ${gbp(offer.estimatedNetToClient)} will be paid to you within 5 working days.`} />
                <NextStep n={5} text="You can track the payment progress in your dashboard." />
              </ol>
            </section>

            <section aria-label="Acceptance summary" className="skeuo-card mt-md rounded-xl p-md">
              <h2 className="font-headline-md text-headline-md text-on-surface">Summary</h2>
              <dl className="mt-sm space-y-1.5">
                <Row label="Offer Amount" value={gbp(offer.offerAmount)} />
                <Row label={`Fee (${offer.feePercentage}% + VAT)`} value={`- ${gbp(offer.estimatedFeeAmount)}`} />
                <hr className="my-2 border-outline-variant/30" />
                <Row label="You will receive" value={gbp(offer.estimatedNetToClient)} emphasis />
              </dl>
            </section>

            <div className="mt-lg flex flex-col gap-sm sm:flex-row-reverse">
              <Button fullWidth leadingIcon="visibility" onClick={() => navigate(`/claims/${encodeURIComponent(claimId)}`)}>
                View Claim
              </Button>
              <Button fullWidth variant="ghost" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}

function NextStep({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-sm">
      <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-primary-container font-body text-label font-bold text-on-primary-container">{n}</span>
      <span className="font-body text-body-md text-on-surface">{text}</span>
    </li>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-sm">
      <dt className="font-body text-body-md text-on-surface-variant">{label}</dt>
      <dd className={emphasis ? "font-display text-body-lg font-bold tabular-nums text-primary" : "font-body text-body-md tabular-nums text-on-surface"}>{value}</dd>
    </div>
  );
}
