import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

/** Branded launch screen — fades into the dashboard. */
export default function Splash() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  useEffect(() => {
    const t = window.setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
    return () => window.clearTimeout(t);
  }, [navigate]);

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6">
      <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.3, 0, 0, 1] }} className="text-center">
        <span aria-hidden="true" className="mx-auto grid h-20 w-20 place-items-center rounded-xl bg-primary text-3xl font-bold text-on-primary skeuo-raise" style={{ fontFamily: "var(--font-display)" }}>RR</span>
        <h1 className="mt-5 font-display text-display-lg-mobile font-bold text-on-surface">Rowan Rose</h1>
        <p className="font-body text-label-caps uppercase tracking-[0.18em] text-on-surface-variant">Fast Action Claims</p>
        <p className="mt-4 font-body text-body-md text-on-surface-variant">Your claim, clearly explained.</p>
        <button onClick={() => navigate("/dashboard", { replace: true })} className="mt-8 inline-flex min-h-[48px] items-center rounded-full px-6 font-button text-body-md text-primary hover:bg-primary/10">Continue</button>
      </motion.div>
    </div>
  );
}
