import { useId } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface ToggleSwitchProps {
  /** Visible label (also used as the switch's accessible name). */
  label: string;
  /** Optional helper text rendered below the label. */
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  saving?: boolean;
  /** When true, shows a brief "Saved" indicator next to the switch.
   *  Parent clears this prop after ~2s so the indicator fades out. */
  saved?: boolean;
  className?: string;
}

/**
 * Reusable switch (Phase 5.1, Task 8). 44×24 pill track, 20px thumb. The whole
 * row is one `<button role="switch">` so clicking the label, description, or
 * track all toggle. Accessible name = `aria-label`; description is exposed via
 * `aria-describedby`. Honours reduced motion via Tailwind's `motion-reduce:`.
 */
export function ToggleSwitch({
  label, description, checked, onChange, disabled, saving, saved, className,
}: ToggleSwitchProps) {
  const descId = useId();

  return (
    <div className={cn("flex items-center gap-sm", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={description ? descId : undefined}
        aria-busy={saving || undefined}
        disabled={disabled || saving}
        onClick={() => onChange(!checked)}
        className={cn(
          "group flex flex-1 items-start gap-md rounded-lg py-xs text-left",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          (disabled || saving) && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-button text-button text-on-surface">{label}</span>
          {description && (
            <span id={descId} className="mt-0.5 block font-body text-label font-normal text-on-surface-variant">
              {description}
            </span>
          )}
        </span>
        {/* Track */}
        <span
          aria-hidden="true"
          className={cn(
            "relative mt-0.5 inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-200 motion-reduce:transition-none",
            checked ? "bg-primary skeuo-primary-glow" : "bg-surface-container-highest skeuo-recessed",
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-on-primary shadow-md transition-transform duration-200 motion-reduce:transition-none",
              checked ? "translate-x-[22px]" : "translate-x-0.5",
            )}
          />
        </span>
      </button>
      {/* Save status — lives outside the button so its content doesn't pollute
          the accessible name. aria-live announces "Saved" to screen readers. */}
      <span aria-live="polite" className="flex w-16 flex-none items-center justify-end">
        {saving && (
          <span className="flex items-center gap-1 font-body text-label text-on-surface-variant">
            <Icon name="progress_activity" size={14} className="animate-spin" />
          </span>
        )}
        {!saving && saved && (
          <span className="flex items-center gap-0.5 font-body text-label text-primary">
            <Icon name="check" size={14} fill />
            Saved
          </span>
        )}
      </span>
    </div>
  );
}
