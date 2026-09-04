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
  loadMastodonConnection,
  saveMastodonConnection,
  type MastodonConnection,
} from "@/lib/mastodon-client";
import { cn } from "@/lib/utils";

function readPendingCookie(): MastodonConnection | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("mastodon_pending="))
    ?.slice("mastodon_pending=".length);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as MastodonConnection;
    document.cookie = "mastodon_pending=; path=/; max-age=0";
    return parsed;
  } catch {
    return null;
  }
}

export default function MastodonIntegrationPage() {
  const searchParams = useSearchParams();
  const [instanceUrl, setInstanceUrl] = useState("https://mastodon.social");
  const [accessToken, setAccessToken] = useState("");
  const [connection, setConnection] = useState<MastodonConnection | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadMastodonConnection();
    if (saved) {
      setConnection(saved);
      setInstanceUrl(saved.instanceUrl);
      setAccessToken(saved.accessToken);
    }

    fetch("/api/mastodon")
      .then((r) => r.json())
      .then((data: { oauthConfigured?: boolean; defaultInstance?: string }) => {
        setOauthConfigured(Boolean(data.oauthConfigured));
        if (!saved && data.defaultInstance) {
          setInstanceUrl(data.defaultInstance);
        }
      })
      .catch(() => undefined);

    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    }

    if (searchParams.get("oauth") === "1") {
      const pending = readPendingCookie();
      if (pending?.accessToken && pending.instanceUrl) {
        const next: MastodonConnection = {
          ...pending,
          connectedAt: new Date().toISOString(),
        };
        saveMastodonConnection(next);
        setConnection(next);
        setInstanceUrl(next.instanceUrl);
        setAccessToken(next.accessToken);
        setNotice(
          `Connected${next.acct || next.username ? ` as @${next.acct || next.username}` : ""}. Auto-publish from Create a Post or Queue.`,
        );
      }
    }
  }, [searchParams]);

  function connectMastodon() {
    setError(null);
    setNotice(null);
    if (!instanceUrl.trim() || !accessToken.trim()) {
      setError("Instance URL and access token are required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/mastodon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            instanceUrl: instanceUrl.trim(),
            accessToken: accessToken.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          instanceUrl?: string;
          account?: {
            id?: string;
            username?: string;
            acct?: string;
            displayName?: string;
            url?: string;
          };
        };

        if (!data.ok) {
          setError(data.error || "Could not connect to Mastodon.");
          return;
        }

        const next: MastodonConnection = {
          instanceUrl: data.instanceUrl || instanceUrl.trim(),
          accessToken: accessToken.trim(),
          connectedAt: new Date().toISOString(),
          accountId: data.account?.id,
          username: data.account?.username,
          acct: data.account?.acct,
          displayName: data.account?.displayName,
          profileUrl: data.account?.url,
        };
        saveMastodonConnection(next);
        setConnection(next);
        setInstanceUrl(next.instanceUrl);
        setNotice(
          `Connected${data.account?.acct ? ` as @${data.account.acct}` : ""}. Auto-publish from Create a Post or Queue.`,
        );
      } catch {
        setError("Network error while connecting to Mastodon.");
      }
    });
  }

  function disconnectMastodon() {
    saveMastodonConnection(null);
    setConnection(null);
    setNotice("Mastodon disconnected.");
  }

  return (
    <AppShell
      section="Integrations"
      title="Mastodon"
      subtitle="Connect any Mastodon instance (default mastodon.social), then auto-publish public posts from Create a Post."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect Mastodon
            </h2>
            <Badge
              className={cn(
                "border-0",
                connection
                  ? "bg-[#dcfce7] text-[#15803d]"
                  : "bg-[#eef1f6] text-[#5c6578]",
              )}
            >
              {connection ? "Connected to GrowthPilot" : "Not connected"}
            </Badge>
          </div>

          {oauthConfigured ? (
            <div className="space-y-2 rounded-xl border border-[#c5d4eb] bg-[#eef3f9] px-4 py-3">
              <p className="text-sm text-[#1e3a5f]">
                Mastodon OAuth app is configured for this server instance.
              </p>
              <a
                href="/api/mastodon/auth"
                className={cn(
                  buttonVariants(),
                  "inline-flex bg-[#1e3a5f] text-white hover:bg-[#162d4a]",
                )}
              >
                Connect with Mastodon
              </a>
            </div>
          ) : (
            <p className="rounded-xl border border-[#e4e8ef] bg-[#f8fafc] px-3 py-2 text-xs text-[#5c6578]">
              Optional: set <code>MASTODON_CLIENT_ID</code> +{" "}
              <code>MASTODON_CLIENT_SECRET</code> (and{" "}
              <code>MASTODON_INSTANCE</code>) for one-click OAuth. Otherwise
              paste an access token below.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="mastodon-instance">Instance URL</Label>
            <Input
              id="mastodon-instance"
              placeholder="https://mastodon.social"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
            />
            <p className="text-xs text-[#5c6578]">
              Works with{" "}
              <a
                className="text-[#1e3a5f] underline"
                href="https://mastodon.social/explore"
                target="_blank"
                rel="noreferrer"
              >
                mastodon.social
              </a>{" "}
              or any other Mastodon server.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mastodon-token">Access token</Label>
            <Input
              id="mastodon-token"
              type="password"
              autoComplete="off"
              placeholder="Paste token from Preferences → Development"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-sm text-[#8a1f11]">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="rounded-lg bg-[#dcfce7] px-3 py-2 text-sm text-[#15803d]">
              {notice}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
              disabled={isPending}
              onClick={connectMastodon}
            >
              {isPending ? "Connecting…" : "Connect to GrowthPilot"}
            </Button>
            {connection ? (
              <Button
                type="button"
                variant="outline"
                onClick={disconnectMastodon}
              >
                Disconnect
              </Button>
            ) : null}
            <Link
              href="/dashboard/parasite-posting/compose"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Open Create a Post
            </Link>
          </div>
        </SoftPanel>

        <SoftPanel className="space-y-3 text-sm text-[#5c6578]">
          <h3 className="font-medium text-[#1c1f26]">
            Mastodon integration system
          </h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Open your instance (e.g.{" "}
              <a
                className="text-[#1e3a5f] underline"
                href="https://mastodon.social/settings/applications"
                target="_blank"
                rel="noreferrer"
              >
                mastodon.social Preferences → Development
              </a>
              ).
            </li>
            <li>
              Create a new application with scopes <code>read</code> and{" "}
              <code>write:statuses</code>, then copy the access token.
            </li>
            <li>
              Paste the instance URL + token here, or set OAuth env vars for
              one-click Connect (callback{" "}
              <code className="text-xs">…/api/mastodon/callback</code>).
            </li>
            <li>
              Select Mastodon on Create a Post — GrowthPilot publishes via{" "}
              <code>/api/v1/statuses</code> (500-char limit).
            </li>
          </ol>
          {connection?.profileUrl ? (
            <p className="text-xs">
              Linked profile:{" "}
              <a
                className="text-[#1e3a5f] underline"
                href={connection.profileUrl}
                target="_blank"
                rel="noreferrer"
              >
                @{connection.acct || connection.username}
              </a>
            </p>
          ) : null}
        </SoftPanel>
      </div>
    </AppShell>
  );
}
