import { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  /** id(s) of extra descriptions to associate (e.g. a requirements list). */
  describedById?: string;
}

/** Password input mirroring the Input visual language, with a show/hide toggle.
 *  Kept separate from Input so the Phase 1.1 component stays untouched. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, error, describedById, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [show, setShow] = useState(false);
  const describedBy = [error ? `${inputId}-err` : null, describedById].filter(Boolean).join(" ") || undefined;

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block font-body text-label font-semibold text-on-surface">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={show ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "skeuo-recessed min-h-[48px] w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-4 pr-14 font-body text-body-md text-on-surface placeholder:text-on-surface-variant/70",
            error && "border-error",
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name={show ? "visibility_off" : "visibility"} size={20} />
        </button>
      </div>
      {error && (
        <p id={`${inputId}-err`} className="mt-1.5 flex items-center gap-1 font-body text-label text-error">
          <Icon name="error" size={16} fill />
          {error}
        </p>
      )}
    </div>
  );
});
