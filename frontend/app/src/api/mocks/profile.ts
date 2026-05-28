/**
 * In-memory profile mocks (Phase 5.1). Backs /profile until the real CRM
 * profile endpoints land (Phase 7.1). Magic value: changePassword accepts
 * "Password1" as the current password (matches TEST_PASSWORD in mocks/auth.ts).
 */
import type {
  ClientProfile, NotificationPreferences,
} from "@/data/types";
import { CLIENT } from "@/data/mock";
import type {
  ChangePasswordRequest, ChangePasswordResponse,
  UpdatePreferencesResponse, SimpleSuccessResponse,
} from "../profile";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Module-level state — reflects updates within the session so the UI stays in
// sync without a real backend. Reset on page reload (no persistence).
let preferences: NotificationPreferences = {
  statusChanges: true,
  newMessages: true,
  documentRequests: true,
  offerNotifications: true,
  paymentUpdates: true,
  marketingEmails: false,
};

let passwordLastChanged: string | null = null;

/** Phases the spec considers "active" for the Active Claims count. */
const ACTIVE_STATUSES = new Set([
  "Onboarding", "Documents Required", "Awaiting Bank Statements",
  "DSAR Sent", "DSAR Received", "DSAR Chased",
  "Complaint Submitted", "Complaint Chased", "FRL Received", "Counter Response Sent",
  "FOS Submitted", "FOS Chased", "FOS Awaiting Decision",
  "Offer Received",
]);

export async function getClientProfile(): Promise<ClientProfile> {
  await delay(500);
  const totalClaims = CLIENT.claims.length;
  const activeClaims = CLIENT.claims.filter((c) => ACTIVE_STATUSES.has(c.internalStatus)).length;
  return {
    clientId: CLIENT.id,
    firstName: CLIENT.firstName,
    lastName: CLIENT.lastName,
    dateOfBirth: "1988-03-14",
    email: "client@test.com",
    phone: "+447912345678",
    registeredAt: "2026-04-15",
    totalClaims,
    activeClaims,
    passwordLastChanged,
  };
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  await delay(400);
  return { ...preferences };
}

export async function updateNotificationPreferences(prefs: NotificationPreferences): Promise<UpdatePreferencesResponse> {
  await delay(800);
  preferences = { ...prefs };
  return { success: true, message: "Preferences updated successfully." };
}

export async function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  await delay(1500);
  if (data.currentPassword !== "Password1") {
    return { success: false, message: "Current password is incorrect." };
  }
  passwordLastChanged = new Date().toISOString();
  return { success: true, message: "Password changed successfully." };
}

export async function logoutAllDevices(): Promise<SimpleSuccessResponse> {
  await delay(1000);
  return { success: true, message: "All sessions have been ended." };
}

export async function requestDataExport(): Promise<SimpleSuccessResponse> {
  await delay(800);
  return { success: true, message: "Data export request submitted." };
}
