export type WordPressConfig = {
  siteUrl: string;
  username: string;
  applicationPassword: string;
};

export function normalizeWordPressUrl(siteUrl: string) {
  return siteUrl.trim().replace(/\/$/, "");
}

function authHeader(username: string, applicationPassword: string) {
  const token = Buffer.from(
    `${username.trim()}:${applicationPassword.trim().replace(/\s+/g, "")}`,
  ).toString("base64");
  return `Basic ${token}`;
}

export async function testWordPressConnection(config: WordPressConfig) {
  const base = normalizeWordPressUrl(config.siteUrl);
  const response = await fetch(`${base}/wp-json/wp/v2/users/me`, {
    headers: {
      Authorization: authHeader(config.username, config.applicationPassword),
      Accept: "application/json",
    },
  });
  const data = (await response.json().catch(() => ({}))) as {
    id?: number;
    name?: string;
    slug?: string;
    message?: string;
    code?: string;
  };
  if (!response.ok) {
    throw new Error(
      data.message ||
        "WordPress auth failed. Check Site URL, username, and application password.",
    );
  }
  return { id: data.id, name: data.name, slug: data.slug };
}

export async function publishToWordPress(
  config: WordPressConfig,
  input: { title: string; body: string; targetUrl?: string },
) {
  const base = normalizeWordPressUrl(config.siteUrl);
  const content = input.targetUrl?.trim()
    ? `${input.body.trim()}\n\n<p><a href="${input.targetUrl.trim()}">${input.targetUrl.trim()}</a></p>`
    : input.body.trim();

  const response = await fetch(`${base}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization: authHeader(config.username, config.applicationPassword),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title: input.title.trim(),
      content,
      status: "publish",
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    id?: number;
    link?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(data.message || `WordPress publish failed (${response.status})`);
  }
  return { id: data.id, url: data.link || "" };
}
