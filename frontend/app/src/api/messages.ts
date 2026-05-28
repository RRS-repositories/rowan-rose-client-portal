/**
 * Messages API surface. Routes through in-memory mocks while VITE_USE_MOCKS is
 * on; the real branch (CRM-integrated) is stubbed until the backend phase.
 * Mirrors the shape of src/api/documents.ts.
 */
import { apiClient } from "./client";
import * as mock from "./mocks/messages";
import type { Message, MessageThread } from "@/data/types";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export function getMessageThreads(): Promise<MessageThread[]> {
  return USE_MOCKS ? mock.getMessageThreads() : apiClient.get<MessageThread[]>("/client/messages");
}

export function getClaimMessages(claimId: string): Promise<Message[]> {
  return USE_MOCKS
    ? mock.getClaimMessages(claimId)
    : apiClient.get<Message[]>(`/client/messages/${encodeURIComponent(claimId)}`);
}

export function sendMessage(claimId: string, content: string): Promise<Message> {
  return USE_MOCKS
    ? mock.sendMessage(claimId, content)
    : apiClient.post<Message>(`/client/messages/${encodeURIComponent(claimId)}`, { content });
}

export function markThreadAsRead(claimId: string): Promise<{ success: boolean }> {
  return USE_MOCKS
    ? mock.markThreadAsRead(claimId)
    : apiClient.post<{ success: boolean }>(`/client/messages/${encodeURIComponent(claimId)}/read`, {});
}
