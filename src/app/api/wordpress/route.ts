import { NextResponse } from "next/server";
import { publishToWordPress, testWordPressConnection } from "@/lib/wordpress";

export const runtime = "nodejs";

type Body = {
  siteUrl?: string;
  username?: string;
  applicationPassword?: string;
  title?: string;
  body?: string;
  targetUrl?: string;
  action?: "test" | "publish";
};

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const siteUrl = (json.siteUrl || "").trim();
    const username = (json.username || "").trim();
    const applicationPassword = (json.applicationPassword || "").trim();
    if (!siteUrl || !username || !applicationPassword) {
      throw new Error(
        "Site URL, username, and application password are required.",
      );
    }
    const config = { siteUrl, username, applicationPassword };
    const action = json.action ?? "publish";

    if (action === "test") {
      const user = await testWordPressConnection(config);
      return NextResponse.json({ ok: true, user });
    }

    if (!json.title?.trim() || !json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title and body are required." },
        { status: 400 },
      );
    }

    const post = await publishToWordPress(config, {
      title: json.title.trim(),
      body: json.body.trim(),
      targetUrl: json.targetUrl,
    });
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "WordPress request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
