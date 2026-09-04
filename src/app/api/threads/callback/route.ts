import { NextResponse } from "next/server";
import { exchangeThreadsCode } from "@/lib/threads";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");

  const cookieHeader = request.headers.get("cookie") || "";
  const expectedState = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("threads_oauth_state="))
    ?.slice("threads_oauth_state=".length);
  const redirectUri =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("threads_oauth_redirect="))
      ?.slice("threads_oauth_redirect=".length) ||
    `${url.origin}/api/threads/callback`;

  const dashboard = new URL("/dashboard/integrations/threads", url.origin);

  if (error) {
    dashboard.searchParams.set("error", error);
    return NextResponse.redirect(dashboard);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    dashboard.searchParams.set("error", "Invalid OAuth state. Try Connect again.");
    return NextResponse.redirect(dashboard);
  }

  try {
    const connection = await exchangeThreadsCode({
      code,
      redirectUri: decodeURIComponent(redirectUri),
    });

    dashboard.searchParams.set("oauth", "1");
    const response = NextResponse.redirect(dashboard);
    response.cookies.set(
      "threads_pending",
      encodeURIComponent(
        JSON.stringify({
          accessToken: connection.accessToken,
          userId: connection.userId,
          username: connection.username,
          name: connection.name,
          profileUrl: connection.username
            ? `https://www.threads.net/@${connection.username}`
            : undefined,
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
    response.cookies.set("threads_oauth_state", "", { path: "/", maxAge: 0 });
    response.cookies.set("threads_oauth_redirect", "", { path: "/", maxAge: 0 });
    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Threads OAuth failed.";
    dashboard.searchParams.set("error", message);
    return NextResponse.redirect(dashboard);
  }
}
