import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/** Scrollable terms-of-acceptance container with read tracking.
 *
 *  Calls onRead(true) once the user reaches the bottom (with an 8px tolerance)
 *  and never re-fires it back to false — once read, always read. Renders top
 *  and bottom scroll-shadows that fade with scroll position, and an aria-live
 *  status that announces "Scroll to read all terms" / "You have read the
 *  terms" to screen readers. */
interface Props {
  terms: string;
  onRead: (read: boolean) => void;
  hasRead: boolean;
}

export function TermsOfAcceptance({ terms, onRead, hasRead }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  // The terms can be short enough to fit without scrolling; in that case we
  // mark them as read immediately so the user isn't stuck.
  const [fitsWithoutScroll, setFitsWithoutScroll] = useState(false);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollTop, clientHeight, scrollHeight } = el;
    setAtTop(scrollTop <= 4);
    const reachedBottom = scrollTop + clientHeight >= scrollHeight - 8;
    setAtBottom(reachedBottom);
    if (scrollHeight <= clientHeight + 4) {
      setFitsWithoutScroll(true);
      if (!hasRead) onRead(true);
    } else if (reachedBottom && !hasRead) {
      onRead(true);
    }
  }, [hasRead, onRead]);

  useEffect(() => {
    measure();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const showShadowTop = !atTop;
  const showShadowBottom = !atBottom && !fitsWithoutScroll;

  return (
    <section aria-label="Terms of acceptance">
      <header className="mb-sm">
        <h2 className="font-headline-md text-headline-md text-on-surface">Terms of Acceptance</h2>
        <p className="mt-1 font-body text-body-md text-on-surface-variant">
          Please read the following terms carefully before signing.
        </p>
      </header>

      <div className="relative">
        <div
          ref={scrollerRef}
          role="document"
          aria-label="Terms of acceptance"
          tabIndex={0}
          onScroll={measure}
          className={cn(
            "skeuo-recessed h-[250px] w-full overflow-y-auto rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-md font-body text-body-md leading-relaxed text-on-surface md:h-[300px]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          )}
        >
          <pre className="whitespace-pre-wrap font-body text-body-md text-on-surface">{terms}</pre>
        </div>

        {/* Scroll shadows */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 right-0 top-0 h-6 rounded-t-lg bg-gradient-to-b from-on-surface/15 to-transparent transition-opacity duration-200",
            showShadowTop ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 right-0 h-6 rounded-b-lg bg-gradient-to-t from-on-surface/15 to-transparent transition-opacity duration-200",
            showShadowBottom ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "mt-2 inline-flex items-center gap-1.5 font-body text-label",
          hasRead || fitsWithoutScroll ? "text-primary" : "text-on-surface-variant",
        )}
      >
        {hasRead || fitsWithoutScroll ? (
          <>
            <Icon name="check_circle" size={16} fill />
            You have read the terms
          </>
        ) : (
          <>
            <Icon name="south" size={16} />
            Scroll to read all terms
          </>
        )}
      </p>
    </section>
  );
}
