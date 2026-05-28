import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { setNewPassword } from "@/api/auth";
import { validatePassword, passwordStrength, validatePasswordMatch } from "@/utils/validation";

// Mirrors the Phase 1.3 CreatePassword page so the reset form feels identical.
const REQUIREMENTS = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasUppercase", label: "One uppercase letter (A–Z)" },
  { key: "hasLowercase", label: "One lowercase letter (a–z)" },
  { key: "hasNumber", label: "One number (0–9)" },
] as const;

const STRENGTH = [
  { label: "", bar: "", text: "" },
  { label: "Weak", bar: "bg-error", text: "text-error" },
  { label: "Fair", bar: "bg-[#d98324]", text: "text-[#c2701a]" },
  { label: "Good", bar: "bg-[#9aa011]", text: "text-[#7f8a00]" },
  { label: "Strong", bar: "bg-primary", text: "text-primary" },
] as const;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const reqId = "reset-pw-requirements";

  // No token in the URL → the link is invalid; can't reset.
  if (!token) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          <span aria-hidden className="grid h-20 w-20 place-items-center rounded-full bg-error-container text-on-error-container skeuo-inner-highlight">
            <Icon name="link_off" size={42} fill />
          </span>
          <h1 className="mt-md font-display text-headline-md font-bold text-on-surface">Invalid Reset Link</h1>
          <p className="mt-2 font-body text-body-md text-on-surface-variant">
            Invalid or expired reset link. Please request a new one.
          </p>
          <Button className="mt-lg" fullWidth onClick={() => navigate("/forgot-password")}>
            Request a New Link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const checks = validatePassword(password);
  const strength = passwordStrength(password);
  const filled = password.length === 0 ? 0 : strength < 2 ? 1 : strength;
  const meta = STRENGTH[filled];
  const matchError = confirmTouched ? validatePasswordMatch(password, confirm) : null;
  const canSubmit = checks.isValid && confirm.length > 0 && password === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setBanner(null);
    try {
      const res = await setNewPassword({ token, newPassword: password });
      if (res.success) {
        navigate("/password-reset-success");
        return;
      }
      setBanner(res.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-headline-md font-bold text-on-surface">Set New Password</h1>
      <p className="mt-1 font-body text-body-md text-on-surface-variant">Enter your new password below.</p>

      {banner && (
        <div role="alert" className="mt-md rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <div className="flex items-start gap-2">
            <Icon name="error" size={20} fill className="mt-0.5 flex-none" />
            <p className="min-w-0 flex-1 font-body text-body-md">{banner}</p>
          </div>
          <Link to="/forgot-password" className="mt-1 inline-block font-body text-label font-semibold underline">
            Request a new reset link
          </Link>
        </div>
      )}

      <form className="mt-md flex flex-col gap-md" onSubmit={submit} noValidate>
        <PasswordField
          label="New Password"
          placeholder="Create your new password"
          autoComplete="new-password"
          value={password}
          describedById={reqId}
          onChange={(e) => setPassword(e.target.value)}
        />

        <ul id={reqId} className="-mt-1 flex flex-col gap-1.5">
          {REQUIREMENTS.map((r) => {
            const met = checks[r.key];
            return (
              <li key={r.key} className={cn("flex items-center gap-2 font-body text-label", met ? "text-primary" : "text-on-surface-variant")}>
                <Icon name={met ? "check_circle" : "close"} size={16} fill={met} className="flex-none" />
                {r.label}
              </li>
            );
          })}
        </ul>

        <div aria-hidden={password.length === 0}>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < filled ? meta.bar : "bg-outline-variant/40")} />
            ))}
          </div>
          {meta.label && <p className={cn("mt-1 font-body text-label font-semibold", meta.text)}>{meta.label}</p>}
        </div>

        <PasswordField
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          value={confirm}
          error={matchError ?? undefined}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setConfirmTouched(true)}
        />

        <Button type="submit" fullWidth loading={submitting} disabled={!canSubmit}>
          {submitting ? "Resetting your password..." : "Reset Password"}
        </Button>
        <p aria-live="polite" className="sr-only">{submitting ? "Resetting your password" : ""}</p>
      </form>
    </AuthLayout>
  );
}
