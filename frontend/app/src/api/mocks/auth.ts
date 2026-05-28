/**
 * In-memory auth mocks — fallback for when VITE_USE_MOCKS is on. The real flow
 * runs against the Express + Postgres backend (see src/api/auth.ts). Magic
 * values: OTP "123456" verifies; login client@test.com / Password1.
 */
import type {
  RegisterStartRequest, RegisterStartResponse,
  VerifyOtpRequest, VerifyOtpResponse,
  ResendOtpRequest, ResendOtpResponse,
  CompleteRegistrationRequest, CompleteRegistrationResponse,
  LoginRequest, LoginResponse,
  RequestPasswordResetRequest, RequestPasswordResetResponse,
  SetNewPasswordRequest, SetNewPasswordResponse,
  AuthUser,
} from "../auth";

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const CORRECT_OTP = "123456";
const MAX_OTP_ATTEMPTS = 5;
let otpAttempts = MAX_OTP_ATTEMPTS;

const TEST_EMAIL = "client@test.com";
const TEST_PASSWORD = "Password1";
const TEST_USER: AuthUser = {
  clientId: "RR-676687-554",
  firstName: "Sarah",
  lastName: "Holden",
  email: TEST_EMAIL,
  phoneLastFour: "7890",
};

export async function registerStart(data: RegisterStartRequest): Promise<RegisterStartResponse> {
  await delay(1200);
  if (data.email.trim().toLowerCase() === TEST_EMAIL) {
    return { sent: false, alreadyExists: true, message: "An account already exists for this email. Please log in." };
  }
  otpAttempts = MAX_OTP_ATTEMPTS;
  return { sent: true, message: "Verification code sent to your email.", devCode: CORRECT_OTP };
}

export async function verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  await delay(1000);
  if (data.otp === CORRECT_OTP) {
    return { verified: true, attemptsRemaining: 0, token: "mock-signup-token", message: "Identity verified." };
  }
  otpAttempts = Math.max(0, otpAttempts - 1);
  if (otpAttempts <= 0) {
    return { verified: false, attemptsRemaining: 0, token: "", message: "Too many incorrect attempts. Please request a new code." };
  }
  return { verified: false, attemptsRemaining: otpAttempts, token: "", message: `Incorrect code. ${otpAttempts} attempt${otpAttempts === 1 ? "" : "s"} remaining.` };
}

export async function resendOtp(_data: ResendOtpRequest): Promise<ResendOtpResponse> {
  await delay(800);
  otpAttempts = MAX_OTP_ATTEMPTS;
  return { sent: true, message: "New code sent.", devCode: CORRECT_OTP };
}

export async function completeRegistration(data: CompleteRegistrationRequest): Promise<CompleteRegistrationResponse> {
  await delay(1200);
  const parts = data.fullName.trim().split(/\s+/);
  const user: AuthUser = {
    clientId: "",
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    email: "you@example.com",
    phoneLastFour: data.phone.replace(/\D/g, "").slice(-4),
  };
  return { success: true, token: "mock-session-token", user, message: "Account created successfully." };
}

export async function loginClient(data: LoginRequest): Promise<LoginResponse> {
  await delay(1000);
  if (data.email.trim().toLowerCase() === TEST_EMAIL && data.password === TEST_PASSWORD) {
    return { success: true, token: "mock-session-token", user: { ...TEST_USER }, message: "Login successful." };
  }
  return { success: false, token: "", user: null, message: "Invalid email or password." };
}

export async function requestPasswordReset(_data: RequestPasswordResetRequest): Promise<RequestPasswordResetResponse> {
  await delay(1200);
  return { success: true, message: "If an account with that email exists, we have sent a password reset link." };
}

export async function setNewPassword(data: SetNewPasswordRequest): Promise<SetNewPasswordResponse> {
  await delay(1200);
  if (data.token === "expired-token") return { success: false, message: "This reset link has expired. Please request a new one." };
  return { success: true, message: "Password reset successfully." };
}
