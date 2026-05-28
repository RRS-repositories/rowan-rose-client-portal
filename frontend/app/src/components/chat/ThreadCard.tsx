import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { relativeDays } from "@/lib/format";
import type { MessageThread } from "@/data/types";
import type { Claim } from "@/data/types";

interface Props {
  thread: MessageThread;
  /** The full claim — for the lender icon and brand. The selector knows it. */
  claim: Claim;
  isActive: boolean;
  onClick: () => void;
}

/** Trim a preview to ~60 characters with ellipsis on overflow. */
function previewOf(messages: MessageThread["messages"]): string {
  const last = messages[messages.length - 1];
  if (!last) return "";
  const prefix = last.sender === "client" ? "You: " : "";
  const text = (prefix + last.content).replace(/\s+/g, " ").trim();
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

/** A single row in the thread selector — lender header, last-message preview,
 *  relative timestamp, unread pill. Active state lifts via skeuo-raise on a
 *  brand-primary tinted background; the left edge is a 3px brand bar. */
export function ThreadCard({ thread, claim, isActive, onClick }: Props) {
  const empty = thread.messages.length === 0;
  const aria = empty
    ? `${claim.lender.name}, no messages yet`
    : thread.unreadCount > 0
    ? `${claim.lender.name}, ${thread.unreadCount} unread message${thread.unreadCount === 1 ? "" : "s"}`
    : `${claim.lender.name}, no unread messages`;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-label={aria}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-start gap-sm rounded-xl border-l-[3px] px-sm py-sm text-left transition-colors duration-150",
        isActive
          ? "border-primary bg-primary/10 skeuo-raise"
          : "border-transparent hover:bg-surface-container-low",
      )}
    >
      <span
        aria-hidden
        className="mt-0.5 grid h-10 w-10 flex-none place-items-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-primary skeuo-inner-highlight"
      >
        <Icon name={claim.lender.icon} size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-sm">
          <h3
            className={cn(
              "min-w-0 flex-1 truncate font-button text-button text-on-surface",
              (isActive || thread.unreadCount > 0) && "font-bold",
            )}
          >
            {claim.lender.name}
          </h3>
          {!empty && thread.lastMessageAt && (
            <span className="flex-none font-body text-label text-on-surface-variant">
              {relativeDays(thread.lastMessageAt)}
            </span>
          )}
        </div>
        <p className="truncate font-mono text-label text-on-surface-variant">{claim.id}</p>
        {empty ? (
          <p className="mt-0.5 truncate font-body text-label italic text-on-surface-variant">
            No messages yet
          </p>
        ) : (
          <p
            className={cn(
              "mt-0.5 truncate font-body text-label",
              thread.unreadCount > 0 ? "font-semibold text-on-surface" : "text-on-surface-variant",
            )}
          >
            {previewOf(thread.messages)}
          </p>
        )}
      </div>

      {thread.unreadCount > 0 && (
        <span
          aria-hidden
          className="badge-3d ml-1 mt-1 grid h-6 min-w-[24px] flex-none place-items-center rounded-full px-1.5 font-button text-label-caps font-bold text-on-error-container"
        >
          {thread.unreadCount}
        </span>
      )}
    </button>
  );
}
