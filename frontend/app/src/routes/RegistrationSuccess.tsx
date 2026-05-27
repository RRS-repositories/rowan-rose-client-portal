import { Navigate, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useRegistration } from "@/context/RegistrationContext";

const STEPS = ["Details", "Verify", "Password", "Done"];

export default function RegistrationSuccess() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { state } = useRegistration();

  if (!state.otpToken) return <Navigate to="/register" replace />;

  return (
    <AuthLayout>
      <StepIndicator steps={STEPS} currentStep={3} />
      <div className="mt-lg flex flex-col items-center text-center">
        <motion.span
          aria-hidden="true"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="grid h-20 w-20 place-items-center rounded-full bg-primary text-on-primary skeuo-raise"
        >
          <Icon name="check" size={44} fill />
        </motion.span>

        <h1 className="mt-md font-display text-headline-md font-bold text-on-surface">You're All Set!</h1>
        <p className="mt-2 font-body text-body-md text-on-surface-variant">
          Your account has been created successfully. You can now log in to view your claims, upload documents, and track your progress.
        </p>

        <Button className="mt-lg" fullWidth onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>

        <p className="mt-md font-body text-label text-on-surface-variant">
          Need help? Contact us at{" "}
          <a href="mailto:support@rowanrose.co.uk" className="font-semibold text-primary hover:underline">support@rowanrose.co.uk</a>
        </p>
      </div>
    </AuthLayout>
  );
}
