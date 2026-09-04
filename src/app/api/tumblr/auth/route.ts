import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  buildTumblrAuthorizeUrl,
  tumblrOAuthConfigured,
} from "@/lib/tumblr";

export const runtime = "nodejs";

function redirectUriFromRequest(request: Request) {
  const env = process.env.TUMBLR_REDIRECT_URI?.trim();
  if (env) return env;
  const url = new URL(request.url);
  return `${url.origin}/api/tumblr/callback`;
}

export async function GET(request: Request) {
  if (!tumblrOAuthConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/integrations/tumblr?error=" +
          encodeURIComponent(
            "Tumblr OAuth is not configured. Set TUMBLR_CLIENT_ID and TUMBLR_CLIENT_SECRET, or paste a token manually.",
          ),
        request.url,
      ),
    );
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = redirectUriFromRequest(request);
  const authorizeUrl = buildTumblrAuthorizeUrl({ redirectUri, state });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("tumblr_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: redirectUri.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("tumblr_oauth_redirect", redirectUri, {
    httpOnly: true,
    sameSite: "lax",
    secure: redirectUri.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  return response;
}
