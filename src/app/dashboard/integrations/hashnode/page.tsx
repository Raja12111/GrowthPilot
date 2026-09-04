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
  loadHashnodeConnection,
  saveHashnodeConnection,
  type HashnodeConnection,
} from "@/lib/hashnode-client";
import { cn } from "@/lib/utils";

type PublicationOption = {
  id: string;
  title?: string;
  url?: string;
};

export default function HashnodeIntegrationPage() {
  const [accessToken, setAccessToken] = useState("");
  const [publicationId, setPublicationId] = useState("");
  const [publications, setPublications] = useState<PublicationOption[]>([]);
  const [connection, setConnection] = useState<HashnodeConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadHashnodeConnection();
    if (saved) {
      setConnection(saved);
      setAccessToken(saved.accessToken);
      setPublicationId(saved.publicationId);
      if (saved.publicationId) {
        setPublications([
          {
            id: saved.publicationId,
            title: saved.publicationTitle,
            url: saved.publicationUrl,
          },
        ]);
      }
    }
  }, []);

  function connectHashnode() {
    setError(null);
    setNotice(null);
    if (!accessToken.trim()) {
      setError("Hashnode Personal Access Token is required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/hashnode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            accessToken: accessToken.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          user?: {
            username?: string;
            name?: string;
            publications?: PublicationOption[];
          };
        };

        if (!data.ok || !data.user?.publications?.length) {
          setError(data.error || "Could not connect to Hashnode.");
          return;
        }

        const pubs = data.user.publications;
        setPublications(pubs);

        const selected =
          pubs.find((item) => item.id === publicationId) || pubs[0];
        if (!selected) {
          setError("No Hashnode publication available.");
          return;
        }

        setPublicationId(selected.id);
        const next: HashnodeConnection = {
          accessToken: accessToken.trim(),
          publicationId: selected.id,
          publicationTitle: selected.title,
          publicationUrl: selected.url,
          username: data.user.username,
          name: data.user.name,
          connectedAt: new Date().toISOString(),
        };
        saveHashnodeConnection(next);
        setConnection(next);
        setNotice(
          `Connected${data.user.username ? ` as @${data.user.username}` : ""}${
            selected.title ? ` → ${selected.title}` : ""
          }. You can auto-publish from Create a Post or Queue.`,
        );
      } catch {
        setError("Network error while connecting to Hashnode.");
      }
    });
  }

  function saveSelectedPublication() {
    setError(null);
    setNotice(null);
    if (!connection || !publicationId.trim()) {
      setError("Connect with a token first, then choose a publication.");
      return;
    }
    const selected =
      publications.find((item) => item.id === publicationId) ||
      publications[0];
    if (!selected) {
      setError("Choose a publication.");
      return;
    }
    const next: HashnodeConnection = {
      ...connection,
      publicationId: selected.id,
      publicationTitle: selected.title,
      publicationUrl: selected.url,
      connectedAt: new Date().toISOString(),
    };
    saveHashnodeConnection(next);
    setConnection(next);
    setNotice(`Publication set to ${selected.title || selected.id}.`);
  }

  function disconnectHashnode() {
    saveHashnodeConnection(null);
    setConnection(null);
    setPublications([]);
    setPublicationId("");
    setNotice("Hashnode disconnected.");
  }

  return (
    <AppShell
      section="Integrations"
      title="Hashnode"
      subtitle="Connect Hashnode with a Personal Access Token, pick your publication, then auto-publish articles from Create a Post."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect Hashnode
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
            <Label htmlFor="hashnode-token">Personal Access Token</Label>
            <Input
              id="hashnode-token"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Paste token from Hashnode → Settings → Developer"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
            />
          </div>

          {publications.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="hashnode-pub">Publication</Label>
              <select
                id="hashnode-pub"
                value={publicationId}
                onChange={(e) => setPublicationId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-[#d8dee8] bg-white px-3 text-sm text-[#1c1f26] outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25"
              >
                {publications.map((pub) => (
                  <option key={pub.id} value={pub.id}>
                    {pub.title || pub.id}
                    {pub.url ? ` — ${pub.url}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {connection?.username ? (
            <p className="text-sm text-[#5c6578]">
              Signed in as{" "}
              <span className="font-medium text-[#1c1f26]">
                @{connection.username}
              </span>
              {connection.publicationTitle
                ? ` · ${connection.publicationTitle}`
                : ""}
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
              onClick={connectHashnode}
              className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
            >
              {isPending ? "Connecting…" : "Save & Connect"}
            </Button>
            {connection && publications.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={saveSelectedPublication}
                className="border-[#1e3a5f]/25"
              >
                Save publication
              </Button>
            ) : null}
            {connection ? (
              <Button
                type="button"
                variant="outline"
                onClick={disconnectHashnode}
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
              <span className="font-medium text-[#1c1f26]">1.</span> Open{" "}
              <a
                href="https://hashnode.com/settings/developer"
                target="_blank"
                rel="noreferrer"
                className="text-[#1e3a5f] underline"
              >
                Hashnode → Settings → Developer
              </a>{" "}
              and generate a Personal Access Token.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">2.</span> Paste the
              token here and click <strong>Save & Connect</strong>. GrowthPilot
              loads your publications automatically.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">3.</span> Pick the
              blog/publication to publish into, then use Create a Post with
              Hashnode selected.
            </li>
          </ol>
          <p className="text-xs text-[#5c6578]">
            Hashnode&apos;s GraphQL API is used (`gql.hashnode.com`). Publishing
            via API may require an active Hashnode Pro plan on the target
            publication.
          </p>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
