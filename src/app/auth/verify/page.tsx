"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { postJson } from "@/lib/api";
import { setAccessToken, setUserId } from "@/lib/session";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type VerifyResponse = {
  access_token: string;
  user: { id: string; email: string };
};

type StatusState = "loading" | "success" | "error";

type VerifyCardProps = {
  status: StatusState;
  message: string;
};

function VerifyCard({ status, message }: VerifyCardProps) {
  const t = useTranslations("verify");
  const statusStyles = useMemo(() => {
    if (status === "error") {
      return "bg-destructive/10 text-destructive";
    }

    if (status === "success") {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    }

    return "bg-muted text-muted-foreground";
  }, [status]);

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-lg flex-col justify-center">
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`rounded-md px-4 py-3 text-sm ${statusStyles}`} data-state={status}>
              {message}
            </div>
          </CardContent>
          <CardFooter>
            <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">
              {t("goHome")}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function VerifyPageContent() {
  const t = useTranslations("verify");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<StatusState>(() =>
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState<string>(() =>
    token ? t("verifying") : t("missingToken"),
  );

  useEffect(() => {
    if (!token) {
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
  }, [token, t]);

  return <VerifyCard status={status} message={message} />;
}

export default function VerifyPage() {
  const t = useTranslations("verify");
  return (
    <Suspense
      fallback={
        <VerifyCard status="loading" message={t("verifying")} />
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
