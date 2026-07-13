import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { loginClient, type AuthUser, type LoginResponse } from "@/api/auth";
import { setToken as persistToken, getToken as readToken } from "@/lib/session";
import { fetchRealClient, REAL_AUTH } from "@/data/realClient";
import { setRealClient } from "@/data/mock";
import { LogoutModal } from "@/components/ui/LogoutModal";
import { SessionWarningModal } from "@/components/ui/SessionWarningModal";
import { useInactivityTimer, INACTIVITY_LOGOUT_MS } from "@/hooks/useInactivityTimer";

/**
 * App-wide authenticated session (Phase 1.4). Separate from RegistrationContext:
 * this holds the logged-in client and persists across the app, where that one is
 * scoped to the registration flow.
 *
 * Token lives in memory only (never localStorage). A "session active" flag plus
 * the user record is mirrored to sessionStorage so the session survives a
 * same-tab refresh but not a new tab or a closed browser. On load we attempt a
 * (mocked) token refresh from that flag. All auth is MOCKED this phase.
 */
export type LogoutReason = "manual" | "inactivity";

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  lastActivity: number;
}

interface AuthCtx {
  state: AuthState;
  login: (email: string, password: string) => Promise<LoginResponse>;
  /** Set the session directly from a token + user (auto-login after signup). */
  establishSession: (user: AuthUser, token: string) => void;
  logout: (reason?: LogoutReason) => void;
  /** Opens the logout confirmation modal (wired to the nav Log Out controls). */
  requestLogout: () => void;
  refreshSession: () => void;
  isSessionExpired: () => boolean;
}

const SESSION_KEY = "rr-session";
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// eslint-disable-next-line react-refresh/only-export-components
const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inactivity bookkeeping lives in refs so the timer never forces a re-render;
  // `warned` freezes the deadline once the warning shows (only an explicit
  // "Stay Logged In" clears it).
  const lastActivityRef = useRef(Date.now());
  const warnedRef = useRef(false);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningDeadline, setWarningDeadline] = useState(0);

  const isAuthenticated = user !== null && token !== null;

  // Restore a session on load. In real-auth mode the live JWT is read back from
  // session storage and the client's real data is re-hydrated; in mock mode we
  // keep the original simulated refresh.
  useEffect(() => {
    let cancelled = false;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const parsed = JSON.parse(raw) as { user: AuthUser };
        const storedToken = readToken();
        if (REAL_AUTH) {
          if (!storedToken) {
            sessionStorage.removeItem(SESSION_KEY);
            return;
          }
          setUser(parsed.user);
          setToken(storedToken);
          setRealClient(await fetchRealClient());
        } else {
          await delay(300); // simulated token refresh
          if (cancelled) return;
          setUser(parsed.user);
          setToken("mock-jwt-token-refreshed");
        }
        lastActivityRef.current = Date.now();
        warnedRef.current = false;
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    const res = await loginClient({ email, password });
    if (res.success && res.user) {
      setUser(res.user);
      setToken(res.token);
      persistToken(res.token);
      lastActivityRef.current = Date.now();
      warnedRef.current = false;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: res.user }));
      if (REAL_AUTH) setRealClient(await fetchRealClient());
    }
    return res;
  }, []);

  const establishSession = useCallback(async (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    persistToken(t);
    lastActivityRef.current = Date.now();
    warnedRef.current = false;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: u }));
    if (REAL_AUTH) setRealClient(await fetchRealClient());
  }, []);

  const logout = useCallback(
    (reason: LogoutReason = "manual") => {
      setUser(null);
      setToken(null);
      persistToken(null);
      setRealClient(null);
      warnedRef.current = false;
      setWarningOpen(false);
      setLogoutOpen(false);
      sessionStorage.removeItem(SESSION_KEY);
      navigate("/login", { state: { notice: reason } });
    },
    [navigate],
  );

  const requestLogout = useCallback(() => setLogoutOpen(true), []);
  const refreshSession = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);
  const isSessionExpired = useCallback(
    () => Date.now() - lastActivityRef.current >= INACTIVITY_LOGOUT_MS,
    [],
  );

  // "Stay Logged In" — resume tracking from now and dismiss the warning.
  const stayLoggedIn = useCallback(() => {
    warnedRef.current = false;
    lastActivityRef.current = Date.now();
    setWarningOpen(false);
  }, []);

  useInactivityTimer({
    enabled: isAuthenticated,
    lastActivityRef,
    warnedRef,
    onWarn: () => {
      warnedRef.current = true;
      setWarningDeadline(lastActivityRef.current + INACTIVITY_LOGOUT_MS);
      setWarningOpen(true);
    },
    onLogout: () => logout("inactivity"),
  });

  const value = useMemo<AuthCtx>(
    () => ({
      state: { isAuthenticated, user, token, isLoading, lastActivity: lastActivityRef.current },
      login,
      establishSession,
      logout,
      requestLogout,
      refreshSession,
      isSessionExpired,
    }),
    [isAuthenticated, user, token, isLoading, login, establishSession, logout, requestLogout, refreshSession, isSessionExpired],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LogoutModal open={logoutOpen} onConfirm={() => logout("manual")} onCancel={() => setLogoutOpen(false)} />
      <SessionWarningModal
        open={warningOpen}
        deadline={warningDeadline}
        onStay={stayLoggedIn}
        onLogout={() => logout("manual")}
        onExpire={() => logout("inactivity")}
      />
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
