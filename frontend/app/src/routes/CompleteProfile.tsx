import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useRegistration } from "@/context/RegistrationContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/useToast";
import { completeRegistration } from "@/api/auth";
import { validateName, validateDateOfBirth } from "@/utils/validation";

const STEPS = ["Email", "Verify", "Password", "Details"];
type Field = "fullName" | "phone" | "dob";

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "Please enter your phone number.";
  if (digits.length < 7 || digits.length > 15) return "Please enter a valid phone number.";
  return null;
}

const validators: Record<Field, (v: string) => string | null> = {
  fullName: validateName,
  phone: validatePhone,
  dob: validateDateOfBirth,
};

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { state, resetRegistration } = useRegistration();
  const { establishSession } = useAuth();
  const { push } = useToast();

  const [values, setValues] = useState<Record<Field, string>>({ fullName: "", phone: "", dob: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  if (!state.signupToken || !state.password) return <Navigate to="/register" replace />;

  const setField = (f: Field, v: string) => {
    setValues((s) => ({ ...s, [f]: v }));
    if (touched[f]) setErrors((e) => ({ ...e, [f]: validators[f](v) ?? undefined }));
  };
  const onBlur = (f: Field) => {
    setTouched((t) => ({ ...t, [f]: true }));
    setErrors((e) => ({ ...e, [f]: validators[f](values[f]) ?? undefined }));
  };

  const allFilled = (Object.keys(values) as Field[]).every((f) => values[f].trim() !== "");
  const todayISO = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    (Object.keys(values) as Field[]).forEach((f) => {
      const msg = validators[f](values[f]);
      if (msg) next[f] = msg;
    });
    setTouched({ fullName: true, phone: true, dob: true });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setBanner(null);
    try {
      const res = await completeRegistration({
        signupToken: state.signupToken,
        password: state.password,
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        dob: values.dob,
      });
      if (res.success && res.user) {
        establishSession(res.user, res.token);
        push({ title: `Welcome, ${res.user.firstName}!`, description: "Your account is all set up.", tone: "success" });
        resetRegistration();
        navigate("/dashboard", { replace: true });
        return;
      }
      setBanner(res.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <StepIndicator steps={STEPS} currentStep={3} />
      <h1 className="mt-md font-display text-headline-md font-bold text-on-surface">A Few More Details</h1>
      <p className="mt-1 font-body text-body-md text-on-surface-variant">
        Tell us a little about yourself to finish setting up your account.
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
          label="Full Name"
          placeholder="Enter your full name"
          autoComplete="name"
          value={values.fullName}
          error={touched.fullName ? errors.fullName : undefined}
          onChange={(e) => setField("fullName", e.target.value)}
          onBlur={() => onBlur("fullName")}
        />
        <Input
          label="Phone Number"
          type="tel"
          inputMode="tel"
          placeholder="Enter your phone number"
          autoComplete="tel"
          value={values.phone}
          error={touched.phone ? errors.phone : undefined}
          onChange={(e) => setField("phone", e.target.value)}
          onBlur={() => onBlur("phone")}
        />
        <Input
          label="Date of Birth"
          type="date"
          max={todayISO}
          hint="You must be 18 or older to register."
          value={values.dob}
          error={touched.dob ? errors.dob : undefined}
          onChange={(e) => setField("dob", e.target.value)}
          onBlur={() => onBlur("dob")}
        />

        <Button type="submit" fullWidth loading={submitting} disabled={!allFilled}>
          {submitting ? "Creating your account..." : "Create Account"}
        </Button>
        <p aria-live="polite" className="sr-only">{submitting ? "Creating your account" : ""}</p>
      </form>
    </AuthLayout>
  );
}
