import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

/**
 * State for the multi-step signup flow (email → email OTP → password → profile).
 * Held in memory and cleared the moment the user leaves the flow routes.
 * The plaintext password is carried only between the password and profile steps,
 * then submitted once to create the account.
 */
export interface RegistrationState {
  step: number; // 0 Email · 1 Verify · 2 Password · 3 Details
  email: string;
  signupToken: string; // returned by verify-otp, spent at complete-registration
  password: string;
  devCode: string | null; // dev-only OTP hint (no email provider wired yet)
  otpAttemptsRemaining: number;
  resendAttemptsRemaining: number;
  isLocked: boolean;
}

const INITIAL: RegistrationState = {
  step: 0,
  email: "",
  signupToken: "",
  password: "",
  devCode: null,
  otpAttemptsRemaining: 5,
  resendAttemptsRemaining: 3,
  isLocked: false,
};

const FLOW_ROUTES = ["/register", "/verify-otp", "/create-password", "/complete-profile"];

interface RegistrationCtx {
  state: RegistrationState;
  setEmail: (email: string, devCode?: string | null) => void;
  setSignupToken: (token: string) => void;
  setPassword: (password: string) => void;
  setDevCode: (code: string | null) => void;
  setOtpAttemptsRemaining: (remaining: number) => void;
  decrementResendAttempts: () => void;
  resetRegistration: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
const RegistrationContext = createContext<RegistrationCtx | null>(null);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RegistrationState>(INITIAL);
  const { pathname } = useLocation();
  const inFlow = FLOW_ROUTES.includes(pathname);

  const resetRegistration = useCallback(() => setState(INITIAL), []);

  // Drop signup data (incl. the token + password) when leaving the flow.
  useEffect(() => {
    if (!inFlow) setState((s) => (s === INITIAL ? s : INITIAL));
  }, [inFlow]);

  const api = useMemo<RegistrationCtx>(() => ({
    state,
    setEmail: (email, devCode = null) =>
      setState((s) => ({ ...s, email, devCode, step: 1, otpAttemptsRemaining: 5, resendAttemptsRemaining: 3, isLocked: false })),
    setSignupToken: (token) => setState((s) => ({ ...s, signupToken: token, step: 2 })),
    setPassword: (password) => setState((s) => ({ ...s, password, step: 3 })),
    setDevCode: (code) => setState((s) => ({ ...s, devCode: code })),
    setOtpAttemptsRemaining: (remaining) =>
      setState((s) => ({ ...s, otpAttemptsRemaining: remaining, isLocked: remaining <= 0 })),
    decrementResendAttempts: () =>
      setState((s) => ({ ...s, resendAttemptsRemaining: Math.max(0, s.resendAttemptsRemaining - 1) })),
    resetRegistration,
  }), [state, resetRegistration]);

  return <RegistrationContext.Provider value={api}>{children}</RegistrationContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error("useRegistration must be used within <RegistrationProvider>");
  return ctx;
}
