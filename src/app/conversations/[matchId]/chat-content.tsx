"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { getJson, postJson } from "@/lib/api";
import { getUserId } from "@/lib/session";

import type {
  Message,
  MessagesResponse,
  SendMessageResponse,
} from "../conversation-types";

type Props = {
  matchId: string;
  initialData?: MessagesResponse | null;
  initialError?: string | null;
  initialErrorStatus?: number | null;
};

export default function ChatContent({
  matchId,
  initialData,
  initialError,
  initialErrorStatus,
}: Props) {
  const t = useTranslations("messaging");
  const router = useRouter();
  const currentUserId = getUserId();

  // Reverse initial DESC messages to chronological order
  const initialMessages = [...(initialData?.items ?? [])].reverse();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [nextCursor, setNextCursor] = useState<string | undefined>(
    initialData?.next_cursor ?? undefined,
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [closed, setClosed] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_LENGTH = 2000;
  const charCount = input.length;

  // Redirect on 404
  useEffect(() => {
    if (initialErrorStatus === 404) {
      router.push("/conversations");
    }
  }, [initialErrorStatus, router]);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!currentUserId || closed) return;

    let intervalId: ReturnType<typeof setInterval>;

    const poll = async () => {
      if (messages.length === 0) return;
      const latest = messages[messages.length - 1];
      try {
        const data = await getJson<MessagesResponse>(
          `/matches/${matchId}/messages?since=${encodeURIComponent(latest.created_at)}&limit=50`,
        );
        if (data.items.length > 0) {
          setMessages((prev) => [...prev, ...data.items]);
        }
      } catch {
        // Silent poll failure
      }
    };

    intervalId = setInterval(poll, 3000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        intervalId = setInterval(poll, 3000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [currentUserId, matchId, messages, closed]);

  // Load older messages
  const loadOlder = async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const data = await getJson<MessagesResponse>(
        `/matches/${matchId}/messages?cursor=${nextCursor}&limit=50`,
      );
      // data.items is DESC, reverse to chronological and prepend
      const older = [...data.items].reverse();
      setMessages((prev) => [...older, ...prev]);
      setNextCursor(data.next_cursor ?? undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingOlder(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    const body = input.trim();
    if (!body || sending || closed) return;

    setSending(true);
    setError(null);

    // Optimistic add
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: currentUserId ?? "",
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");

    try {
      const result = await postJson<SendMessageResponse>(
        `/matches/${matchId}/messages`,
        { body },
      );
      // Replace temp with real
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...result }
            : m,
        ),
      );
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Unknown error";
      // Check for closed match
      if (errMsg.toLowerCase().includes("closed")) {
        setClosed(true);
      }
      // Check for daily limit
      if (errMsg.toLowerCase().includes("limit")) {
        setError(t("dailyLimitReached"));
      } else {
        setError(errMsg);
      }
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(body); // Restore input
    } finally {
      setSending(false);
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Close match
  const handleClose = async () => {
    if (!confirm(t("closeConfirm"))) return;
    try {
      await postJson(`/matches/${matchId}/close`, {});
      setClosed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  if (!currentUserId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t("signIn")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Link
          href="/conversations"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t("backToConversations")}
        </Link>
        <button
          onClick={handleClose}
          className="text-xs text-destructive hover:underline"
          disabled={closed}
        >
          {t("closeConversation")}
        </button>
      </div>

      {/* Closed banner */}
      {closed && (
        <div className="bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {t("conversationClosed")}
        </div>
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {nextCursor && (
          <button
            onClick={loadOlder}
            disabled={loadingOlder}
            className="w-full text-center text-xs text-muted-foreground hover:underline"
          >
            {loadingOlder ? t("loading") : t("loadOlder")}
          </button>
        )}

        {messages.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            {t("noMessagesYet")}
          </p>
        )}

        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === currentUserId;
          const showDate = shouldShowDateSeparator(messages, idx);
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center text-xs text-muted-foreground my-4">
                  {formatDateSeparator(msg.created_at)}
                </div>
              )}
              <div
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-1 text-center text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Compose */}
      {!closed && (
        <div className="border-t px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={handleKeyDown}
                placeholder={t("typePlaceholder")}
                rows={1}
                className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-[6rem] overflow-y-auto"
                disabled={sending}
              />
              {charCount > 1800 && (
                <span
                  className={`absolute bottom-1 right-2 text-[10px] ${
                    charCount >= MAX_LENGTH ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {charCount}/{MAX_LENGTH}
                </span>
              )}
            </div>
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {t("send")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function shouldShowDateSeparator(messages: Message[], idx: number): boolean {
  if (idx === 0) return true;
  const prev = new Date(messages[idx - 1].created_at).toDateString();
  const curr = new Date(messages[idx].created_at).toDateString();
  return prev !== curr;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
