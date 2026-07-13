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
// Profile details come from the real backend in real-auth mode; the rest
// (preferences, password, etc.) stay mocked until their endpoints exist.
const PROFILE_REAL = import.meta.env.VITE_REAL_AUTH === "true";

export function getClientProfile(): Promise<ClientProfile> {
  return PROFILE_REAL
    ? apiClient.get<{ profile: ClientProfile }>("/client/profile").then((r) => r.profile)
    : mock.getClientProfile();
}

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return USE_MOCKS ? mock.getNotificationPreferences() : apiClient.get<NotificationPreferences>("/client/preferences");
}

export function updateNotificationPreferences(prefs: NotificationPreferences): Promise<UpdatePreferencesResponse> {
  return USE_MOCKS ? mock.updateNotificationPreferences(prefs) : apiClient.post<UpdatePreferencesResponse>("/client/preferences", prefs);
}

export function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return PROFILE_REAL ? apiClient.post<ChangePasswordResponse>("/client/change-password", data) : mock.changePassword(data);
}

export function logoutAllDevices(): Promise<SimpleSuccessResponse> {
  return USE_MOCKS ? mock.logoutAllDevices() : apiClient.post<SimpleSuccessResponse>("/client/logout-all", {});
}

export function requestDataExport(): Promise<SimpleSuccessResponse> {
  return USE_MOCKS ? mock.requestDataExport() : apiClient.post<SimpleSuccessResponse>("/client/data-export", {});
}
