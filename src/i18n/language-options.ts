import { normalizeLocale } from "@/i18n/locale";

export type LanguageOption = {
  value: string;
  label: string;
};

function getDisplayNames(locale: string) {
  if (typeof Intl === "undefined" || !("DisplayNames" in Intl)) {
    return null;
  }

  try {
    return new Intl.DisplayNames([locale], { type: "language" });
  } catch {
    return null;
  }
}

export function buildLanguageSelectOptions(
  values: string[],
  locale: string,
): LanguageOption[] {
  const display = getDisplayNames(locale);
  const normalized = new Set<string>();
  const options: LanguageOption[] = [];

  values.forEach((value) => {
    const normalizedCode = normalizeLocale(value);
    if (normalized.has(normalizedCode)) {
      return;
    }
    normalized.add(normalizedCode);

    let label: string | undefined;

    if (display) {
      try {
        label = display.of(normalizedCode) ?? display.of(value) ?? undefined;
      } catch {
        try {
          label = display.of(value.replace(/_/g, "-")) ?? undefined;
        } catch {
          label = undefined;
        }
      }
    }

    if (!label) {
      if (display) {
        return;
      }
      label = normalizedCode;
    }

    if (display) {
      const normalizedLabel = label.toLowerCase();
      const normalizedValue = normalizedCode.toLowerCase();
      if (
        normalizedLabel === normalizedValue ||
        normalizedLabel === value.toLowerCase()
      ) {
        return;
      }
    }

    options.push({
      value: normalizedCode,
      label: `${label} (${normalizedCode})`,
    });
  });

  return options.sort((a, b) => a.label.localeCompare(b.label));
}
