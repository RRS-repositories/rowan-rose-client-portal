/**
 * Mock notification feed — fallback while real auth is off. Derives the same
 * shape the backend serves (portal.notifications) from the mock client's
 * outstanding requirements, so the bell behaves identically in both modes.
 * Read state is module-scoped and persists for the SPA lifetime, matching the
 * message mocks' behaviour.
 */
import type { PortalNotification } from "@/data/types";
import { getClient } from "@/data/mock";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const readIds = new Set<string>();

function buildFeed(): PortalNotification[] {
  const client = getClient();
  return client.requirements
    .filter((r) => !r.done)
    .map((r, i) => ({
      id: `mock-${r.id}`,
      kind: r.kind === "id" ? "id_request" : r.kind === "bank-statements" ? "bank_statements_request" : r.kind,
      title: r.title,
      body: r.description,
      link: "/documents",
      claimId: r.claimId,
      createdAt: new Date(Date.now() - (i + 1) * 86_400_000).toISOString(),
      read: readIds.has(`mock-${r.id}`),
    }));
}

export async function getNotifications(): Promise<{ notifications: PortalNotification[]; unread: number }> {
  await delay(300);
  const notifications = buildFeed();
  return { notifications, unread: notifications.filter((n) => !n.read).length };
}

export async function markNotificationsRead(ids?: string[]): Promise<{ success: boolean; updated: number }> {
  await delay(150);
  const targets = ids?.length ? ids : buildFeed().map((n) => n.id);
  let updated = 0;
  for (const id of targets) {
    if (!readIds.has(id)) { readIds.add(id); updated += 1; }
  }
  return { success: true, updated };
}
