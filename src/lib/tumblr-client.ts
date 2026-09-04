export type TumblrBlogOption = {
  name: string;
  title?: string;
  url?: string;
  primary?: boolean;
};

export type TumblrConnection = {
  accessToken: string;
  blogIdentifier: string;
  refreshToken?: string;
  connectedAt?: string;
  userName?: string;
  blogName?: string;
  blogTitle?: string;
  blogUrl?: string;
  blogs?: TumblrBlogOption[];
};

const KEY = "growthpilot.tumblr.connection.v1";

export function loadTumblrConnection(): TumblrConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TumblrConnection) : null;
  } catch {
    return null;
  }
}

export function saveTumblrConnection(connection: TumblrConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(KEY);
    return;
  }
  window.localStorage.setItem(KEY, JSON.stringify(connection));
}
