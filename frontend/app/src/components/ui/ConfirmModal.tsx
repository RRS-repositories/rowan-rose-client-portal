import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import {
  useFloating, useDismiss, useRole, useInteractions, useTransitionStyles,
  FloatingPortal, FloatingOverlay, FloatingFocusManager,
} from "@floating-ui/react";
import { Button } from "./Button";
import { Icon } from "./Icon";

type Tone = "default" | "warning" | "danger";

interface Props {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Visual tone — picks the icon and the confirm button variant. */
  tone?: Tone;
  /** Material Symbols icon name for the header. Defaults follow tone. */
  icon?: string;
  /** Disable the confirm button (e.g. while a network call is in flight). */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const TONE_DEFAULTS: Record<Tone, { icon: string; iconCls: string; variant: "primary" | "destructive" | "secondary" }> = {
  default: { icon: "info", iconCls: "text-primary bg-surface-container-high", variant: "primary" },
  warning: { icon: "warning", iconCls: "text-tertiary bg-surface-container-high", variant: "primary" },
  danger: { icon: "error", iconCls: "text-error bg-surface-container-high", variant: "destructive" },
};

/**
 * Generic confirmation alertdialog (Phase 5.1). Same shell as LogoutModal —
 * FloatingPortal + FloatingFocusManager (focus trap) + role="alertdialog" +
 * Escape / backdrop press = cancel. Used by the notification warning, log-out-
 * everywhere, and data-export flows on /profile. Reduced-motion aware.
 */
export function ConfirmModal({
  open, title, body, confirmLabel, cancelLabel = "Cancel", tone = "default", icon, loading, onConfirm, onCancel,
}: Props) {
  const reduce = useReducedMotion();
  const meta = TONE_DEFAULTS[tone];
  const iconName = icon ?? meta.icon;

  const { refs, context } = useFloating({
    open,
    onOpenChange: (next) => { if (!next) onCancel(); },
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
      <FloatingOverlay
        lockScroll
        className="z-[80] grid place-items-center bg-black/50 p-margin-mobile"
        style={{ opacity: styles.opacity }}
      >
        <FloatingFocusManager context={context} modal returnFocus>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            style={styles}
            className="skeuo-card w-full max-w-[26rem] rounded-xl p-md"
          >
            <div className="flex flex-col items-center text-center">
              <span aria-hidden className={`grid h-16 w-16 place-items-center rounded-full skeuo-inner-highlight ${meta.iconCls}`}>
                <Icon name={iconName} size={30} fill={tone !== "default"} />
              </span>
              <h2 id="confirm-title" className="mt-md font-display text-headline-md font-bold text-on-surface">
                {title}
              </h2>
              <div id="confirm-desc" className="mt-2 font-body text-body-md text-on-surface-variant">
                {body}
              </div>
            </div>

            <div className="mt-md flex flex-col gap-sm">
              <Button variant={meta.variant} fullWidth onClick={onConfirm} loading={loading}>
                {confirmLabel}
              </Button>
              <Button variant="ghost" fullWidth onClick={onCancel} disabled={loading}>
                {cancelLabel}
              </Button>
            </div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}
