import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/useToast";
import { validateEmail } from "@/utils/validation";

const REMEMBER_KEY = "rr-remember-email";
const LOCKOUT_KEY = "rr-login-lockout";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function format(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { push } = useToast();

  // Pre-fill the email if it was remembered on a previous visit.
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? "");
  const [remember, setRemember] = useState(() => localStorage.getItem(REMEMBER_KEY) !== null);
  const [password, setPassword] = useState("");

  const [emailErr, setEmailErr] = useState<string | undefined>();
  const [passwordErr, setPasswordErr] = useState<string | undefined>();
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [failCount, setFailCount] = useState(0);

  // Lockout end time persists across refresh (spec test 4).
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(() => {
    const v = Number(sessionStorage.getItem(LOCKOUT_KEY));
    return Number.isFinite(v) && v > Date.now() ? v : null;
  });
  const [nowTs, setNowTs] = useState(Date.now());
  const locked = lockoutEnd != null && nowTs < lockoutEnd;

  // Keep the remembered email in sync with the checkbox.
  useEffect(() => {
    if (remember) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);
  }, [remember, email]);

  // Drive the lockout countdown; clear and reset attempts when it elapses.
  useEffect(() => {
    if (lockoutEnd == null) return;
    const id = window.setInterval(() => {
      if (Date.now() >= lockoutEnd) {
        setLockoutEnd(null);
        setFailCount(0);
        sessionStorage.removeItem(LOCKOUT_KEY);
      } else {
        setNowTs(Date.now());
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockoutEnd]);

  // Surface a toast if we arrived here from a logout / inactivity redirect.
  const noticeShown = useRef(false);
  useEffect(() => {
    if (noticeShown.current) return;
    const notice = (location.state as { notice?: string } | null)?.notice;
    if (!notice) return;
    noticeShown.current = true;
    if (notice === "inactivity") {
      push({ title: "Session ended", description: "You have been logged out due to inactivity.", tone: "info" });
    } else {
      push({ title: "Logged out", description: "You have been logged out successfully.", tone: "success" });
    }
    navigate(location.pathname, { replace: true });
  }, [location, navigate, push]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || submitting) return;

    const eErr = validateEmail(email);
    const pErr = password ? undefined : "Please enter your password.";
    setEmailErr(eErr ?? undefined);
    setPasswordErr(pErr);
    if (eErr || pErr) return;

    setSubmitting(true);
    setBanner(null);
    try {
      const res = await login(email, password);
      if (res.success && res.user) {
        push({ title: `Welcome back, ${res.user.firstName}!`, tone: "success" });
        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
        navigate(from ?? "/dashboard", { replace: true });
        return;
      }
      const newCount = failCount + 1;
      setFailCount(newCount);
      setPassword(""); // clear password, keep email
      if (newCount >= MAX_ATTEMPTS) {
        const end = Date.now() + LOCKOUT_MS;
        sessionStorage.setItem(LOCKOUT_KEY, String(end));
        setNowTs(Date.now());
        setLockoutEnd(end);
      } else {
        const remaining = MAX_ATTEMPTS - newCount;
        setBanner(`Invalid email or password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-headline-md font-bold text-on-surface">Welcome Back</h1>
      <p className="mt-1 font-body text-body-md text-on-surface-variant">
        Log in to your account to view your claims.
      </p>

      {locked ? (
        <div role="alert" aria-live="polite" className="mt-md flex items-start gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <Icon name="lock_clock" size={20} fill className="mt-0.5 flex-none" />
          <p className="min-w-0 flex-1 font-body text-body-md">
            Your account has been temporarily locked due to too many failed login attempts. Please try again in{" "}
            <span className="font-bold tabular-nums">{format((lockoutEnd ?? 0) - nowTs)}</span>.
          </p>
        </div>
      ) : banner ? (
        <div role="alert" className="mt-md flex items-start gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <Icon name="error" size={20} fill className="mt-0.5 flex-none" />
          <p className="min-w-0 flex-1 font-body text-body-md">{banner}</p>
          <button type="button" onClick={() => setBanner(null)} aria-label="Dismiss message" className="-m-1 grid h-8 w-8 flex-none place-items-center rounded-full hover:bg-on-error-container/10">
            <Icon name="close" size={18} />
          </button>
        </div>
      ) : null}

      <form className="mt-md flex flex-col gap-md" onSubmit={submit} noValidate>
        <Input
          label="Email Address"
          type="email"
          inputMode="email"
          placeholder="Enter your email address"
          autoComplete="email"
          value={email}
          error={emailErr}
          disabled={locked}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailErr(validateEmail(email) ?? undefined)}
        />
        <div>
          <PasswordField
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            error={passwordErr}
            disabled={locked}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordErr(password ? undefined : "Please enter your password.")}
          />
          <div className="mt-1.5 text-right">
            <Link to="/forgot-password" className="font-body text-label font-semibold text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>
        </div>

        <label className="flex min-h-[44px] items-center gap-2 font-body text-body-md text-on-surface">
          <input
            type="checkbox"
            checked={remember}
            disabled={locked}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-5 w-5 flex-none rounded border-outline-variant"
            style={{ accentColor: "rgb(var(--c-primary))" }}
          />
          Remember me
        </label>

        <Button type="submit" fullWidth loading={submitting} disabled={locked}>
          {submitting ? "Logging in..." : "Log In"}
        </Button>
        <p aria-live="polite" className="sr-only">{submitting ? "Logging in" : ""}</p>
      </form>

      <p className="mt-md text-center font-body text-body-md text-on-surface-variant">
        New client?{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">Register here</Link>
      </p>
    </AuthLayout>
  );
}
