export type TelegramConnection = {
  botToken: string;
  channelId: string;
  connectedAt?: string;
  botUsername?: string;
  channelTitle?: string;
};

const TELEGRAM_KEY = "growthpilot.telegram.connection.v1";

export function loadTelegramConnection(): TelegramConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TELEGRAM_KEY);
    return raw ? (JSON.parse(raw) as TelegramConnection) : null;
  } catch {
    return null;
  }
}

export function saveTelegramConnection(connection: TelegramConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(TELEGRAM_KEY);
    return;
  }
  window.localStorage.setItem(TELEGRAM_KEY, JSON.stringify(connection));
}
