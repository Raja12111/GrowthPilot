export type SupportGuide = {
  slug: string;
  title: string;
  category: "connect" | "tutorial";
  summary: string;
  platformId?: string;
  href?: string;
  steps: { title: string; body: string }[];
  sourceUrl?: string;
};

export const supportGuides: SupportGuide[] = [
  {
    slug: "connect-facebook",
    title: "How To Connect Facebook",
    category: "connect",
    platformId: "facebook",
    href: "/dashboard/integrations/facebook",
    summary:
      "Connect your Facebook Page to GrowthPilot so you can schedule and publish posts from Create a Post.",
    sourceUrl: "https://someposter.ai/how-to-connect-facebook-to-someposter/",
    steps: [
      {
        title: "Open Integrations",
        body: "In GrowthPilot, go to Integrations and click Connect to GrowthPilot on the Facebook card.",
      },
      {
        title: "Log in to Facebook",
        body: "Follow the Facebook login flow with the account that manages your Page.",
      },
      {
        title: "Opt in to Pages & Businesses",
        body: "Select opt-in for current and future Pages and Businesses, enable permissions, then Save.",
      },
      {
        title: "Select your Page",
        body: "Back in GrowthPilot, choose the Facebook Page you want to publish to and mark it connected.",
      },
    ],
  },
  {
    slug: "connect-instagram",
    title: "How To Connect Instagram",
    category: "connect",
    platformId: "instagram",
    href: "/dashboard/integrations/instagram",
    summary:
      "Instagram connects through a Facebook Page. Use a Professional (Business/Creator) Instagram linked to a Page.",
    sourceUrl: "https://someposter.ai/how-to-connect-instagram-to-someposter/",
    steps: [
      {
        title: "Convert to Professional account",
        body: "In Instagram: Settings → Account → Switch to Professional Account (Business or Creator).",
      },
      {
        title: "Link Instagram to a Facebook Page",
        body: "Edit Profile → Page, or Facebook Page → Settings → Linked Accounts → Instagram.",
      },
      {
        title: "Connect in GrowthPilot",
        body: "Open Integrations → Instagram → Connect to GrowthPilot and complete the Facebook login / opt-in steps.",
      },
    ],
  },
  {
    slug: "connect-linkedin",
    title: "How To Connect LinkedIn",
    category: "connect",
    platformId: "linkedin",
    href: "/dashboard/integrations/linkedin",
    summary:
      "Connect LinkedIn to plan and publish professional posts from GrowthPilot.",
    sourceUrl: "https://someposter.ai/how-to-connect-linkedin-to-someposter/",
    steps: [
      {
        title: "Open LinkedIn in Integrations",
        body: "Go to Integrations and click Connect to GrowthPilot on LinkedIn.",
      },
      {
        title: "Authorize LinkedIn",
        body: "Sign in and Allow permissions for posting and profile access.",
      },
      {
        title: "Confirm connected",
        body: "Return to GrowthPilot — LinkedIn should show Connected to GrowthPilot.",
      },
    ],
  },
  {
    slug: "connect-x",
    title: "How To Connect X (Twitter)",
    category: "connect",
    platformId: "x",
    href: "/dashboard/integrations/x",
    summary: "Authorize X so GrowthPilot can create posts for your account.",
    sourceUrl: "https://someposter.ai/how-to-connect-x-twitter-to-someposter/",
    steps: [
      {
        title: "Click Connect on X",
        body: "In Integrations, open X and click Connect to GrowthPilot.",
      },
      {
        title: "Authorize the app",
        body: "Sign in to X and approve create/delete posts permissions.",
      },
      {
        title: "Start posting",
        body: "Select X in Create a Post. Character limits follow your Free vs Paid X plan.",
      },
    ],
  },
  {
    slug: "connect-bluesky",
    title: "How To Connect Bluesky",
    category: "connect",
    platformId: "bluesky",
    href: "/dashboard/integrations/bluesky",
    summary:
      "Connect Bluesky with your handle and an app password — same flow as SoMePoster.",
    sourceUrl: "https://someposter.ai/how-to-connect-bluesky-to-someposter/",
    steps: [
      {
        title: "Log in to Bluesky",
        body: "Open bsky.app and sign in.",
      },
      {
        title: "Create an App Password",
        body: "Settings → Privacy and Security → App Passwords → Add App Password. Copy it.",
      },
      {
        title: "Copy your handle",
        body: "Copy your handle (for example username.bsky.social).",
      },
      {
        title: "Paste into GrowthPilot & Connect",
        body: "Integrations → Bluesky → paste Handle + App Password → Save & Connect.",
      },
    ],
  },
  {
    slug: "connect-threads",
    title: "How To Connect Threads",
    category: "connect",
    platformId: "threads",
    href: "/dashboard/integrations/threads",
    summary:
      "Connect a public Threads profile with Meta OAuth or a manual access token.",
    sourceUrl: "https://someposter.ai/how-to-connect-threads-to-someposter/",
    steps: [
      {
        title: "Open Threads integration",
        body: "Go to Integrations → Threads.",
      },
      {
        title: "Authorize or paste token",
        body: "Use Meta OAuth (if configured) or paste an access token + user id.",
      },
      {
        title: "Save & Connect",
        body: "Confirm Connected, then auto-publish from Create a Post.",
      },
    ],
  },
  {
    slug: "connect-pinterest",
    title: "How To Connect Pinterest",
    category: "connect",
    platformId: "pinterest",
    href: "/dashboard/integrations/pinterest",
    summary: "Authorize Pinterest to publish pins to your boards.",
    sourceUrl: "https://someposter.ai/how-to-connect-pinterest-to-someposter/",
    steps: [
      {
        title: "Connect Pinterest",
        body: "Integrations → Pinterest → Connect to GrowthPilot.",
      },
      {
        title: "Give Access",
        body: "Log in and approve boards/pins access.",
      },
      {
        title: "Choose a board when posting",
        body: "In Create a Post, select Pinterest and target the board you want.",
      },
    ],
  },
  {
    slug: "connect-wordpress",
    title: "How To Connect WordPress.com",
    category: "connect",
    platformId: "wordpress",
    href: "/dashboard/integrations/wordpress",
    summary: "Connect WordPress.com via OAuth, or use self-hosted with an application password.",
    sourceUrl: "https://someposter.ai/how-to-connect-wordpress-to-someposter/",
    steps: [
      {
        title: "Open WordPress in Integrations",
        body: "Choose WordPress and start Connect to GrowthPilot.",
      },
      {
        title: "Approve access",
        body: "For WordPress.com, approve user/posts permissions. For self-hosted, use Site URL + username + application password.",
      },
      {
        title: "Publish from Create a Post",
        body: "Select WordPress and Post Now to publish a blog article.",
      },
    ],
  },
  {
    slug: "connect-wordpress-self-hosted",
    title: "How To Connect WordPress (Self Hosted)",
    category: "connect",
    platformId: "wordpress",
    href: "/dashboard/integrations/wordpress",
    summary:
      "Use a WordPress Application Password plus your Site Address URL — SoMePoster-style.",
    sourceUrl:
      "https://someposter.ai/how-to-connect-wordpress-self-hosted-to-someposter/",
    steps: [
      {
        title: "Open WP Admin Profile",
        body: "Users → Profile → Application Passwords.",
      },
      {
        title: "Create Application Password",
        body: "Name it GrowthPilot, generate, and copy the password.",
      },
      {
        title: "Copy username + Site URL",
        body: "Copy username from Profile and Site Address (URL) from Settings → General.",
      },
      {
        title: "Save & Connect in GrowthPilot",
        body: "Paste Site URL, Username, and Application Password → Save & Connect.",
      },
    ],
  },
  {
    slug: "connect-shopify",
    title: "How To Connect Shopify",
    category: "connect",
    platformId: "shopify",
    href: "/dashboard/integrations/shopify",
    summary:
      "Create a custom Shopify app with read_content/write_content and connect Client ID + Secret.",
    sourceUrl: "https://someposter.ai/how-to-connect-shopify-to-someposter/",
    steps: [
      {
        title: "Create a custom app",
        body: "Shopify Admin → Settings → Apps → Develop apps → Create app.",
      },
      {
        title: "Set content scopes",
        body: "Enable read_content and write_content, release, and install on your store.",
      },
      {
        title: "Paste credentials in GrowthPilot",
        body: "Copy Client ID, Client Secret, and store URL into Integrations → Shopify → Save & Connect.",
      },
    ],
  },
  {
    slug: "connect-wix",
    title: "How To Connect Wix",
    category: "connect",
    platformId: "wix",
    href: "/dashboard/integrations/wix",
    summary: "Install Wix Blog, publish your site, then add GrowthPilot to the site.",
    sourceUrl: "https://someposter.ai/how-to-connect-wix-to-someposter/",
    steps: [
      {
        title: "Install Wix Blog",
        body: "In Wix Apps, install Blog and publish the site.",
      },
      {
        title: "Connect from GrowthPilot",
        body: "Integrations → Wix → Connect to GrowthPilot / Add to Site.",
      },
      {
        title: "Select site",
        body: "Choose the Wix site and confirm Agree & Add.",
      },
    ],
  },
  {
    slug: "connect-webflow",
    title: "How To Connect Webflow",
    category: "connect",
    platformId: "webflow",
    href: "/dashboard/integrations/webflow",
    summary:
      "Generate a Workspace API token with CMS + Sites + Assets access, then connect your collection.",
    sourceUrl: "https://someposter.ai/how-to-connect-webflow-to-someposter/",
    steps: [
      {
        title: "Prepare a CMS collection",
        body: "Ensure your Webflow blog/CMS fields exist first.",
      },
      {
        title: "Generate API token",
        body: "Site Settings → Apps & Integrations → API access → generate token with CMS/Sites/Assets read+write.",
      },
      {
        title: "Save & Connect",
        body: "Paste token in GrowthPilot → Webflow, pick site + collection, Save & Connect.",
      },
    ],
  },
  {
    slug: "connect-telegram",
    title: "How To Connect Telegram",
    category: "connect",
    platformId: "telegram",
    href: "/dashboard/integrations/telegram",
    summary: "Create a bot with BotFather, add it as channel admin, paste Bot Token + Channel ID.",
    sourceUrl: "https://someposter.ai/how-to-connect-telegram-to-someposter/",
    steps: [
      {
        title: "Create a bot",
        body: "Message @BotFather → /newbot → copy the Bot Token.",
      },
      {
        title: "Add bot as channel admin",
        body: "Give Post Messages permission. Use @RawDataBot to find chat.id (often starts with -100).",
      },
      {
        title: "Save & Connect",
        body: "Paste Bot Token + Channel ID in GrowthPilot → Telegram.",
      },
    ],
  },
  {
    slug: "connect-ghost",
    title: "How To Connect Ghost",
    category: "connect",
    platformId: "ghost",
    href: "/dashboard/integrations/ghost",
    summary: "Add a Ghost custom integration and paste API URL + Admin API Key.",
    sourceUrl: "https://someposter.ai/how-to-connect-ghost-to-someposter/",
    steps: [
      {
        title: "Create Ghost integration",
        body: "Ghost Admin → Settings → Integrations → Add custom integration named GrowthPilot.",
      },
      {
        title: "Copy API URL + Admin API Key",
        body: "Paste into GrowthPilot Ghost Site URL and Admin API Key fields.",
      },
      {
        title: "Save & Connect",
        body: "Test connection, then publish from Create a Post with Ghost selected.",
      },
    ],
  },
  {
    slug: "connect-medium",
    title: "How To Connect Medium",
    category: "connect",
    platformId: "medium",
    href: "/dashboard/integrations/medium",
    summary:
      "Medium no longer issues new Integration Tokens. Connect Medium for manual posting, or use a legacy token only if you already have one.",
    steps: [
      {
        title: "Know the limit",
        body: "Medium stopped issuing new Integration Tokens and does not allow new API integrations. Auto-publish is unavailable for most accounts.",
      },
      {
        title: "Connect manually in GrowthPilot",
        body: "Open Integrations → Medium → Connect manually. This lets you select Medium when creating posts.",
      },
      {
        title: "Publish on Medium",
        body: "Copy your draft into Medium’s editor, or use Medium’s import-from-URL tool if the article is already live elsewhere.",
      },
      {
        title: "Mark published",
        body: "After it’s live on Medium, mark the post Published in Queue or History.",
      },
    ],
  },
  {
    slug: "connect-tumblr",
    title: "How To Connect Tumblr",
    category: "connect",
    platformId: "tumblr",
    href: "/dashboard/integrations/tumblr",
    summary:
      "Connect Tumblr with OAuth2 (app credentials or pasted access token) and auto-publish text posts.",
    steps: [
      {
        title: "Register a Tumblr app",
        body: "Go to tumblr.com/oauth/apps and create an application. Add your GrowthPilot callback URL ending in /api/tumblr/callback.",
      },
      {
        title: "Connect with OAuth or token",
        body: "Either set TUMBLR_CLIENT_ID + TUMBLR_CLIENT_SECRET on the server and click Connect with Tumblr, or open Explore API / the Tumblr API console, Allow access, and paste the OAuth2 access token with your blog name.",
      },
      {
        title: "Pick your blog",
        body: "If you have multiple blogs, choose the one to publish to on the Tumblr integration page.",
      },
      {
        title: "Publish",
        body: "Select Tumblr on Create a Post and use Post Now, or publish from Queue.",
      },
    ],
  },
  {
    slug: "connect-devto",
    title: "How To Connect DEV.to",
    category: "connect",
    platformId: "devto",
    href: "/dashboard/integrations/devto",
    summary:
      "Generate a DEV Community API Key and paste it into GrowthPilot.",
    sourceUrl: "https://someposter.ai/how-to-connect-devto-to-someposter/",
    steps: [
      {
        title: "Open DEV.to integration",
        body: "GrowthPilot → Integrations → DEV.to → Connect.",
      },
      {
        title: "Generate API Key",
        body: "DEV.to → Settings → Extensions → DEV Community API Keys → Generate.",
      },
      {
        title: "Paste & Connect",
        body: "Paste the key into GrowthPilot and click Save & Connect.",
      },
    ],
  },
  {
    slug: "connect-instantly",
    title: "How To Connect Instantly",
    category: "connect",
    platformId: "instantly",
    href: "/dashboard/integrations/instantly",
    summary:
      "Create an Instantly API v2 key, connect it in GrowthPilot, then add leads and start or pause campaigns.",
    steps: [
      {
        title: "Create an API v2 key",
        body: "Instantly → Settings → Integrations → API → Create New API Key. Use v2 (Bearer). Include campaigns and leads scopes.",
      },
      {
        title: "Connect in GrowthPilot",
        body: "Integrations → Instantly → paste the key → Save & Connect.",
      },
      {
        title: "Run campaigns",
        body: "Open Instantly Email to list campaigns, add a lead, and Start or Pause sending.",
      },
    ],
  },
  {
    slug: "connect-hashnode",
    title: "How To Connect Hashnode",
    category: "connect",
    platformId: "hashnode",
    href: "/dashboard/integrations/hashnode",
    summary:
      "Generate a Personal Access Token, connect it in GrowthPilot, and choose the publication to publish into.",
    steps: [
      {
        title: "Generate a token",
        body: "Hashnode → Settings → Developer → Generate New Token.",
      },
      {
        title: "Connect in GrowthPilot",
        body: "Integrations → Hashnode → paste the token → Save & Connect.",
      },
      {
        title: "Pick publication & publish",
        body: "Select your blog/publication, then use Create a Post or Queue with Hashnode selected.",
      },
    ],
  },
  {
    slug: "connect-livejournal",
    title: "How To Connect LiveJournal",
    category: "connect",
    platformId: "livejournal",
    href: "/dashboard/integrations/livejournal",
    summary: "Enter LiveJournal username + password and Save & Connect.",
    sourceUrl: "https://someposter.ai/how-to-connect-livejournal-to-someposter/",
    steps: [
      {
        title: "Open LiveJournal",
        body: "Integrations → LiveJournal.",
      },
      {
        title: "Enter credentials",
        body: "Username + account password.",
      },
      {
        title: "Save & Connect",
        body: "Test connection, then publish from Create a Post.",
      },
    ],
  },
  {
    slug: "create-a-post",
    title: "How To Create A Post",
    category: "tutorial",
    href: "/dashboard/parasite-posting/compose",
    summary:
      "Select platforms, write content, optionally customize per channel, then Post Now or queue.",
    sourceUrl: "https://someposter.ai/how-to-create-a-post-in-someposter/",
    steps: [
      {
        title: "Open Create a Post",
        body: "Use the sidebar Create a Post button.",
      },
      {
        title: "Select platforms",
        body: "Choose connected GrowthPilot integrations from the icon grid. Save Selection to reuse.",
      },
      {
        title: "Write content",
        body: "Use the editor, formatting toolbar, Rewrite, and optional image/emoji tools.",
      },
      {
        title: "Post Now",
        body: "Post Now auto-publishes connected auto channels. Or use Add to Queue / Save Draft from the menu.",
      },
    ],
  },
  {
    slug: "create-a-video-post",
    title: "How To Create A Video Post",
    category: "tutorial",
    href: "/dashboard/parasite-posting/compose",
    summary:
      "Attach media in Create a Post for platforms that support video captions and uploads.",
    sourceUrl: "https://someposter.ai/how-to-create-a-video-post-in-someposter/",
    steps: [
      {
        title: "Select video-friendly platforms",
        body: "Choose channels like YouTube, Facebook, Instagram, X, LinkedIn, or Bluesky.",
      },
      {
        title: "Add media",
        body: "Use Add Image / media attachment in the composer.",
      },
      {
        title: "Publish",
        body: "Write the caption and Post Now or queue for later.",
      },
    ],
  },
  {
    slug: "delete-a-post",
    title: "How To Delete A Post",
    category: "tutorial",
    href: "/dashboard/parasite-posting/published",
    summary: "Remove published or queued items from GrowthPilot tracking.",
    sourceUrl: "https://someposter.ai/how-to-delete-a-post-in-someposter/",
    steps: [
      {
        title: "Open Published or Queue",
        body: "Find the post in Published or Queue.",
      },
      {
        title: "Remove",
        body: "Click Delete/Remove on the post card. Remote deletes on each network depend on that platform’s API.",
      },
    ],
  },
];

export function getSupportGuide(slug: string) {
  return supportGuides.find((guide) => guide.slug === slug) ?? null;
}

export function supportGuidesByCategory(category: SupportGuide["category"]) {
  return supportGuides.filter((guide) => guide.category === category);
}
