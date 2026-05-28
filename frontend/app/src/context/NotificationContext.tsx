import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getUnreadCount, subscribeUnread } from "@/data/mock";

interface NotificationCtx {
  /** Total unread client-facing messages — shown on the notification bell. */
  unreadCount: number;
}

const NotificationContext = createContext<NotificationCtx | null>(null);

/** Surfaces the unread-message total to the app chrome (bell + per-row badges).
 *  Mock-backed — no real delivery (brief §10). Resets to 0 when there's no
 *  session. Reactive via `subscribeUnread` so mark-as-read in `api/mocks/messages.ts`
 *  flows through to every consumer without prop drilling. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const unreadCount = useSyncExternalStore(subscribeUnread, getUnreadCount, () => 0);
  const value = state.isAuthenticated ? unreadCount : 0;
  return <NotificationContext.Provider value={{ unreadCount: value }}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationCtx {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within <NotificationProvider>");
  return ctx;
}
