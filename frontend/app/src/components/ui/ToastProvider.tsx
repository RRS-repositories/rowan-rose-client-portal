import { createContext, useCallback, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "./Icon";

export type ToastTone = "success" | "info" | "error";
interface ToastItem { id: number; title: string; description?: string; tone: ToastTone }
export interface ToastCtx { push: (t: { title: string; description?: string; tone?: ToastTone }) => void }

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastCtx | null>(null);

const toneMeta: Record<ToastTone, { icon: string; cls: string }> = {
  success: { icon: "check_circle", cls: "text-primary" },
  info: { icon: "info", cls: "text-primary" },
  error: { icon: "error", cls: "text-error" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const dismiss = useCallback((id: number) => setItems((cur) => cur.filter((t) => t.id !== id)), []);
  const push = useCallback<ToastCtx["push"]>(({ title, description, tone = "info" }) => {
    const id = ++idRef.current;
    setItems((cur) => [...cur, { id, title, description, tone }]);
    window.setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-4 md:inset-x-auto md:right-4 md:items-end">
        <AnimatePresence>
          {items.map((t) => {
            const m = toneMeta[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: -18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="skeuo-card pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl p-4"
              >
                <Icon name={m.icon} fill size={24} className={m.cls} />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-body-md font-semibold text-on-surface">{t.title}</p>
                  {t.description && <p className="mt-0.5 font-body text-label font-normal text-on-surface-variant">{t.description}</p>}
                </div>
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="-m-2.5 grid h-11 w-11 flex-none place-items-center rounded-full text-on-surface-variant hover:text-on-surface">
                  <Icon name="close" size={20} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
