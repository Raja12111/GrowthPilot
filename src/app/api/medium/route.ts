import { NextResponse } from "next/server";
import { publishToMedium, testMediumConnection } from "@/lib/medium";

export const runtime = "nodejs";

type Body = {
  integrationToken?: string;
  title?: string;
  body?: string;
  targetUrl?: string;
  publishStatus?: "public" | "draft" | "unlisted";
  action?: "test" | "publish";
};

function resolveToken(input: Body) {
  const integrationToken = (
    input.integrationToken ||
    process.env.MEDIUM_INTEGRATION_TOKEN ||
    ""
  ).trim();
  if (!integrationToken) {
    throw new Error(
      "Medium integration token is required. Create one in Medium Settings → Security and apps.",
    );
  }
  return integrationToken;
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const integrationToken = resolveToken(json);
    const action = json.action ?? "publish";

    if (action === "test") {
      const user = await testMediumConnection({ integrationToken });
      return NextResponse.json({ ok: true, user });
    }

    if (!json.title?.trim() || !json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title and body are required to publish." },
        { status: 400 },
      );
    }

    const post = await publishToMedium(
      { integrationToken },
      {
        title: json.title.trim(),
        body: json.body.trim(),
        targetUrl: json.targetUrl,
        publishStatus: json.publishStatus ?? "public",
      },
    );

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Medium request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
