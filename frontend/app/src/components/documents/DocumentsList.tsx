import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDocumentType, formatFileSize, getFileIcon } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/config/upload";
import type { DocStatus, DocumentType, UploadedDoc } from "@/data/types";

type SortKey = "recent" | "oldest" | "name";

/** Type label, with the lender appended for lender-specific docs (bank statements). */
const typeLabel = (d: UploadedDoc) =>
  d.lenderName ? `${formatDocumentType(d.documentType)} · ${d.lenderName}` : formatDocumentType(d.documentType);

const STATUS_META: Record<DocStatus, { label: string; icon: string; cls: string }> = {
  received: { label: "Received", icon: "inbox", cls: "bg-secondary-container text-on-secondary-container" },
  processing: { label: "Processing", icon: "hourglass_top", cls: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  verified: { label: "Verified", icon: "verified", cls: "bg-primary-container text-on-primary-container" },
  rejected: { label: "Rejected", icon: "error", cls: "bg-error-container text-on-error-container" },
};

/** Status badge — icon + label + sr-only "Status: …" so it never relies on
 *  colour alone. Rejected shows the reason in a keyboard-reachable tooltip. */
function DocStatusBadge({ status, reason }: { status: DocStatus; reason?: string }) {
  const m = STATUS_META[status];
  const tipId = useId();
  const pill = "inline-flex min-h-[28px] items-center gap-1 rounded-full px-2 font-label-caps text-label-caps uppercase";

  if (status === "rejected" && reason) {
    return (
      <span className="relative inline-flex">
        <span
          tabIndex={0}
          role="button"
          aria-describedby={tipId}
          className={cn(pill, "peer cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-error", m.cls)}
        >
          <Icon name={m.icon} size={14} fill /> {m.label}
          <span className="sr-only">Status: {m.label}. {reason}</span>
        </span>
        <span
          id={tipId}
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden w-48 -translate-x-1/2 rounded-lg border border-outline-variant/30 bg-surface-container-highest p-2 font-body text-label font-normal normal-case text-on-surface shadow-lg peer-hover:block peer-focus:block"
        >
          {reason}
        </span>
      </span>
    );
  }

  return (
    <span className={cn(pill, m.cls)}>
      <Icon name={m.icon} size={14} fill /> {m.label}
      <span className="sr-only">Status: {m.label}</span>
    </span>
  );
}

function ControlSelect({
  id, label, value, onChange, options,
}: { id: string; label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">{label}</span>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="skeuo-recessed min-h-[48px] w-full appearance-none rounded-lg border border-outline-variant/30 bg-surface-container-lowest pl-sm pr-10 font-body text-body-md text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-48"
        >
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <Icon name="expand_more" size={20} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant" />
      </div>
    </label>
  );
}

/** Uploaded-documents list — desktop table / mobile cards, with sort + type
 *  filter and a live results count. */
export function DocumentsList({ documents }: { documents: UploadedDoc[] }) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [filter, setFilter] = useState<DocumentType | "all">("all");
  const sortId = useId();
  const filterId = useId();

  const visible = useMemo(() => {
    const filtered = filter === "all" ? documents : documents.filter((d) => d.documentType === filter);
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const diff = +new Date(b.uploadedOn) - +new Date(a.uploadedOn);
      return sort === "oldest" ? -diff : diff;
    });
  }, [documents, filter, sort]);

  return (
    <section aria-label="Uploaded documents" className="space-y-md">
      <div className="flex flex-col gap-sm sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-col gap-sm sm:flex-row">
          <ControlSelect
            id={sortId} label="Sort by" value={sort} onChange={(v) => setSort(v as SortKey)}
            options={[["recent", "Most Recent"], ["oldest", "Oldest First"], ["name", "Name A–Z"]]}
          />
          <ControlSelect
            id={filterId} label="Filter by type" value={filter} onChange={(v) => setFilter(v as DocumentType | "all")}
            options={[["all", "All Types"], ...DOCUMENT_TYPES.map((t) => [t.value, t.label] as [string, string])]}
          />
        </div>
        <p className="font-body text-label font-normal text-on-surface-variant" aria-live="polite">
          Showing {visible.length} of {documents.length} {documents.length === 1 ? "document" : "documents"}
        </p>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon="description" title="No documents uploaded yet" description="Upload your first document using the area above." />
      ) : visible.length === 0 ? (
        <EmptyState icon="filter_alt_off" title="No documents match this filter" description="Try a different type, or choose “All Types” to see everything." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="skeuo-card w-full border-collapse overflow-hidden rounded-xl">
              <caption className="sr-only">Your uploaded documents</caption>
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-high text-left">
                  <th scope="col" className="w-12 p-sm"><span className="sr-only">File type</span></th>
                  <th scope="col" className="p-sm font-label-caps text-label-caps uppercase text-on-surface-variant">Document Name</th>
                  <th scope="col" className="p-sm font-label-caps text-label-caps uppercase text-on-surface-variant">Type</th>
                  <th scope="col" className="p-sm font-label-caps text-label-caps uppercase text-on-surface-variant">Date Uploaded</th>
                  <th scope="col" className="p-sm font-label-caps text-label-caps uppercase text-on-surface-variant">Size</th>
                  <th scope="col" className="p-sm font-label-caps text-label-caps uppercase text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((d, i) => (
                  <tr key={d.id} className={cn("border-b border-outline-variant/20 transition-colors hover:bg-surface-container", i % 2 === 1 && "bg-surface-container-low/40")}>
                    <td className="p-sm">
                      <span className="grid h-10 w-10 place-items-center rounded-lg border border-outline-variant/30 bg-surface-container-high text-secondary">
                        <Icon name={getFileIcon(d.mime)} size={20} />
                      </span>
                    </td>
                    <td className="max-w-[280px] p-sm">
                      <span className="block truncate font-body-lg text-body-md text-on-surface" title={d.name}>{d.name}</span>
                    </td>
                    <td className="p-sm font-body text-body-md text-on-surface-variant">{typeLabel(d)}</td>
                    <td className="whitespace-nowrap p-sm font-body text-body-md text-on-surface-variant">{formatDate(d.uploadedOn)}</td>
                    <td className="whitespace-nowrap p-sm font-body text-body-md tabular-nums text-on-surface-variant">{formatFileSize(d.fileSize)}</td>
                    <td className="p-sm"><DocStatusBadge status={d.status} reason={d.rejectionReason} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-sm md:hidden">
            {visible.map((d) => (
              <li key={d.id}>
                <Card className="p-md">
                  <div className="flex items-center gap-sm">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-lg border border-outline-variant/30 bg-surface-container-high text-secondary">
                      <Icon name={getFileIcon(d.mime)} size={22} />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-body-lg text-body-lg text-on-surface" title={d.name}>{d.name}</span>
                  </div>
                  <div className="mt-sm flex flex-wrap items-center gap-x-sm gap-y-xs">
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label text-label text-on-surface-variant">{typeLabel(d)}</span>
                    <span className="font-body text-body-md text-on-surface-variant">{formatDate(d.uploadedOn)}</span>
                  </div>
                  <div className="mt-xs flex items-center justify-between">
                    <span className="font-body text-body-md tabular-nums text-on-surface-variant">{formatFileSize(d.fileSize)}</span>
                    <DocStatusBadge status={d.status} reason={d.rejectionReason} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
