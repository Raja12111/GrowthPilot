"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SoftPanel } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { loadGhostConnection } from "@/lib/ghost-client";
import { loadBlueskyConnection } from "@/lib/bluesky-client";
import { loadDevtoConnection } from "@/lib/devto-client";
import { loadHashnodeConnection } from "@/lib/hashnode-client";
import { loadInstantlyConnection } from "@/lib/instantly-client";
import { loadMastodonConnection } from "@/lib/mastodon-client";
import { loadMediumConnection } from "@/lib/medium-client";
import { loadOpenAiConnection } from "@/lib/openai-client";
import { loadTumblrConnection } from "@/lib/tumblr-client";
import { loadWordPressConnection } from "@/lib/wordpress-client";
import { loadLiveJournalConnection } from "@/lib/livejournal-client";
import { loadTelegramConnection } from "@/lib/telegram-client";
import { loadThreadsConnection } from "@/lib/threads-client";
import { loadWebflowConnection } from "@/lib/webflow-client";
import {
  builtInIntegrations,
  createCustomIntegration,
  loadCustomIntegrations,
  saveCustomIntegrations,
  type CustomIntegration,
} from "@/lib/integrations";
import {
  CHECKLIST_INTEGRATION_IDS,
  loadChecklistIntegrations,
  type ChecklistIntegrationId,
} from "@/lib/social-integrations";
import { cn } from "@/lib/utils";

type LiveStatus = {
  ghost: boolean;
  telegram: boolean;
  webflow: boolean;
  livejournal: boolean;
  threads: boolean;
  devto: boolean;
  hashnode: boolean;
  instantly: boolean;
  bluesky: boolean;
  wordpress: boolean;
  medium: boolean;
  openai: boolean;
  tumblr: boolean;
  mastodon: boolean;
  checklist: Record<ChecklistIntegrationId, boolean>;
};

export default function IntegrationsFolderPage() {
  const [status, setStatus] = useState<LiveStatus>({
    ghost: false,
    telegram: false,
    webflow: false,
    livejournal: false,
    threads: false,
    devto: false,
    hashnode: false,
    instantly: false,
    bluesky: false,
    wordpress: false,
    medium: false,
    openai: false,
    tumblr: false,
    mastodon: false,
    checklist: Object.fromEntries(
      CHECKLIST_INTEGRATION_IDS.map((id) => [id, false]),
    ) as Record<ChecklistIntegrationId, boolean>,
  });
  const [custom, setCustom] = useState<CustomIntegration[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Social Media");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCustom(loadCustomIntegrations());
    const ghost = Boolean(loadGhostConnection());
    const telegram = Boolean(loadTelegramConnection());
    const webflow = Boolean(loadWebflowConnection());
    const livejournal = Boolean(loadLiveJournalConnection());
    const threads = Boolean(loadThreadsConnection());
    const devto = Boolean(loadDevtoConnection());
    const hashnode = Boolean(loadHashnodeConnection());
    const instantly = Boolean(loadInstantlyConnection());
    const bluesky = Boolean(loadBlueskyConnection());
    const wordpress = Boolean(loadWordPressConnection());
    const mediumToken = Boolean(loadMediumConnection());
    const openai = Boolean(loadOpenAiConnection());
    const tumblr = Boolean(loadTumblrConnection());
    const mastodon = Boolean(loadMastodonConnection());
    const checklist = loadChecklistIntegrations();
    setStatus((prev) => ({
      ...prev,
      ghost,
      telegram,
      webflow,
      livejournal,
      threads,
      devto,
      hashnode,
      instantly,
      bluesky,
      wordpress,
      medium: mediumToken || Boolean(checklist.medium),
      openai,
      tumblr,
      mastodon,
      checklist,
    }));
  }, []);

  const connectedCount = builtInIntegrations.filter((item) =>
    builtInReady(item.id),
  ).length;

  function addCustom() {
    setError(null);
    if (!name.trim()) {
      setError("Give the integration a name.");
      return;
    }
    const next = [
      createCustomIntegration({ name, category, notes, url }),
      ...custom,
    ];
    setCustom(next);
    saveCustomIntegrations(next);
    setName("");
    setCategory("Social Media");
    setNotes("");
    setUrl("");
  }

  function removeCustom(id: string) {
    const next = custom.filter((item) => item.id !== id);
    setCustom(next);
    saveCustomIntegrations(next);
  }

  function builtInReady(id: string) {
    if (id === "ghost") return status.ghost;
    if (id === "telegram") return status.telegram;
    if (id === "webflow") return status.webflow;
    if (id === "livejournal") return status.livejournal;
    if (id === "threads") return status.threads;
    if (id === "devto") return status.devto;
    if (id === "hashnode") return status.hashnode;
    if (id === "instantly") return status.instantly;
    if (id === "bluesky") return status.bluesky;
    if (id === "wordpress") return status.wordpress;
    if (id === "medium") return status.medium;
    if (id === "openai") return status.openai;
    if (id === "tumblr") return status.tumblr;
    if (id === "mastodon") return status.mastodon;
    if ((CHECKLIST_INTEGRATION_IDS as readonly string[]).includes(id)) {
      return Boolean(status.checklist[id as ChecklistIntegrationId]);
    }
    return false;
  }

  return (
    <AppShell
      section="Integrations"
      title="Integrations"
      subtitle="One place for every platform. Connect each account to GrowthPilot, then use it from Create a Post."
    >
      <SoftPanel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#1c1f26]">
            GrowthPilot connection status
          </p>
          <p className="mt-1 text-sm text-[#5c6578]">
            {connectedCount} of {builtInIntegrations.length} platforms connected
            to GrowthPilot.
          </p>
        </div>
        <Badge
          className={cn(
            "w-fit border-0",
            connectedCount > 0
              ? "bg-[#dcfce7] text-[#15803d]"
              : "bg-[#eef1f6] text-[#5c6578]",
          )}
        >
          {connectedCount > 0 ? "Accounts linked" : "No accounts linked"}
        </Badge>
      </SoftPanel>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            Platforms
          </h2>
          <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
            {builtInIntegrations.length} available
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {builtInIntegrations.map((item, index) => {
            const ready = builtInReady(item.id);
            return (
              <SoftPanel
                key={item.id}
                className={cn(
                  "flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-0.5",
                  index % 2 === 0 ? "delay-0" : "delay-75",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
                      {item.category}
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-instrument)] text-xl text-[#1e3a5f]">
                      {item.name}
                    </h3>
                  </div>
                  <Badge
                    className={cn(
                      "border-0",
                      ready
                        ? "bg-[#dcfce7] text-[#15803d]"
                        : "bg-[#eef1f6] text-[#5c6578]",
                    )}
                  >
                    {ready ? "Connected to GrowthPilot" : "Not connected"}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-[#5c6578]">
                  {item.description}
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {ready ? (
                    <>
                      <span className="inline-flex h-8 items-center rounded-lg bg-[#16a34a] px-3 text-sm font-medium text-white">
                        Connected
                      </span>
                      <Link
                        href={item.href}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "border-[#1e3a5f]/25",
                        )}
                      >
                        Manage
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        buttonVariants(),
                        "bg-[#1e3a5f] text-white hover:bg-[#162d4a]",
                      )}
                    >
                      Connect to GrowthPilot
                    </Link>
                  )}
                </div>
              </SoftPanel>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            Your folder
          </h2>
          <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
            {custom.length} saved
          </p>
        </div>

        {custom.length === 0 ? (
          <SoftPanel>
            <p className="font-[family-name:var(--font-instrument)] text-xl text-[#1e3a5f]">
              Empty folder
            </p>
            <p className="mt-1 text-sm text-[#5c6578]">
              Add partner APIs, webhooks, or credentials notes below. They stay
              in this browser.
            </p>
          </SoftPanel>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {custom.map((item) => (
              <SoftPanel key={item.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
                      {item.category}
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-instrument)] text-xl text-[#1e3a5f]">
                      {item.name}
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 text-[#7a3e2e] hover:bg-[#f8ece8] hover:text-[#7a3e2e]"
                    onClick={() => removeCustom(item.id)}
                  >
                    Remove
                  </Button>
                </div>
                {item.notes ? (
                  <p className="text-sm leading-relaxed text-[#5c6578]">
                    {item.notes}
                  </p>
                ) : null}
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[#1e3a5f] underline underline-offset-2"
                  >
                    {item.url}
                  </a>
                ) : null}
              </SoftPanel>
            ))}
          </div>
        )}
      </div>

      <SoftPanel className="space-y-4">
        <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
          Add to folder
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="int-name">Name</Label>
            <Input
              id="int-name"
              placeholder="Webflow, Notion, Slack…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="int-category">Category</Label>
            <Input
              id="int-category"
              placeholder="Custom"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="int-url">Docs or dashboard URL (optional)</Label>
          <Input
            id="int-url"
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="int-notes">Notes</Label>
          <Textarea
            id="int-notes"
            placeholder="Where the API key lives, webhook URL, account email…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-24"
          />
        </div>
        {error ? (
          <p className="rounded-xl bg-[#f8ece8] px-3 py-2 text-sm text-[#7a3e2e]">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          onClick={addCustom}
          className="bg-[#1e3a5f] text-white hover:bg-[#162c48]"
        >
          Save integration
        </Button>
      </SoftPanel>
    </AppShell>
  );
}
