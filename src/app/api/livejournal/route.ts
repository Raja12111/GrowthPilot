export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  publishToLiveJournal,
  testLiveJournalConnection,
} from "@/lib/livejournal";

type Body = {
  username?: string;
  password?: string;
  title?: string;
  body?: string;
  targetUrl?: string;
  action?: "test" | "publish";
};

function resolveConfig(input: Body) {
  const username = (
    input.username ||
    process.env.LIVEJOURNAL_USERNAME ||
    ""
  ).trim();
  const password = (
    input.password ||
    process.env.LIVEJOURNAL_PASSWORD ||
    ""
  ).trim();

  if (!username || !password) {
    throw new Error(
      "LiveJournal username and password are required. Connect LiveJournal first.",
    );
  }

  return { username, password };
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const action = json.action ?? "publish";
    const config = resolveConfig(json);

    if (action === "test") {
      const account = await testLiveJournalConnection(config);
      return NextResponse.json({ ok: true, account });
    }

    if (!json.title?.trim() || !json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title and body are required to publish." },
        { status: 400 },
      );
    }

    const post = await publishToLiveJournal(config, {
      title: json.title.trim(),
      body: json.body.trim(),
      targetUrl: json.targetUrl,
    });

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "LiveJournal request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
