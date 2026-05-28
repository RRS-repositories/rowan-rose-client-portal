import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/useToast";
import { requestPasswordReset } from "@/api/auth";

const MAX_RESENDS = 3;
const COOLDOWN_MS = 60 * 1000;

export default function CheckEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { push } = useToast();
  const email = (location.state as { email?: string } | null)?.email;

  const [resends, setResends] = useState(0);
  const [sending, setSending] = useState(false);
  // A link was just sent on the previous page — start the cooldown immediately.
  const [cooldownEnd, setCooldownEnd] = useState(() => Date.now() + COOLDOWN_MS);
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  // Reached directly without an email in route state — send them back.
  if (!email) return <Navigate to="/forgot-password" replace />;

  const cooling = nowTs < cooldownEnd;
  const exhausted = resends >= MAX_RESENDS;
  const secondsLeft = Math.max(0, Math.ceil((cooldownEnd - nowTs) / 1000));

  const resend = async () => {
    if (cooling || exhausted || sending) return;
    setSending(true);
    try {
      await requestPasswordReset({ email });
      setResends((c) => c + 1);
      setCooldownEnd(Date.now() + COOLDOWN_MS);
      push({ title: "Reset link sent again", description: `Check ${email} once more.`, tone: "success" });
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center">
        <span aria-hidden className="grid h-20 w-20 place-items-center rounded-full bg-primary-container text-on-primary-container skeuo-inner-highlight">
          <Icon name="mail" size={44} fill />
        </span>

        <h1 className="mt-md font-display text-headline-md font-bold text-on-surface">Check Your Email</h1>
        <p className="mt-2 font-body text-body-md text-on-surface-variant">
          We have sent a password reset link to <span className="font-semibold text-on-surface">{email}</span>. The link is valid for 1 hour.
        </p>
        <p className="mt-2 font-body text-label text-on-surface-variant/80">
          If you do not see the email, please check your spam folder.
        </p>

        <Button variant="secondary" className="mt-lg" fullWidth onClick={() => navigate("/login")}>
          Back to Login
        </Button>

        <div className="mt-md font-body text-body-md text-on-surface-variant" aria-live="polite">
          {exhausted ? (
            <span>You have reached the maximum number of resend attempts.</span>
          ) : cooling ? (
            <span>
              Didn't receive the email? You can resend in{" "}
              <span className="font-semibold tabular-nums text-on-surface">{secondsLeft}s</span>
            </span>
          ) : (
            <>
              Didn't receive the email?{" "}
              <button
                type="button"
                onClick={resend}
                disabled={sending}
                className="font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {sending ? "Resending..." : "Resend"}
              </button>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
