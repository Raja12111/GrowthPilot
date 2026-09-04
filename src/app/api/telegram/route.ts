import { NextResponse } from "next/server";
import { publishToTelegram, testTelegramConnection } from "@/lib/telegram";

type Body = {
  botToken?: string;
  channelId?: string;
  title?: string;
  body?: string;
  targetUrl?: string;
  action?: "test" | "publish";
};

function resolveConfig(input: Body) {
  const botToken = (
    input.botToken ||
    process.env.TELEGRAM_BOT_TOKEN ||
    ""
  ).trim();
  const channelId = (
    input.channelId ||
    process.env.TELEGRAM_CHANNEL_ID ||
    ""
  ).trim();

  if (!botToken || !channelId) {
    throw new Error(
      "Telegram Bot Token and Channel ID are required. Connect Telegram first.",
    );
  }

  return { botToken, channelId };
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const action = json.action ?? "publish";
    const config = resolveConfig(json);

    if (action === "test") {
      const info = await testTelegramConnection(config);
      return NextResponse.json({ ok: true, ...info });
    }

    if (!json.title?.trim() || !json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title and body are required to publish." },
        { status: 400 },
      );
    }

    const post = await publishToTelegram(config, {
      title: json.title.trim(),
      body: json.body.trim(),
      targetUrl: json.targetUrl,
    });

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Telegram request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
