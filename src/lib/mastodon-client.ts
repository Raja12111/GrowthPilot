export type MastodonConnection = {
  instanceUrl: string;
  accessToken: string;
  connectedAt?: string;
  accountId?: string;
  username?: string;
  acct?: string;
  displayName?: string;
  profileUrl?: string;
};

const KEY = "growthpilot.mastodon.connection.v1";

export function loadMastodonConnection(): MastodonConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MastodonConnection) : null;
  } catch {
    return null;
  }
}

export function saveMastodonConnection(connection: MastodonConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(KEY);
    return;
  }
  window.localStorage.setItem(KEY, JSON.stringify(connection));
}
