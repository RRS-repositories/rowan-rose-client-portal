/**
 * Upload rules — shared by the drop zone, the file validator (src/lib/format.ts)
 * and the type selector. Kept in one place so the accepted formats / limits never
 * drift between the UI copy and the validation logic.
 */
import type { DocumentType } from "@/data/types";

/** Accepted MIME types → their allowed file extensions. */
export const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/heic": [".heic"],
  "image/heif": [".heic"],
};

export const ACCEPTED_MIME = Object.keys(ACCEPTED_FILE_TYPES);
export const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".heic"];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_UPLOAD = 5;

/** Human-readable accept hint shown under the drop zone. */
export const ACCEPT_HINT = "Accepted formats: PDF, JPG, JPEG, PNG, HEIC — Max 10MB per file";

export const DOCUMENT_TYPES: ReadonlyArray<{ value: DocumentType; label: string }> = [
  { value: "id", label: "ID Document" },
  { value: "address", label: "Proof of Address" },
  { value: "bank-statement", label: "Bank Statement" },
  { value: "loan-agreement", label: "Loan Agreement" },
  { value: "other", label: "Other" },
] as const;
