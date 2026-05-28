import { useReducedMotion } from "framer-motion";
import {
  useFloating, useDismiss, useRole, useInteractions, useTransitionStyles,
  FloatingPortal, FloatingOverlay, FloatingFocusManager,
} from "@floating-ui/react";
import { Button } from "./Button";
import { Icon } from "./Icon";

/**
 * Logout confirmation (Phase 1.4, Task 12). role="alertdialog" with a trapped
 * focus loop; Escape / backdrop press resolve to the safe default (Cancel).
 */
interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutModal({ open, onConfirm, onCancel }: Props) {
  const reduce = useReducedMotion();

  const { refs, context } = useFloating({
    open,
    onOpenChange: (next) => {
      if (!next) onCancel(); // Escape / backdrop = cancel
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

  if (!isMounted) return null;

  return (
    <FloatingPortal>
      <FloatingOverlay lockScroll className="z-[80] grid place-items-center bg-black/50 p-margin-mobile" style={{ opacity: styles.opacity }}>
        <FloatingFocusManager context={context} modal returnFocus>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            aria-labelledby="logout-title"
            aria-describedby="logout-desc"
            style={styles}
            className="skeuo-card w-full max-w-[26rem] rounded-xl p-md"
          >
            <div className="flex flex-col items-center text-center">
              <span aria-hidden className="grid h-16 w-16 place-items-center rounded-full bg-surface-container-high text-on-surface-variant skeuo-inner-highlight">
                <Icon name="logout" size={30} />
              </span>
              <h2 id="logout-title" className="mt-md font-display text-headline-md font-bold text-on-surface">
                Log Out
              </h2>
              <p id="logout-desc" className="mt-2 font-body text-body-md text-on-surface-variant">
                Are you sure you want to log out? You will need to log in again to access your claims.
              </p>
            </div>

            <div className="mt-md flex flex-col gap-sm">
              <Button variant="destructive" fullWidth onClick={onConfirm}>Log Out</Button>
              <Button variant="ghost" fullWidth onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}
