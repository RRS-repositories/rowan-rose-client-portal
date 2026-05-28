import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Page } from "@/components/layout/Page";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/useToast";
import { ThreadSelector } from "@/components/chat/ThreadSelector";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageThread, type OptimisticMessage } from "@/components/chat/MessageThread";
import { ReplyComposer } from "@/components/chat/ReplyComposer";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useAuth } from "@/context/AuthContext";
import { useMockQuery } from "@/data/useMockQuery";
import { getClient, subscribeUnread } from "@/data/mock";
import { getMessageThreads, getClaimMessages, sendMessage, markThreadAsRead } from "@/api/messages";
import { pageSlide, pageFade } from "@/lib/motion";
import type { Message, MessageThread as MessageThreadModel } from "@/data/types";

const BOTTOM_THRESHOLD = 80; // px from the bottom to count as "at the bottom"
const MARK_READ_DELAY_MS = 2000;

/* ─── Chat pane ──────────────────────────────────────────────────────────── */

function ChatPane({
  claimId,
  clientName,
}: {
  claimId: string;
  clientName: string;
}) {
  const { push } = useToast();
  const claim = useMemo(() => getClient().claims.find((c) => c.id === claimId), [claimId]);

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<OptimisticMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [scrolledUp, setScrolledUp] = useState(false);
  /** Anchor id for the "New messages" divider — frozen at load time, cleared
   *  ~1s after mark-as-read so the divider fades on its own. */
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const markedRead = useRef(false);
  const reduce = useReducedMotion();

  // Capture the first unread message id at load — the divider stays anchored
  // there even after mark-as-read flips messages to read.
  function computeFirstUnread(list: Message[]): string | null {
    return list.find((m) => m.sender === "firm" && !m.read)?.id ?? null;
  }

  // Load messages for this claim. Clears on claim change.
  useEffect(() => {
    let active = true;
    setMessages(null);
    setLoadError(null);
    setOptimistic([]);
    setScrolledUp(false);
    markedRead.current = false;
    setFirstUnreadId(null);

    getClaimMessages(claimId)
      .then((list) => {
        if (!active) return;
        setFirstUnreadId(computeFirstUnread(list));
        setMessages(list);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "We couldn't load this conversation.");
      });
    return () => { active = false; };
  }, [claimId]);

  // Auto-scroll to bottom on initial load. After that, only when the user is
  // already near the bottom (don't yank them away from older messages they're
  // reading). Smooth unless reduced-motion.
  useLayoutEffect(() => {
    if (!messages) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, claimId]);

  // When optimistic messages arrive, scroll to bottom (user is sending — they
  // expect to see it). Same for after-send resolution.
  useLayoutEffect(() => {
    if (optimistic.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [optimistic.length, reduce]);

  // Track whether the user has scrolled up — drives the "New message ↓" pill.
  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setScrolledUp(distance > BOTTOM_THRESHOLD);
  }

  // Mark-as-read: if the thread has unread firm messages, wait 2s (or fire
  // immediately if the user is already at the bottom) then call the mock.
  // Cancels on unmount or claim change. Also fires on scroll-to-bottom.
  useEffect(() => {
    if (!messages || markedRead.current) return;
    const unreadCount = messages.filter((m) => m.sender === "firm" && !m.read).length;
    if (unreadCount === 0) {
      markedRead.current = true;
      return;
    }

    const fire = () => {
      if (markedRead.current) return;
      markedRead.current = true;
      void markThreadAsRead(claimId).then(() => {
        setMessages((cur) => cur?.map((m) => (m.sender === "firm" ? { ...m, read: true } : m)) ?? cur);
        // Spec: divider disappears ~1s after read (3s total from thread open).
        window.setTimeout(() => setFirstUnreadId(null), 1000);
      });
    };

    // Defer the "are we already at the bottom" check until after the first
    // paint of this thread — that's when scrollTop reflects the auto-scroll.
    const timer = window.setTimeout(() => {
      const el = scrollRef.current;
      if (el) {
        const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distance <= BOTTOM_THRESHOLD) { fire(); return; }
      }
      // Otherwise wait the full 2s — give the client a moment to read.
      window.setTimeout(fire, MARK_READ_DELAY_MS);
    }, 0);

    return () => { window.clearTimeout(timer); };
  }, [messages, claimId]);

  // Scrolling to the bottom while there are unread messages also fires
  // mark-as-read immediately (the "they saw it" signal).
  useEffect(() => {
    if (!messages || markedRead.current || scrolledUp) return;
    // The scrolled-up effect transition (true → false) means they've now reached
    // the bottom. The mark-as-read effect above will see this on its next run
    // via the polling timeout. To avoid waiting, fire if we're definitely at
    // bottom now.
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance <= BOTTOM_THRESHOLD && messages.some((m) => m.sender === "firm" && !m.read)) {
      markedRead.current = true;
      void markThreadAsRead(claimId).then(() => {
        setMessages((cur) => cur?.map((m) => (m.sender === "firm" ? { ...m, read: true } : m)) ?? cur);
        window.setTimeout(() => setFirstUnreadId(null), 1000);
      });
    }
  }, [scrolledUp, messages, claimId]);

  // Send: optimistic insert, then real call. Failure leaves the entry visible
  // for retry; success drops the entry and re-fetches the persisted thread.
  const handleSend = useCallback(async (content: string) => {
    const tempId = `tmp-${Date.now()}`;
    const entry: OptimisticMessage = {
      tempId,
      content,
      timestamp: new Date().toISOString(),
      status: "sending",
    };
    setOptimistic((cur) => [...cur, entry]);
    setIsSending(true);
    try {
      const real = await sendMessage(claimId, content);
      setMessages((cur) => (cur ? [...cur, real] : [real]));
      setOptimistic((cur) => cur.filter((o) => o.tempId !== tempId));
    } catch (err) {
      setOptimistic((cur) => cur.map((o) => (o.tempId === tempId ? { ...o, status: "failed" } : o)));
      push({
        title: "Couldn't send your message",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsSending(false);
    }
  }, [claimId, push]);

  // Retry: re-send the failed entry's content; drop the failed entry once
  // queued so we don't show two copies.
  const handleRetry = useCallback((tempId: string) => {
    const failed = optimistic.find((o) => o.tempId === tempId);
    if (!failed) return;
    setOptimistic((cur) => cur.filter((o) => o.tempId !== tempId));
    void handleSend(failed.content);
  }, [optimistic, handleSend]);

  function jumpToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }

  if (!claim) {
    return (
      <div className="flex h-full items-center justify-center p-md">
        <EmptyState
          icon="error"
          title="Conversation not found"
          description="We couldn't find this claim. Please choose a different conversation from the list."
        />
      </div>
    );
  }

  const newest =
    optimistic.length > 0
      ? { id: optimistic[optimistic.length - 1].tempId, preview: "New message sent" }
      : messages && messages.length > 0
      ? { id: messages[messages.length - 1].id, preview: `New message from ${messages[messages.length - 1].senderName}` }
      : { id: null as string | null, preview: "" };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-surface-container-lowest skeuo-card md:bg-surface-container-low">
      <ChatHeader claim={claim} />

      {loadError ? (
        <div className="flex-1 overflow-y-auto p-md">
          <EmptyState
            icon="error"
            title="Couldn't load this conversation"
            description={loadError}
            action={<Button variant="primary" leadingIcon="refresh" onClick={() => { setLoadError(null); setMessages(null); void getClaimMessages(claimId).then((list) => { setFirstUnreadId(computeFirstUnread(list)); setMessages(list); }).catch((e) => setLoadError(e instanceof Error ? e.message : "We couldn't load this conversation.")); }}>Try Again</Button>}
          />
        </div>
      ) : !messages ? (
        <div className="flex-1 space-y-md overflow-y-auto p-md" aria-busy="true" aria-label="Loading conversation">
          <Skeleton className="h-16 w-2/3 rounded-2xl" />
          <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl" />
          <Skeleton className="h-20 w-3/4 rounded-2xl" />
          <Skeleton className="ml-auto h-10 w-1/3 rounded-2xl" />
        </div>
      ) : messages.length === 0 && optimistic.length === 0 ? (
        <div className="flex-1 overflow-y-auto">
          <EmptyState
            icon="forum"
            title="No messages yet"
            description={`Your claims handler will contact you here when there are updates about your ${claim.lender.name} claim.`}
          />
        </div>
      ) : (
        <div className="relative flex flex-1 min-h-0 flex-col">
          <MessageThread
            ref={scrollRef}
            messages={messages}
            optimistic={optimistic}
            firstUnreadId={firstUnreadId}
            clientName={clientName}
            onRetry={handleRetry}
            newestId={newest.id}
            newestPreview={newest.preview}
            onScroll={onScroll}
          />
          {scrolledUp && (
            <button
              type="button"
              onClick={jumpToBottom}
              className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-primary px-sm py-1.5 font-button text-label-caps font-bold text-on-primary skeuo-raise skeuo-primary-glow"
              aria-label="Jump to latest message"
            >
              <Icon name="arrow_downward" size={16} />
              New message
            </button>
          )}
        </div>
      )}

      <ReplyComposer
        onSend={handleSend}
        disabled={!!loadError || !messages}
        isSending={isSending}
        placeholder={`Message ${claim.lender.name}…`}
      />
    </div>
  );
}

/* ─── Default chat-pane state (desktop, no thread selected) ──────────────── */

function NoSelection() {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl bg-surface-container-lowest skeuo-card md:bg-surface-container-low">
      <EmptyState
        icon="forum"
        title="Select a conversation"
        description="Choose a claim from the left to view your messages."
      />
    </div>
  );
}

/* ─── Route ──────────────────────────────────────────────────────────────── */

export default function Chat() {
  const { claimId: claimIdParam } = useParams<{ claimId?: string }>();
  const claimId = claimIdParam ? decodeURIComponent(claimIdParam) : null;
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();
  const { state: auth } = useAuth();

  const { data: client } = useMockQuery(getClient, "client");

  // Threads load via the async mock (which has its own 700ms delay), so we
  // can't use useMockQuery here — that hook only takes synchronous getters.
  // A small bespoke loader keeps it simple and re-fetches when the claim
  // changes (so the selector reflects mark-as-read / send mutations).
  const [threads, setThreads] = useState<MessageThreadModel[] | null>(null);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [threadsNonce, setThreadsNonce] = useState(0);
  const refetchThreads = useCallback(() => setThreadsNonce((n) => n + 1), []);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    let active = true;
    setThreadsLoading(true);
    setThreadsError(null);
    getMessageThreads()
      .then((list) => { if (active) { setThreads(list); setThreadsLoading(false); } })
      .catch((err: unknown) => {
        if (!active) return;
        setThreadsError(err instanceof Error ? err.message : "We couldn't load your conversations.");
        setThreadsLoading(false);
      });
    return () => { active = false; };
  }, [auth.isAuthenticated, threadsNonce, claimId]);

  // Re-fetch the thread list whenever mark-as-read mutates the store, so the
  // selector's unread pills stay in sync with the SideNav bell.
  useEffect(() => subscribeUnread(refetchThreads), [refetchThreads]);

  const clientName = client ? `${client.firstName} ${client.lastName}` : "You";

  function selectThread(id: string) {
    navigate(`/chat/${encodeURIComponent(id)}`);
  }

  function backToList() {
    navigate("/chat");
  }

  const activeClaim = claimId && client ? client.claims.find((c) => c.id === claimId) : undefined;

  return (
    <Page label="Messages">
      {/* Mobile header: title view when on the list, back view when on a chat. */}
      {!isDesktop && !claimId && <MobileHeader variant="title" title="Messages" />}
      {!isDesktop && claimId && (
        <MobileHeader
          variant="back"
          title={activeClaim?.lender.name ?? "Messages"}
          onBack={backToList}
          backLabel="Back to message threads"
        />
      )}

      {/* Desktop heading */}
      <div className="hidden px-lg pt-md md:block">
        <h1 className="font-display-lg-mobile text-display-lg text-on-surface">Messages</h1>
        <p className="mt-1 font-body-lg text-body-lg text-on-surface-variant">
          One thread per claim — your handler will reply here.
        </p>
      </div>

      <div
        className={
          // Height: viewport minus mobile header (64px) + bottom tab bar (120px from AppShell)
          // on mobile; minus the desktop heading on desktop.
          "px-margin-mobile pt-3 md:px-lg md:pb-lg md:pt-md " +
          "h-[calc(100dvh-64px-120px)] md:h-[calc(100dvh-160px)]"
        }
      >
        <div className="grid h-full min-h-0 grid-cols-1 gap-md md:grid-cols-[260px_1fr] lg:grid-cols-[320px_1fr]">
          {/* Thread selector — desktop always; mobile only when no claim selected. */}
          <div className={(!claimId ? "block " : "hidden ") + "min-h-0 md:block"}>
            {!isDesktop ? (
              <AnimatePresence mode="wait" initial={false}>
                {!claimId && (
                  <motion.div
                    key="list"
                    variants={reduce ? pageFade : pageSlide}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="h-full min-h-0"
                  >
                    <ThreadSelector
                      threads={threads}
                      claims={client?.claims ?? []}
                      activeClaimId={claimId}
                      onSelect={selectThread}
                      loading={threadsLoading || !client}
                      error={threadsError}
                      onRetry={refetchThreads}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <ThreadSelector
                threads={threads}
                claims={client?.claims ?? []}
                activeClaimId={claimId}
                onSelect={selectThread}
                loading={threadsLoading || !client}
                error={threadsError}
                onRetry={refetchThreads}
              />
            )}
          </div>

          {/* Chat pane — desktop always; mobile only when a claim is selected. */}
          <div className={(claimId ? "block " : "hidden ") + "min-h-0 md:block"}>
            {!isDesktop ? (
              <AnimatePresence mode="wait" initial={false}>
                {claimId && (
                  <motion.div
                    key={`chat-${claimId}`}
                    variants={reduce ? pageFade : pageSlide}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="h-full min-h-0"
                  >
                    <ChatPane claimId={claimId} clientName={clientName} />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : claimId ? (
              <ChatPane claimId={claimId} clientName={clientName} />
            ) : (
              <NoSelection />
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
