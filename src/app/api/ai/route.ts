import { NextResponse } from "next/server";
import {
  getOpenAiApiKey,
  getOpenAiModel,
  isOpenAiConfigured,
  OpenAiError,
  testOpenAiConnection,
} from "@/lib/openai";
import { rewriteSocialPost, writeSocialPost } from "@/lib/post-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  action?: "test" | "rewrite" | "write" | "status";
  apiKey?: string;
  model?: string;
  body?: string;
  topic?: string;
  platforms?: string[];
  targetUrl?: string;
  tone?: string;
  systemPrompt?: string;
};

function resolveKey(input: Body) {
  return getOpenAiApiKey(input.apiKey);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: isOpenAiConfigured(),
    model: getOpenAiModel(),
    source: "rankbrainx-openai-chat-completions",
  });
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const action = json.action ?? "rewrite";
    const apiKey = resolveKey(json);
    const model = json.model?.trim() || undefined;

    if (action === "status") {
      return NextResponse.json({
        ok: true,
        configured: Boolean(apiKey) || isOpenAiConfigured(),
        model: getOpenAiModel(model),
      });
    }

    if (action === "test") {
      if (!apiKey) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "OpenAI API key is required. Paste a key from platform.openai.com/api-keys, or set OPENAI_API_KEY on the server.",
          },
          { status: 400 },
        );
      }
      const result = await testOpenAiConnection(apiKey);
      return NextResponse.json({
        ok: true,
        model: result.model,
        sampleModel: result.sampleModel,
      });
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          code: "OPENAI_NOT_CONFIGURED",
          error:
            "ChatGPT is not configured. Connect OpenAI under Integrations → OpenAI, or set OPENAI_API_KEY (same as RankBrain X).",
        },
        { status: 503 },
      );
    }

    if (action === "write") {
      const result = await writeSocialPost({
        topic: json.topic || json.body || "",
        platforms: json.platforms,
        targetUrl: json.targetUrl,
        tone: json.tone,
        systemPrompt: json.systemPrompt,
        apiKey,
        model,
      });
      return NextResponse.json({
        ok: true,
        text: result.content,
        model: result.model,
        usage: result.usage,
      });
    }

    // rewrite (default)
    const result = await rewriteSocialPost({
      body: json.body || "",
      platforms: json.platforms,
      targetUrl: json.targetUrl,
      systemPrompt: json.systemPrompt,
      apiKey,
      model,
    });
    return NextResponse.json({
      ok: true,
      text: result.content,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    if (error instanceof OpenAiError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status >= 400 ? error.status : 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "AI request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
