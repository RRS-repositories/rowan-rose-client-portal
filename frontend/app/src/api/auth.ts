/**
 * Auth API surface. Talks to the Express + Postgres backend (Phase 1.4) when
 * VITE_USE_MOCKS !== "false"; otherwise falls back to in-memory mocks.
 *
 * Signup flow (new order): email → email OTP → password → profile (name/phone/
 * DOB 18+) → account created + signed in.
 */
import { apiClient } from "./client";
import * as mock from "./mocks/auth";

/** The authenticated client, returned by login/registration and held in AuthContext. */
export interface AuthUser {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneLastFour: string;
}

// Step 1 — start signup with an email; backend emails a 6-digit code.
export interface RegisterStartRequest {
  email: string;
}
export interface RegisterStartResponse {
  sent: boolean;
  alreadyExists?: boolean;
  message: string;
  devCode?: string; // dev-only: shown in UI until email delivery is wired
}

// Step 2 — verify the code; returns a short-lived signup token.
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}
export interface VerifyOtpResponse {
  verified: boolean;
  attemptsRemaining: number;
  token: string; // signup token, carried to complete-registration
  message: string;
}

export interface ResendOtpRequest {
  email: string;
}
export interface ResendOtpResponse {
  sent: boolean;
  message: string;
  devCode?: string;
}

// Step 4 — create the account with password + profile; returns a session.
export interface CompleteRegistrationRequest {
  signupToken: string;
  password: string;
  fullName: string;
  phone: string;
  dob: string;
}
export interface CompleteRegistrationResponse {
  success: boolean;
  token: string;
  user: AuthUser | null;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser | null;
  message: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}
export interface RequestPasswordResetResponse {
  success: boolean;
  message: string;
  devToken?: string;
}

export interface SetNewPasswordRequest {
  token: string;
  newPassword: string;
}
export interface SetNewPasswordResponse {
  success: boolean;
  message: string;
}

// Auth talks to the real backend when VITE_REAL_AUTH=true (Phase 7.1), even
// while the rest of the app still runs on mocks (VITE_USE_MOCKS).
const USE_MOCKS =
  import.meta.env.VITE_USE_MOCKS !== "false" && import.meta.env.VITE_REAL_AUTH !== "true";

export function registerStart(data: RegisterStartRequest): Promise<RegisterStartResponse> {
  return USE_MOCKS ? mock.registerStart(data) : apiClient.post<RegisterStartResponse>("/auth/register-start", data);
}

export function verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  return USE_MOCKS ? mock.verifyOtp(data) : apiClient.post<VerifyOtpResponse>("/auth/verify-otp", data);
}

export function resendOtp(data: ResendOtpRequest): Promise<ResendOtpResponse> {
  return USE_MOCKS ? mock.resendOtp(data) : apiClient.post<ResendOtpResponse>("/auth/resend-otp", data);
}

export function completeRegistration(data: CompleteRegistrationRequest): Promise<CompleteRegistrationResponse> {
  return USE_MOCKS ? mock.completeRegistration(data) : apiClient.post<CompleteRegistrationResponse>("/auth/complete-registration", data);
}

export function loginClient(data: LoginRequest): Promise<LoginResponse> {
  return USE_MOCKS ? mock.loginClient(data) : apiClient.post<LoginResponse>("/auth/login", data);
}

export function requestPasswordReset(data: RequestPasswordResetRequest): Promise<RequestPasswordResetResponse> {
  return USE_MOCKS ? mock.requestPasswordReset(data) : apiClient.post<RequestPasswordResetResponse>("/auth/request-reset", data);
}

export function setNewPassword(data: SetNewPasswordRequest): Promise<SetNewPasswordResponse> {
  return USE_MOCKS ? mock.setNewPassword(data) : apiClient.post<SetNewPasswordResponse>("/auth/set-new-password", data);
}
