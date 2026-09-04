import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  buildMastodonAuthorizeUrl,
  getMastodonOAuthInstance,
  mastodonOAuthConfigured,
} from "@/lib/mastodon";

export const runtime = "nodejs";

function redirectUriFromRequest(request: Request) {
  const env = process.env.MASTODON_REDIRECT_URI?.trim();
  if (env) return env;
  const url = new URL(request.url);
  return `${url.origin}/api/mastodon/callback`;
}

export async function GET(request: Request) {
  if (!mastodonOAuthConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/integrations/mastodon?error=" +
          encodeURIComponent(
            "Mastodon OAuth is not configured. Set MASTODON_CLIENT_ID and MASTODON_CLIENT_SECRET, or paste an access token.",
          ),
        request.url,
      ),
    );
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = redirectUriFromRequest(request);
  const instanceUrl = getMastodonOAuthInstance();
  const authorizeUrl = buildMastodonAuthorizeUrl({
    redirectUri,
    state,
    instanceUrl,
  });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("mastodon_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: redirectUri.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("mastodon_oauth_redirect", redirectUri, {
    httpOnly: true,
    sameSite: "lax",
    secure: redirectUri.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("mastodon_oauth_instance", instanceUrl, {
    httpOnly: true,
    sameSite: "lax",
    secure: redirectUri.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  return response;
}
