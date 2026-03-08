"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { clearAccessToken, clearUserId, getAccessToken, getUserId } from "@/lib/session";
import { getJson } from "@/lib/api";
import type { ProfileResponse } from "@/app/profile/profile-types";

export default function HomeSession() {
  const t = useTranslations("home");
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const onSignOut = () => {
    clearAccessToken();
    clearUserId();
    setToken(null);
    setUserId(null);
    setProfileComplete(null);
  };

  useEffect(() => {
    setToken(getAccessToken());
    setUserId(getUserId());
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    let active = true;
    getJson<ProfileResponse>("/profile")
      .then((data) => {
        if (!active) return;
        setProfileComplete(Boolean(data.profile.discoverable));
      })
      .catch(() => {
        if (!active) return;
        setProfileComplete(false);
      });

    return () => {
      active = false;
    };
  }, [token, userId]);

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">{t("checking")}</p>
      </div>
    );
  }

  if (token) {
    const profileLabel = profileComplete ? t("profileComplete") : t("completeProfile");
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">{t("signedIn")}</p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild className="rounded-full">
            <Link href="/profile">{profileLabel}</Link>
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
