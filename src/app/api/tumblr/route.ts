import { NextResponse } from "next/server";
import {
  normalizeTumblrBlogIdentifier,
  publishToTumblr,
  testTumblrConnection,
  tumblrOAuthConfigured,
} from "@/lib/tumblr";

export const runtime = "nodejs";

type Body = {
  accessToken?: string;
  blogIdentifier?: string;
  title?: string;
  body?: string;
  targetUrl?: string;
  state?: "published" | "draft" | "queue" | "private";
  action?: "test" | "publish";
};

function resolveConfig(input: Body) {
  const accessToken = (
    input.accessToken ||
    process.env.TUMBLR_ACCESS_TOKEN ||
    ""
  ).trim();
  const blogIdentifier = normalizeTumblrBlogIdentifier(
    input.blogIdentifier || process.env.TUMBLR_BLOG_IDENTIFIER || "",
  );
  if (!accessToken) {
    throw new Error(
      "Tumblr OAuth2 access token is required. Create an app at tumblr.com/oauth/apps.",
    );
  }
  if (!blogIdentifier) {
    throw new Error(
      "Tumblr blog identifier is required (e.g. myblog or myblog.tumblr.com).",
    );
  }
  return { accessToken, blogIdentifier };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    oauthConfigured: tumblrOAuthConfigured(),
  });
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const config = resolveConfig(json);
    const action = json.action ?? "publish";

    if (action === "test") {
      const account = await testTumblrConnection(config);
      return NextResponse.json({ ok: true, account });
    }

    if (!json.title?.trim() || !json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title and body are required to publish." },
        { status: 400 },
      );
    }

    const post = await publishToTumblr(config, {
      title: json.title.trim(),
      body: json.body.trim(),
      targetUrl: json.targetUrl,
      state: json.state ?? "published",
    });

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tumblr request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
