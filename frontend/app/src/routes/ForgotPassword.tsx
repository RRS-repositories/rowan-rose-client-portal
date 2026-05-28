import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requestPasswordReset } from "@/api/auth";
import { validateEmail } from "@/utils/validation";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const err = validateEmail(email);
    setError(err ?? undefined);
    if (err) return;

    setSubmitting(true);
    try {
      // Always succeeds — the mock never reveals whether the email is registered.
      await requestPasswordReset({ email });
      navigate("/check-email", { state: { email } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-headline-md font-bold text-on-surface">Reset Your Password</h1>
      <p className="mt-1 font-body text-body-md text-on-surface-variant">
        Enter your email address and we will send you a link to reset your password.
      </p>

      <form className="mt-md flex flex-col gap-md" onSubmit={submit} noValidate>
        <Input
          label="Email Address"
          type="email"
          inputMode="email"
          placeholder="Enter your registered email address"
          autoComplete="email"
          value={email}
          error={error}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setError(validateEmail(email) ?? undefined)}
        />
        <Button type="submit" fullWidth loading={submitting} disabled={email.trim() === ""}>
          {submitting ? "Sending..." : "Send Reset Link"}
        </Button>
        <p aria-live="polite" className="sr-only">{submitting ? "Sending reset link" : ""}</p>
      </form>

      <div className="mt-md flex flex-col items-center gap-2 text-center font-body text-body-md text-on-surface-variant">
        <Link to="/login" className="font-semibold text-primary hover:underline">Back to login</Link>
        <span>
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">Register</Link>
        </span>
      </div>
    </AuthLayout>
  );
}
