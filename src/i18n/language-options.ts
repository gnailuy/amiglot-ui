import { normalizeLocale } from "@/i18n/locale";

export type LanguageOption = {
  value: string;
  label: string;
};

type DisplayNames = Intl.DisplayNames | null;

function getDisplayNames(locale: string): DisplayNames {
  if (typeof Intl === "undefined" || !("DisplayNames" in Intl)) {
    return null;
  }

  try {
    return new Intl.DisplayNames([locale], { type: "language" });
  } catch {
    return null;
  }
}

function resolveDisplayLabel(
  value: string,
  normalizedCode: string,
  display: DisplayNames,
): string {
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
    return normalizedCode;
  }

  const normalizedLabel = label.toLowerCase();
  const normalizedValue = normalizedCode.toLowerCase();
  if (
    normalizedLabel === normalizedValue ||
    normalizedLabel === value.toLowerCase()
  ) {
    return normalizedCode;
  }

  return label;
}

function getCollator(locale: string) {
  if (typeof Intl === "undefined" || !("Collator" in Intl)) {
    return null;
  }

  try {
    return new Intl.Collator(locale, { sensitivity: "base" });
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
  const options: Array<
    LanguageOption & { sortLabel: string; hasDisplayName: boolean }
  > = [];

  values.forEach((value) => {
    const normalizedCode = normalizeLocale(value);
    if (normalizedCode.toLowerCase() === "und") {
      return;
    }
    if (normalized.has(normalizedCode)) {
      return;
    }
    normalized.add(normalizedCode);

    const label = resolveDisplayLabel(value, normalizedCode, display);
    const hasDisplayName = label !== normalizedCode;

    options.push({
      value: normalizedCode,
      label: `${label} (${normalizedCode})`,
      sortLabel: label,
      hasDisplayName,
    });
  });

  const collator = getCollator(locale);
  const withDisplayNames = options    .filter((option) => option.hasDisplayName)    .sort((a, b) =>
      collator
        ? collator.compare(a.sortLabel, b.sortLabel)
        : a.sortLabel.localeCompare(b.sortLabel),
    );
  const withoutDisplayNames = options    .filter((option) => !option.hasDisplayName)    .sort((a, b) => a.value.localeCompare(b.value));

  return [...withDisplayNames, ...withoutDisplayNames].map(({ value, label }) => ({
    value,
    label,
  }));
}

export function buildLanguageSwitcherOptions(
  values: string[],
): LanguageOption[] {
  const normalized = new Set<string>();
  const options: Array<
    LanguageOption & { hasDisplayName: boolean }
  > = [];

  values.forEach((value) => {
    const normalizedCode = normalizeLocale(value);
    if (normalizedCode.toLowerCase() === "und") {
      return;
    }
    if (normalized.has(normalizedCode)) {
      return;
    }
    normalized.add(normalizedCode);

    const display = getDisplayNames(normalizedCode);
    const label = resolveDisplayLabel(value, normalizedCode, display);
    const hasDisplayName = label !== normalizedCode;

    options.push({
      value: normalizedCode,
      label: `${label} (${normalizedCode})`,
      hasDisplayName,
    });
  });

  const withDisplayNames = options    .filter((option) => option.hasDisplayName)    .sort((a, b) => a.value.localeCompare(b.value));
  const withoutDisplayNames = options    .filter((option) => !option.hasDisplayName)    .sort((a, b) => a.value.localeCompare(b.value));

  return [...withDisplayNames, ...withoutDisplayNames].map(({ value, label }) => ({
    value,
    label,
  }));
}
