export type WebflowConnection = {
  apiToken: string;
  siteId: string;
  siteName?: string;
  collectionId: string;
  collectionName?: string;
  connectedAt?: string;
};

const WEBFLOW_KEY = "growthpilot.webflow.connection.v1";

export function loadWebflowConnection(): WebflowConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WEBFLOW_KEY);
    return raw ? (JSON.parse(raw) as WebflowConnection) : null;
  } catch {
    return null;
  }
}

export function saveWebflowConnection(connection: WebflowConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(WEBFLOW_KEY);
    return;
  }
  window.localStorage.setItem(WEBFLOW_KEY, JSON.stringify(connection));
}
