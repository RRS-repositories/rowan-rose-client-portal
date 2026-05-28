import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Inactivity → auto-logout tracking for the authenticated session (Phase 1.4).
 *
 * Activity (mouse / key / touch / scroll) refreshes a timestamp; once 25 minutes
 * pass with no activity a warning fires, and at 30 minutes the session is ended.
 * Timestamp writes are throttled (once per THROTTLE_MS) to avoid churn, and the
 * elapsed check is paused while the tab is hidden — resumed (and re-evaluated)
 * when it becomes visible again (Page Visibility API).
 *
 * The provider owns the refs so it can reset them ("Stay Logged In") without this
 * hook re-subscribing: while `warnedRef` is set, activity no longer pushes the
 * deadline out, so only an explicit choice can clear the warning.
 *
 * Production timing. Overridable per-call so the live demo can run in seconds.
 */
export const INACTIVITY_WARNING_MS = 25 * 60 * 1000;
export const INACTIVITY_LOGOUT_MS = 30 * 60 * 1000;

const THROTTLE_MS = 30 * 1000; // record activity at most this often
const CHECK_INTERVAL_MS = 15 * 1000; // how often the elapsed check runs

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

interface Options {
  enabled: boolean;
  /** now − this = inactivity elapsed. Frozen by the provider while warned. */
  lastActivityRef: MutableRefObject<number>;
  /** True once the warning is shown; gates further deadline pushes + re-warns. */
  warnedRef: MutableRefObject<boolean>;
  onWarn: () => void;
  onLogout: () => void;
  warningMs?: number;
  logoutMs?: number;
}

export function useInactivityTimer({
  enabled,
  lastActivityRef,
  warnedRef,
  onWarn,
  onLogout,
  warningMs = INACTIVITY_WARNING_MS,
  logoutMs = INACTIVITY_LOGOUT_MS,
}: Options) {
  // Keep callbacks current without re-subscribing the listeners every render.
  const onWarnRef = useRef(onWarn);
  const onLogoutRef = useRef(onLogout);
  onWarnRef.current = onWarn;
  onLogoutRef.current = onLogout;

  useEffect(() => {
    if (!enabled) return;

    let lastWrite = 0;
    const recordActivity = () => {
      if (warnedRef.current) return; // require an explicit choice once warned
      const now = Date.now();
      if (now - lastWrite < THROTTLE_MS) return;
      lastWrite = now;
      lastActivityRef.current = now;
    };

    const check = () => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= logoutMs) {
        onLogoutRef.current();
      } else if (elapsed >= warningMs && !warnedRef.current) {
        onWarnRef.current();
      }
    };

    let interval = window.setInterval(check, CHECK_INTERVAL_MS);

    const onVisibility = () => {
      if (document.hidden) {
        window.clearInterval(interval);
      } else {
        check(); // catch up on any time that passed while hidden
        interval = window.setInterval(check, CHECK_INTERVAL_MS);
      }
    };

    for (const evt of ACTIVITY_EVENTS) {
      document.addEventListener(evt, recordActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      for (const evt of ACTIVITY_EVENTS) document.removeEventListener(evt, recordActivity);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, lastActivityRef, warnedRef, warningMs, logoutMs]);
}
