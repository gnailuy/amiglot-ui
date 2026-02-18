"use client";

import { useState } from "react";
import Link from "next/link";
import { postJson } from "@/lib/api";
import styles from "./login.module.css";

type MagicLinkResponse = {
  ok?: boolean;
  dev_login_url?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);
    setDevLink(null);

    try {
      const data = await postJson<MagicLinkResponse>("/auth/magic-link", {
        email,
      });

      setStatus("success");
      setMessage("Check your email for a sign-in link.");

      if (data.dev_login_url) {
        setDevLink(data.dev_login_url);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>We&apos;ll email you a magic link.</p>
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label} htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <button
            className={styles.primary}
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Sending..." : "Send magic link"}
          </button>
        </form>
        {message && (
          <div className={styles.message} data-state={status}>
            {message}
          </div>
        )}
        {devLink && (
          <div className={styles.devLink}>
            Dev login link: <a href={devLink}>{devLink}</a>
          </div>
        )}
        <Link className={styles.secondary} href="/">
          Back to home
        </Link>
      </main>
    </div>
  );
}
