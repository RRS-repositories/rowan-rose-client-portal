import { useMockQuery } from "@/data/useMockQuery";
import { getClient } from "@/data/mock";
import { computeFee } from "@/data/financials";
import { gbp } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Right-column "at a glance" card on /profile. Surfaces metrics that *aren't*
 * already on Personal Details (which carries identity + raw claim counts +
 * member-since). Instead this card tells the achievement / activity story:
 * total + biggest net recovered, distinct lenders engaged, and how recently
 * something moved on a claim.
 */

const SETTLED_STATUSES = ["Client Paid", "Fee Deducted"] as const;

function formatLastActivity(ms: number): string {
  const days = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function ProgressAtGlance() {
  const { loading, data } = useMockQuery(getClient, "profile-progress");

  if (loading || !data) {
    return (
      <section className="skeuo-card rounded-xl p-md" aria-label="Your progress, loading">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-md h-10 w-40" />
        <div className="mt-md grid grid-cols-2 gap-sm">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </section>
    );
  }

  const settledNets = data.claims
    .filter((c) =>
      SETTLED_STATUSES.includes(c.internalStatus as (typeof SETTLED_STATUSES)[number]),
    )
    .map((c) => (c.financials?.gross ? computeFee(c.financials.gross).net : 0))
    .filter((n) => n > 0);

  const recovered = settledNets.reduce((a, b) => a + b, 0);
  const biggest = settledNets.length > 0 ? Math.max(...settledNets) : 0;
  const lendersCount = new Set(data.claims.map((c) => c.lender.name)).size;

  const latestTimelineMs = data.claims
    .flatMap((c) => c.timeline.map((t) => new Date(t.date).getTime()))
    .filter((ms) => Number.isFinite(ms))
    .reduce((max, ms) => (ms > max ? ms : max), 0);

  return (
    <section aria-labelledby="progress-title" className="skeuo-card rounded-xl p-md">
      <div className="flex items-center gap-sm">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-primary-container text-on-primary-container skeuo-inner-highlight"
        >
          <Icon name="insights" size={20} fill />
        </span>
        <h2 id="progress-title" className="font-headline-md text-headline-md text-on-surface">
          Your Progress
        </h2>
      </div>

      <div className="mt-md">
        <p
          className="font-display-lg-mobile text-display-lg-mobile font-bold tabular-nums text-primary"
          aria-label={`${gbp(recovered)} recovered for you`}
        >
          {gbp(recovered)}
        </p>
        <p className="mt-1 font-body text-body-md text-on-surface-variant">
          {recovered > 0
            ? `Recovered for you so far${settledNets.length > 1 ? ` across ${settledNets.length} settled claims` : ""}.`
            : "We'll show your total here once a claim settles."}
        </p>
      </div>

      <dl className="mt-md grid grid-cols-2 gap-sm">
        <div className="rounded-lg bg-surface-container-lowest p-sm skeuo-inner-highlight">
          <dt className="flex items-center gap-1 font-body text-label font-normal text-on-surface-variant">
            <Icon name="emoji_events" size={14} className="flex-none" />
            Biggest win
          </dt>
          <dd className="mt-1 font-display text-headline-md font-bold tabular-nums text-on-surface">
            {biggest > 0 ? gbp(biggest) : "—"}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-container-lowest p-sm skeuo-inner-highlight">
          <dt className="flex items-center gap-1 font-body text-label font-normal text-on-surface-variant">
            <Icon name="account_balance" size={14} className="flex-none" />
            Lenders engaged
          </dt>
          <dd className="mt-1 font-display text-headline-md font-bold tabular-nums text-on-surface">
            {lendersCount}
          </dd>
        </div>
      </dl>

      {latestTimelineMs > 0 && (
        <p className="mt-md flex items-center gap-1.5 font-body text-label font-normal text-on-surface-variant">
          <Icon name="bolt" size={14} className="flex-none text-primary" />
          Last activity {formatLastActivity(latestTimelineMs)}
        </p>
      )}
    </section>
  );
}
