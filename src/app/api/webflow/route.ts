import { NextResponse } from "next/server";
import {
  listWebflowCollections,
  publishToWebflow,
  testWebflowConnection,
} from "@/lib/webflow";

type Body = {
  apiToken?: string;
  siteId?: string;
  collectionId?: string;
  title?: string;
  body?: string;
  targetUrl?: string;
  action?: "test" | "collections" | "publish";
};

function resolveToken(input: Body) {
  const apiToken = (
    input.apiToken ||
    process.env.WEBFLOW_API_TOKEN ||
    ""
  ).trim();
  if (!apiToken) {
    throw new Error(
      "Webflow API token is required. Connect Webflow first.",
    );
  }
  return apiToken;
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const action = json.action ?? "publish";
    const apiToken = resolveToken(json);

    if (action === "test") {
      const result = await testWebflowConnection(apiToken);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "collections") {
      const siteId = (json.siteId || "").trim();
      if (!siteId) {
        return NextResponse.json(
          { ok: false, error: "siteId is required." },
          { status: 400 },
        );
      }
      const collections = await listWebflowCollections(apiToken, siteId);
      return NextResponse.json({ ok: true, collections });
    }

    const siteId = (json.siteId || process.env.WEBFLOW_SITE_ID || "").trim();
    const collectionId = (
      json.collectionId ||
      process.env.WEBFLOW_COLLECTION_ID ||
      ""
    ).trim();

    if (!siteId || !collectionId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Webflow site and CMS collection must be selected.",
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

    const post = await publishToWebflow(
      { apiToken, siteId, collectionId },
      {
        title: json.title.trim(),
        body: json.body.trim(),
        targetUrl: json.targetUrl,
      },
    );

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webflow request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
