import jwt from "jsonwebtoken";

export type GhostConfig = {
  apiUrl: string;
  adminApiKey: string;
};

export function normalizeGhostUrl(apiUrl: string) {
  return apiUrl.trim().replace(/\/$/, "");
}

export function createGhostAdminToken(adminApiKey: string) {
  const [id, secret] = adminApiKey.split(":");
  if (!id || !secret) {
    throw new Error(
      "Admin API Key must look like id:secret from Ghost → Integrations.",
    );
  }

  return jwt.sign({}, Buffer.from(secret, "hex"), {
    keyid: id,
    algorithm: "HS256",
    expiresIn: "5m",
    audience: "/admin/",
  });
}

export async function ghostAdminFetch(
  config: GhostConfig,
  path: string,
  init?: RequestInit,
) {
  const base = normalizeGhostUrl(config.apiUrl);
  const token = createGhostAdminToken(config.adminApiKey);
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Ghost ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
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
      "errors" in data &&
      Array.isArray((data as { errors: { message?: string }[] }).errors)
        ? (data as { errors: { message?: string }[] }).errors
            .map((e) => e.message)
            .filter(Boolean)
            .join("; ")
        : `Ghost API error (${response.status})`;
    throw new Error(message || `Ghost API error (${response.status})`);
  }

  return data;
}

export function toGhostHtml(body: string, targetUrl?: string) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const cta = targetUrl?.trim()
    ? `<p><a href="${targetUrl.trim()}">${targetUrl.trim()}</a></p>`
    : "";

  return `${paragraphs}${cta}`;
}

export async function publishToGhost(
  config: GhostConfig,
  input: { title: string; body: string; targetUrl?: string; status?: "draft" | "published" },
) {
  const html = toGhostHtml(input.body, input.targetUrl);
  const payload = {
    posts: [
      {
        title: input.title,
        html,
        status: input.status ?? "published",
        tags: [{ name: "parasite-posting" }],
      },
    ],
  };

  const data = (await ghostAdminFetch(
    config,
    "/ghost/api/admin/posts/?source=html",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  )) as {
    posts?: { id?: string; url?: string; slug?: string; status?: string }[];
  };

  const post = data.posts?.[0];
  return {
    id: post?.id ?? "",
    url: post?.url ?? "",
    slug: post?.slug ?? "",
    status: post?.status ?? input.status ?? "published",
  };
}

export async function testGhostConnection(config: GhostConfig) {
  const data = (await ghostAdminFetch(
    config,
    "/ghost/api/admin/site/",
  )) as { site?: { title?: string; url?: string } };

  return {
    title: data.site?.title ?? "Ghost site",
    url: data.site?.url ?? normalizeGhostUrl(config.apiUrl),
  };
}
