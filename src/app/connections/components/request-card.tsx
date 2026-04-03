"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MatchRequest } from "../connection-types";

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

type Props = {
  request: MatchRequest;
  direction: "incoming" | "outgoing";
  actionLoading: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
};

export default function RequestCard({
  request,
  direction,
  actionLoading,
  onAccept,
  onDecline,
  onCancel,
}: Props) {
  const t = useTranslations("connections.requestCard");

  const partner =
    direction === "incoming" ? request.requester : request.recipient;
  const flag = partner.country_code ? countryFlag(partner.country_code) : "";

  const subtitle = [
    flag,
    `@${partner.handle}`,
    partner.age != null ? String(partner.age) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const messageInfo = request.message_count > 0
    ? `💬 ${request.message_count} ${request.message_count === 1 ? "message" : "messages"}`
    : null;
  const sentTime = request.created_at
    ? t("sentAgo", { time: timeAgo(request.created_at) })
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{subtitle}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {[messageInfo, sentTime].filter(Boolean).join(" · ")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Link href={`/connections/${request.id}`}>
            <Button size="sm" variant="outline">
              {t("view")}
            </Button>
          </Link>
          {direction === "incoming" && (
            <>
              <Button
                size="sm"
                onClick={onAccept}
                disabled={actionLoading}
              >
                {t("accept")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onDecline}
                disabled={actionLoading}
              >
                {t("decline")}
              </Button>
            </>
          )}
          {direction === "outgoing" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onCancel}
              disabled={actionLoading}
            >
              {t("cancel")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
