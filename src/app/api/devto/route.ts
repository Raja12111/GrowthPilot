import { NextResponse } from "next/server";
import { publishToDevto, testDevtoConnection } from "@/lib/devto";

export const runtime = "nodejs";

type Body = {
  apiKey?: string;
  title?: string;
  body?: string;
  targetUrl?: string;
  published?: boolean;
  action?: "test" | "publish";
};

function resolveConfig(input: Body) {
  const apiKey = (input.apiKey || process.env.DEVTO_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error(
      "DEV.to API Key is required. Generate one in DEV.to → Settings → Extensions.",
    );
  }
  return { apiKey };
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const action = json.action ?? "publish";
    const config = resolveConfig(json);

    if (action === "test") {
      const user = await testDevtoConnection(config);
      return NextResponse.json({ ok: true, user });
    }

    if (!json.title?.trim() || !json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title and body are required to publish." },
        { status: 400 },
      );
    }

    const post = await publishToDevto(config, {
      title: json.title.trim(),
      body: json.body.trim(),
      targetUrl: json.targetUrl,
      published: json.published ?? true,
    });

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "DEV.to request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
