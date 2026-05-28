import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

/** Branded launch screen — after a brief hold, routes to the dashboard if a
 *  session is active, otherwise to login. */
export default function Splash() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { state } = useAuth();
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHeld(true), 1800);
    return () => window.clearTimeout(t);
  }, []);

  // Wait out the splash hold and the (mock) session check, then route.
  useEffect(() => {
    if (!held || state.isLoading) return;
    navigate(state.isAuthenticated ? "/dashboard" : "/login", { replace: true });
  }, [held, state.isLoading, state.isAuthenticated, navigate]);

  const go = () => {
    if (state.isLoading) return;
    navigate(state.isAuthenticated ? "/dashboard" : "/login", { replace: true });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6">
      <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.3, 0, 0, 1] }} className="text-center">
        <span aria-hidden="true" className="mx-auto grid h-20 w-20 place-items-center rounded-xl bg-primary text-3xl font-bold text-on-primary skeuo-raise" style={{ fontFamily: "var(--font-display)" }}>RR</span>
        <h1 className="mt-5 text-display-lg-mobile font-bold text-on-surface" style={{ fontFamily: '"Times New Roman", Times, serif' }}>Rowan Rose Solicitors</h1>
        <p className="mt-4 font-body text-body-md text-on-surface-variant">Your claim, clearly explained.</p>
        <button onClick={go} className="mt-8 inline-flex min-h-[48px] items-center rounded-full px-6 font-button text-body-md text-primary hover:bg-primary/10">Continue</button>
      </motion.div>
    </div>
  );
}
