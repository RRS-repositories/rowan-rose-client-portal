import { useReducedMotion } from "framer-motion";
import {
  useFloating, useDismiss, useRole, useInteractions, useTransitionStyles,
  FloatingPortal, FloatingOverlay, FloatingFocusManager,
} from "@floating-ui/react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { gbp } from "@/lib/format";
import type { OfferDetails } from "@/data/offers";
import type { SignatureValue } from "./SignatureSection";

interface Props {
  open: boolean;
  offer: OfferDetails;
  signature: SignatureValue;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation step before submitting an offer acceptance. Escape /
 *  backdrop both resolve to "Go Back" (safe default — accept-offer is
 *  irreversible, so we never confirm by accident). */
export function OfferConfirmationModal({ open, offer, signature, submitting, onConfirm, onCancel }: Props) {
  const reduce = useReducedMotion();
  const { refs, context } = useFloating({
    open,
    onOpenChange: (next) => { if (!next) onCancel(); },
  });
  const { getFloatingProps } = useInteractions([
    useDismiss(context),
    useRole(context, { role: "alertdialog" }),
  ]);
  const { isMounted, styles } = useTransitionStyles(context, {
    duration: reduce ? 0 : 180,
    initial: { opacity: 0, transform: reduce ? "none" : "scale(0.96)" },
  });

  if (!isMounted) return null;

  return (
    <FloatingPortal>
      <FloatingOverlay lockScroll className="z-[80] grid place-items-center bg-black/55 p-margin-mobile" style={{ opacity: styles.opacity }}>
        <FloatingFocusManager context={context} modal returnFocus>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            aria-labelledby="offer-confirm-title"
            aria-describedby="offer-confirm-desc"
            style={styles}
            className="skeuo-card w-full max-w-[30rem] rounded-xl p-md"
          >
            <div className="flex items-start gap-md">
              <span aria-hidden className="grid h-12 w-12 flex-none place-items-center rounded-full bg-tertiary-container text-on-tertiary-container skeuo-inner-highlight">
                <Icon name="warning" size={26} fill />
              </span>
              <div className="min-w-0">
                <h2 id="offer-confirm-title" className="font-headline-md text-headline-md text-on-surface">Confirm Offer Acceptance</h2>
                <p id="offer-confirm-desc" className="mt-1 font-body text-body-md text-on-surface-variant">
                  You are about to accept a settlement offer of <span className="font-semibold text-on-surface">{gbp(offer.offerAmount)}</span> from {offer.lenderName}. This action is final and cannot be reversed.
                </p>
              </div>
            </div>

            <dl className="mt-md space-y-1.5 rounded-lg bg-surface-container-low p-sm">
              <SummaryLine label="Offer" value={gbp(offer.offerAmount)} />
              <SummaryLine label={`Fee (${offer.feePercentage}% + VAT)`} value={`- ${gbp(offer.estimatedFeeAmount)}`} />
              <SummaryLine label="You will receive" value={gbp(offer.estimatedNetToClient)} emphasis />
            </dl>

            <div className="mt-md">
              <p className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Your signature</p>
              <div className="mt-1 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-sm">
                {signature.data ? (
                  <img src={signature.data} alt="Your drawn signature" className="mx-auto block max-h-24 w-auto" />
                ) : (
                  <p className="text-center font-body text-label text-on-surface-variant">(no signature provided)</p>
                )}
              </div>
            </div>

            <p className="mt-md font-body text-body-md font-semibold text-on-surface">
              Are you sure you want to proceed?
            </p>

            <div className="mt-md flex flex-col gap-sm sm:flex-row-reverse">
              <Button fullWidth onClick={onConfirm} loading={submitting} leadingIcon={submitting ? undefined : "check"}>
                {submitting ? "Submitting..." : "Yes, Accept Offer"}
              </Button>
              <Button fullWidth variant="ghost" onClick={onCancel} disabled={submitting}>
                Go Back
              </Button>
            </div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}

function SummaryLine({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-sm">
      <dt className="font-body text-body-md text-on-surface-variant">{label}</dt>
      <dd className={emphasis ? "font-body text-body-lg font-bold tabular-nums text-primary" : "font-body text-body-md tabular-nums text-on-surface"}>{value}</dd>
    </div>
  );
}
