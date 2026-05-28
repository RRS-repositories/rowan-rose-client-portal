import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { Container } from "@/components/layout/AppShell";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { WhatWeNeedCard } from "@/components/dashboard/WhatWeNeedCard";
import { ClaimSummaryCard } from "@/components/dashboard/ClaimSummaryCard";
import { OfferBanner } from "@/components/dashboard/OfferBanner";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Skeleton, SkeletonClaimCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useMockQuery } from "@/data/useMockQuery";
import { getClient } from "@/data/mock";
import { phaseOf } from "@/data/statusMap";
import { computeFee } from "@/data/financials";
import { gbp, formatDate, formatUKDateFull } from "@/lib/format";
import { listContainer, listItem } from "@/lib/motion";
import type { Claim, Client } from "@/data/types";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const lastUpdated = (c: Claim): string => c.timeline[0]?.date ?? c.openedOn;

/** Offers first (highest priority for the client), then most-recently updated. */
function sortClaims(claims: Claim[]): Claim[] {
  return [...claims].sort((a, b) => {
    const ao = phaseOf(a) === "Offer Received" ? 0 : 1;
    const bo = phaseOf(b) === "Offer Received" ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return +new Date(lastUpdated(b)) - +new Date(lastUpdated(a));
  });
}

function StatTile({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="skeuo-card flex items-center gap-md rounded-xl p-md">
      <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-primary-container text-on-primary-container skeuo-inner-highlight">
        <Icon name={icon} size={24} fill />
      </span>
      <div>
        <p className="font-display-lg-mobile text-[28px] font-bold leading-none tabular-nums text-on-surface">{value}</p>
        <p className="mt-1 font-body text-label font-normal text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}

function RecentUpdates({ client }: { client: Client }) {
  const recent = client.claims
    .flatMap((c) => c.timeline.map((t) => ({ claim: c, t })))
    .sort((a, b) => +new Date(b.t.date) - +new Date(a.t.date))
    .slice(0, 5);
  return (
    <section aria-label="Recent updates">
      <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">Recent updates</h2>
      <div className="skeuo-card divide-y divide-outline-variant/20 overflow-hidden rounded-xl">
        {recent.map(({ claim, t }) => (
          <Link key={`${claim.id}-${t.id}`} to={`/claims/${encodeURIComponent(claim.id)}`} className="flex items-start gap-md p-md transition-colors hover:bg-surface-container-low">
            <span className="mt-0.5 grid h-10 w-10 flex-none place-items-center rounded-full border border-outline-variant/30 bg-surface-container text-primary">
              <Icon name={t.icon} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-body-lg text-body-md text-on-surface">{t.text}</p>
              <p className="mt-0.5 font-body text-label font-normal text-on-surface-variant">{claim.lender.name} · {formatDate(t.date)}</p>
            </div>
            <Icon name="chevron_right" size={20} className="mt-2 flex-none text-on-surface-variant" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function HelpCard() {
  return (
    <div className="skeuo-card rounded-xl p-md">
      <div className="flex items-center gap-sm">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-secondary-container text-on-secondary-container skeuo-inner-highlight">
          <Icon name="support_agent" size={22} />
        </span>
        <h3 className="font-headline-md text-headline-md text-on-surface">Need a hand?</h3>
      </div>
      <p className="mt-sm font-body text-body-md text-on-surface-variant">Our team is here Monday to Friday. We'll never ask for your password or full bank details.</p>
      <div className="mt-md space-y-sm">
        <Link to="/faq" className="flex min-h-[48px] items-center gap-sm rounded-lg bg-surface-container-lowest px-3 font-button text-button text-on-surface skeuo-raise skeuo-press">
          <Icon name="help" size={20} className="text-primary" /> Browse help &amp; FAQs
        </Link>
        <a href="tel:01615050150" className="flex min-h-[48px] items-center gap-sm rounded-lg bg-surface-container-lowest px-3 font-button text-button text-on-surface skeuo-raise skeuo-press">
          <Icon name="call" size={20} className="text-primary" /> 0161 505 0150
        </a>
        <a href="mailto:contact@rowanrose.co.uk" className="flex min-h-[48px] items-center gap-sm rounded-lg bg-surface-container-lowest px-3 font-button text-button text-on-surface skeuo-raise skeuo-press">
          <Icon name="mail" size={20} className="text-primary" /> contact@rowanrose.co.uk
        </a>
      </div>
    </div>
  );
}

/** Error surface — plain English, no codes (UX Rule #6). Focus lands on Retry. */
function DashboardError({ onRetry }: { onRetry: () => void }) {
  const retryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { retryRef.current?.focus(); }, []);
  return (
    <EmptyState
      icon="error"
      title="Something went wrong"
      description="We couldn't load your dashboard. Please try again — if the problem continues, contact us at contact@rowanrose.co.uk."
      action={<Button ref={retryRef} variant="primary" leadingIcon="refresh" onClick={onRetry}>Try Again</Button>}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-md" aria-busy="true" aria-label="Loading your dashboard">
      <Skeleton className="hidden h-12 w-80 md:block" />
      <div className="hidden gap-gutter md:grid md:grid-cols-3"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
      <Skeleton className="h-72 w-full rounded-[24px]" />
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2"><SkeletonClaimCard /><SkeletonClaimCard /></div>
    </div>
  );
}

export default function Dashboard() {
  const { loading, data, error, refetch } = useMockQuery(getClient, "client");
  const reduce = useReducedMotion();
  const { state: auth } = useAuth();
  const firstName = auth.user?.firstName ?? "";

  const outstanding = data?.requirements.filter((r) => !r.done) ?? [];
  const sorted = sortClaims(data?.claims ?? []);
  const offerClaims = sorted.filter((c) => phaseOf(c) === "Offer Received");
  const recovered = data
    ? data.claims.reduce((s, c) => (["Client Paid", "Fee Deducted"].includes(c.internalStatus) && c.financials?.gross ? s + computeFee(c.financials.gross).net : s), 0)
    : 0;

  return (
    <Page label="Dashboard">
      <MobileHeader variant="greeting" greeting={`${greeting()}${firstName ? `, ${firstName}` : ""}`} subtitle={formatUKDateFull()} />
      <Container>
        {error ? (
          <DashboardError onRetry={refetch} />
        ) : loading || !data ? (
          <DashboardSkeleton />
        ) : data.claims.length === 0 ? (
          <EmptyState
            icon="folder_open"
            title="No claims yet"
            description="You don't have any active claims at the moment. If you think this is wrong, please get in touch and we'll help."
            action={
              <a href="mailto:contact@rowanrose.co.uk" className="inline-flex min-h-[48px] items-center gap-xs rounded-lg bg-primary px-md font-button text-button text-on-primary skeuo-raise skeuo-press">
                <Icon name="mail" size={20} /> Get in touch
              </a>
            }
          />
        ) : (
          <>
            {/* ===== MOBILE ===== */}
            <div className="space-y-md md:hidden">
              <WhatWeNeedCard requirements={outstanding} />
              {offerClaims.map((c) => <OfferBanner key={c.id} claim={c} />)}
              <QuickActions />
              <h2 className="font-headline-md text-headline-md text-on-surface">Your Active Claims</h2>
              <div className="grid grid-cols-1 gap-gutter">
                {sorted.map((claim) => <ClaimSummaryCard key={claim.id} claim={claim} />)}
              </div>
            </div>

            {/* ===== DESKTOP (rich dashboard) ===== */}
            <div className="hidden md:block">
              <header className="mb-md">
                <h1 className="font-display-lg-mobile text-display-lg text-on-surface">{greeting()}{firstName ? `, ${firstName}` : ""}.</h1>
                <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">{formatUKDateFull()}</p>
                <p className="mt-0.5 font-body text-body-md text-on-surface-variant">
                  Client {data.id} · {data.claims.length} claims · {outstanding.length} {outstanding.length === 1 ? "item" : "items"} to send us
                </p>
              </header>

              <motion.div variants={reduce ? undefined : listContainer} initial={reduce ? undefined : "hidden"} animate={reduce ? undefined : "show"} className="mb-gutter grid grid-cols-3 gap-gutter">
                <motion.div variants={reduce ? undefined : listItem}><StatTile icon="account_balance_wallet" value={String(data.claims.length)} label="Claims with us" /></motion.div>
                <motion.div variants={reduce ? undefined : listItem}><StatTile icon="assignment_late" value={String(outstanding.length)} label="Items to send us" /></motion.div>
                <motion.div variants={reduce ? undefined : listItem}><StatTile icon="payments" value={gbp(recovered)} label="Recovered for you so far" /></motion.div>
              </motion.div>

              {offerClaims.length > 0 && (
                <div className="mb-gutter space-y-md">
                  {offerClaims.map((c) => <OfferBanner key={c.id} claim={c} />)}
                </div>
              )}

              <div className="grid grid-cols-12 gap-gutter">
                <div className="col-span-8 space-y-md">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Your Active Claims</h2>
                  <div className="grid grid-cols-1 gap-gutter xl:grid-cols-2">
                    {sorted.map((claim) => <ClaimSummaryCard key={claim.id} claim={claim} />)}
                  </div>
                  <QuickActions />
                  <RecentUpdates client={data} />
                </div>
                <div className="col-span-4 space-y-md">
                  <WhatWeNeedCard requirements={outstanding} />
                  <HelpCard />
                </div>
              </div>
            </div>
          </>
        )}

        <LegalFooter />
      </Container>
    </Page>
  );
}

export function LegalFooter() {
  return (
    <footer className="mt-lg border-t border-outline-variant/30 pt-md font-body text-label font-normal leading-relaxed text-on-surface-variant">
      <p className="font-semibold">Rowan Rose Solicitors trading as Fast Action Claims</p>
      <p>Rowan Rose Ltd (12916452) · SRA 8000843</p>
      <p>City Point, 701 Chester Road, Stretford, Manchester, M32 0RW</p>
      <p>contact@rowanrose.co.uk · 0161 505 0150</p>
    </footer>
  );
}
