import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE } from "@/i18n/locale";

import RequestDetail from "./request-detail";

const API_BASE = "/api/v1";

type ApiErrorShape = {
  error?: { message?: string };
  detail?: string;
  message?: string;
};

async function fetchServerJson<T>(path: string): Promise<{ data?: T; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("amiglot_access_token")?.value;
  const userId = cookieStore.get("amiglot_user_id")?.value;

  if (!token || !userId) {
    return { error: "Not authenticated" };
  }

  const headerList = await headers();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value;
  const acceptLanguage = locale ?? headerList.get("accept-language") ?? "en";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (host ? `${proto}://${host}` : "http://localhost:3000");

  const response = await fetch(`${baseUrl}${API_BASE}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": acceptLanguage,
      Authorization: `Bearer ${token}`,
      "X-User-Id": userId,
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => ({}))) as ApiErrorShape | T;

  if (!response.ok) {
    const message =
      (body as ApiErrorShape)?.error?.message ??
      (body as ApiErrorShape)?.detail ??
      (body as ApiErrorShape)?.message ??
      `Request failed (${response.status})`;
    return { error: message };
  }

  return { data: body as T };
}

import type { MatchRequest, MessagesResponse } from "../connection-types";

type PageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function RequestDetailPage({ params }: PageProps) {
  const { requestId } = await params;

  const [requestResult, messagesResult] = await Promise.all([
    fetchServerJson<MatchRequest>(`/match-requests/${requestId}`),
    fetchServerJson<MessagesResponse>(
      `/match-requests/${requestId}/messages?limit=50`,
    ),
  ]);

  return (
    <RequestDetail
      requestId={requestId}
      initialRequest={requestResult.data}
      initialMessages={messagesResult.data?.items}
      initialError={requestResult.error ?? messagesResult.error}
    />
  );
}
