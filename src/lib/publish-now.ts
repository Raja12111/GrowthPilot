import { loadGhostConnection } from "@/lib/ghost-client";
import { loadBlueskyConnection } from "@/lib/bluesky-client";
import { loadDevtoConnection } from "@/lib/devto-client";
import { loadHashnodeConnection } from "@/lib/hashnode-client";
import { loadLiveJournalConnection } from "@/lib/livejournal-client";
import { loadMastodonConnection } from "@/lib/mastodon-client";
import { loadMediumConnection } from "@/lib/medium-client";
import { loadTelegramConnection } from "@/lib/telegram-client";
import { loadThreadsConnection } from "@/lib/threads-client";
import { loadTumblrConnection } from "@/lib/tumblr-client";
import { loadWebflowConnection } from "@/lib/webflow-client";
import { loadWordPressConnection } from "@/lib/wordpress-client";
import type { ParasitePost } from "@/lib/parasite-data";

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as {
    ok: boolean;
    error?: string;
    post?: { url?: string };
  };
}

export async function publishToGhostNow(post: ParasitePost) {
  const ghost = loadGhostConnection();
  if (!ghost) throw new Error("Connect Ghost first under Integrations.");
  const data = await postJson("/api/ghost", {
    action: "publish",
    apiUrl: ghost.apiUrl,
    adminApiKey: ghost.adminApiKey,
    title: post.title,
    body: post.body,
    targetUrl: post.targetUrl,
    status: "published",
  });
  if (!data.ok) throw new Error(data.error || "Ghost publish failed.");
  return data.post?.url || "";
}

export async function publishToTelegramNow(post: ParasitePost) {
  const telegram = loadTelegramConnection();
  if (!telegram) throw new Error("Connect Telegram first under Integrations.");
  const data = await postJson("/api/telegram", {
    action: "publish",
    botToken: telegram.botToken,
    channelId: telegram.channelId,
    title: post.title,
    body: post.body,
    targetUrl: post.targetUrl,
  });
  if (!data.ok) throw new Error(data.error || "Telegram publish failed.");
  return data.post?.url || "";
}

export async function publishToWebflowNow(post: ParasitePost) {
  const webflow = loadWebflowConnection();
  if (!webflow) throw new Error("Connect Webflow first under Integrations.");
  const data = await postJson("/api/webflow", {
    action: "publish",
    apiToken: webflow.apiToken,
    siteId: webflow.siteId,
    collectionId: webflow.collectionId,
    title: post.title,
    body: post.body,
    targetUrl: post.targetUrl,
  });
  if (!data.ok) throw new Error(data.error || "Webflow publish failed.");
  return data.post?.url || "";
}

export async function publishToLiveJournalNow(post: ParasitePost) {
  const livejournal = loadLiveJournalConnection();
  if (!livejournal) {
    throw new Error("Connect LiveJournal first under Integrations.");
  }
  const data = await postJson("/api/livejournal", {
    action: "publish",
    username: livejournal.username,
    password: livejournal.password,
    title: post.title,
    body: post.body,
    targetUrl: post.targetUrl,
  });
  if (!data.ok) throw new Error(data.error || "LiveJournal publish failed.");
  return data.post?.url || "";
}

export async function publishToThreadsNow(post: ParasitePost) {
  const threads = loadThreadsConnection();
  if (!threads) throw new Error("Connect Threads first under Integrations.");
  const data = await postJson("/api/threads", {
    action: "publish",
    accessToken: threads.accessToken,
    userId: threads.userId,
    title: post.title,
    body: post.body,
    targetUrl: post.targetUrl,
  });
  if (!data.ok) throw new Error(data.error || "Threads publish failed.");
  return data.post?.url || "";
}

export async function publishToDevtoNow(post: ParasitePost) {
  const devto = loadDevtoConnection();
  if (!devto) throw new Error("Connect DEV.to first under Integrations.");
  const data = await postJson("/api/devto", {
    action: "publish",
    apiKey: devto.apiKey,
    title: post.title,
    body: post.body,
    targetUrl: post.targetUrl,
    published: true,
  });
  if (!data.ok) throw new Error(data.error || "DEV.to publish failed.");
  return data.post?.url || "";
}

export async function publishToHashnodeNow(post: ParasitePost) {
  const hashnode = loadHashnodeConnection();
  if (!hashnode) throw new Error("Connect Hashnode first under Integrations.");
  const data = await postJson("/api/hashnode", {
    action: "publish",
    accessToken: hashnode.accessToken,
    publicationId: hashnode.publicationId,
    title: post.title,
    body: post.body,
    targetUrl: post.targetUrl,
  });
  if (!data.ok) throw new Error(data.error || "Hashnode publish failed.");
  return data.post?.url || "";
}

export async function publishToBlueskyNow(post: ParasitePost) {
  const bluesky = loadBlueskyConnection();
  if (!bluesky) throw new Error("Connect Bluesky first under Integrations.");
  const data = await postJson("/api/bluesky", {
    action: "publish",
    handle: bluesky.handle,
    appPassword: bluesky.appPassword,
    body: post.body,
    targetUrl: post.targetUrl,
  });
  if (!data.ok) throw new Error(data.error || "Bluesky publish failed.");
  return data.post?.url || "";
}

export async function publishToWordPressNow(post: ParasitePost) {
  const wordpress = loadWordPressConnection();
  if (!wordpress) throw new Error("Connect WordPress first under Integrations.");
  const data = await postJson("/api/wordpress", {
    action: "publish",
    siteUrl: wordpress.siteUrl,
    username: wordpress.username,
    applicationPassword: wordpress.applicationPassword,
    title: post.title,
    body: post.body,
    targetUrl: post.targetUrl,
  });
  if (!data.ok) throw new Error(data.error || "WordPress publish failed.");
  return data.post?.url || "";
}

export async function publishToMediumNow(post: ParasitePost) {
  const medium = loadMediumConnection();
  if (!medium) throw new Error("Connect Medium first under Integrations.");
  const data = await postJson("/api/medium", {
    action: "publish",
    integrationToken: medium.integrationToken,
    title: post.title,
    body: post.body,
    targetUrl: post.targetUrl,
    publishStatus: "public",
  });
  if (!data.ok) throw new Error(data.error || "Medium publish failed.");
  return data.post?.url || "";
}

export async function publishToTumblrNow(post: ParasitePost) {
  const tumblr = loadTumblrConnection();
  if (!tumblr) throw new Error("Connect Tumblr first under Integrations.");
  const data = await postJson("/api/tumblr", {
    action: "publish",
    accessToken: tumblr.accessToken,
    blogIdentifier: tumblr.blogIdentifier,
    title: post.title,
    body: post.body,
    targetUrl: post.targetUrl,
    state: "published",
  });
  if (!data.ok) throw new Error(data.error || "Tumblr publish failed.");
  return data.post?.url || "";
}

export async function publishToMastodonNow(post: ParasitePost) {
  const mastodon = loadMastodonConnection();
  if (!mastodon) throw new Error("Connect Mastodon first under Integrations.");
  const data = await postJson("/api/mastodon", {
    action: "publish",
    instanceUrl: mastodon.instanceUrl,
    accessToken: mastodon.accessToken,
    body: post.body,
    targetUrl: post.targetUrl,
    visibility: "public",
  });
  if (!data.ok) throw new Error(data.error || "Mastodon publish failed.");
  return data.post?.url || "";
}
