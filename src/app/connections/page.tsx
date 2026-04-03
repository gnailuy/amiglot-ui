import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE } from "@/i18n/locale";

import ConnectionsContent from "./connections-content";
import type { MatchRequestsResponse } from "./connection-types";

type ApiErrorShape = {
  error?: {
    code?: string;
    message?: string;
  };
  detail?: string;
  message?: string;
  title?: string;
};

type InitialResult = {
  fetched: boolean;
  data?: MatchRequestsResponse | null;
  error?: string | null;
  errorStatus?: number | null;
};

const API_BASE = "/api/v1";

async function getInitialRequests(): Promise<InitialResult> {
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

  const response = await fetch(
    `${baseUrl}${API_BASE}/match-requests?direction=incoming&status=pending&limit=20`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": acceptLanguage,
        Authorization: `Bearer ${token}`,
        "X-User-Id": userId,
      },
      cache: "no-store",
    },
  );

  const data = (await response.json().catch(() => ({}))) as
    | ApiErrorShape
    | MatchRequestsResponse;

  if (!response.ok) {
    const message =
      (data as ApiErrorShape)?.error?.message ??
      (data as ApiErrorShape)?.detail ??
      (data as ApiErrorShape)?.message ??
      `Request failed (${response.status})`;
    return { fetched: true, error: message, errorStatus: response.status };
  }

  return { fetched: true, data: data as MatchRequestsResponse };
}

export default async function ConnectionsPage() {
  const { data, error, errorStatus, fetched } = await getInitialRequests();
  return (
    <ConnectionsContent
      initialData={data}
      initialError={error}
      initialErrorStatus={errorStatus}
      initialFetched={fetched}
    />
  );
}
