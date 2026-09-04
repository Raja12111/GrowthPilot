export type DevtoConfig = {
  apiKey: string;
};

export type DevtoUser = {
  username?: string;
  name?: string;
};

export type DevtoArticle = {
  id?: number;
  url?: string;
  title?: string;
};

function authHeaders(apiKey: string): HeadersInit {
  return {
    "api-key": apiKey.trim(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function testDevtoConnection(config: DevtoConfig) {
  const response = await fetch("https://dev.to/api/users/me", {
    headers: authHeaders(config.apiKey),
  });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data &&
      "error" in data &&
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : `DEV.to API error (${response.status})`;
    throw new Error(
      message ||
        "Invalid DEV.to API key. Generate one in Settings → Extensions.",
    );
  }

  return data as DevtoUser;
}

export function toDevtoMarkdown(body: string, targetUrl?: string) {
  const cleaned = body.trim();
  const cta = targetUrl?.trim()
    ? `\n\n[Read more](${targetUrl.trim()})`
    : "";
  return `${cleaned}${cta}`;
}

export async function publishToDevto(
  config: DevtoConfig,
  input: {
    title: string;
    body: string;
    targetUrl?: string;
    published?: boolean;
  },
) {
  const response = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: authHeaders(config.apiKey),
    body: JSON.stringify({
      article: {
        title: input.title.trim(),
        body_markdown: toDevtoMarkdown(input.body, input.targetUrl),
        published: input.published ?? true,
      },
    }),
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data &&
      "error" in data &&
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : `DEV.to publish failed (${response.status})`;
    throw new Error(message);
  }

  const article = data as DevtoArticle;
  return {
    id: article.id,
    url: article.url || "",
    title: article.title || input.title,
  };
}
