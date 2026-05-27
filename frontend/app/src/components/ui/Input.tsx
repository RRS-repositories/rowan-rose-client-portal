import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block font-body text-label font-semibold text-on-surface">{label}</label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "skeuo-recessed min-h-[48px] w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-4 font-body text-body-md text-on-surface placeholder:text-on-surface-variant/70",
          error && "border-error",
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-err`} className="mt-1.5 flex items-center gap-1 font-body text-label text-error">
          <Icon name="error" size={16} fill />
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 font-body text-label font-normal text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
});
