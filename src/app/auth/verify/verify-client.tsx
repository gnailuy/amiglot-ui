"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { postJson } from "@/lib/api";
import { setAccessToken, setUserId } from "@/lib/session";

import VerifyCard from "./verify-card";

type VerifyResponse = {
  access_token: string;
  user: { id: string; email: string };
};

type StatusState = "loading" | "success" | "error";

function VerifyPageContent() {
  const t = useTranslations("verify");
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [hasCheckedToken, setHasCheckedToken] = useState(false);
  const [status, setStatus] = useState<StatusState>("loading");
  const [message, setMessage] = useState<string>(() => t("verifying"));

  useEffect(() => {
    const tokenValue = searchParams.get("token");
    queueMicrotask(() => {
      setToken(tokenValue);
      setHasCheckedToken(true);
    });
  }, [searchParams]);

  useEffect(() => {
    if (!hasCheckedToken) {
      return;
    }
    if (!token) {
      queueMicrotask(() => {
        setStatus("error");
        setMessage(t("missingToken"));
      });
      return;
    }

    postJson<VerifyResponse>("/auth/verify", { token })
      .then((data) => {
        setAccessToken(data.access_token);
        setUserId(data.user.id);
        setStatus("success");
        setMessage(t("welcome"));
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : t("invalidLink"));
      });
  }, [hasCheckedToken, token, t]);

  return (
    <VerifyCard
      title={t("title")}
      description={t("description")}
      status={status}
      message={message}
      homeLabel={t("goHome")}
    />
  );
}

export default function VerifyClient() {
  const t = useTranslations("verify");

  return (
    <Suspense
      fallback={
        <VerifyCard
          title={t("title")}
          description={t("description")}
          status="loading"
          message={t("verifying")}
          homeLabel={t("goHome")}
        />
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
