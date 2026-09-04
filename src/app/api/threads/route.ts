import { NextResponse } from "next/server";
import {
  publishToThreads,
  testThreadsConnection,
  threadsOAuthConfigured,
} from "@/lib/threads";

type Body = {
  accessToken?: string;
  userId?: string;
  title?: string;
  body?: string;
  targetUrl?: string;
  action?: "test" | "publish" | "status";
};

function resolveConfig(input: Body) {
  const accessToken = (
    input.accessToken ||
    process.env.THREADS_ACCESS_TOKEN ||
    ""
  ).trim();
  const userId = (
    input.userId ||
    process.env.THREADS_USER_ID ||
    ""
  ).trim();

  if (!accessToken || !userId) {
    throw new Error(
      "Threads access token and user id are required. Connect Threads first.",
    );
  }

  return { accessToken, userId };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    oauthConfigured: threadsOAuthConfigured(),
    message: threadsOAuthConfigured()
      ? "OAuth is configured. Use Connect with Threads."
      : "Set THREADS_APP_ID and THREADS_APP_SECRET for OAuth, or paste a token manually.",
  });
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const action = json.action ?? "publish";

    if (action === "status") {
      return NextResponse.json({
        ok: true,
        oauthConfigured: threadsOAuthConfigured(),
      });
    }

    const config = resolveConfig(json);

    if (action === "test") {
      const profile = await testThreadsConnection(config);
      return NextResponse.json({ ok: true, profile });
    }

    if (!json.title?.trim() || !json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title and body are required to publish." },
        { status: 400 },
      );
    }

    const post = await publishToThreads(config, {
      title: json.title.trim(),
      body: json.body.trim(),
      targetUrl: json.targetUrl,
    });

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Threads request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
