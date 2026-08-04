/**
 * Notifications API surface. Real endpoints when VITE_REAL_AUTH is on (the
 * backend reads portal.notifications, populated by CRM triggers); mock feed
 * derived from requirements otherwise. Mirrors the profile.ts pattern.
 */
import { apiClient } from "./client";
import * as mock from "./mocks/notifications";
import type { PortalNotification } from "@/data/types";

const REAL = import.meta.env.VITE_REAL_AUTH === "true";

export interface NotificationsResponse {
  notifications: PortalNotification[];
  unread: number;
}
export interface MarkReadResponse {
  success: boolean;
  updated: number;
}

export function getNotifications(): Promise<NotificationsResponse> {
  return REAL
    ? apiClient.get<NotificationsResponse>("/client/notifications")
    : mock.getNotifications();
}

/** Mark the given notification ids read; no ids = mark everything read. */
export function markNotificationsRead(ids?: string[]): Promise<MarkReadResponse> {
  return REAL
    ? apiClient.post<MarkReadResponse>("/client/notifications/read", { ids: ids ?? [] })
    : mock.markNotificationsRead(ids);
}
