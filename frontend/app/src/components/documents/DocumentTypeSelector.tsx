import { useId } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { DOCUMENT_TYPES } from "@/config/upload";
import type { DocumentType } from "@/data/types";

interface Props {
  value: DocumentType | "";
  onChange: (value: DocumentType) => void;
  /** Set to surface a "please pick a type" error after a failed upload attempt. */
  error?: string | null;
}

/** Required native <select> for the document type — chosen before any upload.
 *  Native control = reliable at 200% zoom and with screen readers. */
export function DocumentTypeSelector({ value, onChange, error }: Props) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div>
      <label htmlFor={id} className="mb-xs block font-button text-button text-on-surface">
        What type of document is this?
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as DocumentType)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          className={cn(
            "skeuo-recessed min-h-[48px] w-full appearance-none rounded-lg bg-surface-container-lowest px-sm pr-12 font-body text-body-lg text-on-surface",
            "border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            error ? "border-error" : "border-outline-variant/30",
          )}
        >
          <option value="" disabled>Select a type…</option>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
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
