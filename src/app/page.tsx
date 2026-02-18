"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./page.module.css";
import { clearAccessToken, getAccessToken } from "@/lib/session";

export default function Home() {
  const [token, setToken] = useState<string | null>(() => getAccessToken());

  const onSignOut = () => {
    clearAccessToken();
    setToken(null);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Amiglot</h1>
        <p className={styles.subtitle}>
          Find language partners. Learn together.
        </p>
        {token ? (
          <div className={styles.session}>
            <p>You&apos;re signed in.</p>
            <button className={styles.secondary} onClick={onSignOut}>
              Sign out
            </button>
          </div>
        ) : (
          <div className={styles.session}>
            <p>You&apos;re not signed in yet.</p>
            <Link className={styles.primary} href="/login">
              Sign in with magic link
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
