import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useRegistration } from "@/context/RegistrationContext";
import { registerClient } from "@/api/auth";
import { validateName, validateEmail, validateDateOfBirth } from "@/utils/validation";

const STEPS = ["Details", "Verify", "Password", "Done"];
type Field = "firstName" | "lastName" | "dateOfBirth" | "email";

const validators: Record<Field, (v: string) => string | null> = {
  firstName: validateName,
  lastName: validateName,
  dateOfBirth: validateDateOfBirth,
  email: validateEmail,
};

export default function Register() {
  const navigate = useNavigate();
  const { setRegistrationDetails } = useRegistration();

  const [values, setValues] = useState<Record<Field, string>>({ firstName: "", lastName: "", dateOfBirth: "", email: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const setField = (f: Field, v: string) => {
    setValues((s) => ({ ...s, [f]: v }));
    if (touched[f]) setErrors((e) => ({ ...e, [f]: validators[f](v) ?? undefined }));
  };
  const onBlur = (f: Field) => {
    setTouched((t) => ({ ...t, [f]: true }));
    setErrors((e) => ({ ...e, [f]: validators[f](values[f]) ?? undefined }));
  };

  const allFilled = (Object.keys(values) as Field[]).every((f) => values[f].trim() !== "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    (Object.keys(values) as Field[]).forEach((f) => {
      const msg = validators[f](values[f]);
      if (msg) next[f] = msg;
    });
    setTouched({ firstName: true, lastName: true, dateOfBirth: true, email: true });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setBanner(null);
    try {
      const res = await registerClient({ ...values });
      if (!res.matched) {
        setBanner(res.message);
        return;
      }
      setRegistrationDetails({ ...values, phoneLastFour: res.phoneLastFour });
      navigate("/verify-otp");
    } finally {
      setSubmitting(false);
    }
  };

  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <AuthLayout>
      <StepIndicator steps={STEPS} currentStep={0} />
      <h1 className="mt-md font-display text-headline-md font-bold text-on-surface">Create Your Account</h1>
      <p className="mt-1 font-body text-body-md text-on-surface-variant">
        Enter your details below. We will match them against our records.
      </p>

      {banner && (
        <div role="alert" className="mt-md flex items-start gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <Icon name="error" size={20} fill className="mt-0.5 flex-none" />
          <p className="min-w-0 flex-1 font-body text-body-md">{banner}</p>
          <button type="button" onClick={() => setBanner(null)} aria-label="Dismiss message" className="-m-1 grid h-8 w-8 flex-none place-items-center rounded-full hover:bg-on-error-container/10">
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      <form className="mt-md flex flex-col gap-md" onSubmit={submit} noValidate>
        <Input
          label="First Name"
          placeholder="Enter your first name"
          autoComplete="given-name"
          value={values.firstName}
          error={touched.firstName ? errors.firstName : undefined}
          onChange={(e) => setField("firstName", e.target.value)}
          onBlur={() => onBlur("firstName")}
        />
        <Input
          label="Last Name"
          placeholder="Enter your last name"
          autoComplete="family-name"
          value={values.lastName}
          error={touched.lastName ? errors.lastName : undefined}
          onChange={(e) => setField("lastName", e.target.value)}
          onBlur={() => onBlur("lastName")}
        />
        <Input
          label="Date of Birth"
          type="date"
          max={todayISO}
          value={values.dateOfBirth}
          error={touched.dateOfBirth ? errors.dateOfBirth : undefined}
          onChange={(e) => setField("dateOfBirth", e.target.value)}
          onBlur={() => onBlur("dateOfBirth")}
        />
        <Input
          label="Email Address"
          type="email"
          inputMode="email"
          placeholder="Enter your email address"
          autoComplete="email"
          value={values.email}
          error={touched.email ? errors.email : undefined}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={() => onBlur("email")}
        />

        <Button type="submit" fullWidth loading={submitting} disabled={!allFilled}>
          {submitting ? "Checking your details..." : "Continue"}
        </Button>
        <p aria-live="polite" className="sr-only">{submitting ? "Checking your details" : ""}</p>
      </form>

      <p className="mt-md text-center font-body text-body-md text-on-surface-variant">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
