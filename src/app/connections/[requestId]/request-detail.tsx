"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserId } from "@/lib/session";
import { postJson } from "@/lib/api";
import type {
  MatchRequest,
  PreAcceptMessage,
  AcceptResponse,
  OkResponse,
} from "../connection-types";

type Props = {
  requestId: string;
  initialRequest?: MatchRequest;
  initialMessages?: PreAcceptMessage[];
  initialError?: string;
};

export default function RequestDetail({
  requestId,
  initialRequest,
  initialMessages,
  initialError,
}: Props) {
  const t = useTranslations("connections.detail");
  const router = useRouter();

  const [request] = useState(initialRequest);
  const [messages, setMessages] = useState<PreAcceptMessage[]>(
    initialMessages ?? [],
  );
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const currentUserId = getUserId();
  const isRecipient = request?.recipient.user_id === currentUserId;
  const isRequester = request?.requester.user_id === currentUserId;
  const partner = isRecipient ? request?.requester : request?.recipient;
  const isPending = request?.status === "pending";

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const msg = await postJson<PreAcceptMessage>(
        `/match-requests/${requestId}/messages`,
        { body: messageText.trim() },
      );
      setMessages((prev) => [...prev, msg]);
      setMessageText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSending(false);
    }
  }, [messageText, sending, requestId]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const result = await postJson<AcceptResponse>(
        `/match-requests/${requestId}/accept`,
        {},
      );
      router.push(`/conversations/${result.match_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      await postJson<OkResponse>(
        `/match-requests/${requestId}/decline`,
        {},
      );
      router.push("/connections");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await postJson<OkResponse>(
        `/match-requests/${requestId}/cancel`,
        {},
      );
      router.push("/connections");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading(false);
    }
  };

  if (!request) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <p className="text-destructive">{error ?? "Request not found."}</p>
        <Link href="/connections" className="text-sm underline">
          ← {t("backToInbox")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/connections"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t("backToInbox")}
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {isRecipient
              ? t("requestFrom", { handle: `@${partner?.handle}` })
              : t("requestTo", { handle: `@${partner?.handle}` })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("messagesTitle")}
            </h3>
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noMessages")}
              </p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p>{msg.body}</p>
                        <p
                          className={`mt-1 text-xs ${
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString(
                            undefined,
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message input */}
          {isPending && (
            <div className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t("typeMessage")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sending}
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={sending || !messageText.trim()}
              >
                {t("send")}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          {isPending && (
            <div className="flex gap-2 border-t pt-4">
              {isRecipient && (
                <>
                  <Button onClick={handleAccept} disabled={actionLoading}>
                    {t("accept")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDecline}
                    disabled={actionLoading}
                  >
                    {t("decline")}
                  </Button>
                </>
              )}
              {isRequester && (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={actionLoading}
                >
                  {t("cancelRequest")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
