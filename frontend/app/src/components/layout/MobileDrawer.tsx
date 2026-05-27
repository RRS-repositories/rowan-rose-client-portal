import { NavLink } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import {
  useFloating, useDismiss, useRole, useInteractions, useTransitionStyles,
  FloatingPortal, FloatingOverlay, FloatingFocusManager,
} from "@floating-ui/react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { NAV_ITEMS } from "./navItems";

/**
 * Mobile navigation drawer — slides in from the left over a dimmed backdrop.
 * Focus is trapped (FloatingFocusManager, modal); Escape and backdrop-press
 * close it (useDismiss); body scroll is locked (FloatingOverlay). Enter/exit
 * slide is via useTransitionStyles and collapses to a fade when reduced motion
 * is requested. Adds Log Out (no-op until Phase 1.4) alongside the primary nav.
 */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  const { refs, context } = useFloating({
    open,
    onOpenChange: (next) => {
      if (!next) onClose();
    },
  });
  const { getFloatingProps } = useInteractions([
    useDismiss(context, { outsidePressEvent: "mousedown" }),
    useRole(context, { role: "dialog" }),
  ]);

  const { isMounted, styles: panelStyles } = useTransitionStyles(context, {
    duration: reduce ? 0 : 200,
    initial: { transform: "translateX(-100%)", opacity: reduce ? 0 : 1 },
  });
  const { styles: backdropStyles } = useTransitionStyles(context, {
    duration: reduce ? 0 : 200,
    initial: { opacity: 0 },
  });

  if (!isMounted) return null;

  return (
    <FloatingPortal>
      <FloatingOverlay lockScroll className="z-[60] bg-black/50 md:hidden" style={backdropStyles}>
        <FloatingFocusManager context={context} modal returnFocus>
          <aside
            ref={refs.setFloating}
            {...getFloatingProps()}
            aria-label="Navigation menu"
            style={panelStyles}
            className="fixed inset-y-0 left-0 flex w-[min(20rem,82vw)] flex-col gap-md bg-surface px-margin-mobile py-md shadow-[8px_0_32px_rgba(0,0,0,0.24)]"
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="grid h-12 w-12 flex-none place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface skeuo-press"
              >
                <Icon name="close" size={24} />
              </button>
            </div>

            <nav aria-label="Primary" className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-[56px] items-center gap-sm rounded-xl px-md font-button text-button transition-colors",
                      isActive
                        ? "bg-primary-container text-on-primary-container shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon name={item.icon} size={24} fill={isActive} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2">
              <span className="mx-md h-px bg-outline-variant/40" aria-hidden />
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[48px] items-center gap-sm rounded-xl px-md font-button text-button text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon name="logout" size={24} />
                <span>Log Out</span>
              </button>
              <p className="px-md font-body text-label-caps text-on-surface-variant">
                © 2026 Rowan Rose Solicitors
              </p>
            </div>
          </aside>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}
