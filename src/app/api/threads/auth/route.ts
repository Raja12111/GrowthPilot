import { NextResponse } from "next/server";
import {
  buildThreadsAuthorizeUrl,
  threadsOAuthConfigured,
} from "@/lib/threads";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

function redirectUriFromRequest(request: Request) {
  const env = process.env.THREADS_REDIRECT_URI?.trim();
  if (env) return env;
  const url = new URL(request.url);
  return `${url.origin}/api/threads/callback`;
}

export async function GET(request: Request) {
  if (!threadsOAuthConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/integrations/threads?error=oauth_not_configured",
        request.url,
      ),
    );
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = redirectUriFromRequest(request);
  const authorizeUrl = buildThreadsAuthorizeUrl({ redirectUri, state });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("threads_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: redirectUri.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("threads_oauth_redirect", redirectUri, {
    httpOnly: true,
    sameSite: "lax",
    secure: redirectUri.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  return response;
}
