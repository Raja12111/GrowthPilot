export type TelegramConfig = {
  botToken: string;
  channelId: string;
};

export type TelegramChannelInfo = {
  id: string;
  title: string;
  type?: string;
  username?: string;
};

function botApiBase(botToken: string) {
  return `https://api.telegram.org/bot${botToken.trim()}`;
}

async function telegramCall<T>(
  botToken: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${botApiBase(botToken)}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json()) as {
    ok: boolean;
    description?: string;
    result?: T;
  };

  if (!response.ok || !data.ok) {
    throw new Error(
      data.description || `Telegram API error (${response.status})`,
    );
  }

  return data.result as T;
}

export function normalizeChannelId(channelId: string) {
  const trimmed = channelId.trim();
  if (!trimmed) {
    throw new Error("Channel ID is required.");
  }
  // Accept @username or numeric -100... ids
  return trimmed;
}

export function formatTelegramMessage(input: {
  title: string;
  body: string;
  targetUrl?: string;
}) {
  const parts = [
    `<b>${escapeHtml(input.title.trim())}</b>`,
    "",
    escapeHtml(input.body.trim()),
  ];
  if (input.targetUrl?.trim()) {
    parts.push("", `<a href="${escapeAttr(input.targetUrl.trim())}">${escapeHtml(input.targetUrl.trim())}</a>`);
  }
  return parts.join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value: string) {
  return value.replaceAll('"', "&quot;");
}

export async function testTelegramConnection(config: TelegramConfig) {
  const bot = await telegramCall<{
    id: number;
    username?: string;
    first_name?: string;
  }>(config.botToken, "getMe");

  const chat = await telegramCall<{
    id: number;
    title?: string;
    type?: string;
    username?: string;
  }>(config.botToken, "getChat", {
    chat_id: normalizeChannelId(config.channelId),
  });

  return {
    botUsername: bot.username ? `@${bot.username}` : bot.first_name || "Bot",
    channel: {
      id: String(chat.id),
      title: chat.title || normalizeChannelId(config.channelId),
      type: chat.type,
      username: chat.username ? `@${chat.username}` : undefined,
    } satisfies TelegramChannelInfo,
  };
}

export async function publishToTelegram(
  config: TelegramConfig,
  input: { title: string; body: string; targetUrl?: string },
) {
  const text = formatTelegramMessage(input);
  const result = await telegramCall<{
    message_id: number;
    chat: { id: number; title?: string; username?: string };
  }>(config.botToken, "sendMessage", {
    chat_id: normalizeChannelId(config.channelId),
    text,
    parse_mode: "HTML",
    disable_web_page_preview: false,
  });

  const username = result.chat.username;
  const url = username
    ? `https://t.me/${username}/${result.message_id}`
    : `telegram://channel/${result.chat.id}/${result.message_id}`;

  return {
    messageId: result.message_id,
    chatId: String(result.chat.id),
    url,
    channelTitle: result.chat.title || "",
  };
}
