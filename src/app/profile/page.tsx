"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

const PROFICIENCY_LABELS: Record<number, string> = {
  0: "Zero",
  1: "Beginner",
  2: "Elementary",
  3: "Intermediate",
  4: "Advanced",
  5: "Native",
};

const HANDLE_PATTERN = /^[a-zA-Z0-9]+$/;
const HANDLE_MIN_LENGTH = 3;
const HANDLE_MAX_LENGTH = 20;
const BIRTH_YEAR_MIN = 1900;
const UNSET_SELECT_VALUE = "__unset__";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];


function buildOptions(values: string[], type: "language" | "region"): Option[] {
  const locale =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language
      : "en";
  const display = new Intl.DisplayNames([locale], { type });
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
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildTimezoneOptions(values: string[]): Option[] {
  return values
    .map((value) => ({ value, label: value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default function ProfilePage() {
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
  const [birthYear, setBirthYear] = useState(UNSET_SELECT_VALUE);
  const [birthMonth, setBirthMonth] = useState(UNSET_SELECT_VALUE);
  const [countryCode, setCountryCode] = useState("");
  const [timezone, setTimezone] = useState("America/Vancouver");
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
  const effectiveHandleAvailability:
    | "idle"
    | "checking"
    | "available"
    | "unavailable"
    | "invalid" =
    handleValidity === "valid" ? handleAvailability : handleValidity;

  const [languages, setLanguages] = useState<LanguagePayload[]>([
    {
      language_code: "en",
      level: 0,
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
    );
  }, []);

  const languageOptions = useMemo(() => {
    const supportedValuesOf = (Intl as unknown as {
      supportedValuesOf?: (key: string) => string[];
    }).supportedValuesOf;
    let langs = DEFAULT_LANGUAGE_CODES;
    if (typeof supportedValuesOf === "function") {
      try {
        langs = supportedValuesOf("language");
      } catch {
        langs = DEFAULT_LANGUAGE_CODES;
      }
    }
    const normalized = langs
      .map((code) => code.toLowerCase())
      .filter((code) => code.length >= 2 && code.length <= 15);
    return buildOptions(
      normalized.length ? normalized : DEFAULT_LANGUAGE_CODES,
      "language",
    );
  }, []);

  const timezoneOptions = useMemo(() => {
    const supportedValuesOf = (Intl as unknown as {
      supportedValuesOf?: (key: string) => string[];
    }).supportedValuesOf;
    let timezones = [
      "America/Vancouver",
      "UTC",
      "America/New_York",
      "Europe/London",
    ];
    if (typeof supportedValuesOf === "function") {
      try {
        timezones = supportedValuesOf("timeZone");
      } catch {
        timezones = [
          "America/Vancouver",
          "UTC",
          "America/New_York",
          "Europe/London",
        ];
      }
    }
    return buildTimezoneOptions(timezones);
  }, []);

  useEffect(() => {
    const tokenValue = getAccessToken();
    const userIdValue = getUserId();
    const frame = requestAnimationFrame(() => {
      setToken(tokenValue);
      setUserId(userIdValue);
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasAuth) {
      return;
    }

    getJson<ProfileResponse>("/profile")
      .then((data) => {
        setEmail(data.user.email ?? "");
        setHandle(data.profile.handle ?? "");
        setBirthYear(data.profile.birth_year?.toString() ?? UNSET_SELECT_VALUE);
        setBirthMonth(data.profile.birth_month?.toString() ?? UNSET_SELECT_VALUE);
        setCountryCode(data.profile.country_code ?? "");
        setTimezone(data.profile.timezone ?? "America/Vancouver");
        setDiscoverable(data.profile.discoverable ?? null);
        setLanguages(
          data.languages.length
            ? data.languages
            : [
                {
                  language_code: "en",
                  level: 0,
                  is_native: true,
                  is_target: false,
                  description: "",
                },
              ],
        );
        setAvailability(
          data.availability.length
            ? data.availability.map((slot) => ({
                weekdays: [slot.weekday],
                start_local_time: slot.start_local_time,
                end_local_time: slot.end_local_time,
                timezone: slot.timezone,
              }))
            : [
                {
                  weekdays: [1],
                  start_local_time: "18:00",
                  end_local_time: "20:00",
                  timezone: "",
                },
              ],
        );
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
            : "Could not load your profile yet.",
        );
      })
      .finally(() => {
        setProfileLoaded(true);
      });
  }, [hasAuth, token, userId]);

  useEffect(() => {
    if (!hasAuth || handleValidity !== "valid") {
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
  }, [handle, hasAuth, handleValidity]);

  const validation = useMemo(() => {
    const nextErrors: Record<string, string> = {};

    const trimmedHandle = handle.trim().replace(/^@+/, "");
    if (!trimmedHandle) {
      nextErrors.handle = "Handle is required.";
    } else if (!HANDLE_PATTERN.test(trimmedHandle)) {
      nextErrors.handle = "Handle can only use letters and numbers.";
    } else if (
      trimmedHandle.length < HANDLE_MIN_LENGTH ||
      trimmedHandle.length > HANDLE_MAX_LENGTH
    ) {
      nextErrors.handle = "Handle must be 3–20 characters.";
    }

    const trimmedTimezone = timezone.trim();
    if (!trimmedTimezone) {
      nextErrors.timezone = "Timezone is required.";
    }

    if (birthYear !== UNSET_SELECT_VALUE) {
      const year = Number(birthYear);
      const currentYear = new Date().getFullYear();
      if (Number.isNaN(year) || year < BIRTH_YEAR_MIN || year > currentYear) {
        nextErrors.birthYear = "Birth year must be within range.";
      }
    }

    if (birthMonth !== UNSET_SELECT_VALUE) {
      const month = Number(birthMonth);
      if (Number.isNaN(month) || month < 1 || month > 12) {
        nextErrors.birthMonth = "Birth month must be between 1 and 12.";
      }
    }

    if (!languages.length) {
      nextErrors.languages = "At least one language is required.";
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
      nextErrors.languages = "Please fill every language code or remove empty rows.";
    }

    const normalizedLanguageCodes = cleanedLanguages
      .map((lang) => lang.language_code)
      .filter(Boolean);
    const duplicateLanguageCodes = normalizedLanguageCodes.filter(
      (code, index) => normalizedLanguageCodes.indexOf(code) !== index,
    );
    if (duplicateLanguageCodes.length) {
      nextErrors.languages = "Each language can only be added once.";
    }

    const nativeCount = cleanedLanguages.filter((lang) => lang.is_native).length;
    if (nativeCount === 0) {
      nextErrors.languages = "At least one native language is required.";
    }

    if (availability.some((slot) => slot.weekdays.length === 0)) {
      nextErrors.availability = "Select at least one weekday for each slot.";
    }
    if (availability.some((slot) => !slot.start_local_time || !slot.end_local_time)) {
      nextErrors.availability = "Set a start and end time for each slot.";
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
  }, [handle, birthYear, birthMonth, timezone, languages, availability]);

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
      setMessage("Please fix the highlighted fields.");
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
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save profile.",
      );
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background px-4 py-12 text-foreground">
        <div className="mx-auto w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Loading your session...</p>
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
              <CardTitle>Profile setup</CardTitle>
              <CardDescription>
                You need to sign in before setting up your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">Sign in with magic link</Link>
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
                <CardTitle className="text-2xl">Profile setup</CardTitle>
                <CardDescription>
                  Tell us about your languages and availability.
                </CardDescription>
              </div>
            </div>
            {loading ? <p className="text-sm text-muted-foreground">Loading your profile…</p> : null}
            {discoverable !== null ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Discoverable status:</span>
                <Badge variant={discoverable ? "default" : "secondary"}>
                  {discoverable ? "Enabled" : "Not yet"}
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
                  Profile
                  {profileTabInvalid ? (
                    <span
                      className="ml-2 h-2 w-2 rounded-full bg-destructive"
                      aria-hidden="true"
                    />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="language" className="flex items-center justify-center gap-2">
                  Language
                  {languageTabInvalid ? (
                    <span
                      className="ml-2 h-2 w-2 rounded-full bg-destructive"
                      aria-hidden="true"
                    />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="availability" className="flex items-center justify-center gap-2">
                  Availability
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
                    <h2 className="text-lg font-semibold">Profile</h2>
                    <p className="text-sm text-muted-foreground">
                      This helps us personalize your matches and schedule.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="handle">
                        Handle <span className="text-destructive">*</span>
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
                          placeholder="arturo"
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
                        <p className="text-xs text-muted-foreground">Checking availability…</p>
                      ) : null}
                      {!fieldErrors.handle && effectiveHandleAvailability === "available" ? (
                        <p className="text-xs text-emerald-600 dark:text-emerald-300">
                          Handle is available.
                        </p>
                      ) : null}
                      {!fieldErrors.handle && effectiveHandleAvailability === "unavailable" ? (
                        <p className="text-xs text-destructive">Handle is taken.</p>
                      ) : null}
                      {!fieldErrors.handle && effectiveHandleAvailability === "invalid" ? (
                        <p className="text-xs text-destructive">
                          Handle must be 3–20 letters or numbers.
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
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
                      <Label>Birth year</Label>
                      <Select value={birthYear} onValueChange={setBirthYear}>
                        <SelectTrigger
                          aria-label="Birth year"
                          className={cn(fieldErrors.birthYear ? "border-destructive" : "")}
                        >
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSET_SELECT_VALUE}>Select year</SelectItem>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.birthYear ? (
                        <p className="text-xs text-destructive">{fieldErrors.birthYear}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label>Birth month</Label>
                      <Select value={birthMonth} onValueChange={setBirthMonth}>
                        <SelectTrigger
                          aria-label="Birth month"
                          className={cn(fieldErrors.birthMonth ? "border-destructive" : "")}
                        >
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSET_SELECT_VALUE}>Select month</SelectItem>
                          {MONTHS.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.birthMonth ? (
                        <p className="text-xs text-destructive">{fieldErrors.birthMonth}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <SmartSelect
                        id="country"
                        value={countryCode}
                        options={countryOptions}
                        onValueChange={setCountryCode}
                        placeholder="Select country"
                        searchPlaceholder="Search countries"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">
                        Timezone <span className="text-destructive">*</span>
                      </Label>
                      <SmartSelect
                        id="timezone"
                        value={timezone}
                        options={[{ value: "", label: "Select timezone" }, ...timezoneOptions]}
                        onValueChange={setTimezone}
                        placeholder="Select timezone"
                        searchPlaceholder="Search timezones"
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
                    Next: Language
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="language" className="mt-6 space-y-6">
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">Languages</h2>
                    <p className="text-sm text-muted-foreground">
                      Add at least one native language and any learning goals.
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
                            <Label>Language</Label>
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
                              placeholder="Select language"
                              searchPlaceholder="Search languages"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Level</Label>
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
                                <SelectValue placeholder="Select level" />
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
                              Remove
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
                            Target language
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
                            placeholder="Short description (optional)"
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
                    Add language
                  </Button>
                </section>

                <div className="flex justify-end">
                  <Button type="button" variant="secondary" onClick={() => setActiveTab("availability")}>
                    Next: Availability
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="availability" className="mt-6 space-y-6">
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">Availability</h2>
                    <p className="text-sm text-muted-foreground">
                      Share your preferred windows for sessions.
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
                            <Label>Weekdays</Label>
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
                          <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
                            <div className="space-y-2">
                              <Label>Start</Label>
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
                              <Label>End</Label>
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
                            <div className="space-y-2">
                              <Label>Timezone</Label>
                              <SmartSelect
                                value={slot.timezone || "profile"}
                                onValueChange={(value) => {
                                  const next = [...availability];
                                  next[index] = {
                                    ...slot,
                                    timezone: value === "profile" ? "" : value,
                                  };
                                  setAvailability(next);
                                }}
                                options={[
                                  { value: "profile", label: "Use profile timezone" },
                                  ...timezoneOptions,
                                ]}
                                placeholder="Use profile timezone"
                                searchPlaceholder="Search timezones"
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
                                Remove
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
                          timezone: "",
                        },
                      ])
                    }
                  >
                    Add availability slot
                  </Button>
                </section>

              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              {profileTabInvalid || languageTabInvalid || availabilityTabInvalid ? (
                <p className="text-xs text-muted-foreground">
                  Save is disabled until every tab is valid.
                </p>
              ) : null}
            </div>
            <Button
              className="sm:min-w-[160px]"
              type="button"
              onClick={onSave}
              disabled={!canSave}
            >
              Save profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
