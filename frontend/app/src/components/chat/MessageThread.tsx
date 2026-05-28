import { forwardRef, useMemo } from "react";
import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { UnreadDivider } from "./UnreadDivider";
import type { Message } from "@/data/types";

/** Client-side message that's mid-send. Rendered after the persisted thread. */
export interface OptimisticMessage {
  tempId: string;
  content: string;
  timestamp: string;
  status: "sending" | "failed";
}

interface ThreadItem {
  kind: "message" | "date" | "unread";
  msg?: Message;
  iso?: string;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  status?: "sending" | "failed";
  tempId?: string;
}

const FIVE_MIN_MS = 5 * 60 * 1000;
const dayKey = (iso: string) => iso.slice(0, 10);

/** Builds the renderable item list: messages with group flags, date separators
 *  between days, and the unread divider above the first unread message. */
function buildItems(
  messages: Message[],
  optimistic: OptimisticMessage[],
  firstUnreadId: string | null,
  clientName: string,
): ThreadItem[] {
  const items: ThreadItem[] = [];
  let prevDay: string | null = null;
  let unreadInserted = false;

  // Persisted messages
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const prev = messages[i - 1];
    const next = messages[i + 1];

    if (dayKey(m.timestamp) !== prevDay) {
      items.push({ kind: "date", iso: m.timestamp });
      prevDay = dayKey(m.timestamp);
    }

    if (!unreadInserted && m.id === firstUnreadId) {
      items.push({ kind: "unread" });
      unreadInserted = true;
    }

    const t = new Date(m.timestamp).getTime();
    const sameAsPrev =
      !!prev && prev.sender === m.sender && prev.senderName === m.senderName &&
      dayKey(prev.timestamp) === dayKey(m.timestamp) &&
      t - new Date(prev.timestamp).getTime() < FIVE_MIN_MS;
    const sameAsNext =
      !!next && next.sender === m.sender && next.senderName === m.senderName &&
      dayKey(next.timestamp) === dayKey(m.timestamp) &&
      new Date(next.timestamp).getTime() - t < FIVE_MIN_MS;

    items.push({
      kind: "message",
      msg: m,
      isGroupStart: !sameAsPrev,
      isGroupEnd: !sameAsNext,
    });
  }

  // Optimistic messages — always their own group; insert today's date separator
  // if the persisted thread didn't already finish on today.
  if (optimistic.length > 0) {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (prevDay !== todayKey) {
      items.push({ kind: "date", iso: new Date().toISOString() });
    }
    for (const o of optimistic) {
      const placeholder: Message = {
        id: o.tempId,
        claimId: "",
        sender: "client",
        senderName: clientName,
        content: o.content,
        timestamp: o.timestamp,
        read: true,
      };
      items.push({
        kind: "message",
        msg: placeholder,
        isGroupStart: true,
        isGroupEnd: true,
        status: o.status,
        tempId: o.tempId,
      });
    }
  }

  return items;
}

interface Props {
  messages: Message[];
  optimistic: OptimisticMessage[];
  firstUnreadId: string | null;
  clientName: string;
  onRetry: (tempId: string) => void;
  /** Latest real or optimistic message id — drives the visually-hidden live region. */
  newestId: string | null;
  newestPreview: string;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
}

export const MessageThread = forwardRef<HTMLDivElement, Props>(function MessageThread(
  { messages, optimistic, firstUnreadId, clientName, onRetry, newestId, newestPreview, onScroll },
  ref,
) {
  const items = useMemo(
    () => buildItems(messages, optimistic, firstUnreadId, clientName),
    [messages, optimistic, firstUnreadId, clientName],
  );

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      role="log"
      aria-label="Conversation"
      className="relative flex-1 overflow-y-auto px-md py-md"
      tabIndex={-1}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {items.map((item, i) => {
          if (item.kind === "date") return <DateSeparator key={`d-${i}-${item.iso}`} iso={item.iso!} />;
          if (item.kind === "unread") return <UnreadDivider key={`u-${i}`} />;
          const m = item.msg!;
          return (
            <MessageBubble
              key={m.id}
              message={m}
              isGroupStart={!!item.isGroupStart}
              isGroupEnd={!!item.isGroupEnd}
              status={item.status}
              onRetry={item.tempId ? () => onRetry(item.tempId!) : undefined}
            />
          );
        })}
      </div>

      {/* Live region: announces only the newest message, never the whole log,
          so screen readers don't repeat themselves on unrelated re-renders. */}
      <p key={newestId ?? "empty"} aria-live="polite" aria-atomic="true" className="sr-only">
        {newestPreview}
      </p>
    </div>
  );
});
