/**
 * Mock auth implementations (brief §10 — no real CRM, OTP delivery or auth this
 * phase). Delays simulate network latency so loading states are testable.
 * Magic values for manual testing:
 *   - email "notfound@test.com" → no match
 *   - OTP "123456" → verifies; anything else decrements from 5 attempts → lockout
 */
import type {
  RegisterRequest, RegisterResponse,
  VerifyOtpRequest, VerifyOtpResponse,
  ResendOtpRequest, ResendOtpResponse,
  CreatePasswordRequest, CreatePasswordResponse,
} from "../auth";

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const CORRECT_OTP = "123456";
const MAX_OTP_ATTEMPTS = 5;

// Server-side counter the mock "remembers" across verify calls for the session.
let otpAttempts = MAX_OTP_ATTEMPTS;
const lockedMessage =
  "Too many incorrect attempts. Your account has been temporarily locked. Please try again in 15 minutes or contact us.";

export async function registerClient(data: RegisterRequest): Promise<RegisterResponse> {
  await delay(1500);
  if (data.email.trim().toLowerCase() === "notfound@test.com") {
    return {
      matched: false,
      phoneLastFour: "",
      message: "We could not find an account matching these details. Please check your information or contact us.",
    };
  }
  otpAttempts = MAX_OTP_ATTEMPTS; // fresh OTP session on a successful match
  return { matched: true, phoneLastFour: "7890", message: "Details matched. OTP sent to registered phone number." };
}

export async function verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  await delay(1000);
  if (otpAttempts <= 0) {
    return { verified: false, attemptsRemaining: 0, token: "", message: lockedMessage };
  }
  if (data.otp === CORRECT_OTP) {
    return { verified: true, attemptsRemaining: otpAttempts, token: "mock-jwt-token-abc123", message: "Identity verified." };
  }
  otpAttempts -= 1;
  if (otpAttempts <= 0) {
    return { verified: false, attemptsRemaining: 0, token: "", message: lockedMessage };
  }
  return {
    verified: false,
    attemptsRemaining: otpAttempts,
    token: "",
    message: `Incorrect code. ${otpAttempts} attempt${otpAttempts === 1 ? "" : "s"} remaining.`,
  };
}

export async function resendOtp(_data: ResendOtpRequest): Promise<ResendOtpResponse> {
  await delay(800);
  otpAttempts = MAX_OTP_ATTEMPTS; // a new code resets the attempt allowance
  return { sent: true, message: "New code sent." };
}

export async function createPassword(_data: CreatePasswordRequest): Promise<CreatePasswordResponse> {
  await delay(1500);
  return { success: true, message: "Account created successfully." };
}
