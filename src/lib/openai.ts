/** Server-only OpenAI Chat Completions helper — same pattern as RankBrain X / OptiSync. */

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
const DEFAULT_TIMEOUT_MS = 45_000;

export type OpenAiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAiTokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type OpenAiChatResult = {
  content: string;
  model: string;
  usage: OpenAiTokenUsage | null;
};

export function getOpenAiApiKey(override?: string): string {
  return (override || process.env.OPENAI_API_KEY || "").trim();
}

export function isOpenAiConfigured(override?: string): boolean {
  return Boolean(getOpenAiApiKey(override));
}

export function getOpenAiModel(override?: string): string {
  return (
    (override || process.env.OPENAI_MODEL || "").trim() || DEFAULT_OPENAI_MODEL
  );
}

export class OpenAiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "OPENAI_ERROR") {
    super(message);
    this.name = "OpenAiError";
    this.status = status;
    this.code = code;
  }
}

function parseUsage(raw: unknown): OpenAiTokenUsage | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  const promptTokens =
    typeof u.prompt_tokens === "number" && Number.isFinite(u.prompt_tokens)
      ? Math.max(0, Math.floor(u.prompt_tokens))
      : null;
  const completionTokens =
    typeof u.completion_tokens === "number" &&
    Number.isFinite(u.completion_tokens)
      ? Math.max(0, Math.floor(u.completion_tokens))
      : null;
  if (promptTokens === null || completionTokens === null) return null;
  const totalTokens =
    typeof u.total_tokens === "number" && Number.isFinite(u.total_tokens)
      ? Math.max(0, Math.floor(u.total_tokens))
      : promptTokens + completionTokens;
  return { promptTokens, completionTokens, totalTokens };
}

export async function testOpenAiConnection(apiKey: string) {
  const key = apiKey.trim();
  if (!key) {
    throw new OpenAiError(
      "OPENAI_API_KEY is not configured.",
      503,
      "OPENAI_NOT_CONFIGURED",
    );
  }

  const response = await fetch(`${OPENAI_MODELS_URL}?limit=1`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const raw = (await response.json().catch(() => null)) as {
    error?: { message?: string };
    data?: { id?: string }[];
  } | null;

  if (!response.ok) {
    const detail =
      typeof raw?.error?.message === "string" && raw.error.message.trim()
        ? raw.error.message.trim()
        : `OpenAI key check failed (${response.status}).`;
    throw new OpenAiError(detail, response.status >= 400 ? response.status : 502);
  }

  return {
    ok: true as const,
    model: getOpenAiModel(),
    sampleModel: raw?.data?.[0]?.id || null,
  };
}

export async function createChatCompletion(options: {
  messages: OpenAiChatMessage[];
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
  apiKey?: string;
  model?: string;
}): Promise<OpenAiChatResult> {
  const apiKey = getOpenAiApiKey(options.apiKey);
  if (!apiKey) {
    throw new OpenAiError(
      "OPENAI_API_KEY is not configured. Connect OpenAI in Integrations or set OPENAI_API_KEY on the server.",
      503,
      "OPENAI_NOT_CONFIGURED",
    );
  }

  const model = getOpenAiModel(options.model);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: options.temperature ?? 0.35,
        messages: options.messages,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    const raw = (await response.json().catch(() => null)) as {
      error?: { message?: string };
      model?: string;
      usage?: unknown;
      choices?: { message?: { content?: string | null } }[];
    } | null;

    if (!response.ok) {
      const detail =
        typeof raw?.error?.message === "string" && raw.error.message.trim()
          ? raw.error.message.trim()
          : `OpenAI request failed (${response.status}).`;
      throw new OpenAiError(
        detail,
        response.status >= 400 ? response.status : 502,
      );
    }

    const content = raw?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new OpenAiError("OpenAI returned an empty response.", 502);
    }
    const usedModel =
      typeof raw?.model === "string" && raw.model.trim()
        ? raw.model.trim()
        : model;

    return {
      content: content.trim(),
      model: usedModel,
      usage: parseUsage(raw?.usage),
    };
  } catch (error) {
    if (error instanceof OpenAiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenAiError("OpenAI request timed out.", 504, "OPENAI_TIMEOUT");
    }
    throw new OpenAiError(
      error instanceof Error ? error.message : "OpenAI request failed.",
      502,
    );
  } finally {
    clearTimeout(timer);
  }
}
