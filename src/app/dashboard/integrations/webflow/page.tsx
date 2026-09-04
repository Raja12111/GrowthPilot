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
  loadWebflowConnection,
  saveWebflowConnection,
  type WebflowConnection,
} from "@/lib/webflow-client";
import { cn } from "@/lib/utils";

type SiteOption = { id: string; displayName: string };
type CollectionOption = { id: string; displayName: string; slug?: string };

export default function WebflowAutomationPage() {
  const [apiToken, setApiToken] = useState("");
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [siteId, setSiteId] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [connection, setConnection] = useState<WebflowConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadWebflowConnection();
    if (saved) {
      setConnection(saved);
      setApiToken(saved.apiToken);
      setSiteId(saved.siteId);
      setCollectionId(saved.collectionId);
    }
  }, []);

  function connectToken() {
    setError(null);
    setNotice(null);
    if (!apiToken.trim()) {
      setError("Workspace API token is required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/webflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            apiToken: apiToken.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          sites?: SiteOption[];
        };
        if (!data.ok) {
          setError(data.error || "Could not connect to Webflow.");
          return;
        }

        const nextSites = data.sites || [];
        setSites(nextSites);
        const first = nextSites[0]?.id || "";
        setSiteId(first);
        setCollections([]);
        setCollectionId("");
        setNotice(
          `Token connected. ${nextSites.length} site${nextSites.length === 1 ? "" : "s"} found — pick site + CMS collection, then save.`,
        );

        if (first) {
          await loadCollections(apiToken.trim(), first);
        }
      } catch {
        setError("Network error while connecting to Webflow.");
      }
    });
  }

  async function loadCollections(token: string, nextSiteId: string) {
    const response = await fetch("/api/webflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "collections",
        apiToken: token,
        siteId: nextSiteId,
      }),
    });
    const data = (await response.json()) as {
      ok: boolean;
      error?: string;
      collections?: CollectionOption[];
    };
    if (!data.ok) {
      setError(data.error || "Could not load CMS collections.");
      return;
    }
    const nextCollections = data.collections || [];
    setCollections(nextCollections);
    setCollectionId(nextCollections[0]?.id || "");
  }

  function onSiteChange(nextSiteId: string) {
    setSiteId(nextSiteId);
    setCollectionId("");
    setCollections([]);
    if (!apiToken.trim() || !nextSiteId) return;
    startTransition(async () => {
      try {
        await loadCollections(apiToken.trim(), nextSiteId);
      } catch {
        setError("Could not load CMS collections.");
      }
    });
  }

  function saveConnection() {
    setError(null);
    setNotice(null);
    if (!apiToken.trim() || !siteId || !collectionId) {
      setError("API token, site, and CMS collection are required.");
      return;
    }

    const siteName = sites.find((s) => s.id === siteId)?.displayName;
    const collectionName = collections.find(
      (c) => c.id === collectionId,
    )?.displayName;

    const next: WebflowConnection = {
      apiToken: apiToken.trim(),
      siteId,
      siteName,
      collectionId,
      collectionName,
      connectedAt: new Date().toISOString(),
    };
    saveWebflowConnection(next);
    setConnection(next);
    setNotice(
      `Connected to ${siteName || "site"} / ${collectionName || "collection"}. Auto-publish from Create a Post or Queue.`,
    );
  }

  function disconnectWebflow() {
    saveWebflowConnection(null);
    setConnection(null);
    setNotice("Webflow disconnected.");
  }

  return (
    <AppShell
      section="Integrations"
      title="Webflow"
      subtitle="Connect Webflow like SoMePoster — paste your API token, choose a CMS collection, then auto-publish posts."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect Webflow
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
            <Label htmlFor="wf-token">Workspace API token</Label>
            <Input
              id="wf-token"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Paste token from Webflow Apps & Integrations"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
            />
          </div>

          <Button
            disabled={isPending}
            onClick={connectToken}
            variant="outline"
            className="w-full border-[#1e3a5f]/25"
          >
            {isPending ? "Connecting…" : "Connect Webflow"}
          </Button>

          {sites.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="wf-site">Site</Label>
              <select
                id="wf-site"
                value={siteId}
                onChange={(e) => onSiteChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2.5 text-sm text-[#1c1f26] outline-none focus:border-[#1e3a5f] focus:ring-3 focus:ring-[#1e3a5f]/20"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.displayName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {collections.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="wf-collection">CMS collection</Label>
              <select
                id="wf-collection"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-2.5 text-sm text-[#1c1f26] outline-none focus:border-[#1e3a5f] focus:ring-3 focus:ring-[#1e3a5f]/20"
              >
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.displayName}
                    {collection.slug ? ` (${collection.slug})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {notice ? <p className="text-sm text-[#1e3a5f]">{notice}</p> : null}
          {connection?.collectionName ? (
            <p className="text-sm text-[#5c6578]">
              Active:{" "}
              <span className="font-medium text-[#1c1f26]">
                {connection.siteName || "Site"} / {connection.collectionName}
              </span>
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              disabled={isPending || !siteId || !collectionId}
              onClick={saveConnection}
              className="flex-1 bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
            >
              Save & Connect
            </Button>
            {connection ? (
              <Button
                variant="outline"
                className="flex-1 border-[#1e3a5f]/25"
                onClick={disconnectWebflow}
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
              <span className="font-medium text-[#1c1f26]">1.</span> In Webflow,
              open <strong>Site Settings → Apps and Permissions → Apps &amp;
              Integrations</strong>.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">2.</span> Scroll to{" "}
              <strong>API Keys</strong> and click{" "}
              <strong>Generate API token</strong>.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">3.</span> Name it
              GrowthPilot. Set <strong>Read and write</strong> for{" "}
              <strong>Assets</strong>, <strong>Sites</strong>, and{" "}
              <strong>CMS</strong>.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">4.</span> Click{" "}
              <strong>Generate token</strong> and copy it.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">5.</span> Paste the
              token here, click <strong>Connect Webflow</strong>, choose your
              blog CMS collection, then <strong>Save &amp; Connect</strong>.
            </li>
          </ol>
          <p className="rounded-xl bg-[#e8eef7] px-3 py-2 text-xs leading-relaxed text-[#1e3a5f]">
            Your CMS collection needs at least <strong>Name</strong> and{" "}
            <strong>Slug</strong>. GrowthPilot also fills common body fields
            like <code className="rounded bg-white px-1">post-body</code>,{" "}
            <code className="rounded bg-white px-1">body</code>, or{" "}
            <code className="rounded bg-white px-1">content</code>.
          </p>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
