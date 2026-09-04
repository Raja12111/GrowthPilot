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
  loadInstantlyConnection,
  saveInstantlyConnection,
  type InstantlyConnection,
} from "@/lib/instantly-client";
import { cn } from "@/lib/utils";

export default function InstantlyIntegrationPage() {
  const [apiKey, setApiKey] = useState("");
  const [connection, setConnection] = useState<InstantlyConnection | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadInstantlyConnection();
    if (saved) {
      setConnection(saved);
      setApiKey(saved.apiKey);
    }
  }, []);

  function connectInstantly() {
    setError(null);
    setNotice(null);
    if (!apiKey.trim()) {
      setError("Instantly API v2 key is required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/instantly", {
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
          workspace?: {
            workspaceName?: string;
            workspaceId?: string;
            campaignCount?: number;
          };
        };

        if (!data.ok) {
          setError(data.error || "Could not connect to Instantly.");
          return;
        }

        const next: InstantlyConnection = {
          apiKey: apiKey.trim(),
          workspaceName: data.workspace?.workspaceName,
          workspaceId: data.workspace?.workspaceId,
          connectedAt: new Date().toISOString(),
        };
        saveInstantlyConnection(next);
        setConnection(next);
        const count = data.workspace?.campaignCount;
        setNotice(
          `Connected${
            data.workspace?.workspaceName
              ? ` to ${data.workspace.workspaceName}`
              : ""
          }${typeof count === "number" ? ` · ${count} campaign${count === 1 ? "" : "s"}` : ""}.`,
        );
      } catch {
        setError("Network error while connecting to Instantly.");
      }
    });
  }

  function disconnectInstantly() {
    saveInstantlyConnection(null);
    setConnection(null);
    setNotice("Instantly disconnected.");
  }

  return (
    <AppShell
      section="Integrations"
      title="Instantly"
      subtitle="Connect Instantly API v2, then list campaigns, add leads, and start or pause sending."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect Instantly
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
            <Label htmlFor="instantly-key">API v2 key</Label>
            <Input
              id="instantly-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste Bearer token from Instantly → Settings → API"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
            />
          </div>

          {connection?.workspaceName ? (
            <p className="text-sm text-[#5c6578]">
              Workspace{" "}
              <span className="font-medium text-[#1c1f26]">
                {connection.workspaceName}
              </span>
              .
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

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              disabled={isPending}
              onClick={connectInstantly}
              className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
            >
              {isPending ? "Connecting…" : "Save & Connect"}
            </Button>
            {connection ? (
              <Button
                type="button"
                variant="outline"
                onClick={disconnectInstantly}
                className="border-[#1e3a5f]/25"
              >
                Disconnect
              </Button>
            ) : null}
            <Link
              href="/dashboard/instantly"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-[#1e3a5f]/25",
              )}
            >
              Open campaigns
            </Link>
          </div>
        </SoftPanel>

        <SoftPanel className="space-y-4">
          <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            How to connect
          </h2>
          <ol className="space-y-3 text-sm leading-relaxed text-[#5c6578]">
            <li>
              <span className="font-medium text-[#1c1f26]">1.</span> In Instantly
              open{" "}
              <a
                href="https://app.instantly.ai"
                target="_blank"
                rel="noreferrer"
                className="text-[#1e3a5f] underline"
              >
                Settings → Integrations → API
              </a>{" "}
              and create an <strong>API v2</strong> key (v1 keys will not work).
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">2.</span> Give the key
              scopes for <strong>campaigns</strong> and <strong>leads</strong>{" "}
              (and <strong>workspaces:read</strong> if you want the workspace
              name).
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">3.</span> Paste it
              here, click <strong>Save & Connect</strong>, then manage campaigns
              from Instantly Email.
            </li>
          </ol>
          <p className="text-xs text-[#5c6578]">
            Instantly is outbound email (sequences + leads), not a newsletter
            blast and not a Create a Post publisher.
          </p>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
