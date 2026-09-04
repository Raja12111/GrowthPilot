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

export default function PublishedPage() {
  const [posts, setPosts] = useState<ParasitePost[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    setPosts(loadPosts());
    setPlatforms(loadPlatforms());
  }, []);

  const published = useMemo(
    () => posts.filter((post) => post.status === "Published"),
    [posts],
  );

  function removePost(id: string) {
    setPosts((prev) => {
      const next = prev.filter((post) => post.id !== id);
      savePosts(next);
      return next;
    });
  }

  return (
    <AppShell
      title="Published"
      subtitle="Posts you’ve marked as live on parasite platforms."
    >
      {published.length === 0 ? (
        <EmptyState
          title="Nothing published yet"
          description="When you mark a queued post as published, it will show up here."
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
          {published.map((post) => (
            <SoftPanel key={post.id} className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-[#1c1f26]">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[#5c6578]">
                    {post.body}
                  </p>
                </div>
                <Badge className="border-0 bg-[#e8eef7] text-[#1e3a5f]">
                  Published
                </Badge>
              </div>
              <p className="text-xs text-[#5c6578]">
                {post.platforms
                  .map((id) => platformLabel(id, platforms))
                  .join(" · ")}
                {post.publishedAt
                  ? ` · ${new Date(post.publishedAt).toLocaleString()}`
                  : ""}
              </p>
              {post.ghostUrl ? (
                <a
                  href={post.ghostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1e3a5f] underline"
                >
                  View on Ghost
                </a>
              ) : null}
              {post.telegramUrl ? (
                <a
                  href={post.telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1e3a5f] underline"
                >
                  View on Telegram
                </a>
              ) : null}
              {post.webflowUrl ? (
                <a
                  href={post.webflowUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1e3a5f] underline"
                >
                  View on Webflow
                </a>
              ) : null}
              {post.livejournalUrl ? (
                <a
                  href={post.livejournalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1e3a5f] underline"
                >
                  View on LiveJournal
                </a>
              ) : null}
              {post.threadsUrl ? (
                <a
                  href={post.threadsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1e3a5f] underline"
                >
                  View on Threads
                </a>
              ) : null}
              {post.devtoUrl ? (
                <a
                  href={post.devtoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1e3a5f] underline"
                >
                  View on DEV.to
                </a>
              ) : null}
              {post.hashnodeUrl ? (
                <a
                  href={post.hashnodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1e3a5f] underline"
                >
                  View on Hashnode
                </a>
              ) : null}
              {post.mediumUrl ? (
                <a
                  href={post.mediumUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1e3a5f] underline"
                >
                  View on Medium
                </a>
              ) : null}
              {post.tumblrUrl ? (
                <a
                  href={post.tumblrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1e3a5f] underline"
                >
                  View on Tumblr
                </a>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => removePost(post.id)}>
                Remove
              </Button>
            </SoftPanel>
          ))}
        </div>
      )}
    </AppShell>
  );
}
