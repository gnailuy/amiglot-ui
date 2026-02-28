import { DEFAULT_LOCALE, TRANSLATED_LOCALES } from "@/i18n/config";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function normalizeLocale(locale: string) {
  return locale.replace(/_/g, "-");
}

export function resolveMessageLocale(locale: string) {
  const normalized = normalizeLocale(locale);
  const lowered = normalized.toLowerCase();

  if (["zh-hans", "zh-cn", "zh-sg"].includes(lowered)) {
    return "zh-Hans";
  }

  if (["zh-hant", "zh-hk", "zh-tw", "zh-mo"].includes(lowered)) {
    return "zh-Hant";
  }

  if (lowered === "zh") {
    return "zh";
  }

  if (lowered === "pt-pt") {
    return "pt-PT";
  }

  if (lowered === "pt-br" || lowered === "pt") {
    return "pt-BR";
  }

  if (lowered === "en-au") {
    return "en-AU";
  }

  if (lowered === "en-ca") {
    return "en-CA";
  }

  if (lowered === "en-gb") {
    return "en-GB";
  }

  if (lowered === "en-us") {
    return "en-US";
  }

  if (lowered === "en") {
    return "en";
  }

  return DEFAULT_LOCALE;
}

export function isTranslatedLocale(locale: string) {
  return TRANSLATED_LOCALES.includes(resolveMessageLocale(locale) as (typeof TRANSLATED_LOCALES)[number]);
}

export function getLocaleCookieValue() {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`));

  if (!match) {
    return null;
  }

  const value = match.split("=")[1] ?? "";
  return value ? decodeURIComponent(value) : null;
}

export function setLocaleCookie(locale: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax`;
}

export function getPreferredLocale(fallback: string) {
  return getLocaleCookieValue() || fallback;
}
