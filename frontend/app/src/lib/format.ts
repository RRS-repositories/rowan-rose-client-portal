import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME, MAX_FILE_SIZE } from "@/config/upload";
import type { DocumentType } from "@/data/types";

const gbpFmt = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const gbp = (n: number): string => gbpFmt.format(n);

/** Formats a fee fraction (e.g. 0.25) as a whole-number percentage ("25%"). */
export const formatPercentage = (fraction: number): string => `${Math.round(fraction * 100)}%`;

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fullDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
const timeOnly = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

export const formatDate = (iso: string): string => longDate.format(new Date(iso));
export const formatDateShort = (iso: string): string => shortDate.format(new Date(iso));

/** "Wednesday, 28 May 2026" — UK date with weekday, no ordinal. Defaults to today. */
export const formatUKDateFull = (iso?: string): string => fullDate.format(iso ? new Date(iso) : new Date());

/** "28 May 2026, 14:32" — UK short date with 24-hour time. Used on message timestamps. */
export const formatDateTime = (iso: string): string => dateTime.format(new Date(iso));

/** "14:32" — UK 24-hour time. Used on grouped messages where the date is implied. */
export const formatTime = (iso: string): string => timeOnly.format(new Date(iso));

/** "Today" / "Yesterday" / "18 May 2026" — for chat date separators. */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const startOfDay = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return shortDate.format(d);
}

export function relativeDays(iso: string | undefined, now: Date = new Date()): string {
  if (!iso) return "recently";
  const days = Math.round((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDateShort(iso);
}

// ── File helpers (Phase 2.1 — Documents & upload) ──────────────────────────

/** Bytes → human-readable size: "2.4 MB", "540 KB", "1.2 GB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  id: "ID Document",
  address: "Proof of Address",
  "bank-statement": "Bank Statement",
  "loan-agreement": "Loan Agreement",
  other: "Other",
};
/** Document-type key → user-facing label ("id" → "ID Document"). */
export const formatDocumentType = (type: DocumentType): string => DOC_TYPE_LABELS[type] ?? "Other";

/** MIME type → Material Symbols icon name for the file's row/cell. */
export function getFileIcon(mime: string): string {
  if (mime === "application/pdf") return "description";
  if (mime.startsWith("image/")) return "image";
  return "draft";
}

const fileExtension = (name: string): string => {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
};

/** Validates a single file against the upload rules. Accepts if either the
 *  extension or the (non-empty) MIME type is allowed — HEIC often arrives with
 *  an empty MIME, so the extension is the fallback. Then enforces the size cap. */
export function validateFile(file: File): { valid: boolean; error: string | null } {
  const extOk = ACCEPTED_EXTENSIONS.includes(fileExtension(file.name));
  const mimeOk = !!file.type && ACCEPTED_MIME.includes(file.type);
  if (!extOk && !mimeOk) {
    return { valid: false, error: `'${file.name}' is not an accepted file type. Please upload a PDF, JPG, PNG, or HEIC file.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `'${file.name}' is too large (${mb}MB). Maximum file size is 10MB.` };
  }
  return { valid: true, error: null };
}
