import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE } from "@/i18n/locale";

import ConversationsContent from "./conversations-content";
import type { ConversationsResponse } from "./conversation-types";

type ApiErrorShape = {
  error?: { message?: string };
  detail?: string;
  message?: string;
};

type InitialResult = {
  fetched: boolean;
  data?: ConversationsResponse | null;
  error?: string | null;
};

async function getInitialConversations(): Promise<InitialResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("amiglot_access_token")?.value;
  const userId = cookieStore.get("amiglot_user_id")?.value;

  if (!token || !userId) {
    return { fetched: false };
  }

  const headerList = await headers();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value;
  const acceptLanguage = locale ?? headerList.get("accept-language") ?? "en";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (host ? `${proto}://${host}` : "http://localhost:3000");

  const response = await fetch(`${baseUrl}/api/v1/matches?limit=20`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": acceptLanguage,
      Authorization: `Bearer ${token}`,
      "X-User-Id": userId,
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as
    | ApiErrorShape
    | ConversationsResponse;

  if (!response.ok) {
    const message =
      (data as ApiErrorShape)?.error?.message ??
      (data as ApiErrorShape)?.detail ??
      (data as ApiErrorShape)?.message ??
      `Request failed (${response.status})`;
    return { fetched: true, error: message };
  }

  return { fetched: true, data: data as ConversationsResponse };
}

export default async function ConversationsPage() {
  const { data, error, fetched } = await getInitialConversations();
  return (
    <ConversationsContent
      initialData={data}
      initialError={error}
      initialFetched={fetched}
    />
  );
}
