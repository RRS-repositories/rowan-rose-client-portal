import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { useRegistration } from "@/context/RegistrationContext";
import { validatePassword, passwordStrength, validatePasswordMatch } from "@/utils/validation";

const STEPS = ["Email", "Verify", "Password", "Details"];

const REQUIREMENTS = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasUppercase", label: "One uppercase letter (A–Z)" },
  { key: "hasLowercase", label: "One lowercase letter (a–z)" },
  { key: "hasNumber", label: "One number (0–9)" },
] as const;

// Index by filled-segment count (1–4). Mid tones chosen to read in light + dark.
const STRENGTH = [
  { label: "", bar: "", text: "" },
  { label: "Weak", bar: "bg-error", text: "text-error" },
  { label: "Fair", bar: "bg-[#d98324]", text: "text-[#c2701a]" },
  { label: "Good", bar: "bg-[#9aa011]", text: "text-[#7f8a00]" },
  { label: "Strong", bar: "bg-primary", text: "text-primary" },
] as const;

export default function CreatePassword() {
  const navigate = useNavigate();
  const { state, setPassword: storePassword } = useRegistration();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const reqId = "pw-requirements";

  if (!state.signupToken) return <Navigate to="/register" replace />;

  const checks = validatePassword(password);
  const strength = passwordStrength(password);
  const filled = password.length === 0 ? 0 : strength < 2 ? 1 : strength;
  const meta = STRENGTH[filled];
  const matchError = confirmTouched ? validatePasswordMatch(password, confirm) : null;
  const canSubmit = checks.isValid && confirm.length > 0 && password === confirm;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    // Hold the password; the account is created on the next (profile) step.
    setSubmitting(true);
    storePassword(password);
    navigate("/complete-profile");
  };

  return (
    <AuthLayout>
      <StepIndicator steps={STEPS} currentStep={2} />
      <h1 className="mt-md font-display text-headline-md font-bold text-on-surface">Create Your Password</h1>
      <p className="mt-1 font-body text-body-md text-on-surface-variant">Choose a strong password for your account.</p>

      <form className="mt-md flex flex-col gap-md" onSubmit={submit}>
        <PasswordField
          label="Password"
          placeholder="Create your password"
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
          label="Confirm Password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={confirm}
          error={matchError ?? undefined}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setConfirmTouched(true)}
        />

        <Button type="submit" fullWidth loading={submitting} disabled={!canSubmit}>
          Continue
        </Button>
      </form>
    </AuthLayout>
  );
}
