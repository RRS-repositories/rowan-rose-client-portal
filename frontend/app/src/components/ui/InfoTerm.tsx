import { useState, type ReactNode } from "react";
import {
  useFloating, offset, flip, shift, autoUpdate,
  useClick, useFocus, useDismiss, useRole, useInteractions, FloatingPortal,
} from "@floating-ui/react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { GLOSSARY } from "@/data/glossary";

/**
 * Inline jargon term that opens a plain-English explanation.
 * Tap/click OR keyboard-focus to open (not hover — the audience is touch/keyboard),
 * ESC / outside-click to dismiss. Accessible via Floating UI's useRole.
 */
export function InfoTerm({ term, children, className }: { term: string; children?: ReactNode; className?: string }) {
  const def = GLOSSARY[term];
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "top",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useFocus(context),
    useDismiss(context),
    useRole(context, { role: "tooltip" }),
  ]);

  if (!def) return <>{children ?? term}</>;

  return (
    <>
      <button
        type="button"
        ref={refs.setReference}
        {...getReferenceProps()}
        aria-label={`What does "${term}" mean?`}
        className={cn(
          "inline-flex items-baseline gap-0.5 font-semibold text-primary underline decoration-dotted underline-offset-2",
          className,
        )}
      >
        {children ?? term}
        <Icon name="help" size={15} className="translate-y-0.5 opacity-70" />
      </button>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="skeuo-card z-[80] max-w-xs rounded-lg p-3"
          >
            <p className="mb-0.5 font-button text-label-caps uppercase tracking-wider text-primary">{term}</p>
            <p className="font-body text-body-md text-on-surface">{def}</p>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
