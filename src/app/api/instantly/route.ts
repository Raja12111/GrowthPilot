import { NextResponse } from "next/server";
import {
  activateInstantlyCampaign,
  addInstantlyLead,
  listInstantlyCampaigns,
  pauseInstantlyCampaign,
  testInstantlyConnection,
} from "@/lib/instantly";

export const runtime = "nodejs";

type Body = {
  apiKey?: string;
  campaignId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  action?:
    | "test"
    | "campaigns"
    | "activate"
    | "pause"
    | "add-lead";
};

function resolveKey(input: Body) {
  const apiKey = (input.apiKey || process.env.INSTANTLY_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error(
      "Instantly API v2 key is required. Create one in Instantly → Settings → Integrations → API.",
    );
  }
  return apiKey;
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Body;
    const action = json.action ?? "test";
    const apiKey = resolveKey(json);

    if (action === "test") {
      const workspace = await testInstantlyConnection(apiKey);
      return NextResponse.json({ ok: true, workspace });
    }

    if (action === "campaigns") {
      const campaigns = await listInstantlyCampaigns(apiKey);
      return NextResponse.json({ ok: true, campaigns });
    }

    if (action === "activate" || action === "pause") {
      const campaignId = json.campaignId?.trim();
      if (!campaignId) {
        return NextResponse.json(
          { ok: false, error: "Campaign ID is required." },
          { status: 400 },
        );
      }
      const campaign =
        action === "activate"
          ? await activateInstantlyCampaign(apiKey, campaignId)
          : await pauseInstantlyCampaign(apiKey, campaignId);
      return NextResponse.json({ ok: true, campaign });
    }

    if (action === "add-lead") {
      const campaignId = json.campaignId?.trim();
      const email = json.email?.trim();
      if (!campaignId || !email || !email.includes("@")) {
        return NextResponse.json(
          {
            ok: false,
            error: "Campaign and a valid lead email are required.",
          },
          { status: 400 },
        );
      }
      const lead = await addInstantlyLead(apiKey, {
        campaignId,
        email,
        firstName: json.firstName,
        lastName: json.lastName,
        companyName: json.companyName,
      });
      return NextResponse.json({ ok: true, lead });
    }

    return NextResponse.json(
      { ok: false, error: "Unknown Instantly action." },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Instantly request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
