"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Props = {
  direction: "incoming" | "outgoing";
};

export default function EmptyState({ direction }: Props) {
  const t = useTranslations("connections.empty");

  if (direction === "outgoing") {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-4xl">📤</span>
        <h3 className="text-lg font-medium">{t("outgoingTitle")}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("outgoingDescription")}
        </p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            {t("discoverPartners")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="text-4xl">📭</span>
      <h3 className="text-lg font-medium">{t("incomingTitle")}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("incomingDescription")}
      </p>
    </div>
  );
}
