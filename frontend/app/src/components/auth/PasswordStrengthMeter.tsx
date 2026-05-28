import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { validatePassword, passwordStrength, type PasswordChecks } from "@/utils/validation";

/** 4-segment strength bar driven by passwordStrength() (0–4 met rules).
 *  Reusable from the registration / reset flows in a future phase. */
export function PasswordStrengthMeter({ value, id }: { value: string; id?: string }) {
  const score = passwordStrength(value);
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const;
  const label = labels[score];
  const toneCls = [
    "bg-surface-container-highest",
    "bg-error",
    "bg-tertiary",
    "bg-primary/60",
    "bg-primary",
  ][score];

  return (
    <div id={id} aria-live="polite" className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < score ? toneCls : "bg-surface-container-highest",
            )}
          />
        ))}
      </div>
      {value && (
        <p className="mt-1 font-body text-label font-normal text-on-surface-variant">
          Password strength: <span className="font-semibold text-on-surface">{label}</span>
        </p>
      )}
    </div>
  );
}

/** Real-time requirements checklist for the change-password form. Mirrors
 *  validatePassword() — minLength, uppercase, lowercase, number. */
export function PasswordRequirementsList({ value, id }: { value: string; id?: string }) {
  const checks: PasswordChecks = validatePassword(value);
  const items: { key: keyof Omit<PasswordChecks, "isValid">; label: string }[] = [
    { key: "minLength", label: "At least 8 characters" },
    { key: "hasUppercase", label: "An uppercase letter (A–Z)" },
    { key: "hasLowercase", label: "A lowercase letter (a–z)" },
    { key: "hasNumber", label: "A number (0–9)" },
  ];

  return (
    <ul id={id} className="mt-2 space-y-1" aria-label="Password requirements">
      {items.map(({ key, label }) => {
        const ok = checks[key];
        return (
          <li key={key} className="flex items-center gap-1.5 font-body text-label">
            <Icon
              name={ok ? "check_circle" : "radio_button_unchecked"}
              size={16}
              fill={ok}
              className={ok ? "text-primary" : "text-on-surface-variant"}
            />
            <span className={ok ? "text-on-surface" : "text-on-surface-variant"}>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
