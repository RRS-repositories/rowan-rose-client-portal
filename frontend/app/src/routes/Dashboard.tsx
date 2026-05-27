import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { Container } from "@/components/layout/AppShell";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { WhatWeNeedCard } from "@/components/dashboard/WhatWeNeedCard";
import { ClaimSummaryCard } from "@/components/dashboard/ClaimSummaryCard";
import { Skeleton, SkeletonClaimCard } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import { useMockQuery } from "@/data/useMockQuery";
import { getClient } from "@/data/mock";
import { computeFee } from "@/data/financials";
import { gbp, formatDate } from "@/lib/format";
import { listContainer, listItem } from "@/lib/motion";
import type { Client } from "@/data/types";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
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

export default function Dashboard() {
  const { loading, data } = useMockQuery(getClient, "client");
  const reduce = useReducedMotion();
  const firstName = data?.firstName ?? "";
  const outstanding = data?.requirements.filter((r) => !r.done) ?? [];
  const recovered = data
    ? data.claims.reduce((s, c) => (["Client Paid", "Fee Deducted"].includes(c.internalStatus) && c.financials?.gross ? s + computeFee(c.financials.gross).net : s), 0)
    : 0;

  return (
    <Page label="Dashboard">
      <MobileHeader variant="greeting" greeting={`${greeting()}${firstName ? `, ${firstName}` : ""}`} subtitle="Claims Portal" />
      <Container>
        {loading || !data ? (
          <div className="space-y-md">
            <Skeleton className="hidden h-12 w-80 md:block" />
            <div className="hidden gap-gutter md:grid md:grid-cols-3"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
            <Skeleton className="h-72 w-full rounded-[24px]" />
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2"><SkeletonClaimCard /><SkeletonClaimCard /></div>
          </div>
        ) : (
          <>
            {/* ===== MOBILE (unchanged) ===== */}
            <div className="space-y-md md:hidden">
              <WhatWeNeedCard requirements={outstanding} />
              <h2 className="font-headline-md text-headline-md text-on-surface">Your Active Claims</h2>
              <div className="grid grid-cols-1 gap-gutter">
                {data.claims.map((claim) => <ClaimSummaryCard key={claim.id} claim={claim} />)}
              </div>
            </div>

            {/* ===== DESKTOP (rich dashboard) ===== */}
            <div className="hidden md:block">
              <header className="mb-md">
                <h1 className="font-display-lg-mobile text-display-lg text-on-surface">{greeting()}{firstName ? `, ${firstName}` : ""}.</h1>
                <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
                  Client {data.id} · {data.claims.length} claims · {outstanding.length} {outstanding.length === 1 ? "item" : "items"} to send us
                </p>
              </header>

              <motion.div variants={reduce ? undefined : listContainer} initial={reduce ? undefined : "hidden"} animate={reduce ? undefined : "show"} className="mb-gutter grid grid-cols-3 gap-gutter">
                <motion.div variants={reduce ? undefined : listItem}><StatTile icon="account_balance_wallet" value={String(data.claims.length)} label="Claims with us" /></motion.div>
                <motion.div variants={reduce ? undefined : listItem}><StatTile icon="assignment_late" value={String(outstanding.length)} label="Items to send us" /></motion.div>
                <motion.div variants={reduce ? undefined : listItem}><StatTile icon="payments" value={gbp(recovered)} label="Recovered for you so far" /></motion.div>
              </motion.div>

              <div className="grid grid-cols-12 gap-gutter">
                <div className="col-span-8 space-y-md">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Your Active Claims</h2>
                  <div className="grid grid-cols-1 gap-gutter xl:grid-cols-2">
                    {data.claims.map((claim) => <ClaimSummaryCard key={claim.id} claim={claim} />)}
                  </div>
                  <RecentUpdates client={data} />
                </div>
                <div className="col-span-4 space-y-md">
                  <div className="sticky top-24 space-y-md">
                    <WhatWeNeedCard requirements={outstanding} />
                    <HelpCard />
                  </div>
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
