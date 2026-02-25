"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { getJson, putJson } from "@/lib/api";
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

type ProfileResponse = {
  profile: ProfilePayload;
  languages: LanguagePayload[];
  availability: AvailabilityPayload[];
};

const PROFICIENCY_LABELS: Record<number, string> = {
  0: "Zero",
  1: "Beginner",
  2: "Elementary",
  3: "Intermediate",
  4: "Advanced",
  5: "Native",
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function ProfilePage() {
  const token = useMemo(() => getAccessToken(), []);
  const userId = useMemo(() => getUserId(), []);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [handle, setHandle] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [timezone, setTimezone] = useState("America/Vancouver");
  const [discoverable, setDiscoverable] = useState<boolean | null>(null);

  const [languages, setLanguages] = useState<LanguagePayload[]>([
    {
      language_code: "",
      level: 0,
      is_native: true,
      is_target: false,
      description: "",
    },
  ]);
  const [availability, setAvailability] = useState<AvailabilityPayload[]>([
    {
      weekday: 1,
      start_local_time: "18:00",
      end_local_time: "20:00",
      timezone: "",
    },
  ]);

  useEffect(() => {
    if (!token || !userId) {
      setLoading(false);
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
        setLanguages(
          data.languages.length
            ? data.languages
            : [
                {
                  language_code: "",
                  level: 0,
                  is_native: true,
                  is_target: false,
                  description: "",
                },
              ],
        );
        setAvailability(
          data.availability.length
            ? data.availability
            : [
                {
                  weekday: 1,
                  start_local_time: "18:00",
                  end_local_time: "20:00",
                  timezone: "",
                },
              ],
        );
        setMessage(null);
      })
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load your profile yet.",
        );
      })
      .finally(() => setLoading(false));
  }, [token, userId]);

  const onSave = async () => {
    setMessage(null);
    try {
      await putJson<ProfileResponse>("/profile", {
        handle,
        birth_year: birthYear ? Number(birthYear) : null,
        birth_month: birthMonth ? Number(birthMonth) : null,
        country_code: countryCode || null,
        timezone,
      });

      await putJson("/profile/languages", {
        languages: languages.map((lang) => ({
          ...lang,
          language_code: lang.language_code.trim(),
          description: lang.description?.trim() || null,
        })),
      });

      await putJson("/profile/availability", {
        availability: availability.map((slot) => ({
          ...slot,
          timezone: slot.timezone || timezone,
        })),
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
            Handle (no @)
            <input
              className={styles.input}
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="arturo"
            />
          </label>
          <div className={styles.grid}>
            <label className={styles.label}>
              Birth year
              <input
                className={styles.input}
                type="number"
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value)}
                placeholder="1992"
              />
            </label>
            <label className={styles.label}>
              Birth month
              <input
                className={styles.input}
                type="number"
                value={birthMonth}
                onChange={(event) => setBirthMonth(event.target.value)}
                placeholder="8"
              />
            </label>
          </div>
          <div className={styles.grid}>
            <label className={styles.label}>
              Country code
              <input
                className={styles.input}
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                placeholder="CA"
              />
            </label>
            <label className={styles.label}>
              Timezone
              <input
                className={styles.input}
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                placeholder="America/Vancouver"
              />
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Languages</h2>
          {languages.map((language, index) => (
            <div key={`lang-${index}`} className={styles.row}>
              <input
                className={styles.input}
                value={language.language_code}
                onChange={(event) => {
                  const next = [...languages];
                  next[index] = { ...language, language_code: event.target.value };
                  setLanguages(next);
                }}
                placeholder="en"
              />
              <select
                className={styles.select}
                value={language.level}
                onChange={(event) => {
                  const next = [...languages];
                  next[index] = {
                    ...language,
                    level: Number(event.target.value),
                  };
                  setLanguages(next);
                }}
              >
                {Object.entries(PROFICIENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label} ({value})
                  </option>
                ))}
              </select>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={language.is_native}
                  onChange={(event) => {
                    const next = [...languages];
                    next[index] = { ...language, is_native: event.target.checked };
                    setLanguages(next);
                  }}
                />
                Native
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={language.is_target}
                  onChange={(event) => {
                    const next = [...languages];
                    next[index] = { ...language, is_target: event.target.checked };
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
                  language_code: "",
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
              <select
                className={styles.select}
                value={slot.weekday}
                onChange={(event) => {
                  const next = [...availability];
                  next[index] = {
                    ...slot,
                    weekday: Number(event.target.value),
                  };
                  setAvailability(next);
                }}
              >
                {WEEKDAYS.map((label, value) => (
                  <option key={label} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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
              <input
                className={styles.input}
                value={slot.timezone}
                onChange={(event) => {
                  const next = [...availability];
                  next[index] = {
                    ...slot,
                    timezone: event.target.value,
                  };
                  setAvailability(next);
                }}
                placeholder={`Defaults to ${timezone}`}
              />
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
                  weekday: 1,
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
