/**
 * Slice C ask links (questionnaire, extra-lender, FOS referral). Like the
 * signature flow, V1 routes to the CRM's existing token pages — the portal
 * backend serves each link to the authenticated owner only. No mock flows:
 * mock mode has none of these asks.
 */
import { apiClient, ApiError } from "./client";
import { REAL_AUTH } from "@/data/realClient";

async function fetchLink(path: string): Promise<string | null> {
  if (!REAL_AUTH) return null;
  try {
    const res = await apiClient.get<{ url: string }>(path);
    return res.url ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export const getQuestionnaireLink = (): Promise<string | null> => fetchLink("/client/questionnaire-link");
export const getExtraLenderLink = (): Promise<string | null> => fetchLink("/client/extra-lender-link");
export const getFosLink = (claimId: string): Promise<string | null> =>
  fetchLink(`/client/claims/${encodeURIComponent(claimId)}/fos-link`);

/** Open an ask's form page from a user gesture — tab opens synchronously (so
 *  popup blockers allow it) and is then pointed at the fetched URL. */
export async function openAskPage(get: () => Promise<string | null>): Promise<boolean> {
  const win = window.open("", "_blank");
  try {
    const url = await get();
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
