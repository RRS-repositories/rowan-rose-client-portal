/**
 * Offers API surface (Phase 7.3 Slice A). Real endpoints when VITE_REAL_AUTH is
 * on — the backend serves the CRM's verified figures and proxies the signed
 * acceptance into the CRM's existing token pipeline. Mock flow (data/offers.ts)
 * otherwise. Mirrors the profile.ts pattern.
 */
import { apiClient, ApiError } from "./client";
import * as mock from "@/data/offers";
import { setRealClient } from "@/data/mock";
import { fetchRealClient, REAL_AUTH } from "@/data/realClient";
import type {
  OfferDetails,
  OfferAcceptancePayload,
  OfferAcceptanceResponse,
  OfferRejectionResponse,
} from "@/data/offers";

export type { OfferDetails, OfferAcceptancePayload, OfferAcceptanceResponse, OfferRejectionResponse };

export async function getOfferDetails(claimId: string): Promise<OfferDetails | null> {
  if (!REAL_AUTH) return mock.getOfferDetails(claimId);
  try {
    const res = await apiClient.get<{ offer: OfferDetails }>(`/client/offers/${encodeURIComponent(claimId)}`);
    return res.offer ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null; // no live offer
    throw err;
  }
}

export async function acceptOffer(claimId: string, payload: OfferAcceptancePayload): Promise<OfferAcceptanceResponse> {
  if (!REAL_AUTH) return mock.acceptOffer(claimId, payload);
  const res = await apiClient.post<OfferAcceptanceResponse>(
    `/client/offers/${encodeURIComponent(claimId)}/accept`,
    { signatureData: payload.signatureData, agreedToTerms: payload.agreedToTerms },
  );
  if (res.success) {
    // The CRM has flipped the status and signing record server-side — re-pull
    // the client so dashboard/claim/requirement views reflect the acceptance.
    // The pause covers the CRM's fire-and-forget signing-record update.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setRealClient(await fetchRealClient());
  }
  return res;
}

/** Mock-only: rejection is not a client self-serve action in the CRM — on real
 *  auth the UI routes clients to their handler instead of calling this. */
export function rejectOffer(claimId: string, reason?: string): Promise<OfferRejectionResponse> {
  return mock.rejectOffer(claimId, reason);
}
