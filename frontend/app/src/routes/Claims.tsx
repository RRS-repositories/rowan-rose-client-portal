import { useState } from "react";
import { Page } from "@/components/layout/Page";
import { Container } from "@/components/layout/AppShell";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { ClaimSummaryCard } from "@/components/dashboard/ClaimSummaryCard";
import { SkeletonClaimCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { LegalFooter } from "./Dashboard";
import { useMockQuery } from "@/data/useMockQuery";
import { getClient } from "@/data/mock";
import { phaseOf } from "@/data/statusMap";
import { gbp } from "@/lib/format";
import { computeFee } from "@/data/financials";
import type { Claim, ClaimPhase } from "@/data/types";

type Filter = "all" | "progress" | "offer" | "completed";

function bucket(phase: ClaimPhase): Exclude<Filter, "all"> {
  if (phase === "Offer Received") return "offer";
  if (phase === "Completed" || phase === "Closed" || phase === "Settlement") return "completed";
  return "progress";
}

export default function Claims() {
  const { loading, data } = useMockQuery(getClient, "client");
  const [filter, setFilter] = useState<Filter>("all");

  const claims = data?.claims ?? [];
  const counts = {
    all: claims.length,
    progress: claims.filter((c) => bucket(phaseOf(c)) === "progress").length,
    offer: claims.filter((c) => bucket(phaseOf(c)) === "offer").length,
    completed: claims.filter((c) => bucket(phaseOf(c)) === "completed").length,
  };
  const recovered = claims.reduce((s, c) => (["Client Paid", "Fee Deducted"].includes(c.internalStatus) && c.financials?.gross ? s + computeFee(c.financials.gross).net : s), 0);
  const filtered: Claim[] = filter === "all" ? claims : claims.filter((c) => bucket(phaseOf(c)) === filter);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "progress", label: "In progress" },
    { key: "offer", label: "Offer received" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <Page label="Your claims">
      <MobileHeader variant="title" title="Your Claims" />
      <Container>
        <header className="mb-md">
          <h1 className="hidden font-display-lg-mobile text-display-lg text-on-surface md:block">Your Claims</h1>
          {!loading && data && (
            <>
              <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
                {counts.all} {counts.all === 1 ? "claim" : "claims"} · {counts.progress} in progress · {counts.completed} completed · {gbp(recovered)} recovered
              </p>
              {(data.contactId != null || data.clientId) && (
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant/70">
                  {data.clientId ? `Client ID ${data.clientId}` : "No client ID assigned"} · CRM contact #{data.contactId ?? "—"}
                </p>
              )}
            </>
          )}
        </header>

        {!loading && data && (
          <div role="tablist" aria-label="Filter claims" className="skeuo-recessed mb-gutter flex gap-1 overflow-x-auto rounded-full bg-surface-container-low p-1">
            {tabs.map((t) => {
              const active = filter === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(t.key)}
                  className={cn(
                    "flex min-h-[44px] flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 font-button text-button transition-colors",
                    active ? "bg-primary text-on-primary focus-on-primary skeuo-raise" : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  {t.label}
                  <span className={cn("rounded-full px-1.5 text-label-caps font-bold", active ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-high text-on-surface-variant")}>
                    {counts[t.key]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {loading || !data ? (
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3"><SkeletonClaimCard /><SkeletonClaimCard /><SkeletonClaimCard /></div>
        ) : claims.length === 0 ? (
          <EmptyState icon="account_balance_wallet" title="No claims yet" description="When we open a claim for you, it'll appear here with its progress and updates." />
        ) : (
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((claim) => <ClaimSummaryCard key={claim.id} claim={claim} />)}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center font-body text-body-md text-on-surface-variant">No claims in this status right now.</p>
            )}
          </div>
        )}

        <LegalFooter />
      </Container>
    </Page>
  );
}
