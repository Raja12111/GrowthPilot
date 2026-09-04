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
  loadWordPressConnection,
  saveWordPressConnection,
  type WordPressConnection,
} from "@/lib/wordpress-client";
import { cn } from "@/lib/utils";

export default function WordPressPage() {
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [applicationPassword, setApplicationPassword] = useState("");
  const [connection, setConnection] = useState<WordPressConnection | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadWordPressConnection();
    if (saved) {
      setConnection(saved);
      setSiteUrl(saved.siteUrl);
      setUsername(saved.username);
      setApplicationPassword(saved.applicationPassword);
    }
  }, []);

  function connect() {
    setError(null);
    setNotice(null);
    if (!siteUrl.trim() || !username.trim() || !applicationPassword.trim()) {
      setError("Site URL, username, and application password are required.");
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/wordpress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            siteUrl: siteUrl.trim(),
            username: username.trim(),
            applicationPassword: applicationPassword.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          user?: { name?: string };
        };
        if (!data.ok) {
          setError(data.error || "Could not connect to WordPress.");
          return;
        }
        const next: WordPressConnection = {
          siteUrl: siteUrl.trim(),
          username: username.trim(),
          applicationPassword: applicationPassword.trim(),
          connectedAt: new Date().toISOString(),
          displayName: data.user?.name,
        };
        saveWordPressConnection(next);
        setConnection(next);
        setNotice(
          `Connected${data.user?.name ? ` as ${data.user.name}` : ""}. Auto-publish from Create a Post.`,
        );
      } catch {
        setError("Network error while connecting to WordPress.");
      }
    });
  }

  return (
    <AppShell
      section="Integrations"
      title="WordPress"
      subtitle="Connect self-hosted WordPress with Site URL + username + application password."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect WordPress
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
            <Label htmlFor="wp-url">Site URL</Label>
            <Input
              id="wp-url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://yoursite.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wp-user">Username</Label>
            <Input
              id="wp-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="wp-admin username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wp-pass">Application Password</Label>
            <Input
              id="wp-pass"
              type="password"
              value={applicationPassword}
              onChange={(e) => setApplicationPassword(e.target.value)}
              placeholder="Users → Profile → Application Passwords"
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
                  saveWordPressConnection(null);
                  setConnection(null);
                  setNotice("WordPress disconnected.");
                }}
              >
                Disconnect
              </Button>
            ) : null}
            <Link
              href="/dashboard/support/connect-wordpress-self-hosted"
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
            <li>1. WP Admin → Users → Profile → Application Passwords</li>
            <li>2. Create password named GrowthPilot</li>
            <li>3. Copy username + Settings → General → Site Address</li>
            <li>4. Paste here → Save & Connect</li>
          </ol>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
