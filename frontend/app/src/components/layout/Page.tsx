import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { pageFade, pageRise, pageSlide } from "@/lib/motion";

/** Per-route wrapper that owns the page transition (slide mobile / fade-rise desktop). */
export function Page({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  const variants = reduce ? pageFade : desktop ? pageRise : pageSlide;
  return (
    <motion.div variants={variants} initial="initial" animate="animate" exit="exit" aria-label={label} className={cn("focus:outline-none", className)}>
      {children}
    </motion.div>
  );
}
