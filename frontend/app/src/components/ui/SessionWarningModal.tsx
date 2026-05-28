import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  useFloating, useDismiss, useRole, useInteractions, useTransitionStyles,
  FloatingPortal, FloatingOverlay, FloatingFocusManager,
} from "@floating-ui/react";
import { Button } from "./Button";
import { Icon } from "./Icon";

/**
 * Idle-session warning (Phase 1.4, Task 2). Shown at 25 minutes of inactivity
 * with a live countdown to the 30-minute auto-logout. role="alertdialog" with a
 * trapped focus loop; Escape / backdrop press resolve to the safe default
 * ("Stay Logged In"). The countdown ticks locally and triggers logout at zero.
 */
function format(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  open: boolean;
  /** Timestamp (ms) at which the session will end. */
  deadline: number;
  onStay: () => void;
  /** Explicit "Log Out Now" press. */
  onLogout: () => void;
  /** Countdown reached zero — auto-logout for inactivity. */
  onExpire: () => void;
}

export function SessionWarningModal({ open, deadline, onStay, onLogout, onExpire }: Props) {
  const reduce = useReducedMotion();
  const [remaining, setRemaining] = useState(() => deadline - Date.now());
  const firedRef = useRef(false);

  const { refs, context } = useFloating({
    open,
    onOpenChange: (next) => {
      if (!next) onStay(); // Escape / backdrop = stay logged in
    },
  });
  const { getFloatingProps } = useInteractions([
    useDismiss(context),
    useRole(context, { role: "alertdialog" }),
  ]);
  const { isMounted, styles } = useTransitionStyles(context, {
    duration: reduce ? 0 : 180,
    initial: { opacity: 0, transform: reduce ? "none" : "scale(0.96)" },
  });

  // Tick the countdown while open; end the session when it reaches zero.
  useEffect(() => {
    if (!open) return;
    firedRef.current = false;
    const tick = () => {
      const left = deadline - Date.now();
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [open, deadline, onExpire]);

  if (!isMounted) return null;

  return (
    <FloatingPortal>
      <FloatingOverlay lockScroll className="z-[80] grid place-items-center bg-black/50 p-margin-mobile" style={{ opacity: styles.opacity }}>
        <FloatingFocusManager context={context} modal returnFocus>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            aria-labelledby="session-warning-title"
            aria-describedby="session-warning-desc"
            style={styles}
            className="skeuo-card w-full max-w-[26rem] rounded-xl p-md"
          >
            <div className="flex flex-col items-center text-center">
              <span aria-hidden className="grid h-16 w-16 place-items-center rounded-full bg-tertiary-container text-on-tertiary-container skeuo-inner-highlight">
                <Icon name="schedule" size={32} fill />
              </span>
              <h2 id="session-warning-title" className="mt-md font-display text-headline-md font-bold text-on-surface">
                Session Expiring Soon
              </h2>
              <p id="session-warning-desc" className="mt-2 font-body text-body-md text-on-surface-variant">
                You have been inactive for 25 minutes. Your session will end in{" "}
                <span className="font-bold tabular-nums text-on-surface">{format(remaining)}</span> to protect your account.
              </p>
            </div>

            <div className="mt-md flex flex-col gap-sm">
              <Button fullWidth onClick={onStay}>Stay Logged In</Button>
              <Button variant="ghost" fullWidth onClick={onLogout}>Log Out Now</Button>
            </div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}
