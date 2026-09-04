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
  loadBlueskyConnection,
  saveBlueskyConnection,
  type BlueskyConnection,
} from "@/lib/bluesky-client";
import { cn } from "@/lib/utils";

export default function BlueskyPage() {
  const [handle, setHandle] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [connection, setConnection] = useState<BlueskyConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadBlueskyConnection();
    if (saved) {
      setConnection(saved);
      setHandle(saved.handle);
      setAppPassword(saved.appPassword);
    }
  }, []);

  function connect() {
    setError(null);
    setNotice(null);
    if (!handle.trim() || !appPassword.trim()) {
      setError("Bluesky handle and app password are required.");
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/bluesky", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            handle: handle.trim(),
            appPassword: appPassword.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          account?: { handle?: string; did?: string };
        };
        if (!data.ok) {
          setError(data.error || "Could not connect to Bluesky.");
          return;
        }
        const next: BlueskyConnection = {
          handle: handle.trim().replace(/^@/, ""),
          appPassword: appPassword.trim(),
          connectedAt: new Date().toISOString(),
          did: data.account?.did,
        };
        saveBlueskyConnection(next);
        setConnection(next);
        setNotice(
          `Connected as @${data.account?.handle || next.handle}. Auto-publish from Create a Post.`,
        );
      } catch {
        setError("Network error while connecting to Bluesky.");
      }
    });
  }

  return (
    <AppShell
      section="Integrations"
      title="Bluesky"
      subtitle="Connect Bluesky like SoMePoster — handle + app password, then auto-publish."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect Bluesky
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
          <div className="space-y-1.5">
            <Label htmlFor="bsky-handle">Bluesky Handle</Label>
            <Input
              id="bsky-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="username.bsky.social"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bsky-pass">App Password</Label>
            <Input
              id="bsky-pass"
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="From Bluesky → Privacy and Security → App Passwords"
            />
          </div>
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
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isPending}
              onClick={connect}
              className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
            >
              {isPending ? "Connecting…" : "Save & Connect"}
            </Button>
            {connection ? (
              <Button
                variant="outline"
                className="border-[#1e3a5f]/25"
                onClick={() => {
                  saveBlueskyConnection(null);
                  setConnection(null);
                  setNotice("Bluesky disconnected.");
                }}
              >
                Disconnect
              </Button>
            ) : null}
            <Link
              href="/dashboard/support/connect-bluesky"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-[#1e3a5f]/25",
              )}
            >
              Guide
            </Link>
          </div>
        </SoftPanel>
        <SoftPanel className="space-y-3 text-sm leading-relaxed text-[#5c6578]">
          <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            How to connect
          </h2>
          <ol className="space-y-2">
            <li>1. Log in at bsky.app</li>
            <li>2. Settings → Privacy and Security → App Passwords</li>
            <li>3. Create an app password and copy it</li>
            <li>4. Paste handle + password here → Save & Connect</li>
          </ol>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
