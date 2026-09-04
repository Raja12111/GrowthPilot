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
  loadOpenAiConnection,
  saveOpenAiConnection,
  type OpenAiConnection,
} from "@/lib/openai-client";
import { cn } from "@/lib/utils";

export default function OpenAiIntegrationPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [connection, setConnection] = useState<OpenAiConnection | null>(null);
  const [serverConfigured, setServerConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadOpenAiConnection();
    if (saved) {
      setConnection(saved);
      setApiKey(saved.apiKey);
      if (saved.model) setModel(saved.model);
    }
    void fetch("/api/ai")
      .then((r) => r.json())
      .then((data: { configured?: boolean; model?: string }) => {
        setServerConfigured(Boolean(data.configured));
        if (!saved?.model && data.model) setModel(data.model);
      })
      .catch(() => undefined);
  }, []);

  function connectOpenAi() {
    setError(null);
    setNotice(null);
    if (!apiKey.trim()) {
      setError("OpenAI API key is required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            apiKey: apiKey.trim(),
            model: model.trim() || "gpt-4o-mini",
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          model?: string;
          sampleModel?: string | null;
        };

        if (!data.ok) {
          setError(data.error || "Could not connect to OpenAI.");
          return;
        }

        const next: OpenAiConnection = {
          apiKey: apiKey.trim(),
          model: model.trim() || data.model || "gpt-4o-mini",
          connectedAt: new Date().toISOString(),
          sampleModel: data.sampleModel,
        };
        saveOpenAiConnection(next);
        setConnection(next);
        setNotice(
          "OpenAI connected (same Chat Completions API RankBrain X uses). Rewrite and Write on Create a Post will use this key.",
        );
      } catch {
        setError("Network error while connecting to OpenAI.");
      }
    });
  }

  function disconnectOpenAi() {
    saveOpenAiConnection(null);
    setConnection(null);
    setNotice("OpenAI disconnected from this browser.");
  }

  return (
    <AppShell
      section="Integrations"
      title="OpenAI"
      subtitle="Same OpenAI Chat Completions setup as RankBrain X — power Rewrite and Write on Create a Post."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect OpenAI
            </h2>
            <Badge
              className={cn(
                "border-0",
                connection || serverConfigured
                  ? "bg-[#dcfce7] text-[#15803d]"
                : "bg-[#eef1f6] text-[#5c6578]",
              )}
            >
              {connection
                ? "Connected in browser"
                : serverConfigured
                  ? "Server key configured"
                  : "Not connected"}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="openai-key">API key</Label>
            <Input
              id="openai-key"
              type="password"
              autoComplete="off"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="openai-model">Model (optional)</Label>
            <Input
              id="openai-model"
              placeholder="gpt-4o-mini"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <p className="text-xs text-[#5c6578]">
              RankBrain X defaults to <code>gpt-4o-mini</code> via{" "}
              <code>OPENAI_MODEL</code>.
            </p>
          </div>

          {error ? (
            <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-sm text-[#8a1f11]">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="rounded-lg bg-[#e8eef7] px-3 py-2 text-sm text-[#1e3a5f]">
              {notice}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
              disabled={isPending}
              onClick={connectOpenAi}
            >
              {isPending ? "Connecting…" : "Connect to GrowthPilot"}
            </Button>
            {connection ? (
              <Button type="button" variant="outline" onClick={disconnectOpenAi}>
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
          <h3 className="font-medium text-[#1c1f26]">How RankBrain X does it</h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Create a key at{" "}
              <a
                className="text-[#1e3a5f] underline"
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
              >
                platform.openai.com/api-keys
              </a>
              .
            </li>
            <li>
              RankBrain sets server env <code>OPENAI_API_KEY</code> (and optional{" "}
              <code>OPENAI_MODEL</code>) and calls{" "}
              <code>https://api.openai.com/v1/chat/completions</code>.
            </li>
            <li>
              GrowthPilot uses that same endpoint for post Rewrite / Write. Paste
              the key here for local browser use, or set{" "}
              <code>OPENAI_API_KEY</code> on Vercel for a shared server key.
            </li>
          </ol>
          {connection?.connectedAt ? (
            <p className="text-xs">
              Connected {new Date(connection.connectedAt).toLocaleString()}
              {connection.sampleModel
                ? ` · API reachable (${connection.sampleModel})`
                : ""}
            </p>
          ) : null}
        </SoftPanel>
      </div>
    </AppShell>
  );
}
