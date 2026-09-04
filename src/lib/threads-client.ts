export type ThreadsConnection = {
  accessToken: string;
  userId: string;
  username?: string;
  name?: string;
  profileUrl?: string;
  connectedAt?: string;
};

const THREADS_KEY = "growthpilot.threads.connection.v1";

export function loadThreadsConnection(): ThreadsConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THREADS_KEY);
    return raw ? (JSON.parse(raw) as ThreadsConnection) : null;
  } catch {
    return null;
  }
}

export function saveThreadsConnection(connection: ThreadsConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(THREADS_KEY);
    return;
  }
  window.localStorage.setItem(THREADS_KEY, JSON.stringify(connection));
}
