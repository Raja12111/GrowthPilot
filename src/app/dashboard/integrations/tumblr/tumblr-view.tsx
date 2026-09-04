"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SoftPanel } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loadTumblrConnection,
  saveTumblrConnection,
  type TumblrBlogOption,
  type TumblrConnection,
} from "@/lib/tumblr-client";
import { cn } from "@/lib/utils";

function readPendingCookie(): (TumblrConnection & {
  blogs?: TumblrBlogOption[];
}) | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("tumblr_pending="))
    ?.slice("tumblr_pending=".length);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as TumblrConnection & {
      blogs?: TumblrBlogOption[];
    };
    document.cookie = "tumblr_pending=; path=/; max-age=0";
    return parsed;
  } catch {
    return null;
  }
}

export default function TumblrIntegrationPage() {
  const searchParams = useSearchParams();
  const [accessToken, setAccessToken] = useState("");
  const [blogIdentifier, setBlogIdentifier] = useState("");
  const [blogs, setBlogs] = useState<TumblrBlogOption[]>([]);
  const [connection, setConnection] = useState<TumblrConnection | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadTumblrConnection();
    if (saved) {
      setConnection(saved);
      setAccessToken(saved.accessToken);
      setBlogIdentifier(saved.blogIdentifier);
      if (saved.blogs?.length) setBlogs(saved.blogs);
    }

    fetch("/api/tumblr")
      .then((r) => r.json())
      .then((data: { oauthConfigured?: boolean }) => {
        setOauthConfigured(Boolean(data.oauthConfigured));
      })
      .catch(() => undefined);

    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    }

    if (searchParams.get("oauth") === "1") {
      const pending = readPendingCookie();
      if (pending?.accessToken) {
        const blogName =
          pending.blogIdentifier ||
          pending.blogName ||
          pending.blogs?.find((b) => b.primary)?.name ||
          pending.blogs?.[0]?.name ||
          "";
        const next: TumblrConnection = {
          accessToken: pending.accessToken,
          refreshToken: pending.refreshToken,
          blogIdentifier: blogName,
          connectedAt: new Date().toISOString(),
          userName: pending.userName,
          blogName: pending.blogName || blogName,
          blogTitle: pending.blogTitle,
          blogUrl: pending.blogUrl,
          blogs: pending.blogs,
        };
        saveTumblrConnection(next);
        setConnection(next);
        setAccessToken(next.accessToken);
        setBlogIdentifier(next.blogIdentifier);
        if (pending.blogs?.length) setBlogs(pending.blogs);
        setNotice(
          `Connected${next.blogTitle || next.blogName ? ` to ${next.blogTitle || next.blogName}` : ""}. Auto-publish from Create a Post or Queue.`,
        );
      }
    }
  }, [searchParams]);

  function connectTumblr() {
    setError(null);
    setNotice(null);
    if (!accessToken.trim() || !blogIdentifier.trim()) {
      setError("Access token and blog name are required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/tumblr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            accessToken: accessToken.trim(),
            blogIdentifier: blogIdentifier.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          account?: {
            name?: string;
            blog?: {
              name?: string;
              title?: string;
              url?: string;
            };
            blogs?: TumblrBlogOption[];
          };
        };

        if (!data.ok) {
          setError(data.error || "Could not connect to Tumblr.");
          return;
        }

        const next: TumblrConnection = {
          accessToken: accessToken.trim(),
          blogIdentifier: data.account?.blog?.name || blogIdentifier.trim(),
          connectedAt: new Date().toISOString(),
          userName: data.account?.name,
          blogName: data.account?.blog?.name,
          blogTitle: data.account?.blog?.title,
          blogUrl: data.account?.blog?.url,
          blogs: data.account?.blogs,
        };
        saveTumblrConnection(next);
        setConnection(next);
        setBlogIdentifier(next.blogIdentifier);
        if (data.account?.blogs?.length) setBlogs(data.account.blogs);
        setNotice(
          `Connected to ${data.account?.blog?.title || data.account?.blog?.name || "Tumblr"}. Auto-publish from Create a Post or Queue.`,
        );
      } catch {
        setError("Network error while connecting to Tumblr.");
      }
    });
  }

  function disconnectTumblr() {
    saveTumblrConnection(null);
    setConnection(null);
    setNotice("Tumblr disconnected.");
  }

  function saveSelectedBlog(name: string) {
    if (!connection) return;
    const blog = blogs.find((item) => item.name === name);
    const next: TumblrConnection = {
      ...connection,
      blogIdentifier: name,
      blogName: name,
      blogTitle: blog?.title,
      blogUrl: blog?.url || `https://${name}.tumblr.com`,
    };
    saveTumblrConnection(next);
    setConnection(next);
    setBlogIdentifier(name);
    setNotice(`Publishing blog set to ${blog?.title || name}.`);
  }

  return (
    <AppShell
      section="Integrations"
      title="Tumblr"
      subtitle="Connect Tumblr with OAuth2 (or paste a token), pick your blog, then auto-publish from Create a Post."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect Tumblr
            </h2>
            <Badge
              className={cn(
                "border-0",
                connection
                  ? "bg-[#dcfce7] text-[#15803d]"
                  : "bg-[#eef1f6] text-[#5c6578]",
              )}
            >
              {connection ? "Connected to GrowthPilot" : "Not connected"}
            </Badge>
          </div>

          {oauthConfigured ? (
            <div className="space-y-2 rounded-xl border border-[#c5d4eb] bg-[#eef3f9] px-4 py-3">
              <p className="text-sm text-[#1e3a5f]">
                Tumblr OAuth app is configured on this server.
              </p>
              <a
                href="/api/tumblr/auth"
                className={cn(
                  buttonVariants(),
                  "inline-flex bg-[#1e3a5f] text-white hover:bg-[#162d4a]",
                )}
              >
                Connect with Tumblr
              </a>
            </div>
          ) : (
            <p className="rounded-xl border border-[#e4e8ef] bg-[#f8fafc] px-3 py-2 text-xs text-[#5c6578]">
              Optional: set <code>TUMBLR_CLIENT_ID</code> +{" "}
              <code>TUMBLR_CLIENT_SECRET</code> on Vercel for one-click OAuth.
              Otherwise paste a token from the API console below.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tumblr-token">OAuth2 access token</Label>
            <Input
              id="tumblr-token"
              type="password"
              autoComplete="off"
              placeholder="Paste token from Tumblr API console"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tumblr-blog">Blog name</Label>
            {blogs.length > 1 ? (
              <select
                id="tumblr-blog"
                value={blogIdentifier}
                onChange={(e) => {
                  setBlogIdentifier(e.target.value);
                  if (connection) saveSelectedBlog(e.target.value);
                }}
                className="flex h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-sm text-[#1c1f26]"
              >
                {blogs.map((blog) => (
                  <option key={blog.name} value={blog.name}>
                    {blog.title || blog.name}
                    {blog.primary ? " (primary)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="tumblr-blog"
                placeholder="myblog or myblog.tumblr.com"
                value={blogIdentifier}
                onChange={(e) => setBlogIdentifier(e.target.value)}
              />
            )}
          </div>

          {error ? (
            <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-sm text-[#8a1f11]">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="rounded-lg bg-[#dcfce7] px-3 py-2 text-sm text-[#15803d]">
              {notice}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
              disabled={isPending}
              onClick={connectTumblr}
            >
              {isPending ? "Connecting…" : "Connect to GrowthPilot"}
            </Button>
            {connection ? (
              <Button type="button" variant="outline" onClick={disconnectTumblr}>
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
          <h3 className="font-medium text-[#1c1f26]">Tumblr integration system</h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Register an app at{" "}
              <a
                className="text-[#1e3a5f] underline"
                href="https://www.tumblr.com/oauth/apps"
                target="_blank"
                rel="noreferrer"
              >
                tumblr.com/oauth/apps
              </a>
              . Add redirect URI{" "}
              <code className="text-xs">…/api/tumblr/callback</code>.
            </li>
            <li>
              For one-click OAuth, set <code>TUMBLR_CLIENT_ID</code> +{" "}
              <code>TUMBLR_CLIENT_SECRET</code> (optional{" "}
              <code>TUMBLR_REDIRECT_URI</code>) on the server.
            </li>
            <li>
              Or use Explore API /{" "}
              <a
                className="text-[#1e3a5f] underline"
                href="https://api.tumblr.com/console"
                target="_blank"
                rel="noreferrer"
              >
                API console
              </a>
              , Allow access, and paste the OAuth2 token here with your blog
              name.
            </li>
            <li>
              GrowthPilot publishes with NPF{" "}
              <code>/v2/blog/&#123;blog&#125;/posts</code> from Create a Post
              and Queue.
            </li>
          </ol>
          {connection?.blogUrl ? (
            <p className="text-xs">
              Linked blog:{" "}
              <a
                className="text-[#1e3a5f] underline"
                href={connection.blogUrl}
                target="_blank"
                rel="noreferrer"
              >
                {connection.blogTitle ||
                  connection.blogName ||
                  connection.blogUrl}
              </a>
            </p>
          ) : null}
        </SoftPanel>
      </div>
    </AppShell>
  );
}
