"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getTimeZones } from "@vvo/tzdb";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError, getJson, putJson } from "@/lib/api";
import { getAccessToken, getUserId } from "@/lib/session";
import { cn } from "@/lib/utils";
import { DEFAULT_COUNTRY_CODES, DEFAULT_LANGUAGE_CODES, MONTHS } from "@/config/profile-options";
import { buildLanguageSelectOptions } from "@/i18n/language-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProfileAvailabilitySection from "./components/profile-availability-section";
import ProfileDetailsSection from "./components/profile-details-section";
import ProfileLanguageSection from "./components/profile-language-section";
import {
  BIRTH_YEAR_MIN,
  HANDLE_MAX_LENGTH,
  HANDLE_MIN_LENGTH,
  HANDLE_PATTERN,
  UNSET_SELECT_VALUE,
  createProfileSchema,
  type ProfileFormValues,
} from "./schema";

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
  timezone?: string;
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

type Option = { value: string; label: string };

const DEFAULT_LANGUAGE: ProfileFormValues["languages"][number] = {
  language_code: "en",
  level: 5,
  is_target: false,
  description: "",
};

const DEFAULT_AVAILABILITY: AvailabilityDraft = {
  weekdays: [1],
  start_local_time: "18:00",
  end_local_time: "20:00",
  timezone: "",
};

const getBrowserTimezone = () => {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
    return "America/Vancouver";
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Vancouver";
  } catch {
    return "America/Vancouver";
  }
};

const buildOptions = (values: string[], type: "language" | "region", locale: string): Option[] => {
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
};

const formatOffsetLabel = (totalMinutes: number) => {
  const sign = totalMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  const paddedHours = String(hours).padStart(2, "0");
  const paddedMinutes = String(minutes).padStart(2, "0");
  return `UTC${sign}${paddedHours}:${paddedMinutes}`;
};

const resolveTimezoneDisplayName = (timeZone: string, locale: string) => {
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
};

const buildTimezoneOptions = (locale: string): Option[] => {
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
};

const buildFormValues = (data: ProfileResponse, fallbackTimezone: string): ProfileFormValues => {
  const resolvedTimezone = data.profile.timezone?.trim() || fallbackTimezone;
  const languages = data.languages.length
    ? data.languages.map((language) => ({
        language_code: language.language_code,
        level: language.level,
        is_target: language.is_target,
        description: language.description ?? "",
      }))
    : [DEFAULT_LANGUAGE];

  const availability = data.availability.length
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
          ...DEFAULT_AVAILABILITY,
          timezone: resolvedTimezone,
        },
      ];

  return {
    handle: data.profile.handle ?? "",
    birthYear: data.profile.birth_year?.toString() ?? UNSET_SELECT_VALUE,
    birthMonth: data.profile.birth_month?.toString() ?? UNSET_SELECT_VALUE,
    countryCode: data.profile.country_code ?? "",
    timezone: resolvedTimezone,
    languages,
    availability,
  };
};

const expandAvailability = (values: ProfileFormValues): AvailabilityPayload[] => {
  return values.availability.flatMap((slot) =>
    slot.weekdays.map((weekday) => ({
      weekday,
      start_local_time: slot.start_local_time,
      end_local_time: slot.end_local_time,
      timezone: slot.timezone?.trim() || values.timezone,
    })),
  );
};

const normalizeLanguages = (values: ProfileFormValues): LanguagePayload[] =>
  values.languages.map((lang) => {
    const languageCode = lang.language_code.trim().toLowerCase();
    const description = lang.description?.trim() || null;
    const isNative = lang.level === 5;
    return {
      language_code: languageCode,
      level: lang.level,
      is_native: isNative,
      is_target: isNative ? false : lang.is_target,
      description,
    };
  });

export default function ProfileForm() {
  const t = useTranslations("profile");
  const locale = useLocale();
  const schema = useMemo(() => createProfileSchema(t), [t]);

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
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [email, setEmail] = useState("");
  const [discoverable, setDiscoverable] = useState<boolean | null>(null);
  const [originalHandle, setOriginalHandle] = useState("");
  const [handleAvailability, setHandleAvailability] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");

  const defaultTimezone = useMemo(() => getBrowserTimezone(), []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      handle: "",
      birthYear: UNSET_SELECT_VALUE,
      birthMonth: UNSET_SELECT_VALUE,
      countryCode: "",
      timezone: defaultTimezone,
      languages: [DEFAULT_LANGUAGE],
      availability: [{ ...DEFAULT_AVAILABILITY, timezone: defaultTimezone }],
    },
  });

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control: form.control,
    name: "languages",
  });
  const { fields: availabilityFields, append: appendAvailability, remove: removeAvailability } =
    useFieldArray({
      control: form.control,
      name: "availability",
    });

  const handleValue = useWatch({ control: form.control, name: "handle" });
  const watchedLanguages = useWatch({ control: form.control, name: "languages" });
  const watchedAvailability = useWatch({ control: form.control, name: "availability" });
  const languages = useMemo(() => watchedLanguages ?? [], [watchedLanguages]);
  const availability = useMemo(() => watchedAvailability ?? [], [watchedAvailability]);
  const timezoneValue = useWatch({ control: form.control, name: "timezone" }) ?? defaultTimezone;

  const handleValidity = useMemo(() => {
    const trimmedHandle = handleValue.trim().replace(/^@+/, "");
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
  }, [handleValue]);

  const handleChanged = useMemo(() => {
    const trimmedHandle = handleValue.trim().replace(/^@+/, "");
    const trimmedOriginal = originalHandle.trim().replace(/^@+/, "");
    if (!trimmedOriginal) {
      return false;
    }
    return trimmedHandle !== trimmedOriginal;
  }, [handleValue, originalHandle]);

  const effectiveHandleAvailability: "idle" | "checking" | "available" | "unavailable" | "invalid" =
    handleValidity === "valid"
      ? handleChanged
        ? handleAvailability
        : "idle"
      : handleValidity;

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= BIRTH_YEAR_MIN; year -= 1) {
      years.push(year);
    }
    return years;
  }, []);

  const birthYearOptions = useMemo<Option[]>(
    () => [
      { value: UNSET_SELECT_VALUE, label: t("birthYearPlaceholder") },
      ...yearOptions.map((year) => ({ value: year.toString(), label: year.toString() })),
    ],
    [t, yearOptions],
  );

  const birthMonthOptions = useMemo<Option[]>(
    () => [
      { value: UNSET_SELECT_VALUE, label: t("birthMonthPlaceholder") },
      ...MONTHS.map((month) => ({ value: month, label: t(`months.${month}`) })),
    ],
    [t],
  );

  const countryOptions = useMemo(() => {
    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
      .supportedValuesOf;
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
    return buildOptions(normalized.length ? normalized : DEFAULT_COUNTRY_CODES, "region", locale);
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
    if (!token || !userId) {
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (active) {
        setProfileLoaded(false);
      }
    });

    getJson<ProfileResponse>("/profile")
      .then((data) => {
        if (!active) return;
        setEmail(data.user.email ?? "");
        setOriginalHandle(data.profile.handle ?? "");
        setDiscoverable(data.profile.discoverable ?? null);
        setMessage(null);
        form.reset(buildFormValues(data, defaultTimezone));
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 404) {
          setMessage(null);
          return;
        }
        setMessage(error instanceof Error ? error.message : t("profileLoadedError"));
      })
      .finally(() => {
        if (active) {
          setProfileLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [token, userId, t, form, defaultTimezone]);

  useEffect(() => {
    if (!profileLoaded) {
      return;
    }
    void form.trigger("handle");
  }, [form, profileLoaded, handleValue]);

  useEffect(() => {
    if (!profileLoaded) {
      return;
    }
    void form.trigger("languages");
  }, [form, profileLoaded, languages]);

  useEffect(() => {
    if (!profileLoaded) {
      return;
    }
    void form.trigger("availability");
  }, [form, profileLoaded, availability]);

  useEffect(() => {
    if (!token || !userId || handleValidity !== "valid" || !handleChanged) {
      return;
    }
    const trimmedHandle = handleValue.trim().replace(/^@+/, "");
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
  }, [handleValue, handleValidity, handleChanged, token, userId]);

  const errors = form.formState.errors;
  const languageErrorMessage = (errors.languages as { message?: string; root?: { message?: string } })?.message ??
    (errors.languages as { root?: { message?: string } })?.root?.message;
  const availabilityErrorMessage = (errors.availability as { message?: string; root?: { message?: string } })?.message ??
    (errors.availability as { root?: { message?: string } })?.root?.message;
  const loading = Boolean(token && userId && !profileLoaded);

  const profileTabInvalid = profileLoaded && Boolean(
    errors.handle || errors.timezone || errors.birthYear || errors.birthMonth,
  );
  const languageTabInvalid = profileLoaded && Boolean(errors.languages);
  const availabilityTabInvalid = profileLoaded && Boolean(errors.availability);
  const canSave =
    !loading &&
    form.formState.isValid &&
    effectiveHandleAvailability !== "unavailable" &&
    effectiveHandleAvailability !== "checking";

  const onSubmit = async (values: ProfileFormValues) => {
    setMessage(null);

    try {
      await putJson<ProfileResponse>("/profile", {
        handle: values.handle.trim().replace(/^@+/, ""),
        birth_year: values.birthYear !== UNSET_SELECT_VALUE ? Number(values.birthYear) : null,
        birth_month: values.birthMonth !== UNSET_SELECT_VALUE ? Number(values.birthMonth) : null,
        country_code: values.countryCode || null,
        timezone: values.timezone.trim(),
      });

      await putJson("/profile/languages", {
        languages: normalizeLanguages(values),
      });

      await putJson("/profile/availability", {
        availability: expandAvailability(values),
      });

      const refreshed = await getJson<ProfileResponse>("/profile");
      setDiscoverable(refreshed.profile.discoverable ?? null);
      setMessage(t("profileSaved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profileSaveFailed"));
    }
  };

  const handleSave = form.handleSubmit(onSubmit, () => {
    setMessage(t("saveFixErrors"));
  });

  const onAddLanguage = () => {
    appendLanguage({
      language_code: "en",
      level: 0,
      is_target: false,
      description: "",
    });
  };

  const onRemoveLanguage = (index: number) => {
    if (languageFields.length <= 1) {
      return;
    }
    removeLanguage(index);
  };

  const onAddAvailability = () => {
    appendAvailability({
      weekdays: [1],
      start_local_time: "18:00",
      end_local_time: "20:00",
      timezone: timezoneValue,
    });
  };

  const onRemoveAvailability = (index: number) => {
    if (availabilityFields.length <= 1) {
      return;
    }
    removeAvailability(index);
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
              <CardDescription>{t("signinRequiredDescription")}</CardDescription>
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
            <div>
              <CardTitle className="text-2xl">{t("title")}</CardTitle>
              <CardDescription>{t("profileSetupIntro")}</CardDescription>
            </div>
            {loading ? <p className="text-sm text-muted-foreground">{t("loadingProfile")}</p> : null}
            {discoverable !== null ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t("discoverableStatus")}</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                    discoverable ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {discoverable ? t("discoverableEnabled") : t("discoverableDisabled")}
                </span>
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
                    <span className="ml-2 h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="language" className="flex items-center justify-center gap-2">
                  {t("languageTab")}
                  {languageTabInvalid ? (
                    <span className="ml-2 h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="availability" className="flex items-center justify-center gap-2">
                  {t("availabilityTab")}
                  {availabilityTabInvalid ? (
                    <span className="ml-2 h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
                  ) : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-6 space-y-6">
                <ProfileDetailsSection
                  t={t}
                  control={form.control}
                  register={form.register}
                  errors={errors}
                  email={email}
                  effectiveHandleAvailability={effectiveHandleAvailability}
                  handleChanged={handleChanged}
                  birthYearOptions={birthYearOptions}
                  birthMonthOptions={birthMonthOptions}
                  countryOptions={countryOptions}
                  timezoneOptions={timezoneOptions}
                  onNext={() => setActiveTab("language")}
                />
              </TabsContent>

              <TabsContent value="language" className="mt-6 space-y-6">
                <ProfileLanguageSection
                  t={t}
                  control={form.control}
                  register={form.register}
                  setValue={form.setValue}
                  languageOptions={languageOptions}
                  languageErrorMessage={languageErrorMessage}
                  proficiencyLabels={PROFICIENCY_LABELS}
                  languageFields={languageFields}
                  languages={languages}
                  onAddLanguage={onAddLanguage}
                  onRemoveLanguage={onRemoveLanguage}
                  onNext={() => setActiveTab("availability")}
                />
              </TabsContent>

              <TabsContent value="availability" className="mt-6 space-y-6">
                <ProfileAvailabilitySection
                  t={t}
                  control={form.control}
                  register={form.register}
                  setValue={form.setValue}
                  availabilityFields={availabilityFields}
                  availability={availability}
                  availabilityErrorMessage={availabilityErrorMessage}
                  timezoneOptions={timezoneOptions}
                  weekdays={WEEKDAYS}
                  onAddAvailability={onAddAvailability}
                  onRemoveAvailability={onRemoveAvailability}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              {profileTabInvalid || languageTabInvalid || availabilityTabInvalid ? (
                <p className="text-xs text-muted-foreground">{t("saveDisabledHint")}</p>
              ) : null}
            </div>
            <Button className="sm:min-w-[160px]" type="button" onClick={handleSave} disabled={!canSave}>
              {t("saveProfile")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
