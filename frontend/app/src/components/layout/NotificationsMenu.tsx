import { useId, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useFloating, offset, flip, shift, autoUpdate,
  useClick, useDismiss, useRole, useInteractions,
  FloatingPortal, FloatingFocusManager, FloatingOverlay, type Placement,
} from "@floating-ui/react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { useNotifications } from "@/context/NotificationContext";
import { getClient } from "@/data/mock";
import type { Claim, Requirement } from "@/data/types";

/**
 * Notifications popover (deferred Phase 6.1 scaffold — built now so the bell
 * isn't dead). Derives an actionable feed from the existing mock:
 *
 *  - "Action required" — Offer Received claims and Documents Required claims,
 *    each linking to the matching detail page.
 *  - "Unread messages" — one row per claim with unreadMessages > 0, linking
 *    to the per-claim chat thread.
 *  - Footer link to /chat for the full conversation list.
 *
 * Same Floating UI scaffolding as SettingsMenu (focus trap, Escape / backdrop
 * close, returns focus to the bell). No real network — all derived client-
 * side, will be replaced when the CRM notification feed is wired in Phase 7.1.
 */
type Variant = "icon" | "row";

interface Props {
  variant?: Variant;
  placement?: Placement;
  className?: string;
}

interface FeedItem {
  id: string;
  icon: string;
  iconTone: "primary" | "tertiary" | "error";
  title: string;
  body: string;
  to: string;
}

function buildFeed(client: ReturnType<typeof getClient>): { actions: FeedItem[]; messages: FeedItem[] } {
  const actions: FeedItem[] = [];

  // Offer received → claim detail
  client.claims
    .filter((c: Claim) => c.internalStatus === "Offer Received")
    .forEach((c) => {
      actions.push({
        id: `offer-${c.id}`,
        icon: "mark_email_unread",
        iconTone: "tertiary",
        title: "An offer has arrived",
        body: `${c.lender.name} has made an offer to settle your claim.`,
        to: `/claims/${encodeURIComponent(c.id)}`,
      });
    });

  // Documents required → claim's pending requirement (or /documents)
  const docByClaim = new Map<string, Requirement[]>();
  client.requirements
    .filter((r) => !r.done)
    .forEach((r) => {
      const key = r.claimId ?? "general";
      const list = docByClaim.get(key) ?? [];
      list.push(r);
      docByClaim.set(key, list);
    });
  const generalDocs = docByClaim.get("general") ?? [];
  if (generalDocs.length > 0) {
    actions.push({
      id: "docs-general",
      icon: "upload_file",
      iconTone: "primary",
      title: generalDocs.length === 1 ? "Document needed" : `${generalDocs.length} documents needed`,
      body: generalDocs.map((r) => r.title).join(", "),
      to: "/documents",
    });
  }
  client.claims
    .filter((c) => c.internalStatus === "Documents Required" || c.internalStatus === "Awaiting Bank Statements")
    .forEach((c) => {
      const claimDocs = docByClaim.get(c.id) ?? [];
      if (claimDocs.length === 0) return; // already covered by general above
      actions.push({
        id: `docs-${c.id}`,
        icon: "upload_file",
        iconTone: "primary",
        title: `Document needed — ${c.lender.name}`,
        body: claimDocs.map((r) => r.title).join(", "),
        to: `/documents?highlight=${claimDocs[0].id}`,
      });
    });

  // Per-claim unread messages → /chat/:claimId
  const messages: FeedItem[] = client.claims
    .filter((c) => (c.unreadMessages ?? 0) > 0)
    .map((c) => ({
      id: `msg-${c.id}`,
      icon: "forum",
      iconTone: "primary" as const,
      title:
        (c.unreadMessages ?? 0) === 1
          ? `1 new message from ${c.lender.name}`
          : `${c.unreadMessages} new messages from ${c.lender.name}`,
      body: c.id,
      to: `/chat/${encodeURIComponent(c.id)}`,
    }));

  return { actions, messages };
}

export function NotificationsMenu({ variant = "icon", placement, className }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const headingId = useId();

  const { actions, messages } = useMemo(() => buildFeed(getClient()), []);
  const totalCount = actions.length + messages.length;

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

  function goTo(to: string) {
    setOpen(false);
    navigate(to);
  }

  const label = unreadCount > 0
    ? `Notifications, ${unreadCount} unread`
    : "Notifications, none unread";

  return (
    <>
      <button
        type="button"
        ref={refs.setReference}
        {...getReferenceProps()}
        aria-label={label}
        aria-expanded={open}
        className={cn(
          variant === "icon"
            ? "relative grid h-12 w-12 place-items-center rounded-xl bg-surface-container-lowest text-primary skeuo-raise skeuo-press transition-colors hover:bg-surface-container-high"
            : "relative flex min-h-[48px] w-full items-center gap-sm rounded-xl px-3 font-button text-button text-on-surface-variant transition-colors hover:text-on-surface",
          className,
        )}
      >
        <Icon name="notifications" size={variant === "icon" ? 22 : 24} fill={open} className="flex-none" />
        {variant === "row" && <span className="whitespace-nowrap">Notifications</span>}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={cn(
              "grid h-5 min-w-[20px] flex-none place-items-center rounded-full bg-error px-1 text-[11px] font-bold leading-none text-on-error",
              variant === "icon"
                ? "absolute right-1.5 top-1.5 ring-2 ring-surface-container-lowest"
                : "ml-auto h-6 min-w-[24px] text-label-caps",
            )}
          >
            {unreadCount}
          </span>
        )}
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
                className="glass z-[80] w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-xl border border-outline-variant/30 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
              >
                <header className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm">
                  <h2 id={headingId} className="font-headline-md text-headline-md font-bold text-on-surface">
                    Notifications
                  </h2>
                  {totalCount > 0 && (
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-body text-label font-normal text-on-surface-variant">
                      {totalCount}
                    </span>
                  )}
                </header>

                <div className="max-h-[calc(100dvh-200px)] overflow-y-auto">
                  {totalCount === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-md py-lg text-center">
                      <Icon name="notifications_off" size={32} className="text-on-surface-variant" />
                      <p className="font-body text-body-md text-on-surface">You're all caught up</p>
                      <p className="font-body text-label font-normal text-on-surface-variant">
                        We'll let you know when there's news on your claims.
                      </p>
                    </div>
                  ) : (
                    <>
                      {actions.length > 0 && (
                        <FeedSection title="Action needed" items={actions} onSelect={goTo} />
                      )}
                      {messages.length > 0 && (
                        <FeedSection title="Unread messages" items={messages} onSelect={goTo} />
                      )}
                    </>
                  )}
                </div>

                <footer className="border-t border-outline-variant/20 bg-surface-container-lowest px-md py-sm">
                  <Link
                    to="/chat"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-2 font-button text-button text-primary hover:underline"
                  >
                    <span>View all messages</span>
                    <Icon name="arrow_forward" size={18} />
                  </Link>
                </footer>
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </>
  );
}

function FeedSection({
  title, items, onSelect,
}: {
  title: string;
  items: FeedItem[];
  onSelect: (to: string) => void;
}) {
  return (
    <section className="border-b border-outline-variant/20 last:border-b-0">
      <h3 className="px-md pt-sm font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
        {title}
      </h3>
      <ul className="py-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.to)}
              className="flex w-full items-start gap-sm px-md py-sm text-left transition-colors hover:bg-surface-container-high focus-visible:bg-surface-container-high focus-visible:outline-none"
            >
              <span
                aria-hidden
                className={cn(
                  "grid h-9 w-9 flex-none place-items-center rounded-full",
                  item.iconTone === "primary" && "bg-primary/15 text-primary",
                  item.iconTone === "tertiary" && "bg-tertiary/20 text-tertiary",
                  item.iconTone === "error" && "bg-error/15 text-error",
                )}
              >
                <Icon name={item.icon} size={20} fill />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-button text-button text-on-surface">{item.title}</span>
                <span className="mt-0.5 block truncate font-body text-label font-normal text-on-surface-variant">
                  {item.body}
                </span>
              </span>
              <Icon name="chevron_right" size={18} className="mt-1 flex-none text-on-surface-variant" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
