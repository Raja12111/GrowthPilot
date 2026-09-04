"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, SoftPanel } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  loadPlatforms,
  loadPosts,
  platformLabel,
  savePosts,
  type ParasitePost,
  type Platform,
} from "@/lib/parasite-data";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "Published" | "Queued" | "Draft";

const LIVE_LINKS: {
  key: keyof ParasitePost;
  label: string;
}[] = [
  { key: "ghostUrl", label: "Ghost" },
  { key: "telegramUrl", label: "Telegram" },
  { key: "webflowUrl", label: "Webflow" },
  { key: "livejournalUrl", label: "LiveJournal" },
  { key: "threadsUrl", label: "Threads" },
  { key: "devtoUrl", label: "DEV.to" },
  { key: "hashnodeUrl", label: "Hashnode" },
  { key: "blueskyUrl", label: "Bluesky" },
  { key: "wordpressUrl", label: "WordPress" },
  { key: "mediumUrl", label: "Medium" },
  { key: "tumblrUrl", label: "Tumblr" },
  { key: "mastodonUrl", label: "Mastodon" },
];

const ERROR_KEYS: (keyof ParasitePost)[] = [
  "ghostError",
  "telegramError",
  "webflowError",
  "livejournalError",
  "threadsError",
  "devtoError",
  "hashnodeError",
  "blueskyError",
  "wordpressError",
  "mediumError",
  "tumblrError",
  "mastodonError",
];

function postSortTime(post: ParasitePost) {
  return new Date(post.publishedAt || post.createdAt).getTime();
}

function statusBadgeClass(status: ParasitePost["status"]) {
  if (status === "Published") return "bg-[#dce8f8] text-[#1e3a5f]";
  if (status === "Queued") return "bg-[#eef1f6] text-[#3d4658]";
  return "bg-[#f3efe8] text-[#6b5a3e]";
}

function dayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<ParasitePost[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    setPosts(loadPosts());
    setPlatforms(loadPlatforms());
  }, []);

  const counts = useMemo(() => {
    const published = posts.filter((p) => p.status === "Published").length;
    const queued = posts.filter((p) => p.status === "Queued").length;
    const drafts = posts.filter((p) => p.status === "Draft").length;
    const notPublished = queued + drafts;
    return {
      total: posts.length,
      published,
      queued,
      drafts,
      notPublished,
    };
  }, [posts]);

  const filtered = useMemo(() => {
    const list =
      filter === "all" ? posts : posts.filter((p) => p.status === filter);
    return [...list].sort((a, b) => postSortTime(b) - postSortTime(a));
  }, [posts, filter]);

  const groups = useMemo(() => {
    const map = new Map<string, ParasitePost[]>();
    for (const post of filtered) {
      const key = dayKey(post.publishedAt || post.createdAt);
      const bucket = map.get(key) || [];
      bucket.push(post);
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function removePost(id: string) {
    setPosts((prev) => {
      const next = prev.filter((post) => post.id !== id);
      savePosts(next);
      return next;
    });
  }

  const filters: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.total },
    { id: "Published", label: "Published", count: counts.published },
    { id: "Queued", label: "Queued", count: counts.queued },
    { id: "Draft", label: "Drafts", count: counts.drafts },
  ];

  return (
    <AppShell
      title="History"
      subtitle="Timeline of every post — see what published and what is still waiting."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SoftPanel className="space-y-1">
          <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
            Total posts
          </p>
          <p className="font-[family-name:var(--font-instrument)] text-3xl text-[#1e3a5f]">
            {counts.total}
          </p>
        </SoftPanel>
        <SoftPanel className="space-y-1">
          <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
            Published
          </p>
          <p className="font-[family-name:var(--font-instrument)] text-3xl text-[#1e3a5f]">
            {counts.published}
          </p>
          <p className="text-xs text-[#5c6578]">
            {counts.total
              ? `${Math.round((counts.published / counts.total) * 100)}% of all posts`
              : "No posts yet"}
          </p>
        </SoftPanel>
        <SoftPanel className="space-y-1">
          <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
            Not published
          </p>
          <p className="font-[family-name:var(--font-instrument)] text-3xl text-[#1e3a5f]">
            {counts.notPublished}
          </p>
          <p className="text-xs text-[#5c6578]">
            {counts.queued} queued · {counts.drafts} draft
            {counts.drafts === 1 ? "" : "s"}
          </p>
        </SoftPanel>
        <SoftPanel className="space-y-1">
          <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
            Publish rate
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef1f6]">
            <div
              className="h-full rounded-full bg-[#1e3a5f] transition-all duration-500"
              style={{
                width: `${counts.total ? (counts.published / counts.total) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="pt-1 text-xs text-[#5c6578]">
            {counts.published} live / {counts.notPublished} pending
          </p>
        </SoftPanel>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              filter === item.id
                ? "bg-[#1e3a5f] text-white"
                : "bg-white text-[#5c6578] ring-1 ring-[#1e3a5f]/15 hover:bg-[#eef1f6]",
            )}
          >
            {item.label}
            <span className="ml-1.5 opacity-70">{item.count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            counts.total === 0 ? "No history yet" : "Nothing in this filter"
          }
          description={
            counts.total === 0
              ? "Create and publish posts to build a timeline of what went live."
              : "Try another status filter, or clear the filter to see everything."
          }
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
        <div className="space-y-8">
          {groups.map(([day, dayPosts]) => (
            <section key={day} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-[#5c6578]">
                  {day}
                </h2>
                <div className="h-px flex-1 bg-[#1e3a5f]/15" />
                <span className="text-xs text-[#5c6578]">
                  {dayPosts.length} post{dayPosts.length === 1 ? "" : "s"}
                </span>
              </div>

              <ol className="relative space-y-3 border-l border-[#1e3a5f]/20 pl-5">
                {dayPosts.map((post) => {
                  const when = new Date(post.publishedAt || post.createdAt);
                  const links = LIVE_LINKS.filter((item) => {
                    const value = post[item.key];
                    return typeof value === "string" && value.trim();
                  });
                  const errors = ERROR_KEYS.map((key) => post[key]).filter(
                    (value): value is string =>
                      typeof value === "string" && Boolean(value.trim()),
                  );

                  return (
                    <li key={post.id} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[1.41rem] top-4 size-2.5 rounded-full ring-4 ring-[#f7f8fa]",
                          post.status === "Published"
                            ? "bg-[#1e3a5f]"
                            : "bg-[#9aa3b2]",
                        )}
                        aria-hidden
                      />
                      <SoftPanel className="space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-[#1c1f26]">
                                {post.title}
                              </p>
                              <Badge
                                className={cn(
                                  "border-0",
                                  statusBadgeClass(post.status),
                                )}
                              >
                                {post.status === "Published"
                                  ? "Published"
                                  : post.status === "Queued"
                                    ? "Not published · Queued"
                                    : "Not published · Draft"}
                              </Badge>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-[#5c6578]">
                              {post.body}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs text-[#5c6578]">
                            {Number.isNaN(when.getTime())
                              ? ""
                              : when.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                          </p>
                        </div>

                        <p className="text-xs text-[#5c6578]">
                          {post.platforms.length
                            ? post.platforms
                                .map((id) => platformLabel(id, platforms))
                                .join(" · ")
                            : "No platforms selected"}
                          {post.targetUrl ? ` · ${post.targetUrl}` : ""}
                        </p>

                        {links.length > 0 ? (
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {links.map((item) => (
                              <a
                                key={String(item.key)}
                                href={String(post[item.key])}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-[#1e3a5f] underline"
                              >
                                View on {item.label}
                              </a>
                            ))}
                          </div>
                        ) : null}

                        {errors.length > 0 ? (
                          <div className="space-y-1">
                            {errors.map((message) => (
                              <p
                                key={message}
                                className="text-xs text-red-700"
                              >
                                {message}
                              </p>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          {post.status !== "Published" ? (
                            <Link
                              href="/dashboard/parasite-posting/queue"
                              className={cn(
                                buttonVariants({
                                  size: "sm",
                                  variant: "outline",
                                }),
                                "border-[#1e3a5f]/25",
                              )}
                            >
                              Open Queue
                            </Link>
                          ) : (
                            <Link
                              href="/dashboard/parasite-posting/published"
                              className={cn(
                                buttonVariants({
                                  size: "sm",
                                  variant: "outline",
                                }),
                                "border-[#1e3a5f]/25",
                              )}
                            >
                              Open Published
                            </Link>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removePost(post.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </SoftPanel>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
