import { useId } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Lenders on the client's account — the bank statement must belong to one. */
  lenders: string[];
  error?: string | null;
}

/** Shown only when the document type is "Bank Statement" — bank statements are
 *  lender-specific, so we ask which of the client's lenders this one is for.
 *  Native <select> for the same reasons as the type selector (200% zoom, SR). */
export function LenderSelector({ value, onChange, lenders, error }: Props) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div>
      <label htmlFor={id} className="mb-xs block font-button text-button text-on-surface">
        Which lender is this statement for?
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          className={cn(
            "skeuo-recessed min-h-[48px] w-full appearance-none rounded-lg bg-surface-container-lowest px-sm pr-12 font-body text-body-lg text-on-surface",
            "border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            error ? "border-error" : "border-outline-variant/30",
          )}
        >
          <option value="" disabled>Select a lender…</option>
          {lenders.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <Icon name="expand_more" size={24} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
      </div>
      {error && (
        <p id={errId} role="alert" className="mt-xs flex items-center gap-1 font-body text-label font-normal text-error">
          <Icon name="error" size={16} fill /> {error}
        </p>
      )}
    </div>
  );
}
