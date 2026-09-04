export type WebflowConfig = {
  apiToken: string;
  siteId: string;
  collectionId: string;
};

export type WebflowSite = {
  id: string;
  displayName: string;
  shortName?: string;
};

export type WebflowCollection = {
  id: string;
  displayName: string;
  slug?: string;
};

export type WebflowField = {
  id: string;
  slug: string;
  displayName: string;
  type: string;
  isRequired?: boolean;
};

const API = "https://api.webflow.com/v2";

async function webflowFetch<T>(
  apiToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken.trim()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
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
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : typeof data === "object" &&
            data &&
            "msg" in data &&
            typeof (data as { msg: unknown }).msg === "string"
          ? (data as { msg: string }).msg
          : `Webflow API error (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function listWebflowSites(apiToken: string): Promise<WebflowSite[]> {
  const data = await webflowFetch<{
    sites?: { id: string; displayName?: string; shortName?: string }[];
  }>(apiToken, "/sites");

  return (data.sites ?? []).map((site) => ({
    id: site.id,
    displayName: site.displayName || site.shortName || site.id,
    shortName: site.shortName,
  }));
}

export async function listWebflowCollections(
  apiToken: string,
  siteId: string,
): Promise<WebflowCollection[]> {
  const data = await webflowFetch<{
    collections?: { id: string; displayName?: string; slug?: string }[];
  }>(apiToken, `/sites/${siteId}/collections`);

  return (data.collections ?? []).map((collection) => ({
    id: collection.id,
    displayName: collection.displayName || collection.slug || collection.id,
    slug: collection.slug,
  }));
}

export async function getWebflowCollectionFields(
  apiToken: string,
  collectionId: string,
): Promise<WebflowField[]> {
  const data = await webflowFetch<{
    fields?: {
      id: string;
      slug: string;
      displayName?: string;
      type?: string;
      isRequired?: boolean;
    }[];
  }>(apiToken, `/collections/${collectionId}`);

  return (data.fields ?? []).map((field) => ({
    id: field.id,
    slug: field.slug,
    displayName: field.displayName || field.slug,
    type: field.type || "PlainText",
    isRequired: field.isRequired,
  }));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `post-${Date.now()}`;
}

function toHtml(body: string, targetUrl?: string) {
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

const BODY_SLUGS = [
  "post-body",
  "body",
  "content",
  "rich-text",
  "post-content",
  "article-body",
  "main-content",
];

const SUMMARY_SLUGS = ["summary", "excerpt", "description", "intro", "subtitle"];
const LINK_SLUGS = ["link", "url", "cta-url", "target-url", "external-link"];

export function buildWebflowFieldData(
  fields: WebflowField[],
  input: { title: string; body: string; targetUrl?: string },
) {
  const bySlug = new Map(fields.map((field) => [field.slug, field]));
  const fieldData: Record<string, string> = {
    name: input.title.trim(),
    slug: slugify(input.title),
  };

  const html = toHtml(input.body, input.targetUrl);
  const plain = [
    input.body.trim(),
    input.targetUrl?.trim() ? input.targetUrl.trim() : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const bodyField =
    BODY_SLUGS.map((slug) => bySlug.get(slug)).find(Boolean) ||
    fields.find((field) =>
      /RichText|PlainText/i.test(field.type) &&
      !["name", "slug"].includes(field.slug),
    );

  if (bodyField) {
    fieldData[bodyField.slug] = /RichText/i.test(bodyField.type) ? html : plain;
  }

  const summaryField = SUMMARY_SLUGS.map((slug) => bySlug.get(slug)).find(
    Boolean,
  );
  if (summaryField) {
    fieldData[summaryField.slug] = input.body.trim().slice(0, 240);
  }

  const linkField = LINK_SLUGS.map((slug) => bySlug.get(slug)).find(Boolean);
  if (linkField && input.targetUrl?.trim()) {
    fieldData[linkField.slug] = input.targetUrl.trim();
  }

  return fieldData;
}

export async function testWebflowConnection(apiToken: string) {
  const sites = await listWebflowSites(apiToken);
  if (sites.length === 0) {
    throw new Error(
      "Token works, but no sites were returned. Check Sites Read permission.",
    );
  }
  return { sites };
}

export async function publishToWebflow(
  config: WebflowConfig,
  input: { title: string; body: string; targetUrl?: string },
) {
  const fields = await getWebflowCollectionFields(
    config.apiToken,
    config.collectionId,
  );
  const fieldData = buildWebflowFieldData(fields, input);

  const data = await webflowFetch<{
    id?: string;
    fieldData?: { name?: string; slug?: string };
  }>(config.apiToken, `/collections/${config.collectionId}/items/live`, {
    method: "POST",
    body: JSON.stringify({
      isArchived: false,
      isDraft: false,
      fieldData,
    }),
  });

  const sites = await listWebflowSites(config.apiToken);
  const site = sites.find((item) => item.id === config.siteId);
  const slug = data.fieldData?.slug || fieldData.slug;
  const shortName = site?.shortName;

  return {
    id: data.id || "",
    slug,
    url: shortName ? `https://${shortName}.webflow.io` : "",
    name: data.fieldData?.name || input.title,
  };
}
