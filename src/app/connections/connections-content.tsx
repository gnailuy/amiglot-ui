"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getJson, postJson } from "@/lib/api";
import type { MatchRequest, MatchRequestsResponse, OkResponse, AcceptResponse } from "./connection-types";
import RequestCard from "./components/request-card";
import RequestCardSkeleton from "./components/request-card-skeleton";
import EmptyState from "./components/empty-state";

type Props = {
  initialData?: MatchRequestsResponse | null;
  initialError?: string | null;
  initialErrorStatus?: number | null;
  initialFetched?: boolean;
};

export default function ConnectionsContent({
  initialData,
  initialError,
  initialFetched,
}: Props) {
  const t = useTranslations("connections");

  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [items, setItems] = useState<MatchRequest[]>(initialData?.items ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialData?.next_cursor ?? null,
  );
  const [loading, setLoading] = useState(!initialFetched);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(
    async (direction: string, cursor?: string | null) => {
      const params = new URLSearchParams({
        direction,
        status: "pending",
        limit: "20",
      });
      if (cursor) params.set("cursor", cursor);
      return getJson<MatchRequestsResponse>(
        `/match-requests?${params.toString()}`,
      );
    },
    [],
  );

  const loadTab = useCallback(
    async (direction: "incoming" | "outgoing") => {
      setLoading(true);
      setError(null);
      setItems([]);
      setNextCursor(null);
      try {
        const data = await fetchRequests(direction);
        setItems(data.items);
        setNextCursor(data.next_cursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [fetchRequests],
  );

  useEffect(() => {
    if (tab !== "incoming" || initialFetched) {
      if (tab !== "incoming") loadTab(tab);
    }
  }, [tab, initialFetched, loadTab]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchRequests(tab, nextCursor);
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.next_cursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await postJson<AcceptResponse>(
        `/match-requests/${requestId}/accept`,
        {},
      );
      setItems((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await postJson<OkResponse>(
        `/match-requests/${requestId}/decline`,
        {},
      );
      setItems((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await postJson<OkResponse>(
        `/match-requests/${requestId}/cancel`,
        {},
      );
      setItems((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  if (!initialFetched) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          <Link href="/login" className="underline">
            {t("signIn")}
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "incoming" | "outgoing")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="incoming">{t("tabs.incoming")}</TabsTrigger>
          <TabsTrigger value="outgoing">{t("tabs.outgoing")}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
              <Button
                variant="link"
                size="sm"
                onClick={() => loadTab(tab)}
                className="ml-2"
              >
                {t("retry")}
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <RequestCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState direction={tab} />
          ) : (
            <div className="space-y-4">
              {items.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  direction={tab}
                  actionLoading={actionLoading === request.id}
                  onAccept={() => handleAccept(request.id)}
                  onDecline={() => handleDecline(request.id)}
                  onCancel={() => handleCancel(request.id)}
                />
              ))}

              {nextCursor && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? t("loading") : t("loadMore")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
