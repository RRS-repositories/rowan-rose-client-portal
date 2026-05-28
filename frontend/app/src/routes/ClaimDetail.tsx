import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/useToast";
import { PhaseProgressTracker } from "@/components/claim/PhaseProgressTracker";
import { WhatHappensNext } from "@/components/claim/WhatHappensNext";
import { Timeline } from "@/components/claim/Timeline";
import { FinancialSummary } from "@/components/claim/FinancialSummary";
import { OfferBanner } from "@/components/claim/OfferBanner";
import { OfferRejectionModal } from "@/components/claim/OfferRejectionModal";
import { ActionItems } from "@/components/claim/ActionItems";
import { LegalFooter } from "./Dashboard";
import { useMockQuery } from "@/data/useMockQuery";
import { getClaim, getRequirements } from "@/data/mock";
import { getOfferDetails, rejectOffer, type OfferDetails } from "@/data/offers";
import { phaseOf, clientMessage } from "@/data/statusMap";
import { phaseIcon } from "@/data/phaseTracker";
import { formatDate } from "@/lib/format";
import type { Claim } from "@/data/types";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block font-label-caps text-label-caps uppercase text-on-surface-variant">{label}</span>
      <span className="mt-0.5 block font-body-lg text-body-md text-on-surface">{value}</span>
    </div>
  );
}

function ClaimDetailsCard({ claim }: { claim: Claim }) {
  return (
    <div className="skeuo-card rounded-xl p-md">
      <h3 className="mb-md border-b border-outline-variant/30 pb-sm font-headline-md text-headline-md text-on-surface">Claim Details</h3>
      <div className="flex flex-col gap-md">
        <DetailRow label="Lender" value={claim.lender.name} />
        <DetailRow label="Product" value={claim.lender.product} />
        <DetailRow label="Reference" value={claim.id} />
        <DetailRow label="Opened" value={formatDate(claim.openedOn)} />
      </div>
    </div>
  );
}

export default function ClaimDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const { loading, data: claim, refetch } = useMockQuery(() => getClaim(decodeURIComponent(id)), id);
  const { data: requirements } = useMockQuery(getRequirements, "requirements");

  // Offer details — fetched whenever a claim is in any offer-related state so
  // the banner can show amounts/dates without prop-drilling through ActionItems.
  const [offerDetails, setOfferDetails] = useState<OfferDetails | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!claim) return;
    const isOfferRelated = claim.internalStatus === "Offer Received" || claim.internalStatus === "Offer Accepted" || claim.internalStatus === "Offer Rejected";
    if (!isOfferRelated) {
      setOfferDetails(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await getOfferDetails(claim.id);
      if (!cancelled) setOfferDetails(res);
    })();
    return () => { cancelled = true; };
  }, [claim]);

  async function handleReject(reason: string) {
    if (!claim) return;
    setRejecting(true);
    const res = await rejectOffer(claim.id, reason);
    setRejecting(false);
    if (!res.success) {
      push({ title: "Couldn't reject offer", description: res.message, tone: "error" });
      return;
    }
    push({ title: "Offer rejected", description: "We will continue pursuing your claim.", tone: "success" });
    setRejectOpen(false);
    refetch();
  }

  return (
    <Page label="Claim detail">
      <MobileHeader variant="back" title="Claims Portal" />
      <div className="w-full px-margin-mobile py-md md:px-lg md:py-lg">
        <button onClick={() => navigate(-1)} aria-label="Back to dashboard" className="mb-md hidden min-h-[44px] items-center gap-1.5 font-button text-button text-primary hover:underline md:inline-flex">
          <Icon name="arrow_back" size={20} />
          Back to your claims
        </button>

        {loading ? (
          <div className="space-y-md">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : !claim ? (
          <EmptyState icon="search_off" title="We couldn't find that claim" description="The claim you're looking for isn't available. Please go back and choose a claim from your list." action={<Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button>} />
        ) : (
          (() => {
            const phase = phaseOf(claim);
            return (
              <div className="space-y-md">
                {/* Header */}
                <header>
                  <p className="hidden font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant md:block">Claim ref: {claim.id}</p>
                  <div className="flex items-start justify-between gap-sm">
                    <h1 className="font-display-lg-mobile text-display-lg-mobile tracking-tight text-primary md:text-display-lg">{claim.lender.name}</h1>
                    <span className="flex-none rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-1 font-label-caps text-label-caps text-on-surface-variant">{claim.lender.product}</span>
                  </div>
                  <p className="font-body-lg text-body-lg text-on-surface-variant md:hidden">Ref: {claim.id}</p>
                </header>

                {/* Status message — full width */}
                <section role="status" className="skeuo-card relative overflow-hidden rounded-xl p-md">
                  <div className="absolute left-0 top-0 h-full w-1 bg-inverse-primary" aria-hidden />
                  <div className="flex items-start gap-md">
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-primary-container text-on-primary-container skeuo-inner-highlight">
                      <Icon name={phaseIcon(phase)} size={24} fill />
                    </span>
                    <div>
                      <h2 className="mb-xs font-headline-md text-headline-md text-primary">{phase}</h2>
                      <p className="font-body-lg text-body-lg leading-relaxed text-on-surface">{clientMessage(claim)}</p>
                    </div>
                  </div>
                </section>

                {/* Tracker — full width (horizontal on desktop) */}
                <PhaseProgressTracker current={phase} escalated={claim.escalated} />

                {/* Main + sidebar */}
                <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
                  <div className="space-y-md lg:col-span-2">
                    {(claim.internalStatus === "Offer Received" || claim.internalStatus === "Offer Accepted" || claim.internalStatus === "Offer Rejected") && (
                      <OfferBanner claim={claim} offer={offerDetails} onReject={() => setRejectOpen(true)} />
                    )}
                    {requirements ? (
                      <ActionItems claim={claim} requirements={requirements} />
                    ) : (
                      <Skeleton className="h-28 w-full rounded-xl" />
                    )}
                    <WhatHappensNext phase={phase} />
                    <FinancialSummary claim={claim} />
                    <Timeline entries={claim.timeline} />
                    <div className="pt-xs lg:hidden">
                      <Button fullWidth leadingIcon="upload_file" onClick={() => navigate("/documents")}>Upload documents for this claim</Button>
                    </div>
                  </div>
                  <aside className="hidden space-y-md lg:col-span-1 lg:block">
                    <ClaimDetailsCard claim={claim} />
                    <Button fullWidth leadingIcon="upload_file" onClick={() => navigate("/documents")}>Upload documents</Button>
                    <Button fullWidth variant="secondary" leadingIcon="forum">Ask us a question</Button>
                  </aside>
                </div>

                <LegalFooter />
              </div>
            );
          })()
        )}
      </div>

      {claim && claim.internalStatus === "Offer Received" && (
        <OfferRejectionModal
          open={rejectOpen}
          offerAmount={claim.financials?.offer ?? 0}
          lenderName={claim.lender.name}
          submitting={rejecting}
          onConfirm={handleReject}
          onCancel={() => { if (!rejecting) setRejectOpen(false); }}
        />
      )}
    </Page>
  );
}
