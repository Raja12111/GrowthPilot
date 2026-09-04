export type HashnodeConnection = {
  accessToken: string;
  publicationId: string;
  publicationTitle?: string;
  publicationUrl?: string;
  username?: string;
  name?: string;
  connectedAt?: string;
};

const HASHNODE_KEY = "growthpilot.hashnode.connection.v1";

export function loadHashnodeConnection(): HashnodeConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HASHNODE_KEY);
    const parsed = raw ? (JSON.parse(raw) as HashnodeConnection) : null;
    if (!parsed?.accessToken?.trim() || !parsed?.publicationId?.trim()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveHashnodeConnection(connection: HashnodeConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(HASHNODE_KEY);
    return;
  }
  window.localStorage.setItem(HASHNODE_KEY, JSON.stringify(connection));
}
