export type PlatformId =
  | "ghost"
  | "telegram"
  | "webflow"
  | "livejournal"
  | "threads"
  | "medium"
  | "linkedin"
  | "reddit"
  | "quora"
  | "devto"
  | "hashnode"
  | "x"
  | "facebook"
  | "instagram"
  | "pinterest"
  | "youtube"
  | "wordpress"
  | "tumblr"
  | "whatsapp"
  | "mastodon"
  | "shopify"
  | "wix"
  | "github"
  | "bluesky";

export type Platform = {
  id: PlatformId;
  name: string;
  tip: string;
  enabled: boolean;
  short: string;
  limit: number;
};

export type ParasitePost = {
  id: string;
  title: string;
  body: string;
  targetUrl: string;
  platforms: PlatformId[];
  status: "Draft" | "Queued" | "Published";
  createdAt: string;
  publishedAt?: string;
  ghostUrl?: string;
  ghostError?: string;
  telegramUrl?: string;
  telegramError?: string;
  webflowUrl?: string;
  webflowError?: string;
  livejournalUrl?: string;
  livejournalError?: string;
  threadsUrl?: string;
  threadsError?: string;
  devtoUrl?: string;
  devtoError?: string;
  hashnodeUrl?: string;
  hashnodeError?: string;
  blueskyUrl?: string;
  blueskyError?: string;
  wordpressUrl?: string;
  wordpressError?: string;
  mediumUrl?: string;
  mediumError?: string;
  tumblrUrl?: string;
  tumblrError?: string;
  mastodonUrl?: string;
  mastodonError?: string;
};

export const defaultPlatforms: Platform[] = [
  {
    id: "x",
    name: "X",
    short: "X",
    tip: "Short posts with a clear hook.",
    enabled: true,
    limit: 280,
  },
  {
    id: "facebook",
    name: "Facebook",
    short: "f",
    tip: "Feed posts and link shares.",
    enabled: true,
    limit: 2200,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    short: "in",
    tip: "Short professional posts and carousels.",
    enabled: true,
    limit: 3000,
  },
  {
    id: "threads",
    name: "Threads",
    short: "@",
    tip: "Auto-publish via Meta OAuth or access token.",
    enabled: true,
    limit: 500,
  },
  {
    id: "instagram",
    name: "Instagram",
    short: "Ig",
    tip: "Visual-first captions.",
    enabled: true,
    limit: 2200,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    short: "P",
    tip: "Pin descriptions and link outs.",
    enabled: true,
    limit: 500,
  },
  {
    id: "medium",
    name: "Medium",
    short: "M",
    tip: "Manual posting — Medium closed new API tokens; mark connected then publish on Medium.",
    enabled: true,
    limit: 10000,
  },
  {
    id: "youtube",
    name: "YouTube",
    short: "YT",
    tip: "Video descriptions and community posts.",
    enabled: true,
    limit: 5000,
  },
  {
    id: "wordpress",
    name: "WordPress",
    short: "W",
    tip: "Self-hosted WordPress via application password (SoMePoster-style).",
    enabled: true,
    limit: 10000,
  },
  {
    id: "telegram",
    name: "Telegram",
    short: "Tg",
    tip: "Auto-post with Bot Token + Channel ID.",
    enabled: true,
    limit: 4096,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    short: "Wa",
    tip: "Channel / broadcast style updates.",
    enabled: true,
    limit: 1000,
  },
  {
    id: "mastodon",
    name: "Mastodon",
    short: "Ma",
    tip: "Auto-publish to mastodon.social or any Mastodon instance via access token.",
    enabled: true,
    limit: 500,
  },
  {
    id: "tumblr",
    name: "Tumblr",
    short: "Tu",
    tip: "Auto-publish via Tumblr OAuth2 access token + blog name.",
    enabled: true,
    limit: 4000,
  },
  {
    id: "github",
    name: "GitHub",
    short: "Gh",
    tip: "Discussions and README-style notes.",
    enabled: true,
    limit: 5000,
  },
  {
    id: "shopify",
    name: "Shopify",
    short: "Sh",
    tip: "Store blog / product updates.",
    enabled: true,
    limit: 5000,
  },
  {
    id: "wix",
    name: "Wix",
    short: "Wx",
    tip: "Site blog publishing checklist.",
    enabled: true,
    limit: 5000,
  },
  {
    id: "ghost",
    name: "Ghost",
    short: "Go",
    tip: "Auto-publish via Admin API.",
    enabled: true,
    limit: 10000,
  },
  {
    id: "webflow",
    name: "Webflow",
    short: "Wf",
    tip: "Auto-publish to a CMS collection.",
    enabled: true,
    limit: 10000,
  },
  {
    id: "livejournal",
    name: "LiveJournal",
    short: "Lj",
    tip: "Auto-publish journal entries.",
    enabled: true,
    limit: 10000,
  },
  {
    id: "reddit",
    name: "Reddit",
    short: "Re",
    tip: "Value-first answers in relevant subs.",
    enabled: true,
    limit: 40000,
  },
  {
    id: "quora",
    name: "Quora",
    short: "Q",
    tip: "Direct answers with one soft link.",
    enabled: true,
    limit: 10000,
  },
  {
    id: "devto",
    name: "Dev.to",
    short: "Dv",
    tip: "Auto-publish articles with your DEV.to API key (SoMePoster-style).",
    enabled: true,
    limit: 10000,
  },
  {
    id: "hashnode",
    name: "Hashnode",
    short: "Ha",
    tip: "Auto-publish articles with a Personal Access Token + publication.",
    enabled: true,
    limit: 10000,
  },
  {
    id: "bluesky",
    name: "Bluesky",
    short: "Bs",
    tip: "Auto-publish with handle + app password.",
    enabled: true,
    limit: 300,
  },
];

const STORAGE_KEY = "growthpilot.parasite.posts.v1";
const PLATFORM_KEY = "growthpilot.parasite.platforms.v1";
const PRESELECT_KEY = "growthpilot.parasite.preselected.v1";

function scopedKey(base: string) {
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem("growthpilot.auth.session.v1");
    if (!raw) return base;
    const session = JSON.parse(raw) as { userId?: string };
    return session.userId ? `${base}.${session.userId}` : base;
  } catch {
    return base;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const scoped = scopedKey(key);
    const raw =
      window.localStorage.getItem(scoped) ??
      // migrate unscoped legacy data into the signed-in account once
      (scoped !== key ? window.localStorage.getItem(key) : null);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (scoped !== key && !window.localStorage.getItem(scoped)) {
      window.localStorage.setItem(scoped, raw);
    }
    return parsed;
  } catch {
    return fallback;
  }
}

export function loadPosts(): ParasitePost[] {
  return readJson<ParasitePost[]>(STORAGE_KEY, []);
}

export function savePosts(posts: ParasitePost[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(STORAGE_KEY), JSON.stringify(posts));
}

export function loadPlatforms(): Platform[] {
  try {
    const saved = readJson<Platform[] | null>(PLATFORM_KEY, null);
    if (!saved) return defaultPlatforms;
    const byId = new Map(saved.map((p) => [p.id, p]));
    return defaultPlatforms.map(
      (platform) => byId.get(platform.id) ?? platform,
    );
  } catch {
    return defaultPlatforms;
  }
}

export function savePlatforms(platforms: Platform[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    scopedKey(PLATFORM_KEY),
    JSON.stringify(platforms),
  );
}

export function loadPreselectedPlatforms(): PlatformId[] {
  try {
    const ids = readJson<PlatformId[]>(PRESELECT_KEY, []);
    const valid = new Set(defaultPlatforms.map((p) => p.id));
    return ids.filter((id) => valid.has(id));
  } catch {
    return [];
  }
}

export function savePreselectedPlatforms(ids: PlatformId[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    scopedKey(PRESELECT_KEY),
    JSON.stringify(ids),
  );
}

export function platformLabel(id: PlatformId, platforms: Platform[]) {
  return platforms.find((p) => p.id === id)?.name ?? id;
}

export function deriveTitle(body: string) {
  const line = body
    .trim()
    .split(/\n/)
    .map((part) => part.trim())
    .find(Boolean);
  if (!line) return "Untitled post";
  return line.length > 80 ? `${line.slice(0, 77)}...` : line;
}
