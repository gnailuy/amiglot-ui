"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { ApiError, getJson, putJson } from "@/lib/api";
import { getAccessToken, getUserId } from "@/lib/session";

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

type Option = {
  value: string;
  label: string;
};

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

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DEFAULT_COUNTRY_CODES = [
  "CA",
  "US",
  "GB",
  "AU",
  "NZ",
  "DE",
  "FR",
  "ES",
  "IT",
  "BR",
  "MX",
  "IN",
  "JP",
  "KR",
  "CN",
];

const DEFAULT_LANGUAGE_CODES = [
  "en",
  "es",
  "fr",
  "de",
  "pt",
  "it",
  "zh",
  "ja",
  "ko",
  "ar",
];

function buildOptions(values: string[], type: "language" | "region"): Option[] {
  const locale =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language
      : "en";
  const display = new Intl.DisplayNames([locale], { type });
  return values
    .map((value) => ({
      value,
      label: `${display.of(value) ?? value} (${value})`,
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [handle, setHandle] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [timezone, setTimezone] = useState("America/Vancouver");
  const [discoverable, setDiscoverable] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");

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
  const effectiveHandleAvailability: "idle" | "checking" | "available" | "unavailable" | "invalid" =
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
    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
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
    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    let languages = DEFAULT_LANGUAGE_CODES;
    if (typeof supportedValuesOf === "function") {
      try {
        languages = supportedValuesOf("language");
      } catch {
        languages = DEFAULT_LANGUAGE_CODES;
      }
    }
    const normalized = languages
      .map((code) => code.toLowerCase())
      .filter((code) => code.length >= 2 && code.length <= 3);
    return buildOptions(
      normalized.length ? normalized : DEFAULT_LANGUAGE_CODES,
      "language",
    );
  }, []);

  const timezoneOptions = useMemo(() => {
    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    let timezones = ["America/Vancouver", "UTC", "America/New_York", "Europe/London"];
    if (typeof supportedValuesOf === "function") {
      try {
        timezones = supportedValuesOf("timeZone");
      } catch {
        timezones = ["America/Vancouver", "UTC", "America/New_York", "Europe/London"];
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
        setHandle(data.profile.handle ?? "");
        setBirthYear(data.profile.birth_year?.toString() ?? "");
        setBirthMonth(data.profile.birth_month?.toString() ?? "");
        setCountryCode(data.profile.country_code ?? "");
        setTimezone(data.profile.timezone ?? "America/Vancouver");
        setDiscoverable(data.profile.discoverable ?? null);
        setEmail(data.user?.email ?? "");
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

  const onSave = async () => {
    setMessage(null);
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

    if (birthYear) {
      const year = Number(birthYear);
      const currentYear = new Date().getFullYear();
      if (Number.isNaN(year) || year < BIRTH_YEAR_MIN || year > currentYear) {
        nextErrors.birthYear = "Birth year must be within range.";
      }
    }

    if (birthMonth) {
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

    const nativeCount = cleanedLanguages.filter((lang) => lang.is_native).length;
    if (nativeCount === 0) {
      nextErrors.languages = "At least one native language is required.";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage("Please fix the highlighted fields.");
      return;
    }

    try {
      await putJson<ProfileResponse>("/profile", {
        handle: trimmedHandle,
        birth_year: birthYear ? Number(birthYear) : null,
        birth_month: birthMonth ? Number(birthMonth) : null,
        country_code: countryCode || null,
        timezone: trimmedTimezone,
      });

      await putJson("/profile/languages", {
        languages: cleanedLanguages,
      });

      const expandedAvailability = availability.flatMap((slot) =>
        slot.weekdays.map((weekday) => ({
          weekday,
          start_local_time: slot.start_local_time,
          end_local_time: slot.end_local_time,
          timezone: slot.timezone || trimmedTimezone,
        })),
      );

      await putJson("/profile/availability", {
        availability: expandedAvailability,
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
      <div className={styles.page}>
        <main className={styles.card}>
          <h1>Profile setup</h1>
          <p>Loading your session...</p>
        </main>
      </div>
    );
  }

  if (!token || !userId) {
    return (
      <div className={styles.page}>
        <main className={styles.card}>
          <h1>Profile setup</h1>
          <p>You need to sign in before setting up your profile.</p>
          <Link className={styles.primary} href="/login">
            Sign in with magic link
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1>Profile setup</h1>
            <p className={styles.subtitle}>
              Tell us about your languages and availability.
            </p>
          </div>
          <Link className={styles.secondary} href="/">
            Back home
          </Link>
        </div>

        {loading ? <p>Loading your profile…</p> : null}
        {discoverable !== null ? (
          <p className={styles.discoverable}>
            Discoverable status: {discoverable ? "Enabled" : "Not yet"}
          </p>
        ) : null}
        {message ? <p className={styles.message}>{message}</p> : null}

        <section className={styles.section}>
          <h2>Profile</h2>
          <label className={styles.label}>
            Handle (no @) <span className={styles.required}>*</span>
            <input
              className={`${styles.input} ${
                fieldErrors.handle ? styles.inputError : ""
              }`}
              value={handle}
              onChange={(event) =>
                setHandle(event.target.value.replace(/^@+/, ""))
              }
              placeholder="arturo"
            />
            {fieldErrors.handle ? (
              <span className={styles.helper}>{fieldErrors.handle}</span>
            ) : null}
            {!fieldErrors.handle && effectiveHandleAvailability === "checking" ? (
              <span className={styles.helper}>Checking availability…</span>
            ) : null}
            {!fieldErrors.handle && effectiveHandleAvailability === "available" ? (
              <span className={styles.helperSuccess}>Handle is available.</span>
            ) : null}
            {!fieldErrors.handle && effectiveHandleAvailability === "unavailable" ? (
              <span className={styles.helperError}>Handle is taken.</span>
            ) : null}
            {!fieldErrors.handle && effectiveHandleAvailability === "invalid" ? (
              <span className={styles.helperError}>
                Handle must be 3–20 letters or numbers.
              </span>
            ) : null}
          </label>
          <label className={styles.label}>
            Email (read-only)
            <input className={styles.input} value={email} readOnly />
          </label>
          <div className={styles.grid}>
            <label className={styles.label}>
              Birth year
              <select
                className={`${styles.select} ${
                  fieldErrors.birthYear ? styles.inputError : ""
                }`}
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value)}
              >
                <option value="">Select year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {fieldErrors.birthYear ? (
                <span className={styles.helper}>{fieldErrors.birthYear}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Birth month
              <select
                className={`${styles.select} ${
                  fieldErrors.birthMonth ? styles.inputError : ""
                }`}
                value={birthMonth}
                onChange={(event) => setBirthMonth(event.target.value)}
              >
                <option value="">Select month</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              {fieldErrors.birthMonth ? (
                <span className={styles.helper}>{fieldErrors.birthMonth}</span>
              ) : null}
            </label>
          </div>
          <div className={styles.grid}>
            <label className={styles.label}>
              Country
              <select
                className={styles.select}
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
              >
                <option value="">Select country</option>
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Timezone <span className={styles.required}>*</span>
              <select
                className={`${styles.select} ${
                  fieldErrors.timezone ? styles.inputError : ""
                }`}
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
              >
                {timezoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldErrors.timezone ? (
                <span className={styles.helper}>{fieldErrors.timezone}</span>
              ) : null}
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h2>
            Languages <span className={styles.required}>*</span>
          </h2>
          {fieldErrors.languages ? (
            <p className={styles.helperError}>{fieldErrors.languages}</p>
          ) : null}
          {languages.map((language, index) => (
            <div key={`lang-${index}`} className={styles.row}>
              <select
                className={styles.select}
                value={language.language_code}
                onChange={(event) => {
                  const next = [...languages];
                  next[index] = {
                    ...language,
                    language_code: event.target.value,
                  };
                  setLanguages(next);
                }}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                value={language.level}
                onChange={(event) => {
                  const next = [...languages];
                  const nextLevel = Number(event.target.value);
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
                {Object.entries(PROFICIENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
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
                Target
              </label>
              <input
                className={styles.input}
                value={language.description ?? ""}
                onChange={(event) => {
                  const next = [...languages];
                  next[index] = { ...language, description: event.target.value };
                  setLanguages(next);
                }}
                placeholder="Short description (optional)"
              />
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => {
                  const next = languages.filter((_, idx) => idx !== index);
                  setLanguages(next.length ? next : languages);
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className={styles.secondary}
            type="button"
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
          </button>
        </section>

        <section className={styles.section}>
          <h2>Availability</h2>
          {availability.map((slot, index) => (
            <div key={`slot-${index}`} className={styles.row}>
              <div className={styles.weekdayGroup}>
                {WEEKDAYS.map((label, value) => (
                  <label key={label} className={styles.weekdayItem}>
                    <input
                      type="checkbox"
                      checked={slot.weekdays.includes(value)}
                      onChange={(event) => {
                        const next = [...availability];
                        const weekdays = new Set(next[index].weekdays);
                        if (event.target.checked) {
                          weekdays.add(value);
                        } else {
                          weekdays.delete(value);
                        }
                        next[index] = {
                          ...slot,
                          weekdays: Array.from(weekdays).sort(),
                        };
                        setAvailability(next);
                      }}
                    />
                    {label.slice(0, 3)}
                  </label>
                ))}
              </div>
              <input
                className={styles.input}
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
              <input
                className={styles.input}
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
              <select
                className={styles.select}
                value={slot.timezone || timezone}
                onChange={(event) => {
                  const next = [...availability];
                  next[index] = {
                    ...slot,
                    timezone: event.target.value,
                  };
                  setAvailability(next);
                }}
              >
                {timezoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => {
                  const next = availability.filter((_, idx) => idx !== index);
                  setAvailability(next.length ? next : availability);
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className={styles.secondary}
            type="button"
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
          </button>
        </section>

        <button className={styles.primary} type="button" onClick={onSave}>
          Save profile
        </button>
      </main>
    </div>
  );
}
