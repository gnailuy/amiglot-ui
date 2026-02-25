"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { clearAccessToken, clearUserId, getAccessToken } from "@/lib/session";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const tokenValue = getAccessToken();
    const frame = requestAnimationFrame(() => {
      setToken(tokenValue);
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const onSignOut = () => {
    clearAccessToken();
    clearUserId();
    setToken(null);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Amiglot</h1>
        <p className={styles.subtitle}>
          Find language partners. Learn together.
        </p>
        {!isMounted ? (
          <div className={styles.session}>
            <div className={styles.spinner} aria-hidden="true" />
            <span className={styles.srOnly}>
              Checking your sign-in status...
            </span>
          </div>
        ) : token ? (
          <div className={styles.session}>
            <p>You&apos;re signed in.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/profile">
                Complete your profile
              </Link>
              <button className={styles.secondary} onClick={onSignOut}>
                Sign out
              </button>
            </div>
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
