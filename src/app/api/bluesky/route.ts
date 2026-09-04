import { NextResponse } from "next/server";
import { publishToBluesky, testBlueskyConnection } from "@/lib/bluesky";

export const runtime = "nodejs";

type Body = {
  handle?: string;
  appPassword?: string;
  body?: string;
  targetUrl?: string;
  action?: "test" | "publish";
};

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const handle = (json.handle || "").trim();
    const appPassword = (json.appPassword || "").trim();
    if (!handle || !appPassword) {
      throw new Error("Bluesky handle and app password are required.");
    }
    const config = { handle, appPassword };
    const action = json.action ?? "publish";

    if (action === "test") {
      const account = await testBlueskyConnection(config);
      return NextResponse.json({ ok: true, account });
    }

    if (!json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Post body is required." },
        { status: 400 },
      );
    }

    const post = await publishToBluesky(config, {
      body: json.body.trim(),
      targetUrl: json.targetUrl,
    });
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bluesky request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
