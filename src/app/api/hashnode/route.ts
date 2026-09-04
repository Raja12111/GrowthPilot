import { NextResponse } from "next/server";
import {
  publishToHashnode,
  testHashnodeConnection,
} from "@/lib/hashnode";

export const runtime = "nodejs";

type Body = {
  accessToken?: string;
  publicationId?: string;
  title?: string;
  body?: string;
  targetUrl?: string;
  action?: "test" | "publish";
};

function resolveToken(input: Body) {
  const accessToken = (
    input.accessToken ||
    process.env.HASHNODE_ACCESS_TOKEN ||
    ""
  ).trim();
  if (!accessToken) {
    throw new Error(
      "Hashnode Personal Access Token is required. Generate one in Hashnode → Settings → Developer.",
    );
  }
  return accessToken;
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const action = json.action ?? "publish";
    const accessToken = resolveToken(json);

    if (action === "test") {
      const user = await testHashnodeConnection(accessToken);
      return NextResponse.json({ ok: true, user });
    }

    const publicationId = (
      json.publicationId ||
      process.env.HASHNODE_PUBLICATION_ID ||
      ""
    ).trim();
    if (!publicationId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Hashnode publication ID is required.",
        },
        { status: 400 },
      );
    }

    if (!json.title?.trim() || !json.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title and body are required to publish." },
        { status: 400 },
      );
    }

    const post = await publishToHashnode(
      { accessToken, publicationId },
      {
        title: json.title.trim(),
        body: json.body.trim(),
        targetUrl: json.targetUrl,
      },
    );

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Hashnode request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
