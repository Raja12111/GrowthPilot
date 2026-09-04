export type BlueskyConnection = {
  handle: string;
  appPassword: string;
  connectedAt?: string;
  did?: string;
};

const KEY = "growthpilot.bluesky.connection.v1";

export function loadBlueskyConnection(): BlueskyConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BlueskyConnection) : null;
  } catch {
    return null;
  }
}

export function saveBlueskyConnection(connection: BlueskyConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(KEY);
    return;
  }
  window.localStorage.setItem(KEY, JSON.stringify(connection));
}
