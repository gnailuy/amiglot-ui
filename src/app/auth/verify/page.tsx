"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { postJson } from "@/lib/api";
import { setAccessToken, setUserId } from "@/lib/session";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type VerifyResponse = {
  access_token: string;
  user: { id: string; email: string };
};

type StatusState = "loading" | "success" | "error";

type VerifyCardProps = {
  status: StatusState;
  message: string;
};

function VerifyCard({ status, message }: VerifyCardProps) {
  const statusStyles = useMemo(() => {
    if (status === "error") {
      return "bg-destructive/10 text-destructive";
    }

    if (status === "success") {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    }

    return "bg-muted text-muted-foreground";
  }, [status]);

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-lg flex-col justify-center">
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Magic link verification</CardTitle>
            <CardDescription>
              We&apos;re validating your secure sign-in link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`rounded-md px-4 py-3 text-sm ${statusStyles}`} data-state={status}>
              {message}
            </div>
          </CardContent>
          <CardFooter>
            <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">
              Go to home
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<StatusState>(() =>
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState<string>(() =>
    token
      ? "Verifying your link..."
      : "Missing token. Please request a new magic link.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    postJson<VerifyResponse>("/auth/verify", { token })
      .then((data) => {
        setAccessToken(data.access_token);
        setUserId(data.user.id);
        setStatus("success");
        setMessage("You're signed in. Welcome back!");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "We could not verify this link.",
        );
      });
  }, [token]);

  return <VerifyCard status={status} message={message} />;
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <VerifyCard status="loading" message="Verifying your link..." />
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
