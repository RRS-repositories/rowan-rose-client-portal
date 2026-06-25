/** Loads the logged-in client's real data from the backend (Phase 7.1).
 *  One call to /client/bootstrap returns the Client shape the app already uses;
 *  on any failure we return null so callers fall back to mock/empty cleanly. */
import { apiClient } from "@/api/client";
import type { Client } from "./types";

export const REAL_AUTH = import.meta.env.VITE_REAL_AUTH === "true";

export async function fetchRealClient(): Promise<Client | null> {
  if (!REAL_AUTH) return null;
  try {
    const res = await apiClient.get<{ client: Client }>("/client/bootstrap");
    return res.client ?? null;
  } catch {
    return null;
  }
}
