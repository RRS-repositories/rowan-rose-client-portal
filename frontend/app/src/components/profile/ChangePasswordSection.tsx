import { useState, useId, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/useToast";
import { PasswordStrengthMeter, PasswordRequirementsList } from "@/components/auth/PasswordStrengthMeter";
import { changePassword } from "@/api/profile";
import { validatePassword } from "@/utils/validation";
import { formatDate } from "@/lib/format";

interface Props {
  passwordLastChanged: string | null;
  /** Called after a successful change so the parent can re-fetch profile and
   *  refresh the "Password last changed" display. */
  onChanged: () => void;
  loading?: boolean;
}

/**
 * Collapsible Change Password section (Phase 5.1, Task 4). Uses the same
 * AccordionItem motion pattern as Faq.tsx; honours prefers-reduced-motion.
 * Form validation reuses validatePassword() from Phase 1.3 so the rules stay
 * identical to registration.
 */
export function ChangePasswordSection({ passwordLastChanged, onChanged, loading }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reduce = useReducedMotion();
  const { push } = useToast();
  const panelId = useId();
  const reqsId = useId();

  const checks = validatePassword(next);
  const sameAsCurrent = next.length > 0 && next === current;
  const newValid = checks.isValid && !sameAsCurrent;
  const confirmValid = confirm.length > 0 && confirm === next;
  const canSubmit = current.length > 0 && newValid && confirmValid && !submitting;

  function reset() {
    setCurrent(""); setNext(""); setConfirm("");
    setCurrentError(null); setConfirmError(null); setSubmitError(null);
  }

  function close() {
    reset();
    setOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setCurrentError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await changePassword({ currentPassword: current, newPassword: next });
      if (!res.success) {
        setCurrentError(res.message);
        return;
      }
      push({ title: "Password changed", description: "Your password has been updated successfully.", tone: "success" });
      reset();
      setOpen(false);
      onChanged();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const lastChangedText = passwordLastChanged
    ? `Password last changed: ${formatDate(passwordLastChanged)}`
    : "Password last changed: Never";

  return (
    <section aria-labelledby="security-heading" className="skeuo-card rounded-xl">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-sm p-md text-left"
      >
        <div className="flex items-start gap-sm">
          <Icon name="shield" size={22} className="mt-0.5 flex-none text-primary" />
          <div>
            <h2 id="security-heading" className="font-headline-md text-headline-md text-on-surface">
              Account Security
            </h2>
            <p className="mt-0.5 font-body text-label font-normal text-on-surface-variant">
              {loading ? "Loading…" : lastChangedText}
            </p>
          </div>
        </div>
        <Icon
          name="expand_more"
          size={22}
          className={`flex-none text-on-surface-variant transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={reduce ? undefined : { height: 0, opacity: 0 }}
            animate={reduce ? undefined : { height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.3, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="border-t border-outline-variant/20 p-md">
              <div className="space-y-md">
                <PasswordField
                  label="Current Password"
                  placeholder="Enter your current password"
                  value={current}
                  onChange={(e) => { setCurrent(e.target.value); setCurrentError(null); }}
                  error={currentError ?? undefined}
                  autoComplete="current-password"
                  required
                />

                <div>
                  <PasswordField
                    label="New Password"
                    placeholder="Enter your new password"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    error={sameAsCurrent ? "New password must be different from your current password." : undefined}
                    describedById={reqsId}
                    autoComplete="new-password"
                    required
                  />
                  <PasswordStrengthMeter value={next} />
                  <PasswordRequirementsList value={next} id={reqsId} />
                </div>

                <PasswordField
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setConfirmError(null);
                  }}
                  onBlur={() => {
                    if (confirm && confirm !== next) setConfirmError("Passwords do not match.");
                  }}
                  error={confirmError ?? undefined}
                  autoComplete="new-password"
                  required
                />

                {submitError && (
                  <p role="alert" className="flex items-center gap-1 font-body text-label text-error">
                    <Icon name="error" size={16} fill /> {submitError}
                  </p>
                )}

                <div className="flex flex-col gap-sm sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={close} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={submitting} disabled={!canSubmit}>
                    Update Password
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
