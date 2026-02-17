"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { postJson } from "@/lib/api";
import { setAccessToken } from "@/lib/session";
import styles from "./verify.module.css";

type VerifyResponse = {
  access_token: string;
  user: { id: string; email: string };
};

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string>("Verifying your link...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Missing token. Please request a new magic link.");
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
  }, [searchParams]);

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
