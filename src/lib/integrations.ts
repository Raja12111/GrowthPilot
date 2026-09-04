export type BuiltInIntegration = {
  id: string;
  name: string;
  category: string;
  description: string;
  href: string;
  statusKey: string;
};

export type CustomIntegration = {
  id: string;
  name: string;
  category: string;
  notes: string;
  url?: string;
  createdAt: string;
};

export const builtInIntegrations: BuiltInIntegration[] = [
  {
    id: "openai",
    name: "OpenAI",
    category: "AI Writing",
    description:
      "RankBrain X Chat Completions API — powers Rewrite and Write on Create a Post.",
    href: "/dashboard/integrations/openai",
    statusKey: "openai",
  },
  {
    id: "x",
    name: "X",
    category: "Social Media",
    description: "Short posts with a clear hook — connect then select in Create a Post.",
    href: "/dashboard/integrations/x",
    statusKey: "x",
  },
  {
    id: "facebook",
    name: "Facebook",
    category: "Social Media",
    description: "Feed posts and link shares.",
    href: "/dashboard/integrations/facebook",
    statusKey: "facebook",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "Social Media",
    description: "Professional posts — connect then select when creating a post.",
    href: "/dashboard/integrations/linkedin",
    statusKey: "linkedin",
  },
  {
    id: "threads",
    name: "Threads",
    category: "Social Media",
    description: "Connect with Meta OAuth (or access token) and publish to Threads.",
    href: "/dashboard/integrations/threads",
    statusKey: "threads",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "Social Media",
    description: "Visual-first captions.",
    href: "/dashboard/integrations/instagram",
    statusKey: "instagram",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    category: "Social Media",
    description: "Pin descriptions and link outs.",
    href: "/dashboard/integrations/pinterest",
    statusKey: "pinterest",
  },
  {
    id: "telegram",
    name: "Telegram",
    category: "Social Media",
    description: "Connect Bot Token + Channel ID to post to your channel.",
    href: "/dashboard/integrations/telegram",
    statusKey: "telegram",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "Social Media",
    description: "Channel / broadcast style updates.",
    href: "/dashboard/integrations/whatsapp",
    statusKey: "whatsapp",
  },
  {
    id: "medium",
    name: "Medium",
    category: "Social Media",
    description:
      "Manual posting — Medium no longer issues new Integration Tokens for API publish.",
    href: "/dashboard/integrations/medium",
    statusKey: "medium",
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "Social Media",
    description: "Video descriptions and community posts.",
    href: "/dashboard/integrations/youtube",
    statusKey: "youtube",
  },
  {
    id: "wordpress",
    name: "WordPress",
    category: "Social Media",
    description: "Self-hosted WordPress with application password auto-publish.",
    href: "/dashboard/integrations/wordpress",
    statusKey: "wordpress",
  },
  {
    id: "ghost",
    name: "Ghost",
    category: "Social Media",
    description: "Connect Site URL + Admin API Key to auto-publish parasite posts.",
    href: "/dashboard/integrations/ghost",
    statusKey: "ghost",
  },
  {
    id: "webflow",
    name: "Webflow",
    category: "Social Media",
    description: "Connect Workspace API token and publish to a CMS collection.",
    href: "/dashboard/integrations/webflow",
    statusKey: "webflow",
  },
  {
    id: "livejournal",
    name: "LiveJournal",
    category: "Social Media",
    description: "Connect username + password and publish journal entries.",
    href: "/dashboard/integrations/livejournal",
    statusKey: "livejournal",
  },
  {
    id: "tumblr",
    name: "Tumblr",
    category: "Social Media",
    description:
      "OAuth2 or access token + blog name — auto-publish Tumblr text posts.",
    href: "/dashboard/integrations/tumblr",
    statusKey: "tumblr",
  },
  {
    id: "mastodon",
    name: "Mastodon",
    category: "Social Media",
    description:
      "Connect mastodon.social (or any instance) with OAuth/token and auto-publish statuses.",
    href: "/dashboard/integrations/mastodon",
    statusKey: "mastodon",
  },
  {
    id: "github",
    name: "GitHub",
    category: "Social Media",
    description: "Discussions and README-style notes.",
    href: "/dashboard/integrations/github",
    statusKey: "github",
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "Social Media",
    description: "Store blog / product updates.",
    href: "/dashboard/integrations/shopify",
    statusKey: "shopify",
  },
  {
    id: "wix",
    name: "Wix",
    category: "Social Media",
    description: "Site blog publishing checklist.",
    href: "/dashboard/integrations/wix",
    statusKey: "wix",
  },
  {
    id: "reddit",
    name: "Reddit",
    category: "Social Media",
    description: "Value-first community posts.",
    href: "/dashboard/integrations/reddit",
    statusKey: "reddit",
  },
  {
    id: "quora",
    name: "Quora",
    category: "Social Media",
    description: "Answer-style posts.",
    href: "/dashboard/integrations/quora",
    statusKey: "quora",
  },
  {
    id: "devto",
    name: "Dev.to",
    category: "Social Media",
    description:
      "Connect a DEV.to API key (Settings → Extensions) and auto-publish articles.",
    href: "/dashboard/integrations/devto",
    statusKey: "devto",
  },
  {
    id: "hashnode",
    name: "Hashnode",
    category: "Social Media",
    description:
      "Connect a Personal Access Token + publication and auto-publish articles.",
    href: "/dashboard/integrations/hashnode",
    statusKey: "hashnode",
  },

  {
    id: "bluesky",
    name: "Bluesky",
    category: "Social Media",
    description: "Connect handle + app password and auto-publish posts.",
    href: "/dashboard/integrations/bluesky",
    statusKey: "bluesky",
  },
  {
    id: "instantly",
    name: "Instantly",
    category: "Email",
    description:
      "Connect Instantly API v2 to list campaigns, add leads, and start or pause sending.",
    href: "/dashboard/integrations/instantly",
    statusKey: "instantly",
  },
];

const CUSTOM_KEY = "growthpilot.integrations.custom.v1";

export function loadCustomIntegrations(): CustomIntegration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as CustomIntegration[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomIntegrations(items: CustomIntegration[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(items));
}

export function createCustomIntegration(input: {
  name: string;
  category: string;
  notes: string;
  url?: string;
}): CustomIntegration {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    category: input.category.trim() || "Custom",
    notes: input.notes.trim(),
    url: input.url?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
}
