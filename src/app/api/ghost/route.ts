import { NextResponse } from "next/server";
import { publishToGhost, testGhostConnection } from "@/lib/ghost";

type Body = {
  apiUrl?: string;
  adminApiKey?: string;
  title?: string;
  body?: string;
  targetUrl?: string;
  status?: "draft" | "published";
  action?: "test" | "publish";
};

function resolveConfig(input: Body) {
  const apiUrl = (input.apiUrl || process.env.GHOST_API_URL || "").trim();
  const adminApiKey = (
    input.adminApiKey ||
    process.env.GHOST_ADMIN_API_KEY ||
    ""
  ).trim();

  if (!apiUrl || !adminApiKey) {
    throw new Error(
      "Ghost Site URL and Admin API Key are required. Connect Ghost first.",
    );
  }

  return { apiUrl, adminApiKey };
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const action = json.action ?? "publish";
    const config = resolveConfig(json);

    if (action === "test") {
      const site = await testGhostConnection(config);
      return NextResponse.json({ ok: true, site });
    }

    if (!json.title?.trim() || !json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title and body are required to publish." },
        { status: 400 },
      );
    }

    const post = await publishToGhost(config, {
      title: json.title.trim(),
      body: json.body.trim(),
      targetUrl: json.targetUrl,
      status: json.status ?? "published",
    });

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ghost request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
