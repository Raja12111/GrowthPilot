export type DevtoConnection = {
  apiKey: string;
  connectedAt?: string;
  username?: string;
  name?: string;
};

const DEVTO_KEY = "growthpilot.devto.connection.v1";

export function loadDevtoConnection(): DevtoConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEVTO_KEY);
    return raw ? (JSON.parse(raw) as DevtoConnection) : null;
  } catch {
    return null;
  }
}

export function saveDevtoConnection(connection: DevtoConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(DEVTO_KEY);
    return;
  }
  window.localStorage.setItem(DEVTO_KEY, JSON.stringify(connection));
}
