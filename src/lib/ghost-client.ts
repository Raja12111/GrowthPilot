export type GhostConnection = {
  apiUrl: string;
  adminApiKey: string;
  connectedAt?: string;
  siteTitle?: string;
};

const GHOST_KEY = "growthpilot.ghost.connection.v1";

export function loadGhostConnection(): GhostConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GHOST_KEY);
    return raw ? (JSON.parse(raw) as GhostConnection) : null;
  } catch {
    return null;
  }
}

export function saveGhostConnection(connection: GhostConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(GHOST_KEY);
    return;
  }
  window.localStorage.setItem(GHOST_KEY, JSON.stringify(connection));
}
