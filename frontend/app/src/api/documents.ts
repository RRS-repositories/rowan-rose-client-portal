/**
 * Documents API surface. Routes through in-memory mocks while VITE_USE_MOCKS is
 * on; the real branch (Express + S3) is stubbed and not exercised in the
 * frontend phase. Mirrors the shape of src/api/auth.ts.
 */
import { apiClient } from "./client";
import * as mock from "./mocks/documents";
import type { DocumentType, UploadResponse, UploadedDoc } from "@/data/types";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";
// Reading documents is real in real-auth mode; upload/delete stay mocked until
// the S3-backed write endpoints exist.
const DOCS_REAL = import.meta.env.VITE_REAL_AUTH === "true";

export function getClientDocuments(): Promise<UploadedDoc[]> {
  return DOCS_REAL ? apiClient.get<UploadedDoc[]>("/client/documents") : mock.getClientDocuments();
}

export function uploadDocument(file: File, documentType: DocumentType): Promise<UploadResponse> {
  if (!DOCS_REAL) return mock.uploadDocument(file, documentType);
  const form = new FormData();
  form.append("file", file);
  form.append("documentType", documentType);
  return apiClient.upload<UploadResponse>("/client/documents/upload", form);
}

export function deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
  return USE_MOCKS
    ? mock.deleteDocument(documentId)
    : apiClient.post<{ success: boolean; message: string }>(`/client/documents/${documentId}/delete`, {});
}
