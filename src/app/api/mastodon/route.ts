import { NextResponse } from "next/server";
import {
  mastodonOAuthConfigured,
  normalizeMastodonInstance,
  publishToMastodon,
  verifyMastodonAccount,
} from "@/lib/mastodon";

export const runtime = "nodejs";

type Body = {
  instanceUrl?: string;
  accessToken?: string;
  body?: string;
  targetUrl?: string;
  visibility?: "public" | "unlisted" | "private" | "direct";
  action?: "test" | "publish";
};

function resolveConfig(input: Body) {
  const instanceUrl = normalizeMastodonInstance(
    input.instanceUrl || process.env.MASTODON_INSTANCE || "",
  );
  const accessToken = (
    input.accessToken ||
    process.env.MASTODON_ACCESS_TOKEN ||
    ""
  ).trim();
  if (!accessToken) {
    throw new Error(
      "Mastodon access token is required. Create one under Preferences → Development.",
    );
  }
  return { instanceUrl, accessToken };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    oauthConfigured: mastodonOAuthConfigured(),
    defaultInstance: normalizeMastodonInstance(
      process.env.MASTODON_INSTANCE || "https://mastodon.social",
    ),
  });
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const config = resolveConfig(json);
    const action = json.action ?? "publish";

    if (action === "test") {
      const account = await verifyMastodonAccount(config);
      return NextResponse.json({ ok: true, ...account });
    }

    if (!json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Post body is required to publish." },
        { status: 400 },
      );
    }

    const post = await publishToMastodon(config, {
      body: json.body.trim(),
      targetUrl: json.targetUrl,
      visibility: json.visibility ?? "public",
    });

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Mastodon request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
