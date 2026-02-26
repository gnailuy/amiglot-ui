"use client";

import { useState } from "react";
import Link from "next/link";
import { postJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MagicLinkResponse = {
  ok?: boolean;
  dev_login_url?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);
    setDevLink(null);

    try {
      const data = await postJson<MagicLinkResponse>("/auth/magic-link", {
        email,
      });

      setStatus("success");
      setMessage("Check your email for a sign-in link.");

      if (data.dev_login_url) {
        setDevLink(data.dev_login_url);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  const statusStyles =
    status === "error"
      ? "bg-destructive/10 text-destructive"
      : status === "success"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
        : "bg-muted text-muted-foreground";

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              We&apos;ll email you a magic link to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button
                className="w-full"
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Sending..." : "Send magic link"}
              </Button>
            </form>
            {message && (
              <div
                className={`mt-4 rounded-md px-4 py-3 text-sm ${statusStyles}`}
                data-state={status}
              >
                {message}
              </div>
            )}
            {devLink && (
              <div className="mt-3 text-xs text-muted-foreground">
                Dev login link: {" "}
                <a className="underline" href={devLink}>
                  {devLink}
                </a>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">
              Back to home
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
