import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { formatDateTime } from "@/lib/format";
import type { Message } from "@/data/types";

/** "James Taylor" → "JT". Falls back to the first letter if there's no surname. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

interface Props {
  message: Message;
  /** First message of a group (same sender, within 5 min) — render avatar + name. */
  isGroupStart: boolean;
  /** Last message of a group — render the timestamp underneath. */
  isGroupEnd: boolean;
  /** Optimistic / failure state for client-side messages. */
  status?: "sending" | "failed";
  /** Retry handler — only meaningful when status === "failed". */
  onRetry?: () => void;
}

export function MessageBubble({ message, isGroupStart, isGroupEnd, status, onRetry }: Props) {
  const isFirm = message.sender === "firm";
  const senderLine = `${message.senderName}${message.senderRole ? `, ${message.senderRole}` : ""}`;
  const ariaLabel = `${senderLine}, ${formatDateTime(message.timestamp)}`;

  return (
    <article
      aria-label={ariaLabel}
      className={cn("flex w-full items-start gap-sm", isFirm ? "justify-start" : "justify-end", !isGroupStart && "mt-[2px]")}
    >
      {isFirm && (
        <div className="w-9 flex-none">
          {isGroupStart && (
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-label-caps font-bold text-on-primary skeuo-inner-highlight"
            >
              {initialsOf(message.senderName)}
            </span>
          )}
        </div>
      )}

      <div className={cn("flex max-w-[75%] min-w-0 flex-col gap-1", !isFirm && "items-end")}>
        {isFirm && isGroupStart && (
          <p className="font-button text-label font-semibold text-on-surface">
            {message.senderName}
            {message.senderRole && (
              <span className="font-body font-normal text-on-surface-variant"> · {message.senderRole}</span>
            )}
          </p>
        )}

        <div
          className={cn(
            "rounded-2xl px-md py-sm font-body-lg text-body-md",
            isFirm
              ? "rounded-tl-md bg-surface-container text-on-surface skeuo-card"
              : "rounded-tr-md bg-primary text-on-primary skeuo-raise",
            status === "sending" && "opacity-60",
            status === "failed" && "ring-2 ring-error",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {status === "failed" && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            aria-label="Message failed to send. Tap to retry."
            className="flex items-center gap-1 font-body text-label font-semibold text-error underline-offset-2 hover:underline"
          >
            <Icon name="error" size={14} />
            Failed to send. Tap to retry.
          </button>
        ) : status === "sending" ? (
          <p
            className={cn(
              "flex items-center gap-1 font-body text-label text-on-surface-variant",
              !isFirm && "self-end",
            )}
          >
            <Icon name="progress_activity" size={12} className="animate-spin" /> Sending…
          </p>
        ) : (
          isGroupEnd && (
            <p className={cn("font-body text-label text-on-surface-variant", !isFirm && "text-right")}>
              {formatDateTime(message.timestamp)}
            </p>
          )
        )}
      </div>
    </article>
  );
}
