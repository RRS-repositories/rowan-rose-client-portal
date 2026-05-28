import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { useIsDesktop } from "@/hooks/useMediaQuery";

const MAX_CHARS = 2000;
const COUNTER_AT = 1500;
const WARN_AT = 1800;

interface Props {
  onSend: (content: string) => void | Promise<void>;
  disabled?: boolean;
  isSending: boolean;
  /** Brief sub-label shown above the input — e.g. lender name. */
  placeholder?: string;
}

/** Bottom-of-chat composer. Auto-grows up to ~5 rows, hard-caps input at 2000
 *  characters, shows a counter from 1500+ that turns amber at 1800 and red at
 *  the cap. Desktop Enter sends; Shift+Enter inserts a newline; mobile Enter
 *  inserts a newline (the touch keyboard's Enter must not double as Send). */
export function ReplyComposer({ onSend, disabled = false, isSending, placeholder = "Type your message…" }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const counterId = useId();
  const isDesktop = useIsDesktop();

  // Auto-grow: reset to auto so the scrollHeight reflects the new content,
  // then set the height to the clamped value. Runs synchronously before paint
  // so the reflow isn't visible.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 5 * 24 + 24; // ~5 rows of 24px + padding
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [value]);

  // After the input clears on send, the textarea height needs to shrink back.
  // useLayoutEffect handles that since the value-clear is a dependency.
  const trimmed = value.trim();
  const canSend = !disabled && !isSending && trimmed.length > 0;

  const submit = useCallback(async () => {
    if (!canSend) return;
    const content = trimmed;
    await onSend(content);
    setValue("");
  }, [canSend, trimmed, onSend]);

  // Keep focus on the input across sends (better keyboard UX).
  useEffect(() => {
    if (!isSending) ref.current?.focus({ preventScroll: true });
  }, [isSending]);

  const counterColor =
    value.length >= MAX_CHARS ? "text-error"
    : value.length >= WARN_AT ? "text-tertiary-fixed-dim"
    : "text-on-surface-variant";

  return (
    <form
      className="border-t border-outline-variant/30 bg-surface-container-low px-md py-sm"
      onSubmit={(e) => { e.preventDefault(); void submit(); }}
    >
      <div className="flex items-end gap-sm">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && isDesktop) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={placeholder}
          aria-label="Type your message"
          aria-describedby={value.length >= COUNTER_AT ? counterId : undefined}
          disabled={disabled}
          maxLength={MAX_CHARS}
          rows={1}
          className={cn(
            "block min-h-[48px] w-full resize-none rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 font-body-lg text-body-md text-on-surface placeholder:text-on-surface-variant",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
            "skeuo-recessed",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={isSending ? "Sending message" : "Send message"}
          aria-busy={isSending || undefined}
          className={cn(
            "grid h-12 w-12 flex-none place-items-center rounded-full bg-primary text-on-primary transition-opacity skeuo-raise skeuo-primary-glow skeuo-press",
            "focus:outline-none focus:ring-2 focus:ring-primary/40",
            (!canSend) && "cursor-not-allowed opacity-50",
          )}
        >
          {isSending ? (
            <Icon name="progress_activity" size={22} className="animate-spin" />
          ) : (
            <Icon name="send" size={20} fill />
          )}
        </button>
      </div>
      {value.length >= COUNTER_AT && (
        <p
          id={counterId}
          aria-live="polite"
          className={cn("mt-1 text-right font-body text-label", counterColor)}
        >
          {value.length}/{MAX_CHARS}
        </p>
      )}
      {!isDesktop && (
        <p className="mt-1 font-body text-label text-on-surface-variant md:hidden">
          Tap the send button to send.
        </p>
      )}
    </form>
  );
}
