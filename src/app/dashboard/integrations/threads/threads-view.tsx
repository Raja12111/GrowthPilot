"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SoftPanel } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loadThreadsConnection,
  saveThreadsConnection,
  type ThreadsConnection,
} from "@/lib/threads-client";
import { cn } from "@/lib/utils";

function readPendingCookie(): ThreadsConnection | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("threads_pending="))
    ?.slice("threads_pending=".length);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as ThreadsConnection;
    document.cookie = "threads_pending=; path=/; max-age=0";
    return parsed;
  } catch {
    return null;
  }
}

export default function ThreadsAutomationPage() {
  const searchParams = useSearchParams();
  const [accessToken, setAccessToken] = useState("");
  const [userId, setUserId] = useState("");
  const [connection, setConnection] = useState<ThreadsConnection | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadThreadsConnection();
    if (saved) {
      setConnection(saved);
      setAccessToken(saved.accessToken);
      setUserId(saved.userId);
    }

    fetch("/api/threads")
      .then((r) => r.json())
      .then((data: { oauthConfigured?: boolean }) => {
        setOauthConfigured(Boolean(data.oauthConfigured));
      })
      .catch(() => undefined);

    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    }

    if (searchParams.get("oauth") === "1") {
      const pending = readPendingCookie();
      if (pending?.accessToken && pending.userId) {
        const next: ThreadsConnection = {
          ...pending,
          connectedAt: new Date().toISOString(),
        };
        saveThreadsConnection(next);
        setConnection(next);
        setAccessToken(next.accessToken);
        setUserId(next.userId);
        setNotice(
          `Connected${next.username ? ` as @${next.username}` : ""}. You can auto-publish from Create a Post or Queue.`,
        );
      }
    }
  }, [searchParams]);

  function connectManual() {
    setError(null);
    setNotice(null);
    if (!accessToken.trim() || !userId.trim()) {
      setError("Access token and Threads user id are required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            accessToken: accessToken.trim(),
            userId: userId.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          profile?: {
            id?: string;
            username?: string;
            name?: string;
            profileUrl?: string;
          };
        };
        if (!data.ok) {
          setError(data.error || "Could not connect to Threads.");
          return;
        }

        const next: ThreadsConnection = {
          accessToken: accessToken.trim(),
          userId: data.profile?.id || userId.trim(),
          username: data.profile?.username,
          name: data.profile?.name,
          profileUrl: data.profile?.profileUrl,
          connectedAt: new Date().toISOString(),
        };
        saveThreadsConnection(next);
        setConnection(next);
        setNotice(
          `Connected${next.username ? ` as @${next.username}` : ""}. Remember: profile must be public to publish.`,
        );
      } catch {
        setError("Network error while connecting to Threads.");
      }
    });
  }

  function disconnectThreads() {
    saveThreadsConnection(null);
    setConnection(null);
    setNotice("Threads disconnected.");
  }

  return (
    <AppShell
      section="Integrations"
      title="Threads"
      subtitle="Connect Threads like SoMePoster — authorize with Meta OAuth (or paste a token), then auto-publish."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect Threads
            </h2>
            {connection ? (
              <Badge className="border-0 bg-[#dcfce7] text-[#15803d]">
                Connected
              </Badge>
            ) : (
              <Badge className="border-0 bg-[#eef1f6] text-[#5c6578]">
                Not connected
              </Badge>
            )}
          </div>

          {oauthConfigured ? (
            <a
              href="/api/threads/auth"
              className={cn(
                buttonVariants(),
                "w-full bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]",
              )}
            >
              Connect with Threads
            </a>
          ) : (
            <p className="rounded-xl bg-[#eef1f6] px-3 py-2 text-sm text-[#5c6578]">
              OAuth needs{" "}
              <code className="rounded bg-white px-1 text-xs">
                THREADS_APP_ID
              </code>{" "}
              and{" "}
              <code className="rounded bg-white px-1 text-xs">
                THREADS_APP_SECRET
              </code>{" "}
              on the server. Until then, paste a token below.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="threads-token">Access token (manual)</Label>
            <Input
              id="threads-token"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Threads user access token"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="threads-user">Threads user id</Label>
            <Input
              id="threads-user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Numeric Threads user id"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
            />
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {notice ? <p className="text-sm text-[#1e3a5f]">{notice}</p> : null}
          {connection?.username ? (
            <p className="text-sm text-[#5c6578]">
              Account:{" "}
              <span className="font-medium text-[#1c1f26]">
                @{connection.username}
              </span>
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              disabled={isPending}
              onClick={connectManual}
              className="flex-1 bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
            >
              {isPending ? "Connecting…" : "Save & Connect"}
            </Button>
            {connection ? (
              <Button
                variant="outline"
                className="flex-1 border-[#1e3a5f]/25"
                onClick={disconnectThreads}
              >
                Disconnect
              </Button>
            ) : null}
          </div>

          <Link
            href="/dashboard/parasite-posting/compose"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full border-[#1e3a5f]/25",
            )}
          >
            Create a Post
          </Link>
        </SoftPanel>

        <SoftPanel className="space-y-4">
          <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            How to connect (SoMePoster steps)
          </h2>
          <ol className="space-y-3 text-sm leading-relaxed text-[#5c6578]">
            <li>
              <span className="font-medium text-[#1c1f26]">1.</span> Click{" "}
              <strong>Connect with Threads</strong> (when OAuth is configured).
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">2.</span> Log in on
              the Threads / Meta page with the account you want to use.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">3.</span> Review
              permissions (profile + create posts) and click{" "}
              <strong>Continue</strong>.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">4.</span> You’ll
              return here connected and ready to publish.
            </li>
          </ol>
          <p className="rounded-xl bg-[#f8ece8] px-3 py-2 text-xs leading-relaxed text-[#7a3e2e]">
            Your Threads profile must be <strong>public</strong>. Private
            accounts can’t be used for API publishing.
          </p>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
