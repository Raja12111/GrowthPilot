export type BlueskyConfig = {
  handle: string;
  appPassword: string;
  service?: string;
};

function serviceBase(service?: string) {
  return (service || "https://bsky.social").replace(/\/$/, "");
}

export async function createBlueskySession(config: BlueskyConfig) {
  const response = await fetch(
    `${serviceBase(config.service)}/xrpc/com.atproto.server.createSession`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: config.handle.trim().replace(/^@/, ""),
        password: config.appPassword.trim(),
      }),
    },
  );
  const data = (await response.json()) as {
    accessJwt?: string;
    did?: string;
    handle?: string;
    error?: string;
    message?: string;
  };
  if (!response.ok || !data.accessJwt || !data.did) {
    throw new Error(
      data.message || data.error || "Bluesky login failed. Check handle + app password.",
    );
  }
  return {
    accessJwt: data.accessJwt,
    did: data.did,
    handle: data.handle || config.handle,
  };
}

export async function testBlueskyConnection(config: BlueskyConfig) {
  const session = await createBlueskySession(config);
  return { handle: session.handle, did: session.did };
}

export async function publishToBluesky(
  config: BlueskyConfig,
  input: { body: string; targetUrl?: string },
) {
  const session = await createBlueskySession(config);
  let text = input.body.trim();
  if (input.targetUrl?.trim()) {
    text = `${text}\n\n${input.targetUrl.trim()}`.trim();
  }
  if (text.length > 300) {
    text = `${text.slice(0, 297)}...`;
  }

  const response = await fetch(
    `${serviceBase(config.service)}/xrpc/com.atproto.repo.createRecord`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({
        repo: session.did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text,
          createdAt: new Date().toISOString(),
        },
      }),
    },
  );
  const data = (await response.json()) as {
    uri?: string;
    cid?: string;
    error?: string;
    message?: string;
  };
  if (!response.ok || !data.uri) {
    throw new Error(data.message || data.error || "Bluesky publish failed.");
  }

  const rkey = data.uri.split("/").pop();
  const handle = session.handle.replace(/^@/, "");
  return {
    uri: data.uri,
    url: rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : "",
  };
}
