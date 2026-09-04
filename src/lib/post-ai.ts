/** Social post rewrite / write prompts using RankBrain-style OpenAI chat completions. */

import {
  createChatCompletion,
  type OpenAiChatResult,
} from "@/lib/openai";

function platformHint(platforms?: string[]) {
  if (!platforms?.length) return "general social / blog channels";
  return platforms.join(", ");
}

export async function rewriteSocialPost(input: {
  body: string;
  platforms?: string[];
  targetUrl?: string;
  systemPrompt?: string;
  apiKey?: string;
  model?: string;
}): Promise<OpenAiChatResult> {
  const body = input.body.trim();
  if (!body) {
    throw new Error("Write something first, then use Rewrite.");
  }

  const platforms = platformHint(input.platforms);
  const urlLine = input.targetUrl?.trim()
    ? `Optional link to include naturally: ${input.targetUrl.trim()}`
    : "No mandatory link.";

  return createChatCompletion({
    apiKey: input.apiKey,
    model: input.model,
    temperature: 0.45,
    json: false,
    messages: [
      {
        role: "system",
        content:
          input.systemPrompt?.trim() ||
          "You rewrite social and parasite-SEO posts for GrowthPilot. Keep the author's intent, facts, and links. Tighten wording, improve clarity and scannability, and match the destination platforms. Do not invent claims, discounts, or stats. Return only the rewritten post text — no title, no markdown fences, no preamble.",
      },
      {
        role: "user",
        content: `Platforms: ${platforms}\n${urlLine}\n\nRewrite this post:\n\n${body}`,
      },
    ],
  });
}

export async function writeSocialPost(input: {
  topic: string;
  platforms?: string[];
  targetUrl?: string;
  tone?: string;
  systemPrompt?: string;
  apiKey?: string;
  model?: string;
}): Promise<OpenAiChatResult> {
  const topic = input.topic.trim();
  if (!topic) {
    throw new Error("Add a topic or brief, then use Write.");
  }

  const platforms = platformHint(input.platforms);
  const urlLine = input.targetUrl?.trim()
    ? `Include this URL once, naturally: ${input.targetUrl.trim()}`
    : "No mandatory link.";
  const tone = input.tone?.trim() || "clear, confident, practical";

  return createChatCompletion({
    apiKey: input.apiKey,
    model: input.model,
    temperature: 0.55,
    json: false,
    messages: [
      {
        role: "system",
        content:
          input.systemPrompt?.trim() ||
          "You write social and parasite-SEO posts for GrowthPilot. Produce ready-to-publish copy for the given platforms. Prefer short paragraphs, concrete benefits, and one clear CTA. Do not invent claims, discounts, or stats. Return only the post body — no title, no markdown fences, no preamble.",
      },
      {
        role: "user",
        content: `Platforms: ${platforms}\nTone: ${tone}\n${urlLine}\n\nBrief:\n${topic}`,
      },
    ],
  });
}
