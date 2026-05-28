import { motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { pageFade, pageRise, pageSlide } from "@/lib/motion";

/** Per-route wrapper that owns the page transition (slide mobile / fade-rise desktop). */
export function Page({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  const variants = reduce ? pageFade : desktop ? pageRise : pageSlide;

  // Each route mounts a fresh Page (keyed by pathname); start it at the top so a
  // new tab never appears mid-scroll. Runs before paint, so there's no flicker.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div variants={variants} initial="initial" animate="animate" exit="exit" aria-label={label} className={cn("focus:outline-none", className)}>
      {children}
    </motion.div>
  );
}
