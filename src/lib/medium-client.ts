export type MediumConnection = {
  integrationToken: string;
  connectedAt?: string;
  userId?: string;
  username?: string;
  name?: string;
  profileUrl?: string;
};

const KEY = "growthpilot.medium.connection.v1";

export function loadMediumConnection(): MediumConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MediumConnection) : null;
  } catch {
    return null;
  }
}

export function saveMediumConnection(connection: MediumConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(KEY);
    return;
  }
  window.localStorage.setItem(KEY, JSON.stringify(connection));
}
