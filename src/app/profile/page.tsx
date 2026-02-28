"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getTimeZones } from "@vvo/tzdb";

import { ApiError, getJson, putJson } from "@/lib/api";
import { getAccessToken, getUserId } from "@/lib/session";
import { cn } from "@/lib/utils";
import { DEFAULT_COUNTRY_CODES, DEFAULT_LANGUAGE_CODES, MONTHS } from "@/config/profile-options";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmartSelect, type SelectOption } from "@/components/ui/smart-select";
import { buildLanguageSelectOptions } from "@/i18n/language-options";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ProfilePayload = {
  handle: string;
  birth_year?: number | null;
  birth_month?: number | null;
  country_code?: string | null;
  timezone: string;
  discoverable?: boolean;
};

type LanguagePayload = {
  language_code: string;
  level: number;
  is_native: boolean;
  is_target: boolean;
  description?: string | null;
};

type AvailabilityPayload = {
  weekday: number;
  start_local_time: string;
  end_local_time: string;
  timezone: string;
};

type AvailabilityDraft = {
  weekdays: number[];
  start_local_time: string;
  end_local_time: string;
  timezone: string;
};

type ProfileResponse = {
  user: {
    id: string;
    email: string;
  };
  profile: ProfilePayload;
  languages: LanguagePayload[];
  availability: AvailabilityPayload[];
};

type HandleCheckResponse = {
  available: boolean;
};

type Option = SelectOption;

const HANDLE_PATTERN = /^[a-zA-Z0-9]+$/;
const HANDLE_MIN_LENGTH = 3;
const HANDLE_MAX_LENGTH = 20;
const BIRTH_YEAR_MIN = 1900;
const UNSET_SELECT_VALUE = "__unset__";

function buildOptions(values: string[], type: "language" | "region", locale: string): Option[] {
  const display = new Intl.DisplayNames([locale], { type });
  const collator = new Intl.Collator([locale], { sensitivity: "base" });
  const resolveLabel = (value: string) => {
    try {
      return display.of(value) ?? value;
    } catch {
      try {
        return display.of(value.replace(/_/g, "-")) ?? value;
      } catch {
        return value;
      }
    }
  };
  return values
    .map((value) => ({
      value,
      label: `${resolveLabel(value)} (${value})`,
    }))
    .sort((a, b) => collator.compare(a.label, b.label));
}

function formatOffsetLabel(totalMinutes: number) {
  const sign = totalMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  const paddedHours = String(hours).padStart(2, "0");
  const paddedMinutes = String(minutes).padStart(2, "0");
  return `UTC${sign}${paddedHours}:${paddedMinutes}`;
}

function resolveTimezoneDisplayName(timeZone: string, locale: string) {
  const fallback = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
  try {
    const display = new Intl.DisplayNames([locale], {
      type: "timeZone" as Intl.DisplayNamesOptions["type"],
      fallback: "none",
    });
    const name = display.of(timeZone);
    if (name) {
      return name;
    }
  } catch {
    // Ignore and fall back to the parsed city name.
  }
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      timeZoneName: "longGeneric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = formatter.formatToParts(new Date());
    const tzName = parts.find((part) => part.type === "timeZoneName")?.value;
    if (tzName && !/^(UTC|GMT)/i.test(tzName)) {
      return tzName;
    }
  } catch {
    // Ignore and fall back to the parsed city name.
  }
  return fallback;
}

function buildTimezoneOptions(locale: string): Option[] {
  const collator = new Intl.Collator([locale], { sensitivity: "base" });
  return getTimeZones({ includeUtc: true })
    .map((timeZone) => {
      const offsetLabel = formatOffsetLabel(timeZone.currentTimeOffsetInMinutes);
      const displayName = resolveTimezoneDisplayName(timeZone.name, locale);
      const cities = timeZone.mainCities?.slice(0, 3).filter(Boolean) ?? [];
      const cityLabel = cities.length ? ` (${cities.join(", ")})` : "";
      return {
        value: timeZone.name,
        label: `(${offsetLabel}) ${displayName}${cityLabel}`,
        offsetMinutes: timeZone.currentTimeOffsetInMinutes,
      };
    })
    .sort((a, b) => {
      if (a.offsetMinutes !== b.offsetMinutes) {
        return a.offsetMinutes - b.offsetMinutes;
      }
      return collator.compare(a.label, b.label);
    })
    .map(({ offsetMinutes, ...option }) => {
      void offsetMinutes;
      return option;
    });
}

function getBrowserTimezone() {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
    return "America/Vancouver";
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Vancouver";
  } catch {
    return "America/Vancouver";
  }
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const locale = useLocale();
  const PROFICIENCY_LABELS: Record<number, string> = {
    0: t("languageLevel.zero"),
    1: t("languageLevel.beginner"),
    2: t("languageLevel.elementary"),
    3: t("languageLevel.intermediate"),
    4: t("languageLevel.advanced"),
    5: t("languageLevel.native"),
  };

  const WEEKDAYS = [
    t("weekdays.sunday"),
    t("weekdays.monday"),
    t("weekdays.tuesday"),
    t("weekdays.wednesday"),
    t("weekdays.thursday"),
    t("weekdays.friday"),
    t("weekdays.saturday"),
  ];

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const hasAuth = Boolean(token && userId);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const loading = hasAuth && !profileLoaded;
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [originalHandle, setOriginalHandle] = useState("");
  const [birthYear, setBirthYear] = useState(UNSET_SELECT_VALUE);
  const [birthMonth, setBirthMonth] = useState(UNSET_SELECT_VALUE);
  const [countryCode, setCountryCode] = useState("");
  const [timezone, setTimezone] = useState(() => getBrowserTimezone());
  const [discoverable, setDiscoverable] = useState<boolean | null>(null);

  const [handleAvailability, setHandleAvailability] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");
  const handleValidity = useMemo(() => {
    const trimmedHandle = handle.trim().replace(/^@+/, "");
    if (!trimmedHandle) {
      return "idle" as const;
    }
    if (
      trimmedHandle.length < HANDLE_MIN_LENGTH ||
      trimmedHandle.length > HANDLE_MAX_LENGTH ||
      !HANDLE_PATTERN.test(trimmedHandle)
    ) {
      return "invalid" as const;
    }
    return "valid" as const;
  }, [handle]);
  const handleChanged = useMemo(() => {
    const trimmedHandle = handle.trim().replace(/^@+/, "");
    const trimmedOriginal = originalHandle.trim().replace(/^@+/, "");
    if (!trimmedOriginal) {
      return false;
    }
    return trimmedHandle !== trimmedOriginal;
  }, [handle, originalHandle]);
  const effectiveHandleAvailability:
    | "idle"
    | "checking"
    | "available"
    | "unavailable"
    | "invalid" =
    handleValidity === "valid"
      ? handleChanged
        ? handleAvailability
        : "idle"
      : handleValidity;

  const [languages, setLanguages] = useState<LanguagePayload[]>([
    {
      language_code: "en",
      level: 5,
      is_native: true,
      is_target: false,
      description: "",
    },
  ]);
  const [availability, setAvailability] = useState<AvailabilityDraft[]>([
    {
      weekdays: [1],
      start_local_time: "18:00",
      end_local_time: "20:00",
      timezone: "",
    },
  ]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= BIRTH_YEAR_MIN; year -= 1) {
      years.push(year);
    }
    return years;
  }, []);

  const birthYearOptions = useMemo<SelectOption[]>(
    () => [
      { value: UNSET_SELECT_VALUE, label: t("birthYearPlaceholder") },
      ...yearOptions.map((year) => ({ value: year.toString(), label: year.toString() })),
    ],
    [t, yearOptions],
  );

  const birthMonthOptions = useMemo<SelectOption[]>(
    () => [
      { value: UNSET_SELECT_VALUE, label: t("birthMonthPlaceholder") },
      ...MONTHS.map((month) => ({ value: month, label: t(`months.${month}`) })),
    ],
    [t],
  );

  const countryOptions = useMemo(() => {
    const supportedValuesOf = (Intl as unknown as {
      supportedValuesOf?: (key: string) => string[];
    }).supportedValuesOf;
    let regions = DEFAULT_COUNTRY_CODES;
    if (typeof supportedValuesOf === "function") {
      try {
        regions = supportedValuesOf("region");
      } catch {
        regions = DEFAULT_COUNTRY_CODES;
      }
    }
    const normalized = regions
      .map((code) => code.toUpperCase())
      .filter((code) => code.length === 2);
    return buildOptions(
      normalized.length ? normalized : DEFAULT_COUNTRY_CODES,
      "region",
      locale,
    );
  }, [locale]);

  const languageOptions = useMemo(() => {
    const normalized = DEFAULT_LANGUAGE_CODES
      .map((code) => code.toLowerCase())
      .filter((code) => code.length >= 2 && code.length <= 15);
    return buildLanguageSelectOptions(
      normalized.length ? normalized : DEFAULT_LANGUAGE_CODES,
      locale,
    );
  }, [locale]);

  const timezoneOptions = useMemo(() => buildTimezoneOptions(locale), [locale]);

  useEffect(() => {
    const tokenValue = getAccessToken();
    const userIdValue = getUserId();
    const frame = requestAnimationFrame(() => {
      setToken(tokenValue);
      setUserId(userIdValue);
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [locale]);

  useEffect(() => {
    if (!hasAuth) {
      return;
    }

    getJson<ProfileResponse>("/profile")
      .then((data) => {
        setEmail(data.user.email ?? "");
        setHandle(data.profile.handle ?? "");
        setOriginalHandle(data.profile.handle ?? "");
        setBirthYear(data.profile.birth_year?.toString() ?? UNSET_SELECT_VALUE);
        setBirthMonth(data.profile.birth_month?.toString() ?? UNSET_SELECT_VALUE);
        setCountryCode(data.profile.country_code ?? "");
        const resolvedTimezone = data.profile.timezone?.trim() || getBrowserTimezone();
        setTimezone(resolvedTimezone);
        setDiscoverable(data.profile.discoverable ?? null);
        setLanguages(
          data.languages.length
            ? data.languages
            : [
                {
                  language_code: "en",
                  level: 5,
                  is_native: true,
                  is_target: false,
                  description: "",
                },
              ],
        );
        const normalizedAvailability = data.availability.length
          ? (() => {
              const grouped = new Map<string, AvailabilityDraft>();
              data.availability.forEach((slot) => {
                const tz = slot.timezone?.trim() || resolvedTimezone;
                const key = `${slot.start_local_time}|${slot.end_local_time}|${tz}`;
                const existing = grouped.get(key);
                if (existing) {
                  if (!existing.weekdays.includes(slot.weekday)) {
                    existing.weekdays.push(slot.weekday);
                  }
                  return;
                }
                grouped.set(key, {
                  weekdays: [slot.weekday],
                  start_local_time: slot.start_local_time,
                  end_local_time: slot.end_local_time,
                  timezone: tz,
                });
              });
              return Array.from(grouped.values()).map((slot) => ({
                ...slot,
                weekdays: [...slot.weekdays].sort(),
              }));
            })()
          : [
              {
                weekdays: [1],
                start_local_time: "18:00",
                end_local_time: "20:00",
                timezone: resolvedTimezone,
              },
            ];
        setAvailability(normalizedAvailability);
        setMessage(null);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setMessage(null);
          return;
        }
        setMessage(
          error instanceof Error
            ? error.message
            : t("profileLoadedError"),
        );
      })
      .finally(() => {
        setProfileLoaded(true);
      });
  }, [hasAuth, token, userId, t]);

  useEffect(() => {
    if (!hasAuth || handleValidity !== "valid" || !handleChanged) {
      return;
    }
    const trimmedHandle = handle.trim().replace(/^@+/, "");
    const timeout = window.setTimeout(() => {
      setHandleAvailability("checking");
      const request = getJson<HandleCheckResponse>(
        `/profile/handle/check?handle=${encodeURIComponent(trimmedHandle)}`,
      );
      if (!request || typeof (request as Promise<HandleCheckResponse>).then !== "function") {
        return;
      }
      request
        .then((data) => {
          setHandleAvailability(data.available ? "available" : "unavailable");
        })
        .catch(() => {
          setHandleAvailability("idle");
        });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [handle, hasAuth, handleValidity, handleChanged, originalHandle]);

  const validation = useMemo(() => {
    const nextErrors: Record<string, string> = {};

    const trimmedHandle = handle.trim().replace(/^@+/, "");
    if (!trimmedHandle) {
      nextErrors.handle = t("handleRequired");
    } else if (!HANDLE_PATTERN.test(trimmedHandle)) {
      nextErrors.handle = t("handleInvalidCharacters");
    } else if (
      trimmedHandle.length < HANDLE_MIN_LENGTH ||
      trimmedHandle.length > HANDLE_MAX_LENGTH
    ) {
      nextErrors.handle = t("handleInvalidLength");
    }

    const trimmedTimezone = timezone.trim();
    if (!trimmedTimezone) {
      nextErrors.timezone = t("timezoneInvalid");
    }

    if (birthYear !== UNSET_SELECT_VALUE) {
      const year = Number(birthYear);
      const currentYear = new Date().getFullYear();
      if (Number.isNaN(year) || year < BIRTH_YEAR_MIN || year > currentYear) {
        nextErrors.birthYear = t("birthYearInvalid");
      }
    }

    if (birthMonth !== UNSET_SELECT_VALUE) {
      const month = Number(birthMonth);
      if (Number.isNaN(month) || month < 1 || month > 12) {
        nextErrors.birthMonth = t("birthMonthInvalid");
      }
    }

    if (!languages.length) {
      nextErrors.languages = t("languagesRequired");
    }

    const cleanedLanguages = languages.map((lang) => {
      const languageCode = lang.language_code.trim().toLowerCase();
      const isNative = lang.level === 5;
      return {
        ...lang,
        language_code: languageCode,
        is_native: isNative,
        is_target: isNative ? false : lang.is_target,
        description: lang.description?.trim() || null,
      };
    });

    if (cleanedLanguages.some((lang) => !lang.language_code)) {
      nextErrors.languages = t("languagesEmpty");
    }

    const normalizedLanguageCodes = cleanedLanguages
      .map((lang) => lang.language_code)
      .filter(Boolean);
    const duplicateLanguageCodes = normalizedLanguageCodes.filter(
      (code, index) => normalizedLanguageCodes.indexOf(code) !== index,
    );
    if (duplicateLanguageCodes.length) {
      nextErrors.languages = t("languagesDuplicate");
    }

    const nativeCount = cleanedLanguages.filter((lang) => lang.is_native).length;
    if (nativeCount === 0) {
      nextErrors.languages = t("languagesNativeRequired");
    }

    if (availability.some((slot) => slot.weekdays.length === 0)) {
      nextErrors.availability = t("availabilityWeekdayRequired");
    }
    if (availability.some((slot) => !slot.start_local_time || !slot.end_local_time)) {
      nextErrors.availability = t("availabilityTimeRequired");
    }

    const expandedAvailability = availability.flatMap((slot) =>
      slot.weekdays.map((weekday) => ({
        weekday,
        start_local_time: slot.start_local_time,
        end_local_time: slot.end_local_time,
        timezone: slot.timezone || trimmedTimezone,
      })),
    );

    return {
      errors: nextErrors,
      cleanedLanguages,
      expandedAvailability,
      trimmedHandle,
      trimmedTimezone,
    };
  }, [handle, birthYear, birthMonth, timezone, languages, availability, t]);

  const fieldErrors = profileLoaded ? validation.errors : {};

  const hasValidation = profileLoaded;
  const profileTabInvalid =
    hasValidation &&
    (Boolean(
      validation.errors.handle ||
        validation.errors.timezone ||
        validation.errors.birthYear ||
        validation.errors.birthMonth,
    ) || effectiveHandleAvailability === "unavailable");
  const languageTabInvalid = hasValidation && Boolean(validation.errors.languages);
  const availabilityTabInvalid = hasValidation && Boolean(validation.errors.availability);
  const canSave =
    !loading &&
    Object.keys(validation.errors).length === 0 &&
    effectiveHandleAvailability !== "unavailable";

  const onSave = async () => {
    setMessage(null);

    if (!canSave) {
      setMessage(t("saveFixErrors"));
      return;
    }

    try {
      await putJson<ProfileResponse>("/profile", {
        handle: validation.trimmedHandle,
        birth_year: birthYear !== UNSET_SELECT_VALUE ? Number(birthYear) : null,
        birth_month: birthMonth !== UNSET_SELECT_VALUE ? Number(birthMonth) : null,
        country_code: countryCode || null,
        timezone: validation.trimmedTimezone,
      });

      await putJson("/profile/languages", {
        languages: validation.cleanedLanguages,
      });

      await putJson("/profile/availability", {
        availability: validation.expandedAvailability,
      });

      const refreshed = await getJson<ProfileResponse>("/profile");
      setDiscoverable(refreshed.profile.discoverable ?? null);
      setMessage(t("profileSaved"));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("profileSaveFailed"),
      );
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background px-4 py-12 text-foreground">
        <div className="mx-auto w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("loadingSession")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!token || !userId) {
    return (
      <div className="min-h-screen bg-background px-4 py-12 text-foreground">
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{t("signinRequiredTitle")}</CardTitle>
              <CardDescription>
                {t("signinRequiredDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">{t("signinButton")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{t("title")}</CardTitle>
                <CardDescription>
                  {t("profileSetupIntro")}
                </CardDescription>
              </div>
            </div>
            {loading ? <p className="text-sm text-muted-foreground">{t("loadingProfile")}</p> : null}
            {discoverable !== null ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t("discoverableStatus")}</span>
                <Badge variant={discoverable ? "default" : "secondary"}>
                  {discoverable ? t("discoverableEnabled") : t("discoverableDisabled")}
                </Badge>
              </div>
            ) : null}
            {message ? (
              <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
                {message}
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="flex items-center justify-center gap-2">
                  {t("profileTab")}
                  {profileTabInvalid ? (
                    <span
                      className="ml-2 h-2 w-2 rounded-full bg-destructive"
                      aria-hidden="true"
                    />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="language" className="flex items-center justify-center gap-2">
                  {t("languageTab")}
                  {languageTabInvalid ? (
                    <span
                      className="ml-2 h-2 w-2 rounded-full bg-destructive"
                      aria-hidden="true"
                    />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="availability" className="flex items-center justify-center gap-2">
                  {t("availabilityTab")}
                  {availabilityTabInvalid ? (
                    <span
                      className="ml-2 h-2 w-2 rounded-full bg-destructive"
                      aria-hidden="true"
                    />
                  ) : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-6 space-y-6">
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">{t("sectionProfileTitle")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("sectionProfileDescription")}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="handle">
                        {t("handleLabel")} <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          @
                        </span>
                        <Input
                          id="handle"
                          value={handle}
                          onChange={(event) =>
                            setHandle(event.target.value.replace(/^@+/, ""))
                          }
                          placeholder={t("handlePlaceholder")}
                          className={cn(
                            "pl-7",
                            fieldErrors.handle ? "border-destructive" : "",
                          )}
                        />
                      </div>
                      {fieldErrors.handle ? (
                        <p className="text-xs text-destructive">{fieldErrors.handle}</p>
                      ) : null}
                      {!fieldErrors.handle && effectiveHandleAvailability === "checking" ? (
                        <p className="text-xs text-muted-foreground">{t("handleAvailabilityChecking")}</p>
                      ) : null}
                      {!fieldErrors.handle &&
                      handleChanged &&
                      effectiveHandleAvailability === "available" ? (
                        <p className="text-xs text-emerald-600 dark:text-emerald-300">
                          {t("handleAvailabilityAvailable")}
                        </p>
                      ) : null}
                      {!fieldErrors.handle && effectiveHandleAvailability === "unavailable" ? (
                        <p className="text-xs text-destructive">{t("handleAvailabilityUnavailable")}</p>
                      ) : null}
                      {!fieldErrors.handle && effectiveHandleAvailability === "invalid" ? (
                        <p className="text-xs text-destructive">
                          {t("handleInvalidLengthHelper")}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("emailLabel")}</Label>
                      <Input
                        id="email"
                        readOnly
                        value={email}
                        className="bg-muted/40 text-muted-foreground focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="birth-year">{t("birthYearLabel")}</Label>
                      <SmartSelect
                        id="birth-year"
                        value={birthYear}
                        options={birthYearOptions}
                        onValueChange={setBirthYear}
                        placeholder={t("birthYearPlaceholder")}
                        searchPlaceholder={t("birthYearPlaceholder")}
                        searchAriaLabel={t("birthYearPlaceholder")}
                        className={cn(fieldErrors.birthYear ? "border-destructive" : "")}
                      />
                      {fieldErrors.birthYear ? (
                        <p className="text-xs text-destructive">{fieldErrors.birthYear}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth-month">{t("birthMonthLabel")}</Label>
                      <SmartSelect
                        id="birth-month"
                        value={birthMonth}
                        options={birthMonthOptions}
                        onValueChange={setBirthMonth}
                        placeholder={t("birthMonthPlaceholder")}
                        longListThreshold={13}
                        className={cn(fieldErrors.birthMonth ? "border-destructive" : "")}
                      />
                      {fieldErrors.birthMonth ? (
                        <p className="text-xs text-destructive">{fieldErrors.birthMonth}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="country">{t("countryLabel")}</Label>
                      <SmartSelect
                        id="country"
                        value={countryCode}
                        options={countryOptions}
                        onValueChange={setCountryCode}
                        placeholder={t("countryPlaceholder")}
                        searchPlaceholder={t("countryPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">
                        {t("timezoneLabel")} <span className="text-destructive">*</span>
                      </Label>
                      <SmartSelect
                        id="timezone"
                        value={timezone}
                        options={[{ value: "", label: t("timezonePlaceholder") }, ...timezoneOptions]}
                        onValueChange={setTimezone}
                        placeholder={t("timezonePlaceholder")}
                        searchPlaceholder={t("timezonePlaceholder")}
                      />
                      {fieldErrors.timezone ? (
                        <p className="text-xs text-destructive">{fieldErrors.timezone}</p>
                      ) : null}
                    </div>
                  </div>
                </section>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setActiveTab("language")}
                    variant="secondary"
                  >
                    {t("nextLanguage")}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="language" className="mt-6 space-y-6">
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">{t("sectionLanguageTitle")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("sectionLanguageDescription")}
                    </p>
                  </div>
                  {fieldErrors.languages ? (
                    <p className="text-sm text-destructive">{fieldErrors.languages}</p>
                  ) : null}
                  <div className="space-y-4">
                    {languages.map((language, index) => (
                      <div
                        key={`lang-${index}`}
                        className="rounded-lg border border-border/60 p-4"
                      >
                        <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
                          <div className="space-y-2">
                            <Label className="whitespace-nowrap w-max inline-flex">{t("languageLabel")}</Label>
                            <SmartSelect
                              value={language.language_code}
                              options={languageOptions}
                              onValueChange={(nextValue) => {
                                const next = [...languages];
                                next[index] = {
                                  ...language,
                                  language_code: nextValue,
                                };
                                setLanguages(next);
                              }}
                              placeholder={t("languagePlaceholder")}
                              searchPlaceholder={t("languageSearchPlaceholder")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("levelLabel")}</Label>
                            <Select
                              value={language.level.toString()}
                              onValueChange={(value) => {
                                const next = [...languages];
                                const nextLevel = Number(value);
                                const isNative = nextLevel === 5;
                                next[index] = {
                                  ...language,
                                  level: nextLevel,
                                  is_native: isNative,
                                  is_target: isNative ? false : language.is_target,
                                };
                                setLanguages(next);
                              }}
                            >
                              <SelectTrigger aria-label="Language level">
                                <SelectValue placeholder={t("levelLabel")} />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(PROFICIENCY_LABELS).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const next = languages.filter((_, idx) => idx !== index);
                                setLanguages(next.length ? next : languages);
                              }}
                            >
                              {t("removeButton")}
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={language.is_target}
                              onChange={(event) => {
                                const next = [...languages];
                                const isTarget = event.target.checked;
                                const nextLevel =
                                  isTarget && language.level === 5 ? 4 : language.level;
                                next[index] = {
                                  ...language,
                                  level: nextLevel,
                                  is_native: nextLevel === 5,
                                  is_target: isTarget,
                                };
                                setLanguages(next);
                              }}
                            />
                            {t("targetLanguage")}
                          </label>
                          <Input
                            value={language.description ?? ""}
                            onChange={(event) => {
                              const next = [...languages];
                              next[index] = {
                                ...language,
                                description: event.target.value,
                              };
                              setLanguages(next);
                            }}
                            placeholder={t("languageDescriptionPlaceholder")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setLanguages([
                        ...languages,
                        {
                          language_code: "en",
                          level: 0,
                          is_native: false,
                          is_target: false,
                          description: "",
                        },
                      ])
                    }
                  >
                    {t("addLanguage")}
                  </Button>
                </section>

                <div className="flex justify-end">
                  <Button type="button" variant="secondary" onClick={() => setActiveTab("availability")}>
                    {t("nextAvailability")}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="availability" className="mt-6 space-y-6">
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">{t("sectionAvailabilityTitle")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("sectionAvailabilityDescription")}
                    </p>
                  </div>
                  {fieldErrors.availability ? (
                    <p className="text-sm text-destructive">{fieldErrors.availability}</p>
                  ) : null}
                  <div className="space-y-4">
                    {availability.map((slot, index) => (
                      <div
                        key={`slot-${index}`}
                        className="rounded-lg border border-border/60 p-4"
                      >
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>{t("weekdaysLabel")}</Label>
                            <ToggleGroup
                              type="multiple"
                              variant="outline"
                              value={slot.weekdays.map((day) => day.toString())}
                              onValueChange={(values) => {
                                const next = [...availability];
                                const weekdays = values
                                  .map((value) => Number(value))
                                  .filter((value) => !Number.isNaN(value));
                                next[index] = {
                                  ...slot,
                                  weekdays: weekdays.sort(),
                                };
                                setAvailability(next);
                              }}
                              className="flex flex-wrap justify-start gap-2"
                            >
                              {WEEKDAYS.map((label, value) => (
                                <ToggleGroupItem
                                  key={label}
                                  value={value.toString()}
                                  aria-label={label}
                                >
                                  {label.slice(0, 3)}
                                </ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                          </div>
                          <div className="grid gap-3 md:grid-cols-[1fr_1fr_minmax(0,2fr)_auto]">
                            <div className="space-y-2">
                              <Label>{t("startLabel")}</Label>
                              <Input
                                type="time"
                                value={slot.start_local_time}
                                onChange={(event) => {
                                  const next = [...availability];
                                  next[index] = {
                                    ...slot,
                                    start_local_time: event.target.value,
                                  };
                                  setAvailability(next);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("endLabel")}</Label>
                              <Input
                                type="time"
                                value={slot.end_local_time}
                                onChange={(event) => {
                                  const next = [...availability];
                                  next[index] = {
                                    ...slot,
                                    end_local_time: event.target.value,
                                  };
                                  setAvailability(next);
                                }}
                              />
                            </div>
                            <div className="space-y-2 min-w-0">
                              <Label>{t("availabilityTimezoneLabel")}</Label>
                              <SmartSelect
                                value={slot.timezone || timezone}
                                onValueChange={(value) => {
                                  const next = [...availability];
                                  next[index] = {
                                    ...slot,
                                    timezone: value,
                                  };
                                  setAvailability(next);
                                }}
                                options={timezoneOptions}
                                placeholder={t("availabilityTimezonePlaceholder")}
                                searchPlaceholder={t("availabilityTimezonePlaceholder")}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const next = availability.filter((_, idx) => idx !== index);
                                  setAvailability(next.length ? next : availability);
                                }}
                              >
                                {t("removeButton")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setAvailability([
                        ...availability,
                        {
                          weekdays: [1],
                          start_local_time: "18:00",
                          end_local_time: "20:00",
                          timezone: timezone,
                        },
                      ])
                    }
                  >
                    {t("addAvailability")}
                  </Button>
                </section>

              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              {profileTabInvalid || languageTabInvalid || availabilityTabInvalid ? (
                <p className="text-xs text-muted-foreground">
                  {t("saveDisabledHint")}
                </p>
              ) : null}
            </div>
            <Button
              className="sm:min-w-[160px]"
              type="button"
              onClick={onSave}
              disabled={!canSave}
            >
              {t("saveProfile")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
