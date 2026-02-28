import createMiddleware from "next-intl/middleware";

import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from "@/i18n/config";

export default createMiddleware({
  locales: AVAILABLE_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "never",
  localeDetection: true,
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
