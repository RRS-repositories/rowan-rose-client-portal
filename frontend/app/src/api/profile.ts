/**
 * Profile API surface. Mirrors the auth.ts pattern — mocks when
 * VITE_USE_MOCKS !== "false" (the frontend-phase default), real endpoints
 * later. All endpoints below are stubbed against /client/* paths; they'll be
 * wired to the CRM in Phase 7.1.
 */
import { apiClient } from "./client";
import * as mock from "./mocks/profile";
import type { ClientProfile, NotificationPreferences } from "@/data/types";

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}
export interface UpdatePreferencesResponse {
  success: boolean;
  message: string;
}
export interface SimpleSuccessResponse {
  success: boolean;
  message: string;
}

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export function getClientProfile(): Promise<ClientProfile> {
  return USE_MOCKS ? mock.getClientProfile() : apiClient.get<ClientProfile>("/client/profile");
}

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return USE_MOCKS ? mock.getNotificationPreferences() : apiClient.get<NotificationPreferences>("/client/preferences");
}

export function updateNotificationPreferences(prefs: NotificationPreferences): Promise<UpdatePreferencesResponse> {
  return USE_MOCKS ? mock.updateNotificationPreferences(prefs) : apiClient.post<UpdatePreferencesResponse>("/client/preferences", prefs);
}

export function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return USE_MOCKS ? mock.changePassword(data) : apiClient.post<ChangePasswordResponse>("/client/change-password", data);
}

export function logoutAllDevices(): Promise<SimpleSuccessResponse> {
  return USE_MOCKS ? mock.logoutAllDevices() : apiClient.post<SimpleSuccessResponse>("/client/logout-all", {});
}

export function requestDataExport(): Promise<SimpleSuccessResponse> {
  return USE_MOCKS ? mock.requestDataExport() : apiClient.post<SimpleSuccessResponse>("/client/data-export", {});
}
