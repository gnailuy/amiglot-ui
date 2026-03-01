import { normalizeLocale } from "@/i18n/locale";
import { ENGLISH_LANGUAGE_NAMES } from "@/i18n/english-language-names";

export type LanguageOption = {
  value: string;
  label: string;
};

type DisplayNames = Intl.DisplayNames | null;

const EXCLUDED_LANGUAGE_CODES = new Set([
  "und",
  "zxx",
  "mis",
  "mul",
  "root",
  "qaa",
  "qtz",
  "art",
  "cel",
  "phi",
  "tut",
  "sgn",
]);

const ISO_639_1_CODES = new Set([
  "aa", "ab", "ae", "af", "ak", "am", "an", "ar", "as", "av", "ay", "az",
  "ba", "be", "bg", "bh", "bi", "bm", "bn", "bo", "br", "bs", "ca", "ce",
  "ch", "co", "cr", "cs", "cu", "cv", "cy", "da", "de", "dv", "dz", "ee",
  "el", "en", "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fo", "fr",
  "fy", "ga", "gd", "gl", "gn", "gu", "gv", "ha", "he", "hi", "ho", "hr",
  "ht", "hu", "hy", "hz", "ia", "id", "ie", "ig", "ii", "ik", "io", "is",
  "it", "iu", "ja", "jv", "ka", "kg", "ki", "kj", "kk", "kl", "km", "kn",
  "ko", "kr", "ks", "ku", "kv", "kw", "ky", "la", "lb", "lg", "li", "ln",
  "lo", "lt", "lu", "lv", "mg", "mh", "mi", "mk", "ml", "mn", "mr", "ms",
  "mt", "my", "na", "nb", "nd", "ne", "ng", "nl", "nn", "no", "nr", "nv",
  "ny", "oc", "oj", "om", "or", "os", "pa", "pi", "pl", "ps", "pt", "qu",
  "rm", "rn", "ro", "ru", "rw", "sa", "sc", "sd", "se", "sg", "si", "sk",
  "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "ta",
  "te", "tg", "th", "ti", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw",
  "ty", "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "wo", "xh", "yi",
  "yo", "za", "zh", "zu",
]);

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

function isRedundantLabel(label: string, value: string, normalizedCode: string) {
  const normalizedLabel = label.toLowerCase();
  const normalizedValue = normalizedCode.toLowerCase();
  return (
    normalizedLabel === normalizedValue ||
    normalizedLabel === value.toLowerCase()
  );
}

function resolveEnglishFallback(normalizedCode: string) {
  const fallback = ENGLISH_LANGUAGE_NAMES[normalizedCode];
  if (!fallback) {
    return normalizedCode;
  }

  if (fallback.toLowerCase() === normalizedCode.toLowerCase()) {
    return normalizedCode;
  }

  return fallback;
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

  if (!label || isRedundantLabel(label, value, normalizedCode)) {
    return resolveEnglishFallback(normalizedCode);
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
    const normalizedLower = normalizedCode.toLowerCase();
    if (EXCLUDED_LANGUAGE_CODES.has(normalizedLower)) {
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
  const withDisplayNames = options
    .filter((option) => option.hasDisplayName)
    .sort((a, b) =>
      collator
        ? collator.compare(a.sortLabel, b.sortLabel)
        : a.sortLabel.localeCompare(b.sortLabel),
    );
  const withoutDisplayNames = options
    .filter((option) => !option.hasDisplayName)
    .sort((a, b) => a.value.localeCompare(b.value));

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
    const normalizedLower = normalizedCode.toLowerCase();
    if (EXCLUDED_LANGUAGE_CODES.has(normalizedLower)) {
      return;
    }
    const primarySubtag = normalizedLower.split("-")[0];
    if (!ISO_639_1_CODES.has(primarySubtag)) {
      return;
    }
    if (normalized.has(normalizedCode)) {
      return;
    }
    normalized.add(normalizedCode);

    const label = resolveEnglishFallback(normalizedCode);
    const hasDisplayName = label !== normalizedCode;

    options.push({
      value: normalizedCode,
      label: `${label} (${normalizedCode})`,
      hasDisplayName,
    });
  });

  const withDisplayNames = options
    .filter((option) => option.hasDisplayName)
    .sort((a, b) => a.value.localeCompare(b.value));
  const withoutDisplayNames = options
    .filter((option) => !option.hasDisplayName)
    .sort((a, b) => a.value.localeCompare(b.value));

  return [...withDisplayNames, ...withoutDisplayNames].map(({ value, label }) => ({
    value,
    label,
  }));
}
