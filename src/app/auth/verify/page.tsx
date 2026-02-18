"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { postJson } from "@/lib/api";
import { setAccessToken } from "@/lib/session";
import styles from "./verify.module.css";

type VerifyResponse = {
  access_token: string;
  user: { id: string; email: string };
};

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    () => (token ? "loading" : "error"),
  );
  const [message, setMessage] = useState<string>(() =>
    token
      ? "Verifying your link..."
      : "Missing token. Please request a new magic link.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    postJson<VerifyResponse>("/auth/verify", { token })
      .then((data) => {
        setAccessToken(data.access_token);
        setStatus("success");
        setMessage("You're signed in. Welcome back!");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "We could not verify this link.",
        );
      });
  }, [token]);

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <h1 className={styles.title}>Magic link verification</h1>
        <p className={styles.message} data-state={status}>
          {message}
        </p>
        <Link className={styles.secondary} href="/">
          Go to home
        </Link>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <main className={styles.card}>
            <h1 className={styles.title}>Magic link verification</h1>
            <p className={styles.message} data-state="loading">
              Verifying your link...
            </p>
            <Link className={styles.secondary} href="/">
              Go to home
            </Link>
          </main>
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
