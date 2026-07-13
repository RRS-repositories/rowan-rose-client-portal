import { Page } from "@/components/layout/Page";
import { Container } from "@/components/layout/AppShell";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { ClaimSummaryCard } from "@/components/dashboard/ClaimSummaryCard";
import { SkeletonClaimCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LegalFooter } from "./Dashboard";
import { useMockQuery } from "@/data/useMockQuery";
import { getClient } from "@/data/mock";

export default function Claims() {
  const { loading, data } = useMockQuery(getClient, "client");
  const claims = data?.claims ?? [];

  return (
    <Page label="Your claims">
      <MobileHeader variant="title" title="Your Claims" />
      <Container>
        <h1 className="mb-md hidden font-display-lg-mobile text-display-lg text-on-surface md:block">Your Claims</h1>

        {loading || !data ? (
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3"><SkeletonClaimCard /><SkeletonClaimCard /><SkeletonClaimCard /></div>
        ) : claims.length === 0 ? (
          <EmptyState icon="account_balance_wallet" title="No claims yet" description="When we open a claim for you, it'll appear here with its progress and updates." />
        ) : (
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
            {claims.map((claim) => <ClaimSummaryCard key={claim.id} claim={claim} showProgress />)}
          </div>
        )}

        <LegalFooter />
      </Container>
    </Page>
  );
}
