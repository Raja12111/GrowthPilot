/** Server-only Tumblr API helpers (OAuth2 Bearer + NPF posts). */

export type TumblrConfig = {
  accessToken: string;
  blogIdentifier: string;
};

export type TumblrBlog = {
  name: string;
  title?: string;
  url?: string;
  uuid?: string;
  primary?: boolean;
};

export type TumblrUser = {
  name?: string;
  blogs: TumblrBlog[];
};

const OAUTH_AUTHORIZE = "https://www.tumblr.com/oauth2/authorize";
const OAUTH_TOKEN = "https://api.tumblr.com/v2/oauth2/token";

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token.trim()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function tumblrOAuthConfigured() {
  return Boolean(
    process.env.TUMBLR_CLIENT_ID?.trim() &&
      process.env.TUMBLR_CLIENT_SECRET?.trim(),
  );
}

export function getTumblrClientId() {
  return process.env.TUMBLR_CLIENT_ID?.trim() || "";
}

export function getTumblrClientSecret() {
  return process.env.TUMBLR_CLIENT_SECRET?.trim() || "";
}

export function buildTumblrAuthorizeUrl(input: {
  redirectUri: string;
  state: string;
}) {
  const params = new URLSearchParams({
    client_id: getTumblrClientId(),
    response_type: "code",
    scope: "basic write offline_access",
    redirect_uri: input.redirectUri,
    state: input.state,
  });
  return `${OAUTH_AUTHORIZE}?${params.toString()}`;
}

export function normalizeTumblrBlogIdentifier(raw: string) {
  const value = raw.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!value) return "";
  if (value.includes(".")) return value;
  return `${value}.tumblr.com`;
}

async function parseTumblrResponse(response: Response) {
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return data;
}

function tumblrErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data) {
    const errors = (data as { errors?: { detail?: string; title?: string }[] })
      .errors;
    if (Array.isArray(errors) && errors.length) {
      const message = errors
        .map((e) => e.detail || e.title)
        .filter(Boolean)
        .join("; ");
      if (message) return message;
    }
    const meta = (data as { meta?: { msg?: string } }).meta;
    if (typeof meta?.msg === "string" && meta.msg.trim()) {
      return meta.msg.trim();
    }
    const description = (data as { error_description?: string })
      .error_description;
    const error = (data as { error?: string }).error;
    if (typeof description === "string" && description.trim()) {
      return description.trim();
    }
    if (typeof error === "string" && error.trim()) {
      return error.trim();
    }
  }
  return fallback;
}

export async function fetchTumblrUserInfo(accessToken: string) {
  const response = await fetch("https://api.tumblr.com/v2/user/info", {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  const data = await parseTumblrResponse(response);
  if (!response.ok) {
    throw new Error(
      tumblrErrorMessage(
        data,
        "Invalid Tumblr access token. Register an app, open Explore API / console, Allow access, and paste the OAuth2 token.",
      ),
    );
  }

  const user = (data as { response?: { user?: TumblrUser } }).response?.user;
  const blogs = Array.isArray(user?.blogs) ? user.blogs : [];
  return {
    name: user?.name,
    blogs,
  };
}

export async function exchangeTumblrCode(input: {
  code: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    client_id: getTumblrClientId(),
    client_secret: getTumblrClientSecret(),
    redirect_uri: input.redirectUri,
  });

  const response = await fetch(OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await parseTumblrResponse(response);
  if (!response.ok) {
    throw new Error(
      tumblrErrorMessage(
        data,
        `Tumblr OAuth token exchange failed (${response.status})`,
      ),
    );
  }

  const accessToken = (data as { access_token?: string }).access_token?.trim();
  if (!accessToken) {
    throw new Error("Tumblr did not return an access token.");
  }

  const refreshToken = (data as { refresh_token?: string }).refresh_token?.trim();
  const account = await fetchTumblrUserInfo(accessToken);
  const blog =
    account.blogs.find((item) => item.primary) || account.blogs[0] || null;

  return {
    accessToken,
    refreshToken,
    userName: account.name,
    blogName: blog?.name,
    blogTitle: blog?.title,
    blogUrl:
      blog?.url ||
      (blog?.name
        ? `https://${normalizeTumblrBlogIdentifier(blog.name)}`
        : undefined),
    blogs: account.blogs,
  };
}

export async function testTumblrConnection(config: TumblrConfig) {
  const accessToken = config.accessToken.trim();
  const blogIdentifier = normalizeTumblrBlogIdentifier(config.blogIdentifier);
  if (!accessToken) {
    throw new Error(
      "Tumblr OAuth2 access token is required. Create an app at tumblr.com/oauth/apps, then authorize via the API console.",
    );
  }
  if (!blogIdentifier) {
    throw new Error(
      "Tumblr blog identifier is required (e.g. myblog or myblog.tumblr.com).",
    );
  }

  const account = await fetchTumblrUserInfo(accessToken);
  const blogs = account.blogs;
  const match =
    blogs.find((blog) => {
      const name = (blog.name || "").toLowerCase();
      const url = (blog.url || "").toLowerCase();
      const needle = blogIdentifier.toLowerCase();
      return (
        needle === `${name}.tumblr.com` ||
        needle === name ||
        url.includes(needle) ||
        Boolean(blog.uuid && needle === blog.uuid.toLowerCase())
      );
    }) ||
    blogs.find((blog) => blog.primary) ||
    blogs[0];

  if (!match?.name) {
    throw new Error(
      "Tumblr token works, but no blog matched. Check the blog name (myblog or myblog.tumblr.com).",
    );
  }

  return {
    name: account.name || match.name,
    blog: {
      name: match.name,
      title: match.title,
      url: match.url || `https://${normalizeTumblrBlogIdentifier(match.name)}`,
      uuid: match.uuid,
      primary: match.primary,
    },
    blogs,
  };
}

function toTumblrContentBlocks(title: string, body: string, targetUrl?: string) {
  const blocks: { type: "text"; text: string; subtype?: string }[] = [];
  if (title.trim()) {
    blocks.push({ type: "text", text: title.trim(), subtype: "heading1" });
  }
  const cleaned = body.trim();
  if (cleaned) {
    blocks.push({ type: "text", text: cleaned });
  }
  if (targetUrl?.trim()) {
    blocks.push({ type: "text", text: targetUrl.trim() });
  }
  if (blocks.length === 0) {
    blocks.push({ type: "text", text: "Untitled post" });
  }
  return blocks;
}

export async function publishToTumblr(
  config: TumblrConfig,
  input: {
    title: string;
    body: string;
    targetUrl?: string;
    state?: "published" | "draft" | "queue" | "private";
  },
) {
  const verified = await testTumblrConnection(config);
  const blogIdentifier = normalizeTumblrBlogIdentifier(
    verified.blog.name || config.blogIdentifier,
  );

  const response = await fetch(
    `https://api.tumblr.com/v2/blog/${encodeURIComponent(blogIdentifier)}/posts`,
    {
      method: "POST",
      headers: authHeaders(config.accessToken),
      body: JSON.stringify({
        content: toTumblrContentBlocks(
          input.title,
          input.body,
          input.targetUrl,
        ),
        state: input.state ?? "published",
        source_url: input.targetUrl?.trim() || undefined,
      }),
    },
  );
  const data = await parseTumblrResponse(response);
  if (!response.ok) {
    throw new Error(
      tumblrErrorMessage(data, `Tumblr publish failed (${response.status})`),
    );
  }

  const postId =
    (data as { response?: { id?: string | number } }).response?.id ??
    (data as { response?: { id_string?: string } }).response?.id_string;
  const blogName = verified.blog.name;
  const url = postId
    ? `https://${normalizeTumblrBlogIdentifier(blogName)}/post/${postId}`
    : verified.blog.url || `https://${blogIdentifier}`;

  return {
    id: postId != null ? String(postId) : undefined,
    url,
    blogName,
  };
}
