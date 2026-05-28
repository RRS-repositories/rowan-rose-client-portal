import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function PasswordResetSuccess() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center">
        <motion.span
          aria-hidden="true"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="grid h-20 w-20 place-items-center rounded-full bg-primary text-on-primary skeuo-raise"
        >
          <Icon name="check" size={44} fill />
        </motion.span>

        <h1 className="mt-md font-display text-headline-md font-bold text-on-surface">Password Changed</h1>
        <p className="mt-2 font-body text-body-md text-on-surface-variant">
          Your password has been reset successfully. You can now log in with your new password.
        </p>

        <Button className="mt-lg" fullWidth onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    </AuthLayout>
  );
}
