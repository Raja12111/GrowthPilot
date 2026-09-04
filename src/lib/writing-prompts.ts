import { storageKeyForUser } from "@/lib/auth-client";

export type PromptMode = "write" | "rewrite" | "both";

export type WritingPrompt = {
  id: string;
  name: string;
  body: string;
  mode: PromptMode;
  createdAt: string;
};

const PROMPTS_KEY = "growthpilot.writing.prompts.v1";
const ACTIVE_KEY = "growthpilot.writing.prompts.active.v1";

export const DEFAULT_PROMPTS: WritingPrompt[] = [
  {
    id: "default-write",
    name: "Default Write",
    body: "You write social and parasite-SEO posts for GrowthPilot. Produce ready-to-publish copy for the given platforms. Prefer short paragraphs, concrete benefits, and one clear CTA. Do not invent claims, discounts, or stats. Return only the post body — no title, no markdown fences, no preamble.",
    mode: "write",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "default-rewrite",
    name: "Default Rewrite",
    body: "You rewrite social and parasite-SEO posts for GrowthPilot. Keep the author's intent, facts, and links. Tighten wording, improve clarity and scannability, and match the destination platforms. Do not invent claims, discounts, or stats. Return only the rewritten post text — no title, no markdown fences, no preamble.",
    mode: "rewrite",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function key(base: string) {
  if (typeof window === "undefined") return base;
  return storageKeyForUser(base);
}

export function loadWritingPrompts(): WritingPrompt[] {
  if (typeof window === "undefined") return DEFAULT_PROMPTS;
  try {
    const raw = window.localStorage.getItem(key(PROMPTS_KEY));
    if (!raw) {
      saveWritingPrompts(DEFAULT_PROMPTS);
      return DEFAULT_PROMPTS;
    }
    const parsed = JSON.parse(raw) as WritingPrompt[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_PROMPTS;
    }
    return parsed.filter((item) => item?.id && item.name && item.body);
  } catch {
    return DEFAULT_PROMPTS;
  }
}

export function saveWritingPrompts(prompts: WritingPrompt[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(PROMPTS_KEY), JSON.stringify(prompts));
}

export function loadActivePromptId(mode: PromptMode = "write"): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(ACTIVE_KEY));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Record<PromptMode, string>>;
    return parsed[mode] || parsed.both || parsed.write || null;
  } catch {
    return null;
  }
}

export function saveActivePromptId(mode: PromptMode, id: string | null) {
  if (typeof window === "undefined") return;
  let current: Partial<Record<PromptMode, string>> = {};
  try {
    const raw = window.localStorage.getItem(key(ACTIVE_KEY));
    current = raw ? (JSON.parse(raw) as Partial<Record<PromptMode, string>>) : {};
  } catch {
    current = {};
  }
  if (id) current[mode] = id;
  else delete current[mode];
  window.localStorage.setItem(key(ACTIVE_KEY), JSON.stringify(current));
}

export function promptsForMode(
  prompts: WritingPrompt[],
  mode: "write" | "rewrite",
) {
  return prompts.filter((item) => item.mode === mode || item.mode === "both");
}

export function resolvePrompt(
  prompts: WritingPrompt[],
  mode: "write" | "rewrite",
  selectedId?: string | null,
) {
  const pool = promptsForMode(prompts, mode);
  return (
    pool.find((item) => item.id === selectedId) ||
    pool.find((item) => item.id === loadActivePromptId(mode)) ||
    pool[0] ||
    null
  );
}

export function createWritingPrompt(input: {
  name: string;
  body: string;
  mode?: PromptMode;
}): WritingPrompt {
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    body: input.body.trim(),
    mode: input.mode || "write",
    createdAt: new Date().toISOString(),
  };
}
