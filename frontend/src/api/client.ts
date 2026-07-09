import { getDevIdentity } from "../telegram/devIdentity";
import { getWebApp, isMockMode } from "../telegram/webApp";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function withAuthHeaders(headers: Headers) {
  if (isMockMode()) {
    const identity = getDevIdentity();
    headers.set("x-dev-telegram-id", identity.telegramId);
    headers.set("x-dev-full-name", identity.fullName);
  } else {
    const initData = getWebApp()?.initData ?? "";
    headers.set("Authorization", `tma ${initData}`);
  }
  return headers;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  // Skip forcing JSON when the body is FormData — the browser must set its
  // own multipart boundary in Content-Type, which we'd otherwise clobber.
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  withAuthHeaders(headers);

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new ApiError(res.status, body.error ?? `So'rov xato bilan yakunlandi (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const get = <T>(path: string) => apiFetch<T>(path);
export const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
export const put = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
export const patch = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
export const del = <T>(path: string) => apiFetch<T>(path, { method: "DELETE" });
export const postForm = <T>(path: string, formData: FormData) =>
  apiFetch<T>(path, { method: "POST", body: formData });

export async function fetchBlob(path: string): Promise<{ blob: Blob; filename: string }> {
  const headers = withAuthHeaders(new Headers());
  const res = await fetch(`/api${path}`, { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new ApiError(res.status, body.error ?? `So'rov xato bilan yakunlandi (${res.status})`);
  }

  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? "hisobot.xlsx";

  return { blob: await res.blob(), filename };
}
