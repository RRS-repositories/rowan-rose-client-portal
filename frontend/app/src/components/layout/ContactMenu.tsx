import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useFloating, offset, flip, shift, autoUpdate,
  useClick, useDismiss, useRole, useInteractions,
  FloatingPortal, FloatingFocusManager, FloatingOverlay, type Placement,
} from "@floating-ui/react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

/**
 * Contact popover — quick ways to reach the firm without hunting through the
 * Help/FAQ pages. Three actions: call, email, or open the in-app chat. Same
 * Floating UI scaffolding as SettingsMenu / NotificationsMenu (focus trap,
 * Escape / backdrop close, returns focus to the trigger).
 *
 *  - `icon`: square button (mobile header, before the settings gear)
 *  - `row` : full-width labelled row (e.g. SideNav footer)
 */
type Variant = "icon" | "row";

export function ContactMenu({
  variant = "icon",
  placement,
  className,
}: {
  variant?: Variant;
  placement?: Placement;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
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
        aria-label="Contact us"
        aria-expanded={open}
        className={cn(
          variant === "icon"
            ? "grid h-12 w-12 place-items-center rounded-xl bg-surface-container-lowest text-primary skeuo-raise skeuo-press transition-colors hover:bg-surface-container-high"
            : "flex min-h-[48px] w-full items-center gap-sm rounded-xl px-md font-button text-button text-on-surface-variant transition-colors hover:text-on-surface",
          className,
        )}
      >
        <Icon name="call" size={variant === "icon" ? 22 : 24} fill={open} />
        {variant === "row" && <span>Contact us</span>}
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
                className="glass z-[80] w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-xl border border-outline-variant/30 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
              >
                <header className="border-b border-outline-variant/20 px-md py-sm">
                  <h2 id={headingId} className="font-headline-md text-headline-md font-bold text-on-surface">
                    Contact us
                  </h2>
                  <p className="mt-0.5 font-body text-label font-normal text-on-surface-variant">
                    We're here Monday to Friday.
                  </p>
                </header>

                <ul className="py-1">
                  <li>
                    <a
                      href="tel:01615050150"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-sm px-md py-sm text-left transition-colors hover:bg-surface-container-high focus-visible:bg-surface-container-high focus-visible:outline-none"
                    >
                      <span aria-hidden className="grid h-9 w-9 flex-none place-items-center rounded-full bg-primary/15 text-primary">
                        <Icon name="call" size={20} fill />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-button text-button text-on-surface">Call us</span>
                        <span className="mt-0.5 block font-body text-label font-normal text-on-surface-variant">0161 505 0150</span>
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:irl@rowanrose.co.uk"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-sm px-md py-sm text-left transition-colors hover:bg-surface-container-high focus-visible:bg-surface-container-high focus-visible:outline-none"
                    >
                      <span aria-hidden className="grid h-9 w-9 flex-none place-items-center rounded-full bg-primary/15 text-primary">
                        <Icon name="mail" size={20} fill />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-button text-button text-on-surface">Email us</span>
                        <span className="mt-0.5 block truncate font-body text-label font-normal text-on-surface-variant">irl@rowanrose.co.uk</span>
                      </span>
                    </a>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => { setOpen(false); navigate("/chat"); }}
                      className="flex w-full items-center gap-sm px-md py-sm text-left transition-colors hover:bg-surface-container-high focus-visible:bg-surface-container-high focus-visible:outline-none"
                    >
                      <span aria-hidden className="grid h-9 w-9 flex-none place-items-center rounded-full bg-primary/15 text-primary">
                        <Icon name="forum" size={20} fill />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-button text-button text-on-surface">Speak to the team</span>
                        <span className="mt-0.5 block font-body text-label font-normal text-on-surface-variant">Message us in the app</span>
                      </span>
                      <Icon name="chevron_right" size={18} className="flex-none text-on-surface-variant" />
                    </button>
                  </li>
                </ul>
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </>
  );
}
