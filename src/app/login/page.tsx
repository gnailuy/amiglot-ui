"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { postJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MagicLinkResponse = {
  ok?: boolean;
  dev_login_url?: string;
};


const getDevLoginUrl = (url: string | undefined | null) => {
  if (!url) {
    return null;
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appBaseUrl) {
    return url;
  }

  try {
    const loginUrl = new URL(url);
    const baseUrl = new URL(appBaseUrl);
    loginUrl.protocol = baseUrl.protocol;
    loginUrl.host = baseUrl.host;
    loginUrl.port = baseUrl.port;
    return loginUrl.toString();
  } catch {
    return url;
  }
};

export default function LoginPage() {
  const t = useTranslations("login");
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
      setMessage(t("success"));

      if (data.dev_login_url) {
        setDevLink(getDevLoginUrl(data.dev_login_url));
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : t("errorFallback"));
    }
  };

  const statusStyles =
    status === "error"
      ? "bg-destructive/10 text-destructive"
      : status === "success"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
        : "bg-muted text-muted-foreground";

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("emailPlaceholder")}
                />
              </div>
              <Button
                className="w-full"
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? t("sending") : t("sendMagicLink")}
              </Button>
            </form>
            {message && (
              <div
                className={`mt-4 rounded-md px-4 py-3 text-sm ${statusStyles}`}
                data-state={status}
              >
                {message}
              </div>
            )}
            {devLink && (
              <div className="mt-3 text-xs text-muted-foreground">
                {t("devLink")}{" "}
                <a className="underline" href={devLink}>
                  {devLink}
                </a>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">
              {t("backHome")}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
