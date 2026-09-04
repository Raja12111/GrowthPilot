"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, SoftPanel } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { loadGhostConnection } from "@/lib/ghost-client";
import { loadDevtoConnection } from "@/lib/devto-client";
import { loadHashnodeConnection } from "@/lib/hashnode-client";
import { loadLiveJournalConnection } from "@/lib/livejournal-client";
import { loadMediumConnection } from "@/lib/medium-client";
import { loadTelegramConnection } from "@/lib/telegram-client";
import { loadThreadsConnection } from "@/lib/threads-client";
import { loadTumblrConnection } from "@/lib/tumblr-client";
import { loadWebflowConnection } from "@/lib/webflow-client";
import {
  loadPlatforms,
  loadPosts,
  platformLabel,
  savePosts,
  type ParasitePost,
  type Platform,
} from "@/lib/parasite-data";
import { cn } from "@/lib/utils";

export default function QueuePage() {
  const [posts, setPosts] = useState<ParasitePost[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPosts(loadPosts());
    setPlatforms(loadPlatforms());
  }, []);

  const queued = useMemo(
    () =>
      posts.filter(
        (post) => post.status === "Queued" || post.status === "Draft",
      ),
    [posts],
  );

  function persist(next: ParasitePost[]) {
    setPosts(next);
    savePosts(next);
  }

  function updateStatus(id: string, status: ParasitePost["status"]) {
    persist(
      posts.map((post) =>
        post.id === id
          ? {
              ...post,
              status,
              publishedAt:
                status === "Published"
                  ? new Date().toISOString()
                  : post.publishedAt,
            }
          : post,
      ),
    );
  }

  function removePost(id: string) {
    persist(posts.filter((post) => post.id !== id));
  }

  function publishGhost(post: ParasitePost) {
    setError(null);
    const ghost = loadGhostConnection();
    if (!ghost) {
      setError("Connect Ghost first under Ghost Automation.");
      return;
    }

    setBusyId(post.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/ghost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "publish",
            apiUrl: ghost.apiUrl,
            adminApiKey: ghost.adminApiKey,
            title: post.title,
            body: post.body,
            targetUrl: post.targetUrl,
            status: "published",
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          post?: { url?: string };
        };
        if (!data.ok) {
          throw new Error(data.error || "Ghost publish failed.");
        }

        persist(
          posts.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  status: "Published",
                  publishedAt: new Date().toISOString(),
                  ghostUrl: data.post?.url || "",
                  ghostError: undefined,
                  platforms: Array.from(
                    new Set([...item.platforms, "ghost" as const]),
                  ),
                }
              : item,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Ghost publish failed.";
        setError(message);
        persist(
          posts.map((item) =>
            item.id === post.id ? { ...item, ghostError: message } : item,
          ),
        );
      } finally {
        setBusyId(null);
      }
    });
  }

  function publishTelegram(post: ParasitePost) {
    setError(null);
    const telegram = loadTelegramConnection();
    if (!telegram) {
      setError("Connect Telegram first under Telegram Automation.");
      return;
    }

    setBusyId(post.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "publish",
            botToken: telegram.botToken,
            channelId: telegram.channelId,
            title: post.title,
            body: post.body,
            targetUrl: post.targetUrl,
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          post?: { url?: string };
        };
        if (!data.ok) {
          throw new Error(data.error || "Telegram publish failed.");
        }

        persist(
          posts.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  status: "Published",
                  publishedAt: new Date().toISOString(),
                  telegramUrl: data.post?.url || "",
                  telegramError: undefined,
                  platforms: Array.from(
                    new Set([...item.platforms, "telegram" as const]),
                  ),
                }
              : item,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Telegram publish failed.";
        setError(message);
        persist(
          posts.map((item) =>
            item.id === post.id ? { ...item, telegramError: message } : item,
          ),
        );
      } finally {
        setBusyId(null);
      }
    });
  }

  function publishWebflow(post: ParasitePost) {
    setError(null);
    const webflow = loadWebflowConnection();
    if (!webflow) {
      setError("Connect Webflow first under Webflow Automation.");
      return;
    }

    setBusyId(post.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/webflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "publish",
            apiToken: webflow.apiToken,
            siteId: webflow.siteId,
            collectionId: webflow.collectionId,
            title: post.title,
            body: post.body,
            targetUrl: post.targetUrl,
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          post?: { url?: string };
        };
        if (!data.ok) {
          throw new Error(data.error || "Webflow publish failed.");
        }

        persist(
          posts.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  status: "Published",
                  publishedAt: new Date().toISOString(),
                  webflowUrl: data.post?.url || "",
                  webflowError: undefined,
                  platforms: Array.from(
                    new Set([...item.platforms, "webflow" as const]),
                  ),
                }
              : item,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Webflow publish failed.";
        setError(message);
        persist(
          posts.map((item) =>
            item.id === post.id ? { ...item, webflowError: message } : item,
          ),
        );
      } finally {
        setBusyId(null);
      }
    });
  }

  function publishLiveJournal(post: ParasitePost) {
    setError(null);
    const livejournal = loadLiveJournalConnection();
    if (!livejournal) {
      setError("Connect LiveJournal first under LiveJournal Automation.");
      return;
    }

    setBusyId(post.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/livejournal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "publish",
            username: livejournal.username,
            password: livejournal.password,
            title: post.title,
            body: post.body,
            targetUrl: post.targetUrl,
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          post?: { url?: string };
        };
        if (!data.ok) {
          throw new Error(data.error || "LiveJournal publish failed.");
        }

        persist(
          posts.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  status: "Published",
                  publishedAt: new Date().toISOString(),
                  livejournalUrl: data.post?.url || "",
                  livejournalError: undefined,
                  platforms: Array.from(
                    new Set([...item.platforms, "livejournal" as const]),
                  ),
                }
              : item,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "LiveJournal publish failed.";
        setError(message);
        persist(
          posts.map((item) =>
            item.id === post.id
              ? { ...item, livejournalError: message }
              : item,
          ),
        );
      } finally {
        setBusyId(null);
      }
    });
  }

  function publishThreads(post: ParasitePost) {
    setError(null);
    const threads = loadThreadsConnection();
    if (!threads) {
      setError("Connect Threads first under Threads Automation.");
      return;
    }

    setBusyId(post.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "publish",
            accessToken: threads.accessToken,
            userId: threads.userId,
            title: post.title,
            body: post.body,
            targetUrl: post.targetUrl,
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          post?: { url?: string };
        };
        if (!data.ok) {
          throw new Error(data.error || "Threads publish failed.");
        }

        persist(
          posts.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  status: "Published",
                  publishedAt: new Date().toISOString(),
                  threadsUrl: data.post?.url || "",
                  threadsError: undefined,
                  platforms: Array.from(
                    new Set([...item.platforms, "threads" as const]),
                  ),
                }
              : item,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Threads publish failed.";
        setError(message);
        persist(
          posts.map((item) =>
            item.id === post.id ? { ...item, threadsError: message } : item,
          ),
        );
      } finally {
        setBusyId(null);
      }
    });
  }

  function publishDevto(post: ParasitePost) {
    setError(null);
    const devto = loadDevtoConnection();
    if (!devto) {
      setError("Connect DEV.to first under Integrations.");
      return;
    }

    setBusyId(post.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/devto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "publish",
            apiKey: devto.apiKey,
            title: post.title,
            body: post.body,
            targetUrl: post.targetUrl,
            published: true,
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          post?: { url?: string };
        };
        if (!data.ok) {
          throw new Error(data.error || "DEV.to publish failed.");
        }

        persist(
          posts.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  status: "Published",
                  publishedAt: new Date().toISOString(),
                  devtoUrl: data.post?.url || "",
                  devtoError: undefined,
                  platforms: Array.from(
                    new Set([...item.platforms, "devto" as const]),
                  ),
                }
              : item,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "DEV.to publish failed.";
        setError(message);
        persist(
          posts.map((item) =>
            item.id === post.id ? { ...item, devtoError: message } : item,
          ),
        );
      } finally {
        setBusyId(null);
      }
    });
  }

  function publishHashnode(post: ParasitePost) {
    setError(null);
    const hashnode = loadHashnodeConnection();
    if (!hashnode) {
      setError("Connect Hashnode first under Integrations.");
      return;
    }

    setBusyId(post.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/hashnode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "publish",
            accessToken: hashnode.accessToken,
            publicationId: hashnode.publicationId,
            title: post.title,
            body: post.body,
            targetUrl: post.targetUrl,
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          post?: { url?: string };
        };
        if (!data.ok) {
          throw new Error(data.error || "Hashnode publish failed.");
        }

        persist(
          posts.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  status: "Published",
                  publishedAt: new Date().toISOString(),
                  hashnodeUrl: data.post?.url || "",
                  hashnodeError: undefined,
                  platforms: Array.from(
                    new Set([...item.platforms, "hashnode" as const]),
                  ),
                }
              : item,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Hashnode publish failed.";
        setError(message);
        persist(
          posts.map((item) =>
            item.id === post.id ? { ...item, hashnodeError: message } : item,
          ),
        );
      } finally {
        setBusyId(null);
      }
    });
  }

  function publishMedium(post: ParasitePost) {
    setError(null);
    const medium = loadMediumConnection();
    if (!medium) {
      setError("Connect Medium first under Integrations.");
      return;
    }

    setBusyId(post.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/medium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "publish",
            integrationToken: medium.integrationToken,
            title: post.title,
            body: post.body,
            targetUrl: post.targetUrl,
            publishStatus: "public",
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          post?: { url?: string };
        };
        if (!data.ok) {
          throw new Error(data.error || "Medium publish failed.");
        }

        persist(
          posts.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  status: "Published",
                  publishedAt: new Date().toISOString(),
                  mediumUrl: data.post?.url || "",
                  mediumError: undefined,
                  platforms: Array.from(
                    new Set([...item.platforms, "medium" as const]),
                  ),
                }
              : item,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Medium publish failed.";
        setError(message);
        persist(
          posts.map((item) =>
            item.id === post.id ? { ...item, mediumError: message } : item,
          ),
        );
      } finally {
        setBusyId(null);
      }
    });
  }

  function publishTumblr(post: ParasitePost) {
    setError(null);
    const tumblr = loadTumblrConnection();
    if (!tumblr) {
      setError("Connect Tumblr first under Integrations.");
      return;
    }

    setBusyId(post.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/tumblr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "publish",
            accessToken: tumblr.accessToken,
            blogIdentifier: tumblr.blogIdentifier,
            title: post.title,
            body: post.body,
            targetUrl: post.targetUrl,
            state: "published",
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          post?: { url?: string };
        };
        if (!data.ok) {
          throw new Error(data.error || "Tumblr publish failed.");
        }

        persist(
          posts.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  status: "Published",
                  publishedAt: new Date().toISOString(),
                  tumblrUrl: data.post?.url || "",
                  tumblrError: undefined,
                  platforms: Array.from(
                    new Set([...item.platforms, "tumblr" as const]),
                  ),
                }
              : item,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Tumblr publish failed.";
        setError(message);
        persist(
          posts.map((item) =>
            item.id === post.id ? { ...item, tumblrError: message } : item,
          ),
        );
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <AppShell
      title="Queue"
      subtitle="Drafts and queued parasite posts. Publish to connected auto platforms when ready."
    >
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {queued.length === 0 ? (
        <EmptyState
          title="Queue is empty"
          description="Create a post and add it to the queue to see it here."
          action={
            <Link
              href="/dashboard/parasite-posting/compose"
              className={cn(
                buttonVariants(),
                "bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]",
              )}
            >
              Create a Post
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {queued.map((post) => (
            <SoftPanel key={post.id} className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-[#1c1f26]">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[#5c6578]">
                    {post.body}
                  </p>
                  {post.targetUrl ? (
                    <p className="mt-1 text-xs text-[#5c6578]">
                      {post.targetUrl}
                    </p>
                  ) : null}
                  {post.ghostError ? (
                    <p className="mt-1 text-xs text-red-700">{post.ghostError}</p>
                  ) : null}
                  {post.telegramError ? (
                    <p className="mt-1 text-xs text-red-700">
                      {post.telegramError}
                    </p>
                  ) : null}
                  {post.webflowError ? (
                    <p className="mt-1 text-xs text-red-700">
                      {post.webflowError}
                    </p>
                  ) : null}
                  {post.livejournalError ? (
                    <p className="mt-1 text-xs text-red-700">
                      {post.livejournalError}
                    </p>
                  ) : null}
                  {post.threadsError ? (
                    <p className="mt-1 text-xs text-red-700">
                      {post.threadsError}
                    </p>
                  ) : null}
                  {post.devtoError ? (
                    <p className="mt-1 text-xs text-red-700">
                      {post.devtoError}
                    </p>
                  ) : null}
                  {post.hashnodeError ? (
                    <p className="mt-1 text-xs text-red-700">
                      {post.hashnodeError}
                    </p>
                  ) : null}
                  {post.mediumError ? (
                    <p className="mt-1 text-xs text-red-700">
                      {post.mediumError}
                    </p>
                  ) : null}
                  {post.tumblrError ? (
                    <p className="mt-1 text-xs text-red-700">
                      {post.tumblrError}
                    </p>
                  ) : null}
                </div>
                <Badge className="border-0 bg-[#e8eef7] text-[#1e3a5f]">
                  {post.status}
                </Badge>
              </div>
              <p className="text-xs text-[#5c6578]">
                {post.platforms
                  .map((id) => platformLabel(id, platforms))
                  .join(" · ")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
                  disabled={isPending && busyId === post.id}
                  onClick={() => publishGhost(post)}
                >
                  {busyId === post.id ? "Publishing…" : "Publish to Ghost"}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
                  disabled={isPending && busyId === post.id}
                  onClick={() => publishTelegram(post)}
                >
                  {busyId === post.id ? "Publishing…" : "Publish to Telegram"}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
                  disabled={isPending && busyId === post.id}
                  onClick={() => publishWebflow(post)}
                >
                  {busyId === post.id ? "Publishing…" : "Publish to Webflow"}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
                  disabled={isPending && busyId === post.id}
                  onClick={() => publishLiveJournal(post)}
                >
                  {busyId === post.id
                    ? "Publishing…"
                    : "Publish to LiveJournal"}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
                  disabled={isPending && busyId === post.id}
                  onClick={() => publishThreads(post)}
                >
                  {busyId === post.id ? "Publishing…" : "Publish to Threads"}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
                  disabled={isPending && busyId === post.id}
                  onClick={() => publishDevto(post)}
                >
                  {busyId === post.id ? "Publishing…" : "Publish to DEV.to"}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
                  disabled={isPending && busyId === post.id}
                  onClick={() => publishHashnode(post)}
                >
                  {busyId === post.id ? "Publishing…" : "Publish to Hashnode"}
                </Button>
                {loadMediumConnection() ? (
                  <Button
                    size="sm"
                    className="bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
                    disabled={isPending && busyId === post.id}
                    onClick={() => publishMedium(post)}
                  >
                    {busyId === post.id ? "Publishing…" : "Publish to Medium"}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  className="bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
                  disabled={isPending && busyId === post.id}
                  onClick={() => publishTumblr(post)}
                >
                  {busyId === post.id ? "Publishing…" : "Publish to Tumblr"}
                </Button>
                {post.status !== "Queued" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#1e3a5f]/25"
                    onClick={() => updateStatus(post.id, "Queued")}
                  >
                    Move to queue
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#1e3a5f]/25"
                  onClick={() => updateStatus(post.id, "Published")}
                >
                  Mark published
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removePost(post.id)}
                >
                  Delete
                </Button>
              </div>
            </SoftPanel>
          ))}
        </div>
      )}
    </AppShell>
  );
}
