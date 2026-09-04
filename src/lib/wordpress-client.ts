export type WordPressConnection = {
  siteUrl: string;
  username: string;
  applicationPassword: string;
  connectedAt?: string;
  displayName?: string;
};

const KEY = "growthpilot.wordpress.connection.v1";

export function loadWordPressConnection(): WordPressConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WordPressConnection) : null;
  } catch {
    return null;
  }
}

export function saveWordPressConnection(connection: WordPressConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(KEY);
    return;
  }
  window.localStorage.setItem(KEY, JSON.stringify(connection));
}
