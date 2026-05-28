import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/useToast";
import { useAuth } from "@/context/AuthContext";
import { OfferSummaryCard } from "@/components/claim/OfferSummaryCard";
import { TermsOfAcceptance } from "@/components/claim/TermsOfAcceptance";
import { SignatureSection, type SignatureValue, type SignatureSectionRef } from "@/components/claim/SignatureSection";
import { OfferConfirmationModal } from "@/components/claim/OfferConfirmationModal";
import { acceptOffer, getOfferDetails, type OfferDetails } from "@/data/offers";
import { gbp, formatUKDateFull } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Phase 4.1 — Offer Review & E-Signature page. Single scrolling page with
 *  summary, terms (with read-tracking), agreement checkbox, drawn-signature
 *  pad and submit. Loads offer via mock API. Redirects to the claim detail
 *  page if no pending offer exists. */
export default function OfferAcceptance() {
  const { id: rawId = "" } = useParams();
  const claimId = decodeURIComponent(rawId);
  const navigate = useNavigate();
  const { state: auth } = useAuth();
  const { push } = useToast();
  const signatureRef = useRef<SignatureSectionRef | null>(null);

  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [termsRead, setTermsRead] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState<SignatureValue>({ data: "", isValid: false });
  const [showSignatureError, setShowSignatureError] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getOfferDetails(claimId);
        if (cancelled) return;
        if (!res) {
          // No pending offer for this claim — bounce to the claim detail page.
          navigate(`/claims/${encodeURIComponent(claimId)}`, { replace: true });
          return;
        }
        if (res.status !== "pending") {
          // Already actioned — bounce to claim detail (banner will reflect state).
          navigate(`/claims/${encodeURIComponent(claimId)}`, { replace: true });
          return;
        }
        setOffer(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "We couldn't load this offer. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [claimId, navigate]);

  const fullName = `${auth.user?.firstName ?? ""} ${auth.user?.lastName ?? ""}`.trim();
  const canSubmit = termsRead && agreed && signature.isValid && !submitting;

  function attemptOpenConfirm() {
    if (!signature.isValid) {
      setShowSignatureError(true);
      return;
    }
    setConfirmOpen(true);
  }

  async function submit() {
    if (!offer) return;
    setSubmitting(true);
    const value = signatureRef.current?.getValue() ?? signature;
    try {
      const res = await acceptOffer(claimId, {
        claimId,
        offerReference: offer.offerReference,
        signatureData: value.data,
        agreedToTerms: agreed,
        acceptedAt: new Date().toISOString(),
      });
      if (!res.success) {
        push({ title: "Something went wrong", description: res.message, tone: "error" });
        setSubmitting(false);
        setConfirmOpen(false);
        return;
      }
      // Navigate to the success page. Pass the offer + signature kind via
      // location state so the success page can render the numbers without
      // refetching.
      navigate(`/claims/${encodeURIComponent(claimId)}/offer-accepted`, {
        replace: true,
        state: { offer },
      });
    } catch (err) {
      push({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <Page label="Review settlement offer">
      <MobileHeader variant="back" title="Review Offer" />
      <div className="w-full px-margin-mobile py-md md:px-lg md:py-lg">
        <button
          onClick={() => navigate(`/claims/${encodeURIComponent(claimId)}`)}
          className="mb-md inline-flex min-h-[44px] items-center gap-1.5 font-button text-button text-primary hover:underline"
        >
          <Icon name="arrow_back" size={20} />
          Back to claim details
        </button>

        {loading ? (
          <div className="space-y-md">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : error || !offer ? (
          <EmptyState
            icon="error"
            title="We couldn't load this offer"
            description={error ?? "Please try again."}
            action={<Button onClick={() => navigate(`/claims/${encodeURIComponent(claimId)}`)}>Back to claim details</Button>}
          />
        ) : (
          <>
            <header className="mb-md">
              <h1 className="font-display-lg-mobile text-display-lg-mobile tracking-tight text-on-surface md:text-display-lg">Review Settlement Offer</h1>
              <p className="mt-1 font-body text-body-lg text-on-surface-variant">
                {offer.lenderName} — {claimId}
              </p>
            </header>

            <div className="space-y-md pb-32 md:pb-md">
              <OfferSummaryCard offer={offer} />

              <div className="skeuo-card rounded-xl p-md">
                <TermsOfAcceptance terms={offer.termsOfAcceptance} onRead={setTermsRead} hasRead={termsRead} />
              </div>

              <AgreementCheckbox
                fullName={fullName || "Client"}
                agreed={agreed}
                onChange={setAgreed}
                disabled={!termsRead}
              />

              <div className="skeuo-card rounded-xl p-md">
                <SignatureSection
                  ref={signatureRef}
                  onChange={(v) => {
                    setSignature(v);
                    if (v.isValid) setShowSignatureError(false);
                  }}
                />
                {showSignatureError && !signature.isValid && (
                  <p role="alert" aria-live="polite" className="mt-sm flex items-center gap-1.5 font-body text-label text-error">
                    <Icon name="error" size={16} fill />
                    Please draw your signature.
                  </p>
                )}
              </div>

              <div className="skeuo-card rounded-xl p-md">
                <dl className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <div>
                    <dt className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Date</dt>
                    <dd className="mt-0.5 font-body text-body-md text-on-surface">{formatUKDateFull()}</dd>
                  </div>
                </dl>
                <p className="mt-md font-body text-body-md text-on-surface">
                  By signing above, you are accepting a settlement offer of <span className="font-semibold text-on-surface">{gbp(offer.offerAmount)}</span> from {offer.lenderName}.
                </p>
              </div>

              <div className={cn(
                // Desktop: inline. Mobile: stick to the bottom of the viewport so
                // the primary action is always reachable without scrolling.
                "skeuo-card -mx-margin-mobile rounded-none px-margin-mobile py-md md:mx-0 md:rounded-xl md:px-md",
                "fixed inset-x-0 bottom-0 z-30 md:static",
              )}>
                <div className="flex flex-col gap-sm md:flex-row-reverse">
                  <Button
                    onClick={attemptOpenConfirm}
                    disabled={!canSubmit}
                    aria-disabled={!canSubmit}
                    aria-describedby="accept-disabled-hint"
                    fullWidth
                    leadingIcon="check"
                  >
                    Accept Offer
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/claims/${encodeURIComponent(claimId)}`)}
                    fullWidth
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
                {!canSubmit && (
                  <p id="accept-disabled-hint" className="mt-1.5 text-center font-body text-label text-on-surface-variant md:text-left">
                    {!termsRead
                      ? "Scroll through the terms to enable this button."
                      : !agreed
                        ? "Tick the agreement box to enable this button."
                        : !signature.isValid
                          ? "Provide your signature to enable this button."
                          : ""}
                  </p>
                )}
              </div>
            </div>

            <OfferConfirmationModal
              open={confirmOpen}
              offer={offer}
              signature={signature}
              submitting={submitting}
              onConfirm={submit}
              onCancel={() => { if (!submitting) setConfirmOpen(false); }}
            />

            {submitting && (
              <div
                aria-live="assertive"
                role="status"
                className="fixed inset-0 z-[90] grid place-items-center bg-on-surface/40 backdrop-blur-sm"
              >
                <div className="skeuo-card rounded-xl p-lg text-center">
                  <Icon name="progress_activity" size={48} className="animate-spin text-primary" />
                  <p className="mt-sm font-body text-body-lg text-on-surface">Submitting your acceptance...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
}

function AgreementCheckbox({
  fullName,
  agreed,
  onChange,
  disabled,
}: {
  fullName: string;
  agreed: boolean;
  onChange: (next: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div
      className={cn(
        "skeuo-card rounded-xl p-md transition-colors",
        agreed && !disabled && "border border-primary/60",
      )}
    >
      <label
        className={cn(
          "flex cursor-pointer items-start gap-sm",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-disabled={disabled}
          aria-describedby="agreement-label"
          className="mt-1 h-6 w-6 flex-none accent-primary"
        />
        <span id="agreement-label" className="font-body text-body-md text-on-surface">
          I, <span className="font-semibold">{fullName}</span>, have read and agree to the above Terms of Acceptance. I understand that this acceptance is final and cannot be withdrawn.
        </span>
      </label>
      {disabled && (
        <p className="mt-2 flex items-center gap-1.5 font-body text-label text-on-surface-variant">
          <Icon name="info" size={16} />
          Please read the full terms above before agreeing.
        </p>
      )}
    </div>
  );
}
