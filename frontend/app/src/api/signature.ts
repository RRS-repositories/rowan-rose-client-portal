/**
 * Signature / Letter of Authority (Phase 7.3 Slice B). V1 deliberately has no
 * in-portal LoA e-sign: the portal surfaces the ask and routes to the CRM's
 * existing signing page — the same URL the chase email carries, fetched
 * per-claim from the backend (ownership-checked, only while unsigned).
 * There is no mock signing flow; mock mode has no signature asks.
 */
import { apiClient, ApiError } from "./client";
import { REAL_AUTH } from "@/data/realClient";

export async function getResignLink(claimId: string): Promise<string | null> {
  if (!REAL_AUTH) return null;
  try {
    const res = await apiClient.get<{ url: string }>(
      `/client/claims/${encodeURIComponent(claimId)}/resign-link`,
    );
    return res.url ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Open the CRM signing page from a user gesture. The tab opens synchronously
 *  (so popup blockers allow it) and is then pointed at the signing URL. */
export async function openSigningPage(claimId: string): Promise<boolean> {
  const win = window.open("", "_blank");
  try {
    const url = await getResignLink(claimId);
    if (!url) {
      win?.close();
      return false;
    }
    if (win) win.location.href = url;
    else window.location.href = url;
    return true;
  } catch {
    win?.close();
    return false;
  }
}
