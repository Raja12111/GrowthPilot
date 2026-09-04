import { NextResponse } from "next/server";
import { exchangeTumblrCode } from "@/lib/tumblr";

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
    .find((part) => part.startsWith("tumblr_oauth_state="))
    ?.slice("tumblr_oauth_state=".length);
  const redirectUri =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("tumblr_oauth_redirect="))
      ?.slice("tumblr_oauth_redirect=".length) ||
    `${url.origin}/api/tumblr/callback`;

  const dashboard = new URL("/dashboard/integrations/tumblr", url.origin);

  if (error) {
    dashboard.searchParams.set("error", error);
    return NextResponse.redirect(dashboard);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    dashboard.searchParams.set(
      "error",
      "Invalid OAuth state. Try Connect with Tumblr again.",
    );
    return NextResponse.redirect(dashboard);
  }

  try {
    const connection = await exchangeTumblrCode({
      code,
      redirectUri: decodeURIComponent(redirectUri),
    });

    dashboard.searchParams.set("oauth", "1");
    const response = NextResponse.redirect(dashboard);
    response.cookies.set(
      "tumblr_pending",
      encodeURIComponent(
        JSON.stringify({
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken,
          blogIdentifier: connection.blogName || "",
          userName: connection.userName,
          blogName: connection.blogName,
          blogTitle: connection.blogTitle,
          blogUrl: connection.blogUrl,
          blogs: connection.blogs,
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
    response.cookies.set("tumblr_oauth_state", "", { path: "/", maxAge: 0 });
    response.cookies.set("tumblr_oauth_redirect", "", { path: "/", maxAge: 0 });
    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Tumblr OAuth failed.";
    dashboard.searchParams.set("error", message);
    return NextResponse.redirect(dashboard);
  }
}
