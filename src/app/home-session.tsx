"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { clearAccessToken, clearUserId, getAccessToken } from "@/lib/session";

export default function HomeSession() {
  const t = useTranslations("home");
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const tokenValue = getAccessToken();
    setToken(tokenValue);
    setIsMounted(true);
  }, []);

  const onSignOut = () => {
    clearAccessToken();
    clearUserId();
    setToken(null);
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center gap-3">
        <span
          className="h-7 w-7 animate-spin rounded-full border-2 border-muted border-t-primary"
          aria-hidden="true"
        />
        <span className="sr-only">{t("checking")}</span>
      </div>
    );
  }

  if (token) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">{t("signedIn")}</p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild className="rounded-full">
            <Link href="/profile">{t("completeProfile")}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onSignOut}
          >
            {t("signOut")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">{t("signedOut")}</p>
      <Button asChild className="rounded-full">
        <Link href="/login">{t("signIn")}</Link>
      </Button>
    </div>
  );
}
