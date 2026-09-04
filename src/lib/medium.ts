export type MediumConfig = {
  integrationToken: string;
};

export type MediumUser = {
  id: string;
  username?: string;
  name?: string;
  url?: string;
};

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token.trim()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Charset": "utf-8",
  };
}

async function parseMediumResponse(response: Response) {
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return data;
}

function mediumErrorMessage(data: unknown, fallback: string) {
  if (
    typeof data === "object" &&
    data &&
    "errors" in data &&
    Array.isArray((data as { errors: { message?: string }[] }).errors)
  ) {
    const message = (data as { errors: { message?: string }[] }).errors
      .map((e) => e.message)
      .filter(Boolean)
      .join("; ");
    if (message) return message;
  }
  return fallback;
}

export async function testMediumConnection(config: MediumConfig) {
  const response = await fetch("https://api.medium.com/v1/me", {
    headers: authHeaders(config.integrationToken),
  });
  const data = await parseMediumResponse(response);
  if (!response.ok) {
    throw new Error(
      mediumErrorMessage(
        data,
        "Invalid Medium integration token. Create one in Medium Settings → Security and apps → Integration tokens.",
      ),
    );
  }

  const user = (data as { data?: MediumUser }).data;
  if (!user?.id) {
    throw new Error("Medium returned no user id. Check your integration token.");
  }
  return user;
}

export function toMediumMarkdown(body: string, targetUrl?: string) {
  const cleaned = body.trim();
  const cta = targetUrl?.trim()
    ? `\n\n[Read more](${targetUrl.trim()})`
    : "";
  return `${cleaned}${cta}`;
}

export async function publishToMedium(
  config: MediumConfig,
  input: {
    title: string;
    body: string;
    targetUrl?: string;
    publishStatus?: "public" | "draft" | "unlisted";
  },
) {
  const user = await testMediumConnection(config);
  const response = await fetch(
    `https://api.medium.com/v1/users/${user.id}/posts`,
    {
      method: "POST",
      headers: authHeaders(config.integrationToken),
      body: JSON.stringify({
        title: input.title.trim(),
        contentFormat: "markdown",
        content: toMediumMarkdown(input.body, input.targetUrl),
        publishStatus: input.publishStatus ?? "public",
        canonicalUrl: input.targetUrl?.trim() || undefined,
      }),
    },
  );
  const data = await parseMediumResponse(response);
  if (!response.ok) {
    throw new Error(
      mediumErrorMessage(data, `Medium publish failed (${response.status})`),
    );
  }

  const post = (data as {
    data?: { id?: string; url?: string; title?: string };
  }).data;
  return {
    id: post?.id,
    url: post?.url || "",
    title: post?.title || input.title,
  };
}
