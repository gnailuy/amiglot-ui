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
  const namedOptions: LanguageOption[] = [];
  const fallbackOptions: LanguageOption[] = [];

  values.forEach((value) => {
    const normalizedCode = normalizeLocale(value);
    if (normalizedCode.toLowerCase() === "und") {
      return;
    }
    if (normalized.has(normalizedCode)) {
      return;
    }
    normalized.add(normalizedCode);

    let label: string | undefined;
    let hasProperDisplayName = true;

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
      label = normalizedCode;
      hasProperDisplayName = false;
    }

    if (display) {
      const normalizedLabel = label.toLowerCase();
      const normalizedValue = normalizedCode.toLowerCase();
      if (
        normalizedLabel === normalizedValue ||
        normalizedLabel === value.toLowerCase()
      ) {
        hasProperDisplayName = false;
      }
    } else {
      hasProperDisplayName = false;
    }

    const option = {
      value: normalizedCode,
      label: `${label} (${normalizedCode})`,
    };

    if (hasProperDisplayName) {
      namedOptions.push(option);
    } else {
      fallbackOptions.push(option);
    }
  });

  const sortedNamed = namedOptions.sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const sortedFallback = fallbackOptions.sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return [...sortedNamed, ...sortedFallback];
}
