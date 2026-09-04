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
  loadGhostConnection,
  saveGhostConnection,
  type GhostConnection,
} from "@/lib/ghost-client";
import { cn } from "@/lib/utils";

export default function GhostAutomationPage() {
  const [apiUrl, setApiUrl] = useState("");
  const [adminApiKey, setAdminApiKey] = useState("");
  const [connection, setConnection] = useState<GhostConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadGhostConnection();
    if (saved) {
      setConnection(saved);
      setApiUrl(saved.apiUrl);
      setAdminApiKey(saved.adminApiKey);
    }
  }, []);

  function connectGhost() {
    setError(null);
    setNotice(null);
    if (!apiUrl.trim() || !adminApiKey.trim()) {
      setError("Ghost Site URL and Admin API Key are required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ghost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            apiUrl: apiUrl.trim(),
            adminApiKey: adminApiKey.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          site?: { title?: string; url?: string };
        };

        if (!data.ok) {
          setError(data.error || "Could not connect to Ghost.");
          return;
        }

        const next: GhostConnection = {
          apiUrl: apiUrl.trim().replace(/\/$/, ""),
          adminApiKey: adminApiKey.trim(),
          connectedAt: new Date().toISOString(),
          siteTitle: data.site?.title,
        };
        saveGhostConnection(next);
        setConnection(next);
        setNotice(
          `Connected to ${data.site?.title || "Ghost"}. You can auto-publish from Create a Post or Queue.`,
        );
      } catch {
        setError("Network error while connecting to Ghost.");
      }
    });
  }

  function disconnectGhost() {
    saveGhostConnection(null);
    setConnection(null);
    setNotice("Ghost disconnected.");
  }

  return (
    <AppShell
      section="Integrations"
      title="Ghost"
      subtitle="Connect Ghost like SoMePoster — paste Site URL + Admin API Key, then auto-publish parasite posts."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect Ghost
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

          <div className="space-y-1.5">
            <Label htmlFor="ghost-url">Ghost Site URL</Label>
            <Input
              id="ghost-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://your-site.ghost.io"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ghost-key">Admin API Key</Label>
            <Input
              id="ghost-key"
              type="password"
              value={adminApiKey}
              onChange={(e) => setAdminApiKey(e.target.value)}
              placeholder="id:secret from Ghost custom integration"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
            />
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {notice ? <p className="text-sm text-[#1e3a5f]">{notice}</p> : null}
          {connection?.siteTitle ? (
            <p className="text-sm text-[#5c6578]">
              Site: <span className="font-medium text-[#1c1f26]">{connection.siteTitle}</span>
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              disabled={isPending}
              onClick={connectGhost}
              className="flex-1 bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
            >
              {isPending ? "Connecting…" : "Save & Connect"}
            </Button>
            {connection ? (
              <Button
                variant="outline"
                className="flex-1 border-[#1e3a5f]/25"
                onClick={disconnectGhost}
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
            Setup steps
          </h2>
          <ol className="space-y-3 text-sm leading-relaxed text-[#5c6578]">
            <li>
              <span className="font-medium text-[#1c1f26]">1.</span> In Ghost,
              open <strong>Settings → Integrations</strong>.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">2.</span> Click{" "}
              <strong>Add custom integration</strong> and name it GrowthPilot.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">3.</span> Copy the{" "}
              <strong>API URL</strong> into Ghost Site URL.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">4.</span> Copy the{" "}
              <strong>Admin API Key</strong> into the key field.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">5.</span> Click{" "}
              <strong>Save & Connect</strong>, then publish from Create a Post with
              Ghost selected.
            </li>
          </ol>
          <p className="text-xs text-[#5c6578]">
            Flow matches{" "}
            <a
              href="https://someposter.ai/how-to-connect-ghost-to-someposter/"
              target="_blank"
              rel="noreferrer"
              className="text-[#1e3a5f] underline"
            >
              SoMePoster’s Ghost connection guide
            </a>
            .
          </p>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
