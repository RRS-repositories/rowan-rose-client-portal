import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

export interface RegistrationDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
}

export interface RegistrationState extends RegistrationDetails {
  step: number; // 0 Details · 1 Verify · 2 Password · 3 Done
  phoneLastFour: string;
  otpToken: string;
  otpAttemptsRemaining: number;
  resendAttemptsRemaining: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
}

const LOCKOUT_MS = 15 * 60 * 1000;

const INITIAL: RegistrationState = {
  step: 0,
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  email: "",
  phoneLastFour: "",
  otpToken: "",
  otpAttemptsRemaining: 5,
  resendAttemptsRemaining: 3,
  isLocked: false,
  lockoutEndTime: null,
};

/** Routes that make up the registration flow — state survives navigation
 *  between these and is cleared the moment the user leaves them. */
const FLOW_ROUTES = ["/register", "/verify-otp", "/create-password", "/registration-success"];

interface RegistrationCtx {
  state: RegistrationState;
  setRegistrationDetails: (details: RegistrationDetails & { phoneLastFour: string }) => void;
  setOtpVerified: (token: string) => void;
  setOtpAttemptsRemaining: (remaining: number) => void;
  decrementOtpAttempts: () => void;
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

  // Drop registration data (incl. the temporary token) when leaving the flow.
  useEffect(() => {
    if (!inFlow) setState((s) => (s === INITIAL ? s : INITIAL));
  }, [inFlow]);

  const api = useMemo<RegistrationCtx>(() => ({
    state,
    setRegistrationDetails: (details) => setState((s) => ({ ...s, ...details, step: 1 })),
    setOtpVerified: (token) => setState((s) => ({ ...s, otpToken: token, step: 2 })),
    setOtpAttemptsRemaining: (remaining) =>
      setState((s) => ({
        ...s,
        otpAttemptsRemaining: remaining,
        isLocked: remaining <= 0,
        lockoutEndTime: remaining <= 0 ? (s.lockoutEndTime ?? Date.now() + LOCKOUT_MS) : s.lockoutEndTime,
      })),
    decrementOtpAttempts: () =>
      setState((s) => {
        const n = Math.max(0, s.otpAttemptsRemaining - 1);
        return { ...s, otpAttemptsRemaining: n, isLocked: n <= 0, lockoutEndTime: n <= 0 ? Date.now() + LOCKOUT_MS : s.lockoutEndTime };
      }),
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
