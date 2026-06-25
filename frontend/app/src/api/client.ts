/**
 * Base API client — a thin fetch wrapper, prepared for real endpoints in
 * Phase 7.1. baseURL comes from VITE_API_URL (defaults to ""). During the
 * frontend phase the auth functions route through mocks instead (see auth.ts).
 */
import { getToken } from "@/lib/session";

const BASE_URL: string = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(method: "GET" | "POST", url: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE_URL + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      /* non-JSON error body — keep the default message */
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

/** Multipart POST (file uploads). Lets the browser set the multipart boundary. */
async function upload<T>(url: string, form: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE_URL + url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch { /* keep default */ }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, data?: unknown) => request<T>("POST", url, data),
  upload,
};
