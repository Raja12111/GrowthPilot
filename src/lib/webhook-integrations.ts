export type WebhookPayload = {
  title: string;
  content: string;
  html: string;
  imageUrl?: string;
  timestamp: string;
  targetUrl?: string;
  source: "growthpilot";
};

export function toWebhookHtml(body: string, targetUrl?: string) {
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

export async function postWebhook(
  webhookUrl: string,
  input: {
    title: string;
    body: string;
    targetUrl?: string;
    imageUrl?: string;
  },
) {
  const payload: WebhookPayload = {
    title: input.title.trim(),
    content: input.body.trim(),
    html: toWebhookHtml(input.body, input.targetUrl),
    imageUrl: input.imageUrl,
    timestamp: new Date().toISOString(),
    targetUrl: input.targetUrl?.trim() || undefined,
    source: "growthpilot",
  };

  const response = await fetch(webhookUrl.trim(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text || `Webhook failed (${response.status}). Check the URL is active.`,
    );
  }

  return { url: webhookUrl.trim(), status: response.status };
}

export async function testWebhook(webhookUrl: string) {
  return postWebhook(webhookUrl, {
    title: "GrowthPilot connection test",
    body: "Webhook connected successfully from GrowthPilot.",
  });
}
