"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { getJson } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { formatCountryFlag } from "@/lib/utils";

import type { Conversation, ConversationsResponse } from "./conversation-types";

type Props = {
  initialData?: ConversationsResponse | null;
  initialError?: string | null;
  initialFetched?: boolean;
};

export default function ConversationsContent({
  initialData,
  initialError,
  initialFetched,
}: Props) {
  const t = useTranslations("messaging");
  const [conversations, setConversations] = useState<Conversation[]>(
    initialData?.items ?? [],
  );
  const [hasMore, setHasMore] = useState(initialData?.has_more ?? false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading] = useState(!initialFetched);
  const currentUserId = getUserId();

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getJson<ConversationsResponse>(
        `/matches?limit=20&offset=${conversations.length}`,
      );
      setConversations((prev) => [...prev, ...data.items]);
      setHasMore(data.has_more);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [conversations.length]);

  // Poll for updates every 15s
  useEffect(() => {
    if (!currentUserId) return;

    const poll = async () => {
      try {
        const data = await getJson<ConversationsResponse>(`/matches?limit=20`);
        setConversations(data.items);
        setHasMore(data.has_more);
      } catch {
        // Silently fail on polling errors
      }
    };

    const interval = setInterval(poll, 15000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [currentUserId]);

  // Initial load handled by server-side fetch; polling handles updates
  useEffect(() => {
    if (!initialFetched && currentUserId) {
      // Fetch on mount if server-side fetch didn't happen
      getJson<ConversationsResponse>(`/matches?limit=20`)
        .then((data) => {
          setConversations(data.items);
          setHasMore(data.has_more);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
    }
  }, [initialFetched, currentUserId]);

  if (!currentUserId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t("signIn")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("empty")}</p>
        <Link
          href="/dashboard"
          className="text-sm text-primary underline hover:no-underline"
        >
          {t("discoverPartners")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <div className="space-y-2">
        {conversations.map((conv) => (
          <ConversationCard
            key={conv.id}
            conversation={conv}
            currentUserId={currentUserId}
          />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={fetchConversations}
          className="mt-4 w-full rounded-md border px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          {t("loadMore")}
        </button>
      )}
    </div>
  );
}

function ConversationCard({
  conversation,
  currentUserId,
}: {
  conversation: Conversation;
  currentUserId: string;
}) {
  const t = useTranslations("messaging");
  const flag = conversation.partner_country
    ? formatCountryFlag(conversation.partner_country)
    : "";

  const snippet = conversation.last_message_body
    ? conversation.last_message_body.length > 80
      ? conversation.last_message_body.slice(0, 80) + "…"
      : conversation.last_message_body
    : t("noMessagesYet");

  const senderPrefix =
    conversation.last_sender_id === currentUserId ? t("you") + ": " : "";

  const timeAgo = conversation.last_message_at
    ? formatRelativeTime(conversation.last_message_at)
    : "";

  return (
    <Link
      href={`/conversations/${conversation.id}`}
      className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
        {flag || "👤"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium">@{conversation.partner_handle}</span>
          {timeAgo && (
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {senderPrefix}
          {snippet}
        </p>
      </div>
    </Link>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}
