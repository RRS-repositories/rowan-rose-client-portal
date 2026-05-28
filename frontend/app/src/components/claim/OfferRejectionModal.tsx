import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  useFloating, useDismiss, useRole, useInteractions, useTransitionStyles,
  FloatingPortal, FloatingOverlay, FloatingFocusManager,
} from "@floating-ui/react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { gbp } from "@/lib/format";

interface Props {
  open: boolean;
  offerAmount: number;
  lenderName: string;
  submitting: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/** Rejection confirmation modal. Optional reason textarea is captured and
 *  shown to the team. Escape / backdrop close without rejecting. */
export function OfferRejectionModal({ open, offerAmount, lenderName, submitting, onConfirm, onCancel }: Props) {
  const reduce = useReducedMotion();
  const [reason, setReason] = useState("");

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
            aria-labelledby="offer-reject-title"
            aria-describedby="offer-reject-desc"
            style={styles}
            className="skeuo-card w-full max-w-[30rem] rounded-xl p-md"
          >
            <div className="flex items-start gap-md">
              <span aria-hidden className="grid h-12 w-12 flex-none place-items-center rounded-full bg-error-container text-on-error-container skeuo-inner-highlight">
                <Icon name="cancel" size={26} fill />
              </span>
              <div className="min-w-0">
                <h2 id="offer-reject-title" className="font-headline-md text-headline-md text-on-surface">Reject Offer</h2>
                <p id="offer-reject-desc" className="mt-1 font-body text-body-md text-on-surface-variant">
                  Are you sure you want to reject this offer of <span className="font-semibold text-on-surface">{gbp(offerAmount)}</span> from {lenderName}?
                </p>
                <p className="mt-2 font-body text-body-md text-on-surface-variant">
                  If you reject this offer, we will continue to pursue your claim through alternative channels. This may take longer but could result in a higher settlement.
                </p>
              </div>
            </div>

            <div className="mt-md">
              <label htmlFor="reject-reason" className="mb-1.5 block font-body text-label font-semibold text-on-surface">
                Reason for rejection (optional)
              </label>
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us why you are rejecting this offer..."
                rows={3}
                maxLength={500}
                disabled={submitting}
                className="skeuo-recessed w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-sm font-body text-body-md text-on-surface placeholder:text-on-surface-variant/70"
              />
            </div>

            <div className="mt-md flex flex-col gap-sm sm:flex-row-reverse">
              <Button
                fullWidth
                variant="destructive"
                onClick={() => onConfirm(reason)}
                loading={submitting}
                leadingIcon={submitting ? undefined : "cancel"}
              >
                {submitting ? "Rejecting..." : "Yes, Reject Offer"}
              </Button>
              <Button fullWidth variant="ghost" onClick={onCancel} disabled={submitting}>
                Keep Offer
              </Button>
            </div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}
