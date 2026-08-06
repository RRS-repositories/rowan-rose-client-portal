import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getUnreadCount, subscribeUnread } from "@/data/mock";
import { REAL_AUTH } from "@/data/realClient";
import { getNotifications, markNotificationsRead } from "@/api/notifications";
import { apiClient } from "@/api/client";
import type { PortalNotification } from "@/data/types";

interface NotificationCtx {
  /** Total unread shown on the notification bell. */
  unreadCount: number;
  /** Real CRM-raised notifications (empty in mock mode — the menu derives its
   *  own feed from the mock client there). */
  notifications: PortalNotification[];
  /** Re-fetch the feed (no-op in mock mode). */
  refresh: () => void;
  /** Mark ids (or everything, when omitted) read — optimistic, then server. */
  markRead: (ids?: string[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationCtx | null>(null);

/**
 * Surfaces the bell count + feed to the app chrome. Two sources, summed:
 *  - unread mock messages (mock mode only — real claims carry no counts), kept
 *    reactive via `subscribeUnread` exactly as before;
 *  - real notifications from /client/notifications (portal.notifications rows
 *    written by CRM triggers), fetched on login and re-fetched when the app
 *    regains focus — clients open the portal occasionally, so focus-refresh is
 *    the delivery model (no sockets, brief §10).
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const messagesUnread = useSyncExternalStore(subscribeUnread, getUnreadCount, () => 0);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);

  const [chatUnread, setChatUnread] = useState(0);

  const refresh = useCallback(() => {
    if (!REAL_AUTH || !state.isAuthenticated) return;
    getNotifications()
      .then((r) => setNotifications(r.notifications))
      .catch(() => { /* keep the last known feed — the bell must never crash the chrome */ });
    // Unread chat messages drive the Chat nav badge (Phase 7.4).
    apiClient
      .get<{ unread: number }>("/api/chat/conversations")
      .then((r) => setChatUnread(r.unread ?? 0))
      .catch(() => { /* chat may not be reachable — leave the badge as-is */ });
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (!state.isAuthenticated) {
      setNotifications([]);
      return;
    }
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [state.isAuthenticated, refresh]);

  const markRead = useCallback(async (ids?: string[]) => {
    // Optimistic: flip locally first so the badge reacts on tap.
    setNotifications((prev) =>
      prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)),
    );
    try {
      await markNotificationsRead(ids);
    } catch {
      refresh(); // server disagreed — re-sync rather than guess
    }
  }, [refresh]);

  const notificationsUnread = notifications.filter((n) => !n.read).length;
  // Real auth: mock message counts are meaningless — chat unread is the real one.
  const messageSlot = REAL_AUTH ? chatUnread : messagesUnread;
  const unreadCount = state.isAuthenticated ? messageSlot + notificationsUnread : 0;

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, refresh, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationCtx {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within <NotificationProvider>");
  return ctx;
}
