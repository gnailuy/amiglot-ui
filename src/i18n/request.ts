import { getRequestConfig } from "next-intl/server";

import { AVAILABLE_LOCALE_SET, DEFAULT_LOCALE } from "@/i18n/config";
import { normalizeLocale, resolveMessageLocale } from "@/i18n/locale";

export default getRequestConfig(async ({ requestLocale }) => {
  let normalized = DEFAULT_LOCALE;

  if (typeof requestLocale === "string" && requestLocale) {
    normalized = normalizeLocale(requestLocale);
  } else if (Array.isArray(requestLocale) && requestLocale.length > 0) {
    normalized = normalizeLocale(requestLocale[0]);
  }

  const locale = AVAILABLE_LOCALE_SET.has(normalized) ? normalized : DEFAULT_LOCALE;
  const messageLocale = resolveMessageLocale(locale);

  const messages = (await import(`./messages/${messageLocale}.json`)).default;

  return { locale, messages };
});
