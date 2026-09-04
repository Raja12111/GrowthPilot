import { NextResponse } from "next/server";
import { exchangeMastodonCode } from "@/lib/mastodon";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const error =
    url.searchParams.get("error_description") ||
    url.searchParams.get("error");

  const cookieHeader = request.headers.get("cookie") || "";
  const expectedState = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("mastodon_oauth_state="))
    ?.slice("mastodon_oauth_state=".length);
  const redirectUri =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("mastodon_oauth_redirect="))
      ?.slice("mastodon_oauth_redirect=".length) ||
    `${url.origin}/api/mastodon/callback`;
  const instanceUrl =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("mastodon_oauth_instance="))
      ?.slice("mastodon_oauth_instance=".length) || "https://mastodon.social";

  const dashboard = new URL("/dashboard/integrations/mastodon", url.origin);

  if (error) {
    dashboard.searchParams.set("error", error);
    return NextResponse.redirect(dashboard);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    dashboard.searchParams.set(
      "error",
      "Invalid OAuth state. Try Connect with Mastodon again.",
    );
    return NextResponse.redirect(dashboard);
  }

  try {
    const connection = await exchangeMastodonCode({
      code,
      redirectUri: decodeURIComponent(redirectUri),
      instanceUrl: decodeURIComponent(instanceUrl),
    });

    dashboard.searchParams.set("oauth", "1");
    const response = NextResponse.redirect(dashboard);
    response.cookies.set(
      "mastodon_pending",
      encodeURIComponent(
        JSON.stringify({
          accessToken: connection.accessToken,
          instanceUrl: connection.instanceUrl,
          accountId: connection.account.id,
          username: connection.account.username,
          acct: connection.account.acct,
          displayName: connection.account.displayName,
          profileUrl: connection.account.url,
        }),
      ),
      {
        httpOnly: false,
        sameSite: "lax",
        secure: url.protocol === "https:",
        path: "/",
        maxAge: 300,
      },
    );
    response.cookies.set("mastodon_oauth_state", "", { path: "/", maxAge: 0 });
    response.cookies.set("mastodon_oauth_redirect", "", {
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("mastodon_oauth_instance", "", {
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Mastodon OAuth failed.";
    dashboard.searchParams.set("error", message);
    return NextResponse.redirect(dashboard);
  }
}
