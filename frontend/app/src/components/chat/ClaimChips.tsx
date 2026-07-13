import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { Claim, MessageThread } from "@/data/types";

interface Props {
  threads: MessageThread[] | null;
  claims: Claim[];
  clientFirstName: string;
  onSelect: (claimId: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** Sort order: unread desc → most-recent-last-message desc → empty threads last. */
function sortThreads(threads: MessageThread[]): MessageThread[] {
  return [...threads].sort((a, b) => {
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.claimId.localeCompare(b.claimId);
  });
}

/**
 * The in-chat claim picker (Option A — WhatsApp/bank-portal style). Shown inside
 * the single chat screen when no claim is open: a friendly prompt from the team
 * followed by the client's claims as large quick-reply chips. Tapping one opens
 * that claim's conversation in the same screen — there is no separate list view.
 */
export function ClaimChips({ threads, claims, clientFirstName, onSelect, loading, error, onRetry }: Props) {
  const sorted = useMemo(() => (threads ? sortThreads(threads) : []), [threads]);
  const claimById = useMemo(() => {
    const map = new Map<string, Claim>();
    for (const c of claims) map.set(c.id, c);
    return map;
  }, [claims]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-md md:p-lg">
      <div className="mx-auto w-full max-w-2xl">
        {/* Prompt — framed as a message from the team so the picker reads as the
            opening turn of the conversation rather than a settings list. */}
        <div className="flex items-start gap-sm">
          <span
            aria-hidden
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-secondary-container text-on-secondary-container skeuo-inner-highlight"
          >
            <Icon name="support_agent" size={22} fill />
          </span>
          <div className="min-w-0 rounded-2xl rounded-tl-sm bg-surface-container-high px-md py-sm">
            <h2 className="font-headline-md text-button font-bold text-on-surface">
              {clientFirstName ? `Hi ${clientFirstName} — which claim would you like to discuss today?` : "Which claim would you like to discuss today?"}
            </h2>
            <p className="mt-0.5 font-body text-body-md text-on-surface-variant">
              Tap a claim below to open its messages. You can switch claim any time.
            </p>
          </div>
        </div>

        <div className="mt-md">
          {loading ? (
            <div aria-busy="true" aria-label="Loading your claims" className="grid gap-sm grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))]">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-[60px] w-full rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon="error"
              title="Couldn't load your claims"
              description="Please try again — if the problem continues, contact us at contact@rowanrose.co.uk."
              action={<Button variant="primary" leadingIcon="refresh" onClick={onRetry}>Try Again</Button>}
            />
          ) : sorted.length === 0 ? (
            <p className="font-body text-body-md text-on-surface-variant">You don't have any claims to message about yet.</p>
          ) : (
            <div role="group" aria-label="Choose a claim to discuss" className="grid gap-sm grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))]">
              {sorted.map((thread) => {
                const claim = claimById.get(thread.claimId);
                if (!claim) return null;
                const unread = thread.unreadCount;
                const aria =
                  unread > 0
                    ? `${claim.lender.name}, claim ${claim.id}, ${unread} unread message${unread === 1 ? "" : "s"}`
                    : `${claim.lender.name}, claim ${claim.id}`;
                return (
                  <button
                    key={thread.claimId}
                    type="button"
                    aria-label={aria}
                    onClick={() => onSelect(thread.claimId)}
                    className="group relative flex min-h-[60px] w-full items-center gap-sm rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-sm py-sm pr-md text-left skeuo-raise skeuo-press transition-colors hover:bg-surface-container-high"
                  >
                    <span
                      aria-hidden
                      className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-primary skeuo-inner-highlight"
                    >
                      <Icon name={claim.lender.icon} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate font-button text-button text-on-surface", unread > 0 && "font-bold")}>
                        {claim.lender.name}
                      </span>
                      <span className="block truncate font-mono text-label text-on-surface-variant">{claim.id}</span>
                    </span>
                    {unread > 0 && (
                      <span
                        aria-hidden
                        className="badge-3d ml-auto grid h-6 min-w-[24px] flex-none place-items-center rounded-full px-1.5 font-button text-label-caps font-bold text-on-error-container"
                      >
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
