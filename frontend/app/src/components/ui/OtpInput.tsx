import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
}

/** Segmented one-time-code input — large boxes for older users (brief §2).
 *  Auto-advances on entry, backspace steps back, and a pasted code is spread
 *  across the boxes. Each box is individually labelled for screen readers. */
export function OtpInput({ value, onChange, length = 6, error, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const commit = (next: string[]) => onChange(next.join("").slice(0, length));

  const handleChange = (i: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    const next = digits.slice();
    if (!cleaned) {
      next[i] = "";
      commit(next);
      return;
    }
    next[i] = cleaned[cleaned.length - 1];
    commit(next);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = digits.slice();
      if (digits[i]) {
        next[i] = "";
        commit(next);
      } else if (i > 0) {
        next[i - 1] = "";
        commit(next);
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.currentTarget.select()}
          // Cap at 48px on roomy screens, shrink to fit on narrow ones (no overflow).
          className={cn(
            "skeuo-recessed h-14 min-w-0 flex-1 rounded-lg border-2 bg-surface-container-lowest text-center font-display text-[24px] font-bold text-on-surface caret-primary transition-colors focus:border-primary sm:max-w-[3rem]",
            error ? "border-error" : d ? "border-primary" : "border-outline-variant",
            disabled && "cursor-not-allowed opacity-50",
          )}
        />
      ))}
    </div>
  );
}
