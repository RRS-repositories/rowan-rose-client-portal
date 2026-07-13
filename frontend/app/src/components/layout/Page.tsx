import { motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { pageFade, pageRise, pageSlide } from "@/lib/motion";

// In the native app (Android/iOS WebView) the AnimatePresence page transition
// can deadlock — the exit animation fails to signal completion, so the next
// page never mounts and the screen goes blank (reproduced on-device after a
// theme change). Rather than animate a path that can strand the UI, native
// builds swap pages instantly (always visible, no AnimatePresence dependency).
// Web / PWA keeps the full animated transition.
const NATIVE = Capacitor.isNativePlatform();

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

  if (NATIVE) {
    return (
      <div aria-label={label} className={cn("focus:outline-none", className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div data-rr-motion variants={variants} initial="initial" animate="animate" exit="exit" aria-label={label} className={cn("focus:outline-none", className)}>
      {children}
    </motion.div>
  );
}
