import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/useToast";
import { updateNotificationPreferences } from "@/api/profile";
import type { NotificationPreferences } from "@/data/types";

type PrefKey = keyof NotificationPreferences;

interface ToggleSpec {
  key: PrefKey;
  label: string;
  description: string;
}

const TOGGLES: ToggleSpec[] = [
  { key: "statusChanges", label: "Claim Status Updates", description: "Receive an email when the status of any of your claims changes." },
  { key: "newMessages", label: "New Messages", description: "Receive an email when you have a new message from your claims handler." },
  { key: "documentRequests", label: "Document Requests", description: "Receive an email when we need documents from you to proceed with a claim." },
  { key: "offerNotifications", label: "Settlement Offers", description: "Receive an email when an offer is received for one of your claims." },
  { key: "paymentUpdates", label: "Payment Updates", description: "Receive an email when a settlement payment is processed." },
  { key: "marketingEmails", label: "Marketing & Updates", description: "Receive occasional emails about our services and useful financial information." },
];

/** Disabling any of these triggers a confirmation modal because clients
 *  shouldn't accidentally miss settlement / payment news. */
const CRITICAL_KEYS: ReadonlySet<PrefKey> = new Set<PrefKey>(["offerNotifications", "paymentUpdates"]);

const DEBOUNCE_MS = 500;
const SAVED_FADE_MS = 2000;

interface Props {
  initialPrefs: NotificationPreferences | null;
  loading?: boolean;
}

/**
 * Notification preferences (Phase 5.1, Task 5). Auto-save: each toggle change
 * is applied optimistically, accumulated into `pendingKeys`, then flushed to
 * the server after a 500ms idle. On save success, the changed toggles show a
 * brief "Saved" indicator (cleared after 2s). On failure, the toggles revert
 * to the last server-confirmed state and a toast surfaces the error.
 */
export function NotificationPreferencesSection({ initialPrefs, loading }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(initialPrefs);
  const [savedKeys, setSavedKeys] = useState<Set<PrefKey>>(new Set());
  const [savingKeys, setSavingKeys] = useState<Set<PrefKey>>(new Set());
  const [warningKey, setWarningKey] = useState<PrefKey | null>(null);
  const { push } = useToast();

  // Last server-confirmed state — what we revert to on failure.
  const confirmedRef = useRef<NotificationPreferences | null>(initialPrefs);
  // Keys edited since the last successful flush.
  const pendingKeysRef = useRef<Set<PrefKey>>(new Set());
  const debounceRef = useRef<number | null>(null);
  const savedTimersRef = useRef<Map<PrefKey, number>>(new Map());

  useEffect(() => {
    setPrefs(initialPrefs);
    confirmedRef.current = initialPrefs;
  }, [initialPrefs]);

  useEffect(() => {
    return () => {
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
      savedTimersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  function scheduleFlush() {
    if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void flush();
    }, DEBOUNCE_MS);
  }

  async function flush() {
    if (!prefs) return;
    const keys = Array.from(pendingKeysRef.current);
    if (keys.length === 0) return;
    pendingKeysRef.current = new Set();
    const snapshot = prefs;
    setSavingKeys((cur) => {
      const out = new Set(cur);
      keys.forEach((k) => out.add(k));
      return out;
    });
    try {
      const res = await updateNotificationPreferences(snapshot);
      if (!res.success) throw new Error(res.message);
      confirmedRef.current = snapshot;
      // Mark each changed key as recently-saved; auto-clear after 2s.
      setSavedKeys((cur) => {
        const out = new Set(cur);
        keys.forEach((k) => out.add(k));
        return out;
      });
      keys.forEach((k) => {
        const existing = savedTimersRef.current.get(k);
        if (existing) window.clearTimeout(existing);
        const t = window.setTimeout(() => {
          setSavedKeys((cur) => {
            if (!cur.has(k)) return cur;
            const out = new Set(cur);
            out.delete(k);
            return out;
          });
          savedTimersRef.current.delete(k);
        }, SAVED_FADE_MS);
        savedTimersRef.current.set(k, t);
      });
    } catch {
      // Revert optimistic edits — the server doesn't know about them.
      if (confirmedRef.current) setPrefs(confirmedRef.current);
      push({ title: "Couldn't save preferences", description: "Your changes have been reverted. Please try again.", tone: "error" });
    } finally {
      setSavingKeys((cur) => {
        const out = new Set(cur);
        keys.forEach((k) => out.delete(k));
        return out;
      });
    }
  }

  function applyChange(key: PrefKey, next: boolean) {
    if (!prefs) return;
    const updated = { ...prefs, [key]: next };
    setPrefs(updated);
    pendingKeysRef.current.add(key);
    // Clear any leftover "Saved" badge — fresh edit supersedes the prior result.
    setSavedKeys((cur) => {
      if (!cur.has(key)) return cur;
      const out = new Set(cur);
      out.delete(key);
      return out;
    });
    scheduleFlush();
  }

  function handleToggle(key: PrefKey, next: boolean) {
    if (next === false && CRITICAL_KEYS.has(key)) {
      setWarningKey(key);
      return;
    }
    applyChange(key, next);
  }

  if (loading || !prefs) {
    return (
      <section aria-labelledby="notifications-heading" className="skeuo-card rounded-xl p-md">
        <SectionHeading />
        <div className="mt-md space-y-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </section>
    );
  }

  const warningSpec = warningKey ? TOGGLES.find((t) => t.key === warningKey) : null;

  return (
    <section aria-labelledby="notifications-heading" className="skeuo-card rounded-xl p-md">
      <SectionHeading />

      <div className="mt-md divide-y divide-outline-variant/20">
        {TOGGLES.map((t) => (
          <div key={t.key} className="py-1">
            <ToggleSwitch
              label={t.label}
              description={t.description}
              checked={prefs[t.key]}
              onChange={(next) => handleToggle(t.key, next)}
              saving={savingKeys.has(t.key)}
              saved={savedKeys.has(t.key)}
            />
          </div>
        ))}
      </div>

      <p className="mt-md flex items-start gap-1.5 border-t border-outline-variant/30 pt-sm font-body text-label font-normal text-on-surface-variant">
        <Icon name="info" size={16} className="mt-0.5 flex-none text-primary" />
        We recommend keeping Claim Status Updates, Settlement Offers, and Payment Updates enabled to stay informed about your claims.
      </p>

      {warningSpec && (
        <ConfirmModal
          open={warningKey !== null}
          tone="warning"
          title="Turn off this notification?"
          body={
            <span>
              Disabling <strong>{warningSpec.label}</strong> means you may miss important updates about your claim. Are you sure?
            </span>
          }
          confirmLabel="Disable"
          cancelLabel="Keep Enabled"
          onCancel={() => setWarningKey(null)}
          onConfirm={() => {
            applyChange(warningSpec.key, false);
            setWarningKey(null);
          }}
        />
      )}
    </section>
  );
}

function SectionHeading() {
  return (
    <div>
      <h2 id="notifications-heading" className="flex items-center gap-sm font-headline-md text-headline-md text-on-surface">
        <Icon name="notifications" size={22} className="text-primary" />
        Notification Preferences
      </h2>
      <p className="mt-1 font-body text-label font-normal text-on-surface-variant">
        Choose which email notifications you would like to receive.
      </p>
    </div>
  );
}
