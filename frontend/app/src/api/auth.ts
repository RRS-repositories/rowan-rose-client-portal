/**
 * Auth API surface used by the registration flow. Each function delegates to a
 * mock implementation during the frontend phase and is structured so the import
 * can be swapped for real endpoints in Phase 7.1 (toggle with VITE_USE_MOCKS).
 */
import { apiClient } from "./client";
import * as mock from "./mocks/auth";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
}
export interface RegisterResponse {
  matched: boolean;
  phoneLastFour: string;
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}
export interface VerifyOtpResponse {
  verified: boolean;
  attemptsRemaining: number;
  token: string;
  message: string;
}

export interface ResendOtpRequest {
  email: string;
}
export interface ResendOtpResponse {
  sent: boolean;
  message: string;
}

export interface CreatePasswordRequest {
  token: string;
  password: string;
}
export interface CreatePasswordResponse {
  success: boolean;
  message: string;
}

// Mocks are on unless explicitly disabled. Real API wiring lands in Phase 7.1.
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export function registerClient(data: RegisterRequest): Promise<RegisterResponse> {
  return USE_MOCKS ? mock.registerClient(data) : apiClient.post<RegisterResponse>("/auth/register", data);
}

export function verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  return USE_MOCKS ? mock.verifyOtp(data) : apiClient.post<VerifyOtpResponse>("/auth/verify-otp", data);
}

export function resendOtp(data: ResendOtpRequest): Promise<ResendOtpResponse> {
  return USE_MOCKS ? mock.resendOtp(data) : apiClient.post<ResendOtpResponse>("/auth/resend-otp", data);
}

export function createPassword(data: CreatePasswordRequest): Promise<CreatePasswordResponse> {
  return USE_MOCKS ? mock.createPassword(data) : apiClient.post<CreatePasswordResponse>("/auth/create-password", data);
}
