import { DEFAULT_LANGUAGE_CODES } from "@/config/profile-options";

import { normalizeLocale } from "@/i18n/locale";

export const DEFAULT_LOCALE = "en";
export const TRANSLATED_LOCALES = ["en", "zh", "pt-BR"] as const;

const normalizedLocales = DEFAULT_LANGUAGE_CODES.map(normalizeLocale).concat(DEFAULT_LOCALE);

export const AVAILABLE_LOCALES = Array.from(new Set(normalizedLocales));
export const AVAILABLE_LOCALE_SET = new Set(AVAILABLE_LOCALES);
