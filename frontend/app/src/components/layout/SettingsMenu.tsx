import { useId, useState } from "react";
import {
  useFloating, offset, flip, shift, autoUpdate,
  useClick, useDismiss, useRole, useInteractions,
  FloatingPortal, FloatingFocusManager, FloatingOverlay, type Placement,
} from "@floating-ui/react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { SettingsPanel } from "./SettingsPanel";

/**
 * Settings gear that opens a focus-trapped popover (theme + text size). Click or
 * keyboard to open; Escape or outside-click to close — handled by Floating UI's
 * useDismiss + FloatingFocusManager (focus trap, returns focus to the gear).
 *
 *  - `icon`: square gear button (mobile header, beside the bell)
 *  - `row` : full-width labelled row (desktop SideNav footer)
 */
export function SettingsMenu({
  variant = "icon",
  placement,
  className,
}: {
  variant?: "icon" | "row";
  placement?: Placement;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const headingId = useId();

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: placement ?? (variant === "row" ? "right-end" : "bottom-end"),
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context, { role: "dialog" }),
  ]);

  return (
    <>
      <button
        type="button"
        ref={refs.setReference}
        {...getReferenceProps()}
        aria-label="Settings"
        aria-expanded={open}
        className={cn(
          variant === "icon"
            ? "grid h-12 w-12 place-items-center rounded-xl bg-surface-container-lowest text-primary skeuo-raise skeuo-press transition-colors hover:bg-surface-container-high"
            : "flex min-h-[48px] w-full items-center gap-sm rounded-xl px-md font-button text-button text-on-surface-variant transition-colors hover:text-on-surface",
          className,
        )}
      >
        <Icon name="settings" size={variant === "icon" ? 22 : 24} fill={open} />
        {variant === "row" && <span>Settings</span>}
      </button>

      {open && (
        <FloatingPortal>
          <FloatingOverlay lockScroll className="z-[75]">
            <FloatingFocusManager context={context} modal returnFocus>
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                aria-labelledby={headingId}
                className="glass z-[80] rounded-xl border border-outline-variant/30 p-md shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
              >
                <SettingsPanel headingId={headingId} />
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </>
  );
}
