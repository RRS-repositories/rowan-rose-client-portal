/**
 * Documents API surface. Routes through in-memory mocks while VITE_USE_MOCKS is
 * on; the real branch (Express + S3) is stubbed and not exercised in the
 * frontend phase. Mirrors the shape of src/api/auth.ts.
 */
import { apiClient } from "./client";
import * as mock from "./mocks/documents";
import type { DocumentType, UploadResponse, UploadedDoc } from "@/data/types";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export function getClientDocuments(): Promise<UploadedDoc[]> {
  return USE_MOCKS ? mock.getClientDocuments() : apiClient.get<UploadedDoc[]>("/client/documents");
}

export function uploadDocument(file: File, documentType: DocumentType): Promise<UploadResponse> {
  return USE_MOCKS
    ? mock.uploadDocument(file, documentType)
    : apiClient.post<UploadResponse>("/client/documents/upload", { fileName: file.name, documentType });
}

export function deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
  return USE_MOCKS
    ? mock.deleteDocument(documentId)
    : apiClient.post<{ success: boolean; message: string }>(`/client/documents/${documentId}/delete`, {});
}
