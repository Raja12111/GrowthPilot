export type InstantlyConnection = {
  apiKey: string;
  workspaceName?: string;
  workspaceId?: string;
  connectedAt?: string;
};

const INSTANTLY_KEY = "growthpilot.instantly.connection.v1";

export function loadInstantlyConnection(): InstantlyConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(INSTANTLY_KEY);
    const parsed = raw ? (JSON.parse(raw) as InstantlyConnection) : null;
    if (!parsed?.apiKey?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveInstantlyConnection(connection: InstantlyConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(INSTANTLY_KEY);
    return;
  }
  window.localStorage.setItem(INSTANTLY_KEY, JSON.stringify(connection));
}
