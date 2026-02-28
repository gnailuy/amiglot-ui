"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import styles from "./page.module.css";
import { clearAccessToken, clearUserId, getAccessToken } from "@/lib/session";

export default function Home() {
  const t = useTranslations("home");
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
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        {!isMounted ? (
          <div className={styles.session}>
            <div className={styles.spinner} aria-hidden="true" />
            <span className={styles.srOnly}>{t("checking")}</span>
          </div>
        ) : token ? (
          <div className={styles.session}>
            <p>{t("signedIn")}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/profile">
                {t("completeProfile")}
              </Link>
              <button className={styles.secondary} onClick={onSignOut}>
                {t("signOut")}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.session}>
            <p>{t("signedOut")}</p>
            <Link className={styles.primary} href="/login">
              {t("signIn")}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
