export type LiveJournalConnection = {
  username: string;
  password: string;
  connectedAt?: string;
  fullname?: string;
  profileUrl?: string;
};

const LJ_KEY = "growthpilot.livejournal.connection.v1";

export function loadLiveJournalConnection(): LiveJournalConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LJ_KEY);
    return raw ? (JSON.parse(raw) as LiveJournalConnection) : null;
  } catch {
    return null;
  }
}

export function saveLiveJournalConnection(
  connection: LiveJournalConnection | null,
) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(LJ_KEY);
    return;
  }
  window.localStorage.setItem(LJ_KEY, JSON.stringify(connection));
}
