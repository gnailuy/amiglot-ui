"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { postJson } from "@/lib/api";
import type { MatchItem, MatchLanguage, OverlapSlot } from "../discovery-types";

const LEVEL_KEYS = ["zero", "beginner", "elementary", "intermediate", "advanced", "native"] as const;

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

function formatOverlap(minutes: number, t: ReturnType<typeof useTranslations>): string {
  if (minutes >= 60) {
    const hours = Math.round(minutes / 60);
    return t("card.overlapHours", { hours });
  }
  return t("card.overlapTime", { minutes });
}

function formatSlotTime(utcTime: string, weekday: number): string {
  const [h, m] = utcTime.split(":").map(Number);
  const now = new Date();
  const dayDiff = ((weekday - now.getUTCDay()) + 7) % 7;
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + dayDiff, h, m));
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="ml-1 inline-flex cursor-help text-muted-foreground hover:text-foreground">
          ⓘ
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-sm">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function LanguageList({
  label,
  languages,
  levelT,
  cardT,
}: {
  label: string;
  languages: MatchLanguage[];
  levelT: ReturnType<typeof useTranslations>;
  cardT: ReturnType<typeof useTranslations>;
}) {
  if (languages.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {languages.map((l) => {
          const teacherLevelKey = LEVEL_KEYS[l.level] ?? "zero";
          const learnerLevelKey = LEVEL_KEYS[l.learner_level] ?? "zero";
          const levelPair = cardT("card.levelPair", {
            teacher: levelT(teacherLevelKey),
            learner: levelT(learnerLevelKey),
          });
          return (
            <Badge key={l.language_code} variant="secondary">
              {l.language_code}
              <span className="ml-1 text-xs opacity-75">
                ({levelPair})
              </span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

function OverlapDisplay({
  slots,
  weekdayT,
  cardT,
}: {
  slots: OverlapSlot[];
  weekdayT: ReturnType<typeof useTranslations>;
  cardT: ReturnType<typeof useTranslations>;
}) {
  if (slots.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">
        🕐 {cardT("card.yourTime")}
        <InfoTooltip text={cardT("card.yourTimeTooltip")} />
      </p>
      <div className="space-y-0.5 text-sm">
        {slots.map((s, i) => {
          const dayKey = WEEKDAY_KEYS[s.weekday];
          const start = formatSlotTime(s.start_utc, s.weekday);
          const end = formatSlotTime(s.end_utc, s.weekday);
          return (
            <p key={i}>
              {weekdayT(dayKey)} {start}–{end}
            </p>
          );
        })}
      </div>
    </div>
  );
}

type Props = {
  match: MatchItem;
  pendingRequestSent?: boolean;
};

export default function MatchCard({ match, pendingRequestSent }: Props) {
  const t = useTranslations("dashboard");
  const ct = useTranslations("connections.connect");
  const levelT = useTranslations("profile.languageLevel");
  const weekdayT = useTranslations("profile.weekdays");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(pendingRequestSent ?? false);
  const [error, setError] = useState<string | null>(null);

  const handleSendRequest = async () => {
    setSending(true);
    setError(null);
    try {
      await postJson("/match-requests", {
        recipient_id: match.user_id,
        initial_message: initialMessage.trim() || undefined,
      });
      setSent(true);
      setDialogOpen(false);
      setInitialMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSending(false);
    }
  };

  const flag = match.country_code ? countryFlag(match.country_code) : "";
  const countryName = match.country_code
    ? (() => {
        try {
          return new Intl.DisplayNames(undefined, { type: "region" }).of(
            match.country_code,
          );
        } catch {
          return match.country_code;
        }
      })()
    : null;

  const subtitle = [
    flag,
    `@${match.handle}`,
    match.age != null ? String(match.age) : null,
    countryName,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{subtitle}</CardTitle>
          <p className="text-sm text-muted-foreground">
            🕐 {formatOverlap(match.total_overlap_minutes, t)}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <LanguageList
            label={`🎓 ${t("card.theyTeachYou")}`}
            languages={match.mutual_teach}
            levelT={levelT}
            cardT={t}
          />
          <LanguageList
            label={`📚 ${t("card.youTeachThem")}`}
            languages={match.mutual_learn}
            levelT={levelT}
            cardT={t}
          />
          {match.bridge_languages.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                🌉 {t("card.bridgeLanguage")}
                <InfoTooltip text={t("card.bridgeTooltip")} />
              </p>
              <div className="flex flex-wrap gap-2">
                {match.bridge_languages.map((b) => (
                  <Badge key={b.language_code} variant="outline">
                    {b.language_code}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <OverlapDisplay
            slots={match.availability_overlap}
            weekdayT={weekdayT}
            cardT={t}
          />
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" disabled>
              {t("card.viewProfile")}
            </Button>
            {sent ? (
              <Button size="sm" variant="secondary" disabled>
                {ct("requestSent")}
              </Button>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">{ct("buttonLabel")}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{ct("dialogTitle")}</DialogTitle>
                    <DialogDescription>
                      {ct("dialogDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder={ct("initialMessagePlaceholder")}
                    maxLength={500}
                    disabled={sending}
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={sending}
                    >
                      {ct("cancel")}
                    </Button>
                    <Button onClick={handleSendRequest} disabled={sending}>
                      {ct("sendRequest")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
