export const API_BASE = "/api/v1";

type ApiErrorShape = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string>;
  };
};

export async function postJson<T>(
  path: string,
  body: Record<string, unknown>,
  options: { token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language":
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en",
  };

  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    headers["X-Request-Id"] = crypto.randomUUID();
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

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
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
