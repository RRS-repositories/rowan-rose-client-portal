import { useMemo } from "react";
import { ThreadCard } from "./ThreadCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { Claim, MessageThread } from "@/data/types";

interface Props {
  threads: MessageThread[] | null;
  claims: Claim[];
  activeClaimId: string | null;
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

/** Left-side conversation list. role="tablist"; cards are role="tab". */
export function ThreadSelector({ threads, claims, activeClaimId, onSelect, loading, error, onRetry }: Props) {
  const sorted = useMemo(() => (threads ? sortThreads(threads) : []), [threads]);
  const claimById = useMemo(() => {
    const map = new Map<string, Claim>();
    for (const c of claims) map.set(c.id, c);
    return map;
  }, [claims]);

  return (
    <aside
      aria-label="Message threads"
      className="flex h-full min-h-0 flex-col rounded-2xl bg-surface-container-lowest skeuo-recessed md:bg-surface-container-low"
    >
      <header className="hidden border-b border-outline-variant/30 px-md py-sm md:block">
        <h2 className="font-headline-md text-button font-bold text-on-surface">Conversations</h2>
        <p className="font-body text-label text-on-surface-variant">One thread per claim.</p>
      </header>

      <div role="tablist" aria-label="Claims" className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div aria-busy="true" aria-label="Loading conversations" className="space-y-sm">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon="error"
            title="Couldn't load conversations"
            description="Please try again — if the problem continues, contact us at contact@rowanrose.co.uk."
            action={<Button variant="primary" leadingIcon="refresh" onClick={onRetry}>Try Again</Button>}
          />
        ) : sorted.length === 0 ? (
          <p className="px-md py-md font-body text-body-md text-on-surface-variant">No claims yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {sorted.map((thread) => {
              const claim = claimById.get(thread.claimId);
              if (!claim) return null;
              return (
                <li key={thread.claimId}>
                  <ThreadCard
                    thread={thread}
                    claim={claim}
                    isActive={activeClaimId === thread.claimId}
                    onClick={() => onSelect(thread.claimId)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
