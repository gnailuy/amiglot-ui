import { getAccessToken, getUserId } from "@/lib/session";
import { getPreferredLocale } from "@/i18n/locale";

export const API_BASE = "/api/v1";

type ApiErrorShape = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string>;
  };
  detail?: string;
  message?: string;
  title?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function buildHeaders(options: { token?: string } = {}): Record<string, string> {
  const fallbackLocale =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language
      : "en";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": getPreferredLocale(fallbackLocale),
  };

  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    headers["X-Request-Id"] = crypto.randomUUID();
  }

  const token = options.token ?? getAccessToken() ?? undefined;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const userId = getUserId();
  if (userId) {
    headers["X-User-Id"] = userId;
  }

  return headers;
}

export async function postJson<T>(
  path: string,
  body: Record<string, unknown>,
  options: { token?: string } = {},
): Promise<T> {
  const headers = buildHeaders(options);

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as
    | ApiErrorShape
    | T;

  if (!response.ok) {
    const message =
      (data as ApiErrorShape)?.error?.message ??
      (data as ApiErrorShape)?.detail ??
      (data as ApiErrorShape)?.message ??
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export async function getJson<T>(
  path: string,
  options: { token?: string } = {},
): Promise<T> {
  const headers = buildHeaders(options);

  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as
    | ApiErrorShape
    | T;

  if (!response.ok) {
    const message =
      (data as ApiErrorShape)?.error?.message ??
      (data as ApiErrorShape)?.detail ??
      (data as ApiErrorShape)?.message ??
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export async function putJson<T>(
  path: string,
  body: Record<string, unknown>,
  options: { token?: string } = {},
): Promise<T> {
  const headers = buildHeaders(options);

  const response = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as
    | ApiErrorShape
    | T;

  if (!response.ok) {
    const message =
      (data as ApiErrorShape)?.error?.message ??
      (data as ApiErrorShape)?.detail ??
      (data as ApiErrorShape)?.message ??
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}
