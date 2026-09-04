export type OpenAiConnection = {
  apiKey: string;
  model?: string;
  connectedAt?: string;
  sampleModel?: string | null;
};

const KEY = "growthpilot.openai.connection.v1";

export function loadOpenAiConnection(): OpenAiConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OpenAiConnection) : null;
  } catch {
    return null;
  }
}

export function saveOpenAiConnection(connection: OpenAiConnection | null) {
  if (typeof window === "undefined") return;
  if (!connection) {
    window.localStorage.removeItem(KEY);
    return;
  }
  window.localStorage.setItem(KEY, JSON.stringify(connection));
}
