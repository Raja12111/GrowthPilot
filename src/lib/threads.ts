export type ThreadsConfig = {
  accessToken: string;
  userId: string;
};

export type ThreadsProfile = {
  id: string;
  username?: string;
  name?: string;
};

const GRAPH = "https://graph.threads.net/v1.0";
const OAUTH_AUTHORIZE = "https://threads.net/oauth/authorize";
const OAUTH_TOKEN = "https://graph.threads.net/oauth/access_token";
const OAUTH_LONG_LIVED = "https://graph.threads.net/access_token";

export function threadsOAuthConfigured() {
  return Boolean(
    process.env.THREADS_APP_ID?.trim() &&
      process.env.THREADS_APP_SECRET?.trim(),
  );
}

export function getThreadsAppId() {
  return process.env.THREADS_APP_ID?.trim() || "";
}

export function getThreadsAppSecret() {
  return process.env.THREADS_APP_SECRET?.trim() || "";
}

export function buildThreadsAuthorizeUrl(input: {
  redirectUri: string;
  state: string;
}) {
  const params = new URLSearchParams({
    client_id: getThreadsAppId(),
    redirect_uri: input.redirectUri,
    scope: "threads_basic,threads_content_publish",
    response_type: "code",
    state: input.state,
  });
  return `${OAUTH_AUTHORIZE}?${params.toString()}`;
}

async function threadsJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok || data.error?.message) {
    throw new Error(
      data.error?.message || `Threads API error (${response.status})`,
    );
  }
  return data;
}

export async function exchangeThreadsCode(input: {
  code: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    client_id: getThreadsAppId(),
    client_secret: getThreadsAppSecret(),
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
    code: input.code,
  });

  const short = await threadsJson<{
    access_token?: string;
    user_id?: number | string;
  }>(OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!short.access_token) {
    throw new Error("Threads did not return an access token.");
  }

  let accessToken = short.access_token;
  try {
    const longLived = await threadsJson<{ access_token?: string }>(
      `${OAUTH_LONG_LIVED}?${new URLSearchParams({
        grant_type: "th_exchange_token",
        client_secret: getThreadsAppSecret(),
        access_token: short.access_token,
      }).toString()}`,
    );
    if (longLived.access_token) {
      accessToken = longLived.access_token;
    }
  } catch {
    // Short-lived token is still usable.
  }

  const userId = String(short.user_id || "");
  const profile = await getThreadsProfile(accessToken, userId || "me");

  return {
    accessToken,
    userId: profile.id || userId,
    username: profile.username,
    name: profile.name,
  };
}

export async function getThreadsProfile(
  accessToken: string,
  userId = "me",
): Promise<ThreadsProfile> {
  const params = new URLSearchParams({
    fields: "id,username,name,threads_profile_picture_url",
    access_token: accessToken,
  });
  return threadsJson<ThreadsProfile>(`${GRAPH}/${userId}?${params.toString()}`);
}

export async function testThreadsConnection(config: ThreadsConfig) {
  const profile = await getThreadsProfile(
    config.accessToken,
    config.userId || "me",
  );
  return {
    id: profile.id,
    username: profile.username,
    name: profile.name,
    profileUrl: profile.username
      ? `https://www.threads.net/@${profile.username}`
      : "https://www.threads.net/",
  };
}

export async function publishToThreads(
  config: ThreadsConfig,
  input: { title: string; body: string; targetUrl?: string },
) {
  const text = [
    input.title.trim(),
    "",
    input.body.trim(),
    input.targetUrl?.trim() ? `\n${input.targetUrl.trim()}` : "",
  ]
    .join("\n")
    .trim()
    .slice(0, 500);

  const createParams = new URLSearchParams({
    media_type: "TEXT",
    text,
    access_token: config.accessToken,
  });

  const container = await threadsJson<{ id?: string }>(
    `${GRAPH}/${config.userId}/threads?${createParams.toString()}`,
    { method: "POST" },
  );

  if (!container.id) {
    throw new Error("Threads did not return a media container id.");
  }

  const publishParams = new URLSearchParams({
    creation_id: container.id,
    access_token: config.accessToken,
  });

  const published = await threadsJson<{ id?: string }>(
    `${GRAPH}/${config.userId}/threads_publish?${publishParams.toString()}`,
    { method: "POST" },
  );

  const profile = await getThreadsProfile(config.accessToken, config.userId);
  const postId = published.id || container.id;

  return {
    id: postId,
    url: profile.username
      ? `https://www.threads.net/@${profile.username}/post/${postId}`
      : `https://www.threads.net/`,
  };
}
