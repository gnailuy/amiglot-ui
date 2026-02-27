"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { SmartSelect, type SelectOption } from "@/components/ui/smart-select";
import { DEFAULT_LANGUAGE_CODES } from "@/config/profile-options";
import { normalizeLocale, setLocaleCookie } from "@/i18n/locale";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();

  const options = useMemo<SelectOption[]>(() => {
    const normalized = new Set<string>();
    const localeNames =
      typeof Intl !== "undefined" && "DisplayNames" in Intl
        ? new Intl.DisplayNames([locale], { type: "language" })
        : null;

    const list: SelectOption[] = [];

    DEFAULT_LANGUAGE_CODES.forEach((code) => {
      const normalizedCode = normalizeLocale(code);
      if (normalized.has(normalizedCode)) {
        return;
      }
      normalized.add(normalizedCode);

      let label = normalizedCode;

      if (localeNames) {
        try {
          label = localeNames.of(normalizedCode) ?? normalizedCode;
        } catch {
          label = normalizedCode;
        }
      }

      list.push({
        value: normalizedCode,
        label: label ? `${label} (${normalizedCode})` : normalizedCode,
      });
    });

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [locale]);

  const onChange = (value: string) => {
    setLocaleCookie(value);
    router.refresh();
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
