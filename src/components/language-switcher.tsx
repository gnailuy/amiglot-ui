"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import { SmartSelect, type SelectOption } from "@/components/ui/smart-select";
import { DEFAULT_LANGUAGE_CODES } from "@/config/profile-options";
import { buildLanguageSelectOptions } from "@/i18n/language-options";
import { setLocaleCookie } from "@/i18n/locale";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const options = useMemo<SelectOption[]>(
    () => buildLanguageSelectOptions(DEFAULT_LANGUAGE_CODES, locale),
    [locale],
  );

  const onChange = (value: string) => {
    if (value === locale) {
      return;
    }
    setLocaleCookie(value);
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {t("language")}
      </span>
      <SmartSelect
        value={locale}
        onValueChange={onChange}
        options={options}
        placeholder={t("language")}
        searchPlaceholder={t("language")}
        searchAriaLabel={t("language")}
        className="min-w-[220px]"
      />
    </div>
  );
}
