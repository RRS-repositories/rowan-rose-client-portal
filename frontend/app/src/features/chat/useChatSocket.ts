/**
 * Socket.io connection for the chat page.
 *
 * Delivery model: optimistic send keyed by clientMsgUuid, reconciled on
 * message:ack — the single biggest perceived-quality lever on mobile. On
 * reconnect we call conversation:sync so a client who dropped for 30s learns
 * what they missed (the socket has no replay). The offline banner is driven by
 * socket state, not navigator.onLine, which lies on mobile.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/session";
import type { ChatConversation, ChatErrorCode, ChatMessage, ChatStatus } from "./chatTypes";
import { CHAT_ERROR_COPY } from "./chatTypes";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

/** Socket.io path must sit under the API prefix so nginx proxies it. */
function socketOptions(token: string) {
  const base = API_BASE.startsWith("http") ? new URL(API_BASE) : null;
  return {
    url: base ? base.origin : window.location.origin,
    path: `${API_BASE.replace(/\/$/, "")}/socket.io`,
    auth: { token },
  };
}

export interface ChatState {
  connected: boolean;
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  typing: boolean;
  error: string | null;
  send: (body: string) => void;
  requestHandoff: () => void;
  openClaim: (claimId: string | null) => void;
  dismissError: () => void;
}

export function useChatSocket(initialClaimId: string | null): ChatState {
  const [connected, setConnected] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const claimRef = useRef<string | null>(initialClaimId);
  const conversationRef = useRef<ChatConversation | null>(null);
  const lastIdRef = useRef<number>(0);

  const rememberLastId = useCallback((list: ChatMessage[]) => {
    for (const m of list) {
      const n = Number(m.id);
      if (Number.isFinite(n) && n > lastIdRef.current) lastIdRef.current = n;
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const { url, path, auth } = socketOptions(token);
    const socket = io(url, { path, auth, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    const open = () => socket.emit("conversation:open", { claimId: claimRef.current });

    socket.on("connect", () => {
      setConnected(true);
      // Reconnect: backfill anything missed while we were away, else open.
      if (conversationRef.current && lastIdRef.current) {
        socket.emit("conversation:sync", {
          conversationId: conversationRef.current.id,
          sinceMessageId: lastIdRef.current,
        });
      } else {
        open();
      }
    });
    socket.on("disconnect", () => { setConnected(false); setTyping(false); });
    socket.on("connect_error", () => setConnected(false));

    socket.on("conversation:opened", ({ conversation: conv, messages: list }) => {
      conversationRef.current = conv;
      setConversation(conv);
      setMessages(list);
      rememberLastId(list);
    });

    socket.on("conversation:synced", ({ messages: list, status }) => {
      if (list?.length) {
        setMessages((cur) => {
          const known = new Set(cur.map((m) => m.id));
          return [...cur, ...list.filter((m: ChatMessage) => !known.has(m.id))];
        });
        rememberLastId(list);
      }
      if (status) {
        setConversation((c) => (c ? { ...c, status: status as ChatStatus } : c));
        conversationRef.current = conversationRef.current
          ? { ...conversationRef.current, status: status as ChatStatus }
          : null;
      }
    });

    socket.on("message:new", (msg: ChatMessage) => {
      setMessages((cur) => (cur.some((m) => m.id === msg.id) ? cur : [...cur, msg]));
      rememberLastId([msg]);
    });

    socket.on("message:ack", ({ clientMsgUuid, messageId, createdAt }) => {
      setMessages((cur) =>
        cur.map((m) =>
          m.clientMsgUuid === clientMsgUuid
            ? { ...m, id: String(messageId), created_at: createdAt, pending: false }
            : m,
        ),
      );
      rememberLastId([{ id: String(messageId) } as ChatMessage]);
    });

    socket.on("hermes:typing", ({ on }) => setTyping(Boolean(on)));

    socket.on("conversation:status", ({ status }) => {
      setConversation((c) => (c ? { ...c, status } : c));
      conversationRef.current = conversationRef.current ? { ...conversationRef.current, status } : null;
    });

    socket.on("chat:error", ({ code }: { code: ChatErrorCode }) => {
      setError(CHAT_ERROR_COPY[code] ?? CHAT_ERROR_COPY.AGENT_UNAVAILABLE);
      setTyping(false);
    });

    return () => { socket.close(); socketRef.current = null; };
  }, [rememberLastId]);

  const send = useCallback((body: string) => {
    const socket = socketRef.current;
    const conv = conversationRef.current;
    const text = body.trim();
    if (!socket || !conv || !text) return;
    const clientMsgUuid = crypto.randomUUID();
    // Optimistic bubble — reconciled by message:ack.
    setMessages((cur) => [
      ...cur,
      {
        id: `local-${clientMsgUuid}`,
        conversation_id: conv.id,
        sender_type: "client",
        body: text,
        created_at: new Date().toISOString(),
        pending: true,
        clientMsgUuid,
      },
    ]);
    socket.emit("message:send", { conversationId: conv.id, body: text, clientMsgUuid });
  }, []);

  const requestHandoff = useCallback(() => {
    const conv = conversationRef.current;
    if (socketRef.current && conv) socketRef.current.emit("handoff:request", { conversationId: conv.id });
  }, []);

  const openClaim = useCallback((claimId: string | null) => {
    claimRef.current = claimId;
    conversationRef.current = null;
    lastIdRef.current = 0;
    setMessages([]);
    setConversation(null);
    socketRef.current?.emit("conversation:open", { claimId });
  }, []);

  return {
    connected, conversation, messages, typing, error,
    send, requestHandoff, openClaim,
    dismissError: () => setError(null),
  };
}
