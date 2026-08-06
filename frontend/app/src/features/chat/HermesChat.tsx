import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getClient } from "@/data/mock";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useChatSocket } from "./useChatSocket";
import { ASSISTANT_DISPLAY_NAME, CONTACT_OPTIONS, type ChatMessage } from "./chatTypes";

/**
 * Live chat with Sarah (real auth). Per-claim conversation backed by the socket
 * layer; Sarah answers from live CRM data and hands off to the team when she
 * must. Mock mode keeps the original Chat page — this one only renders when
 * VITE_REAL_AUTH is on.
 */
export default function HermesChat() {
  const { claimId: routeClaimId } = useParams();
  const navigate = useNavigate();
  const claims = useMemo(() => getClient().claims, []);
  const [claimId, setClaimId] = useState<string | null>(routeClaimId ?? null);

  const chat = useChatSocket(claimId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const activeClaim = claims.find((c) => c.id === claimId);
  const withPerson = chat.conversation?.status === "human_queued" || chat.conversation?.status === "human_active";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages, chat.typing]);

  function pick(id: string) {
    setClaimId(id);
    chat.openClaim(id);
    navigate(`/chat/${encodeURIComponent(id)}`, { replace: true });
  }

  function submit() {
    const text = draft.trim();
    if (!text) return;
    chat.send(text);
    setDraft("");
  }

  // First run: which claim are we talking about?
  if (!claimId && claims.length > 0) {
    return (
      <Page label="Chat">
        <MobileHeader variant="title" title="Chat" />
        <div className="mx-auto w-full max-w-3xl px-margin-mobile py-md md:px-lg md:py-lg">
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface md:text-display-lg">
            Chat to us
          </h1>
          <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
            Which claim would you like to talk about?
          </p>
          <ul className="mt-md space-y-sm">
            {claims.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => pick(c.id)}
                  className="skeuo-card flex min-h-[64px] w-full items-center justify-between gap-sm rounded-xl p-md text-left hover:bg-surface-container-high"
                >
                  <span>
                    <span className="block font-button text-body-lg text-on-surface">{c.lender.name}</span>
                    <span className="block font-body text-label text-on-surface-variant">{c.id}</span>
                  </span>
                  <Icon name="chevron_right" size={22} className="text-on-surface-variant" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Page>
    );
  }

  return (
    <Page label="Chat">
      <MobileHeader variant="back" title="Chat" />
      {/* Height has to be explicit: <Page> doesn't constrain it, so h-full
          collapses and the whole document scrolls — header, composer and all.
          Same viewport calc the Messages page uses (mobile allows for the
          header + bottom tab bar), which pins the header and composer and
          leaves only the thread scrolling. */}
      <div className="mx-auto flex h-[calc(100dvh-64px-120px)] w-full max-w-4xl flex-col px-margin-mobile py-sm md:h-[calc(100dvh-120px)] md:px-lg">
        {/* Claim context + talk-to-a-person */}
        <header className="flex flex-none items-center justify-between gap-sm border-b border-outline-variant/30 pb-sm">
          <div className="min-w-0">
            <p className="truncate font-button text-body-lg text-on-surface">
              {activeClaim?.lender.name ?? "Your claim"}
            </p>
            <p className="flex items-center gap-1.5 font-body text-label text-on-surface-variant">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                <Icon name="support_agent" size={14} fill />
              </span>
              {chat.assistant ? ASSISTANT_DISPLAY_NAME : "Your claims team"}
              {chat.assistant && (
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-caps text-label-caps uppercase">
                  AI assistant
                </span>
              )}
            </p>
          </div>
          <div className="relative flex-none">
            <Button variant="secondary" size="md" onClick={() => setMenuOpen((v) => !v)} leadingIcon="headset_mic">
              Talk to a person
            </Button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-outline-variant/30 bg-surface-container-highest p-1 shadow-lg"
                onKeyDown={(e) => { if (e.key === "Escape") setMenuOpen(false); }}
              >
                <a
                  role="menuitem"
                  href={`mailto:${CONTACT_OPTIONS.email}?subject=${encodeURIComponent(`My claim — ${activeClaim?.lender.name ?? ""} (${claimId ?? ""})`)}`}
                  className="flex min-h-[48px] items-center gap-sm rounded-lg px-sm font-body text-body-md text-on-surface hover:bg-surface-container-high"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name="mail" size={20} /> Email the team
                </a>
                <a
                  role="menuitem"
                  href={CONTACT_OPTIONS.phoneHref}
                  className="flex min-h-[48px] items-center gap-sm rounded-lg px-sm font-body text-body-md text-on-surface hover:bg-surface-container-high"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name="call" size={20} />
                  <span>
                    {CONTACT_OPTIONS.phone}
                    <span className="block font-body text-label text-on-surface-variant">{CONTACT_OPTIONS.hours}</span>
                  </span>
                </a>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => { chat.requestHandoff(); setMenuOpen(false); }}
                  className="flex min-h-[48px] w-full items-center gap-sm rounded-lg px-sm text-left font-body text-body-md text-on-surface hover:bg-surface-container-high"
                >
                  <Icon name="forum" size={20} /> Continue here in chat
                </button>
              </div>
            )}
          </div>
        </header>

        {chat.sessionExpired ? (
          <div role="alert" className="mt-sm flex flex-none flex-wrap items-center justify-between gap-sm rounded-lg bg-error-container/60 px-sm py-2">
            <p className="font-body text-label text-on-error-container">
              You've been signed out for security. Log in again to carry on chatting.
            </p>
            <Button size="md" onClick={() => navigate("/login")}>Log in</Button>
          </div>
        ) : !chat.connected ? (
          <p role="status" className="mt-sm flex flex-none items-center gap-2 rounded-lg bg-surface-container-high px-sm py-2 font-body text-label text-on-surface-variant">
            <Icon name="wifi_off" size={16} /> Reconnecting…
          </p>
        ) : null}
        {chat.error && (
          <p role="alert" className="mt-sm flex flex-none items-center justify-between gap-2 rounded-lg bg-error-container/60 px-sm py-2 font-body text-label text-on-error-container">
            {chat.error}
            <button type="button" onClick={chat.dismissError} aria-label="Dismiss"><Icon name="close" size={16} /></button>
          </p>
        )}

        {/* Thread */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-sm overflow-y-auto py-md">
          {!chat.conversation ? (
            // Skeletons imply "loading". Once the session is gone, nothing is
            // loading — don't leave shimmering placeholders on screen forever.
            chat.sessionExpired ? null : (
              <div className="space-y-sm"><Skeleton className="h-16 w-3/4 rounded-xl" /><Skeleton className="h-12 w-1/2 rounded-xl" /></div>
            )
          ) : (
            chat.messages.map((m) => <Bubble key={m.id} message={m} />)
          )}
          {chat.typing && <TypingBubble who={chat.assistant ? ASSISTANT_DISPLAY_NAME : "Your claims team"} />}
        </div>

        {/* Composer */}
        <div className="flex-none border-t border-outline-variant/30 pt-sm">
          {withPerson && (
            <p className="mb-sm rounded-lg bg-primary-container/40 px-sm py-2 font-body text-label text-on-surface">
              Your claims team has this conversation — a case handler will reply here.
            </p>
          )}
          <div className="flex items-end gap-sm">
            <textarea
              value={draft}
              onChange={(e) => { setDraft(e.target.value.slice(0, 2000)); chat.notifyTyping(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              rows={1}
              placeholder={chat.assistant ? `Ask ${ASSISTANT_DISPLAY_NAME} about your claim…` : "Type your message…"}
              aria-label="Your message"
              disabled={chat.sessionExpired}
              className="skeuo-recessed min-h-[52px] flex-1 resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-sm font-body text-body-lg text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            />
            <Button onClick={submit} disabled={!draft.trim() || chat.sessionExpired} leadingIcon="send" size="lg">Send</Button>
          </div>
          <p className="mt-1.5 font-body text-label text-on-surface-variant">
            {chat.assistant
              ? `${ASSISTANT_DISPLAY_NAME} is an AI assistant. She can't give legal or financial advice — for anything about settlement figures or advice, your claims team will always take over.`
              : "Messages are answered by your claims team during office hours (Mon–Fri, 9am–5pm)."}
          </p>
        </div>
      </div>
    </Page>
  );
}

/** Classic three-dot typing indicator, rendered as a bubble in the thread so it
 *  reads as "someone is composing a message" rather than a status line. The
 *  lift is 4px on a smooth ease — the chat idiom people recognise, without the
 *  springy overshoot of a stock bounce. Respects reduced-motion. */
function TypingBubble({ who }: { who: string }) {
  return (
    <div className="flex justify-start" aria-live="polite">
      <div className="skeuo-card max-w-[85%] rounded-2xl px-md py-sm">
        <p className="mb-1 font-label-caps text-label-caps uppercase text-on-surface-variant">{who}</p>
        <span className="flex items-center gap-1.5 py-1" aria-label={`${who} is typing`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="chat-typing-dot h-2 w-2 rounded-full bg-on-surface-variant/70"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.sender_type === "client";
  const system = message.sender_type === "system";
  const card = message.meta?.card;

  if (system) {
    return (
      <p role="status" className="mx-auto max-w-md rounded-lg bg-surface-container-high px-sm py-2 text-center font-body text-label text-on-surface-variant">
        {message.body}
      </p>
    );
  }

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] rounded-2xl px-md py-sm", mine ? "bg-primary text-on-primary" : "skeuo-card text-on-surface")}>
        {!mine && (
          <p className="mb-1 font-label-caps text-label-caps uppercase text-on-surface-variant">
            {message.sender_type === "agent" ? "Your claims team" : ASSISTANT_DISPLAY_NAME}
          </p>
        )}
        <p className="whitespace-pre-wrap font-body text-body-lg">{message.body}</p>
        {card && (
          <dl className="mt-sm rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-sm">
            <p className="mb-1 font-button text-label text-on-surface">{card.title}</p>
            {card.rows.map((r) => (
              <div key={r.k} className="flex items-baseline justify-between gap-sm py-0.5">
                <dt className="font-body text-label text-on-surface-variant">{r.k}</dt>
                <dd className={cn("text-right font-body text-label", r.hl ? "font-semibold text-primary" : "text-on-surface")}>{r.v}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className={cn("mt-1 font-body text-label", mine ? "text-on-primary/70" : "text-on-surface-variant")}>
          {message.pending ? "Sending…" : formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
