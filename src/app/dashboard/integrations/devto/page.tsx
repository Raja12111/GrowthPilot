"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SoftPanel } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loadDevtoConnection,
  saveDevtoConnection,
  type DevtoConnection,
} from "@/lib/devto-client";
import { cn } from "@/lib/utils";

export default function DevtoIntegrationPage() {
  const [apiKey, setApiKey] = useState("");
  const [connection, setConnection] = useState<DevtoConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadDevtoConnection();
    if (saved) {
      setConnection(saved);
      setApiKey(saved.apiKey);
    }
  }, []);

  function connectDevto() {
    setError(null);
    setNotice(null);
    if (!apiKey.trim()) {
      setError("DEV.to API Key is required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/devto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            apiKey: apiKey.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          user?: { username?: string; name?: string };
        };

        if (!data.ok) {
          setError(data.error || "Could not connect to DEV.to.");
          return;
        }

        const next: DevtoConnection = {
          apiKey: apiKey.trim(),
          connectedAt: new Date().toISOString(),
          username: data.user?.username,
          name: data.user?.name,
        };
        saveDevtoConnection(next);
        setConnection(next);
        setNotice(
          `Connected${data.user?.username ? ` as @${data.user.username}` : ""}. You can auto-publish from Create a Post or Queue.`,
        );
      } catch {
        setError("Network error while connecting to DEV.to.");
      }
    });
  }

  function disconnectDevto() {
    saveDevtoConnection(null);
    setConnection(null);
    setNotice("DEV.to disconnected.");
  }

  return (
    <AppShell
      section="Integrations"
      title="DEV.to"
      subtitle="Connect DEV.to like SoMePoster — paste your API key, then publish developer articles from Create a Post."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect DEV.to
            </h2>
            <Badge
              className={cn(
                "border-0",
                connection
                  ? "bg-[#dcfce7] text-[#15803d]"
                : "bg-[#eef1f6] text-[#5c6578]",
              )}
            >
              {connection ? "Connected" : "Not connected"}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="devto-key">DEV.to API Key</Label>
            <Input
              id="devto-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste API key from DEV.to → Settings → Extensions"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
            />
          </div>

          {connection?.username ? (
            <p className="text-sm text-[#5c6578]">
              Signed in as{" "}
              <span className="font-medium text-[#1c1f26]">
                @{connection.username}
              </span>
              {connection.name ? ` (${connection.name})` : ""}.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-[#f8ece8] px-3 py-2 text-sm text-[#7a3e2e]">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="rounded-xl bg-[#eef3f9] px-3 py-2 text-sm text-[#1e3a5f]">
              {notice}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              disabled={isPending}
              onClick={connectDevto}
              className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
            >
              {isPending ? "Connecting…" : "Save & Connect"}
            </Button>
            {connection ? (
              <Button
                type="button"
                variant="outline"
                onClick={disconnectDevto}
                className="border-[#1e3a5f]/25"
              >
                Disconnect
              </Button>
            ) : null}
            <Link
              href="/dashboard/parasite-posting/compose"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-[#1e3a5f]/25",
              )}
            >
              Create a Post
            </Link>
          </div>
        </SoftPanel>

        <SoftPanel className="space-y-4">
          <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            How to connect
          </h2>
          <ol className="space-y-3 text-sm leading-relaxed text-[#5c6578]">
            <li>
              <span className="font-medium text-[#1c1f26]">1.</span> In
              GrowthPilot, open{" "}
              <Link
                href="/dashboard/integrations"
                className="text-[#1e3a5f] underline"
              >
                Integrations
              </Link>{" "}
              and click <strong>Connect</strong> on DEV.to.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">2.</span> Open your{" "}
              <a
                href="https://dev.to/settings/extensions"
                target="_blank"
                rel="noreferrer"
                className="text-[#1e3a5f] underline"
              >
                DEV.to Settings → Extensions
              </a>
              . Under <strong>DEV Community API Keys</strong>, enter a
              description and click <strong>Generate API Key</strong>.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">3.</span> Paste the
              key into <strong>DEV.to API Key</strong> here, then click{" "}
              <strong>Save & Connect</strong>.
            </li>
          </ol>
          <p className="text-xs text-[#5c6578]">
            Flow matches SoMePoster&apos;s DEV.to connection guide — publish
            developer articles from Create a Post alongside your other
            platforms.
          </p>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
