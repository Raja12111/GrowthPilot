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
  loadMediumConnection,
  saveMediumConnection,
  type MediumConnection,
} from "@/lib/medium-client";
import {
  loadChecklistIntegrations,
  setChecklistIntegration,
} from "@/lib/social-integrations";
import { cn } from "@/lib/utils";

export default function MediumIntegrationPage() {
  const [manualConnected, setManualConnected] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);
  const [integrationToken, setIntegrationToken] = useState("");
  const [connection, setConnection] = useState<MediumConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setManualConnected(Boolean(loadChecklistIntegrations().medium));
    const saved = loadMediumConnection();
    if (saved) {
      setConnection(saved);
      setIntegrationToken(saved.integrationToken);
      setShowLegacy(true);
    }
  }, []);

  const linked = manualConnected || Boolean(connection);

  function connectManual() {
    setChecklistIntegration("medium", true);
    setManualConnected(true);
    setError(null);
    setNotice(
      "Medium marked connected for manual posting. Medium no longer issues new API tokens — publish on Medium, then mark the post published in Queue/History.",
    );
  }

  function disconnectManual() {
    setChecklistIntegration("medium", false);
    setManualConnected(false);
    setNotice("Medium manual connection cleared.");
  }

  function connectLegacyToken() {
    setError(null);
    setNotice(null);
    if (!integrationToken.trim()) {
      setError("Paste a legacy Medium Integration Token (only works if you already had one).");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/medium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            integrationToken: integrationToken.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          user?: {
            id?: string;
            username?: string;
            name?: string;
            url?: string;
          };
        };

        if (!data.ok) {
          setError(
            data.error ||
              "This token is not accepted. Medium no longer issues new Integration Tokens for most accounts.",
          );
          return;
        }

        const next: MediumConnection = {
          integrationToken: integrationToken.trim(),
          connectedAt: new Date().toISOString(),
          userId: data.user?.id,
          username: data.user?.username,
          name: data.user?.name,
          profileUrl: data.user?.url,
        };
        saveMediumConnection(next);
        setConnection(next);
        setChecklistIntegration("medium", true);
        setManualConnected(true);
        setNotice(
          `Legacy token works${data.user?.username ? ` as @${data.user.username}` : ""}. Auto-publish is available for this account only.`,
        );
      } catch {
        setError("Network error while checking the Medium token.");
      }
    });
  }

  function disconnectLegacy() {
    saveMediumConnection(null);
    setConnection(null);
    setNotice("Legacy Medium token removed.");
  }

  return (
    <AppShell
      section="Integrations"
      title="Medium"
      subtitle="Medium closed new Integration Tokens — use manual posting (or a legacy token if you already have one)."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect Medium
            </h2>
            <Badge
              className={cn(
                "border-0",
                linked
                  ? "bg-[#dcfce7] text-[#15803d]"
                  : "bg-[#eef1f6] text-[#5c6578]",
              )}
            >
              {linked ? "Connected to GrowthPilot" : "Not connected"}
            </Badge>
          </div>

          <div className="rounded-xl border border-[#f0d9c8] bg-[#fff7f0] px-4 py-3 text-sm text-[#7a4a28]">
            <p className="font-medium text-[#5c3418]">
              Not available on Medium anymore
            </p>
            <p className="mt-1 leading-relaxed">
              Medium no longer issues new Integration Tokens and does not allow
              new API integrations. Auto-publish via API is unavailable unless
              you already created a token before Medium locked it.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-[#e4e8ef] bg-[#f8fafc] px-4 py-3">
            <p className="text-sm font-medium text-[#1c1f26]">
              Recommended: manual posting
            </p>
            <p className="text-sm text-[#5c6578]">
              Mark Medium connected so you can select it in Create a Post, then
              publish on Medium yourself (or use Medium’s import from URL).
            </p>
            <div className="flex flex-wrap gap-2">
              {manualConnected ? (
                <>
                  <span className="inline-flex h-8 items-center rounded-lg bg-[#16a34a] px-3 text-sm font-medium text-white">
                    Connected
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={disconnectManual}
                    className="border-[#1e3a5f]/25"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
                  onClick={connectManual}
                >
                  Connect manually
                </Button>
              )}
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
          </div>

          <div className="space-y-3">
            <button
              type="button"
              className="text-sm font-medium text-[#1e3a5f] underline"
              onClick={() => setShowLegacy((v) => !v)}
            >
              {showLegacy ? "Hide" : "Show"} legacy Integration Token (advanced)
            </button>

            {showLegacy ? (
              <div className="space-y-3 rounded-xl border border-[#e4e8ef] px-4 py-3">
                <p className="text-xs text-[#5c6578]">
                  Only for accounts that already have an old token. Medium will
                  not create new ones.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="medium-token">Legacy Integration Token</Label>
                  <Input
                    id="medium-token"
                    type="password"
                    value={integrationToken}
                    onChange={(e) => setIntegrationToken(e.target.value)}
                    placeholder="Existing token only"
                    className="bg-white focus-visible:ring-[#1e3a5f]/25"
                  />
                </div>
                {connection?.username ? (
                  <p className="text-sm text-[#5c6578]">
                    Legacy token signed in as{" "}
                    <span className="font-medium text-[#1c1f26]">
                      @{connection.username}
                    </span>
                    .
                  </p>
                ) : null}
                {error ? (
                  <p className="rounded-xl bg-[#f8ece8] px-3 py-2 text-sm text-[#7a3e2e]">
                    {error}
                  </p>
                ) : null}
                {notice && showLegacy ? (
                  <p className="rounded-xl bg-[#dcfce7] px-3 py-2 text-sm text-[#15803d]">
                    {notice}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={connectLegacyToken}
                    className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
                  >
                    {isPending ? "Checking…" : "Save legacy token"}
                  </Button>
                  {connection ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={disconnectLegacy}
                      className="border-[#1e3a5f]/25"
                    >
                      Remove token
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {notice && !showLegacy ? (
            <p className="rounded-xl bg-[#dcfce7] px-3 py-2 text-sm text-[#15803d]">
              {notice}
            </p>
          ) : null}
        </SoftPanel>

        <SoftPanel className="space-y-4">
          <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            What still works
          </h2>
          <ol className="space-y-3 text-sm leading-relaxed text-[#5c6578]">
            <li>
              <span className="font-medium text-[#1c1f26]">1.</span> Write in
              GrowthPilot, copy the draft, and publish on{" "}
              <a
                href="https://medium.com/new-story"
                target="_blank"
                rel="noreferrer"
                className="text-[#1e3a5f] underline"
              >
                Medium’s editor
              </a>
              .
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">2.</span> Or use
              Medium’s{" "}
              <a
                href="https://help.medium.com/hc/en-us/articles/213480228-API-Importing"
                target="_blank"
                rel="noreferrer"
                className="text-[#1e3a5f] underline"
              >
                import from URL
              </a>{" "}
              if your post is already live elsewhere.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">3.</span> Mark the
              post Published in Queue / History after it’s live on Medium.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">4.</span> Prefer
              platforms with open APIs for auto-publish — DEV.to, Hashnode,
              Tumblr, Ghost, WordPress.
            </li>
          </ol>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
