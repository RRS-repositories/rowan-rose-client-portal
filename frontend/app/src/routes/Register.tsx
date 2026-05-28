import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useRegistration } from "@/context/RegistrationContext";
import { registerStart } from "@/api/auth";
import { validateEmail } from "@/utils/validation";

const STEPS = ["Email", "Verify", "Password", "Details"];

export default function Register() {
  const navigate = useNavigate();
  const { setEmail } = useRegistration();
  const [email, setEmailValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    setError(err ?? undefined);
    if (err) return;
    setSubmitting(true);
    setBanner(null);
    try {
      const res = await registerStart({ email });
      if (!res.sent) {
        setBanner(res.message);
        return;
      }
      setEmail(email, res.devCode ?? null);
      navigate("/verify-otp");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <StepIndicator steps={STEPS} currentStep={0} />
      <h1 className="mt-md font-display text-headline-md font-bold text-on-surface">Create Your Account</h1>
      <p className="mt-1 font-body text-body-md text-on-surface-variant">
        Enter your email address and we will send you a 6-digit verification code.
      </p>

      {banner && (
        <div role="alert" className="mt-md flex items-start gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <Icon name="info" size={20} fill className="mt-0.5 flex-none" />
          <p className="min-w-0 flex-1 font-body text-body-md">{banner}</p>
          <button type="button" onClick={() => setBanner(null)} aria-label="Dismiss message" className="-m-1 grid h-8 w-8 flex-none place-items-center rounded-full hover:bg-on-error-container/10">
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      <form className="mt-md flex flex-col gap-md" onSubmit={submit} noValidate>
        <Input
          label="Email Address"
          type="email"
          inputMode="email"
          placeholder="Enter your email address"
          autoComplete="email"
          value={email}
          error={error}
          onChange={(e) => setEmailValue(e.target.value)}
          onBlur={() => setError(validateEmail(email) ?? undefined)}
        />
        <Button type="submit" fullWidth loading={submitting} disabled={email.trim() === ""}>
          {submitting ? "Sending code..." : "Continue"}
        </Button>
        <p aria-live="polite" className="sr-only">{submitting ? "Sending verification code" : ""}</p>
      </form>

      <p className="mt-md text-center font-body text-body-md text-on-surface-variant">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
