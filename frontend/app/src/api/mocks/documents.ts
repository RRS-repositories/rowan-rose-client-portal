/**
 * In-memory document mocks — fallback while VITE_USE_MOCKS is on (the real S3 +
 * CRM upload lands in a later backend phase). Uploads don't persist anywhere;
 * the page keeps the optimistic list in local state.
 */
import type { DocumentType, RequirementKind, UploadResponse, UploadedDoc } from "@/data/types";
import { getClient } from "@/data/mock";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let seq = 0;
const newId = () => `up-${Date.now()}-${++seq}`;

const kindOf = (mime: string): UploadedDoc["kind"] => (mime === "application/pdf" ? "pdf" : "image");

/** Which client-level requirement (if any) this document type satisfies. */
function requirementFor(type: DocumentType): RequirementKind | null {
  if (type === "id") return "id";
  if (type === "address") return "address";
  if (type === "bank-statement") return "bank-statements";
  return null;
}

export async function getClientDocuments(): Promise<UploadedDoc[]> {
  await delay(600);
  return [...getClient().documents];
}

export async function uploadDocument(file: File, documentType: DocumentType): Promise<UploadResponse> {
  // Short server-side pause; the visible 0→100% progress is simulated client-side.
  await delay(400);
  const document: UploadedDoc = {
    id: newId(),
    name: file.name,
    mime: file.type || "application/octet-stream",
    fileSize: file.size,
    documentType,
    uploadedOn: new Date().toISOString(),
    status: "received",
    kind: kindOf(file.type),
  };
  const requirementUpdated = requirementFor(documentType);
  return {
    success: true,
    document,
    requirementUpdated,
    message: requirementUpdated ? "Document received and requirement updated." : "Document received.",
  };
}

export async function deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
  await delay(500);
  return { success: true, message: `Document ${documentId} removed.` };
}
