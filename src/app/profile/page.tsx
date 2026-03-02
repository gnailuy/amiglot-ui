import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE } from "@/i18n/locale";

import ProfileForm from "./profile-form";
import type { ProfileResponse } from "./profile-types";

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

type InitialProfileResult = {
  fetched: boolean;
  data?: ProfileResponse | null;
  error?: string | null;
};

const API_BASE = "/api/v1";

async function getInitialProfile(): Promise<InitialProfileResult> {
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (host ? `${proto}://${host}` : "http://localhost:3000");

  const response = await fetch(`${baseUrl}${API_BASE}/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": acceptLanguage,
      Authorization: `Bearer ${token}`,
      "X-User-Id": userId,
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as ApiErrorShape | ProfileResponse;

  if (!response.ok) {
    if (response.status === 404) {
      return { fetched: true, data: null };
    }
    const message =
      (data as ApiErrorShape)?.error?.message ??
      (data as ApiErrorShape)?.detail ??
      (data as ApiErrorShape)?.message ??
      `Request failed (${response.status})`;
    return { fetched: true, error: message };
  }

  return { fetched: true, data: data as ProfileResponse };
}

export default async function ProfilePage() {
  const { data, error, fetched } = await getInitialProfile();
  return <ProfileForm initialData={data} initialError={error} initialFetched={fetched} />;
}
