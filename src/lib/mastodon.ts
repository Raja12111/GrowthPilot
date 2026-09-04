/** Server-only Mastodon API helpers (instance URL + OAuth2 Bearer). */

export type MastodonConfig = {
  instanceUrl: string;
  accessToken: string;
};

export type MastodonAccount = {
  id: string;
  username?: string;
  acct?: string;
  display_name?: string;
  url?: string;
};

const DEFAULT_INSTANCE = "https://mastodon.social";

export function normalizeMastodonInstance(raw?: string) {
  const value = (raw || DEFAULT_INSTANCE).trim();
  if (!value) return DEFAULT_INSTANCE;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function mastodonOAuthConfigured() {
  return Boolean(
    process.env.MASTODON_CLIENT_ID?.trim() &&
      process.env.MASTODON_CLIENT_SECRET?.trim(),
  );
}

export function getMastodonClientId() {
  return process.env.MASTODON_CLIENT_ID?.trim() || "";
}

export function getMastodonClientSecret() {
  return process.env.MASTODON_CLIENT_SECRET?.trim() || "";
}

export function getMastodonOAuthInstance() {
  return normalizeMastodonInstance(
    process.env.MASTODON_INSTANCE || DEFAULT_INSTANCE,
  );
}

export function buildMastodonAuthorizeUrl(input: {
  redirectUri: string;
  state: string;
  instanceUrl?: string;
}) {
  const instance = normalizeMastodonInstance(
    input.instanceUrl || getMastodonOAuthInstance(),
  );
  const params = new URLSearchParams({
    client_id: getMastodonClientId(),
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: "read write:statuses",
    state: input.state,
  });
  return `${instance}/oauth/authorize?${params.toString()}`;
}

async function parseMastodonResponse(response: Response) {
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return data;
}

function mastodonErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data) {
    const error = (data as { error?: string }).error;
    const description = (data as { error_description?: string })
      .error_description;
    if (typeof description === "string" && description.trim()) {
      return description.trim();
    }
    if (typeof error === "string" && error.trim()) {
      return error.trim();
    }
  }
  return fallback;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token.trim()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function verifyMastodonAccount(config: MastodonConfig) {
  const instanceUrl = normalizeMastodonInstance(config.instanceUrl);
  const accessToken = config.accessToken.trim();
  if (!accessToken) {
    throw new Error(
      "Mastodon access token is required. Create one under Preferences → Development, or use Connect with Mastodon OAuth.",
    );
  }

  const response = await fetch(`${instanceUrl}/api/v1/accounts/verify_credentials`, {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  const data = await parseMastodonResponse(response);
  if (!response.ok) {
    throw new Error(
      mastodonErrorMessage(
        data,
        "Invalid Mastodon token or instance. Check the instance URL and access token.",
      ),
    );
  }

  const account = data as MastodonAccount;
  if (!account?.id) {
    throw new Error("Mastodon returned no account id.");
  }
  return {
    instanceUrl,
    account: {
      id: account.id,
      username: account.username,
      acct: account.acct,
      displayName: account.display_name,
      url: account.url,
    },
  };
}

export async function exchangeMastodonCode(input: {
  code: string;
  redirectUri: string;
  instanceUrl?: string;
}) {
  const instanceUrl = normalizeMastodonInstance(
    input.instanceUrl || getMastodonOAuthInstance(),
  );
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    client_id: getMastodonClientId(),
    client_secret: getMastodonClientSecret(),
    redirect_uri: input.redirectUri,
    scope: "read write:statuses",
  });

  const response = await fetch(`${instanceUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await parseMastodonResponse(response);
  if (!response.ok) {
    throw new Error(
      mastodonErrorMessage(
        data,
        `Mastodon OAuth token exchange failed (${response.status})`,
      ),
    );
  }

  const accessToken = (data as { access_token?: string }).access_token?.trim();
  if (!accessToken) {
    throw new Error("Mastodon did not return an access token.");
  }

  const verified = await verifyMastodonAccount({ instanceUrl, accessToken });
  return {
    accessToken,
    instanceUrl,
    account: verified.account,
  };
}

export function toMastodonStatus(body: string, targetUrl?: string) {
  const cleaned = body.trim();
  const cta = targetUrl?.trim() ? `\n\n${targetUrl.trim()}` : "";
  const status = `${cleaned}${cta}`.trim();
  if (!status) throw new Error("Post body is required for Mastodon.");
  return status.slice(0, 500);
}

export async function publishToMastodon(
  config: MastodonConfig,
  input: {
    body: string;
    targetUrl?: string;
    visibility?: "public" | "unlisted" | "private" | "direct";
  },
) {
  const verified = await verifyMastodonAccount(config);
  const status = toMastodonStatus(input.body, input.targetUrl);

  const response = await fetch(
    `${verified.instanceUrl}/api/v1/statuses`,
    {
      method: "POST",
      headers: authHeaders(config.accessToken),
      body: JSON.stringify({
        status,
        visibility: input.visibility ?? "public",
      }),
    },
  );
  const data = await parseMastodonResponse(response);
  if (!response.ok) {
    throw new Error(
      mastodonErrorMessage(data, `Mastodon publish failed (${response.status})`),
    );
  }

  const post = data as { id?: string; url?: string; uri?: string };
  return {
    id: post.id,
    url: post.url || post.uri || verified.account.url || verified.instanceUrl,
  };
}
