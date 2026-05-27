import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useRegistration } from "@/context/RegistrationContext";
import { useToast } from "@/components/ui/useToast";
import { verifyOtp, resendOtp } from "@/api/auth";

const STEPS = ["Details", "Verify", "Password", "Done"];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { state, setOtpVerified, setOtpAttemptsRemaining, decrementResendAttempts } = useRegistration();
  const { push } = useToast();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expiresIn, setExpiresIn] = useState(300);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    const id = window.setInterval(() => {
      setExpiresIn((s) => (s > 0 ? s - 1 : 0));
      setCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!state.email) return <Navigate to="/register" replace />;

  const expired = expiresIn === 0;
  const locked = state.isLocked;
  const resendsLeft = state.resendAttemptsRemaining;
  const canResend = cooldown === 0 && resendsLeft > 0 && !locked;

  const onVerify = async () => {
    if (otp.length < 6 || submitting || locked || expired) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await verifyOtp({ email: state.email, otp });
      if (res.verified) {
        setOtpVerified(res.token);
        navigate("/create-password");
        return;
      }
      setOtp("");
      setOtpAttemptsRemaining(res.attemptsRemaining);
      setError(res.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!canResend) return;
    decrementResendAttempts();
    setOtp("");
    setError(null);
    setExpiresIn(300);
    setCooldown(30);
    await resendOtp({ email: state.email });
    push({ title: "New code sent", description: `To your phone ending ${state.phoneLastFour}`, tone: "success" });
  };

  return (
    <AuthLayout>
      <StepIndicator steps={STEPS} currentStep={1} />
      <h1 className="mt-md font-display text-headline-md font-bold text-on-surface">Verify Your Identity</h1>
      <p className="mt-1 font-body text-body-md text-on-surface-variant">
        We have sent a 6-digit code to your phone number ending in ****{state.phoneLastFour}.
      </p>

      <form className="mt-md flex flex-col gap-md" onSubmit={(e) => { e.preventDefault(); onVerify(); }}>
        <OtpInput value={otp} onChange={setOtp} error={!!error || expired} disabled={locked} />

        {error && <p role="alert" className="text-center font-body text-body-md text-error">{error}</p>}

        {!locked && (
          <p className={cn("text-center font-body text-body-md", expired ? "text-error" : "text-on-surface-variant")}>
            {expired ? "Code expired. Please request a new code." : `Code expires in ${fmt(expiresIn)}`}
          </p>
        )}

        <Button type="submit" fullWidth loading={submitting} disabled={otp.length < 6 || locked || expired}>
          {submitting ? "Verifying..." : "Verify"}
        </Button>
        <p aria-live="polite" className="sr-only">{submitting ? "Verifying your code" : ""}</p>
      </form>

      <div className="mt-md text-center font-body text-body-md text-on-surface-variant">
        {locked ? null : resendsLeft === 0 ? (
          <p>Maximum resend attempts reached. Please try again later or contact us.</p>
        ) : (
          <p>
            Didn't receive the code?{" "}
            {canResend ? (
              <button type="button" onClick={onResend} className="font-semibold text-primary hover:underline">Resend</button>
            ) : (
              <span className="text-on-surface-variant/70">Resend in {cooldown}s</span>
            )}
          </p>
        )}
      </div>

      <p className="mt-sm text-center">
        <Link to="/register" className="font-body text-body-md font-semibold text-primary hover:underline">Back to registration</Link>
      </p>
    </AuthLayout>
  );
}
