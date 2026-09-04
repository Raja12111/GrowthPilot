const INSTANTLY_BASE = "https://api.instantly.ai/api/v2";

export type InstantlyWorkspace = {
  id?: string;
  name?: string;
};

export type InstantlyCampaign = {
  id: string;
  name: string;
  status: number;
};

export type InstantlyLead = {
  id?: string;
  email?: string;
  campaign?: string;
};

export function campaignStatusLabel(status: number) {
  switch (status) {
    case 0:
      return "Draft";
    case 1:
      return "Active";
    case 2:
      return "Paused";
    case 3:
      return "Completed";
    case 4:
      return "Running subsequences";
    case -1:
      return "Accounts unhealthy";
    case -2:
      return "Bounce protect";
    case -99:
      return "Account suspended";
    default:
      return `Status ${status}`;
  }
}

export function campaignIsActive(status: number) {
  return status === 1 || status === 4;
}

async function instantlyJson<T>(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${INSTANTLY_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data &&
      "message" in data &&
      typeof (data as { message?: string }).message === "string"
        ? (data as { message: string }).message
        : `Instantly API error (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function testInstantlyConnection(apiKey: string) {
  try {
    const workspace = await instantlyJson<InstantlyWorkspace>(
      apiKey,
      "/workspaces/current",
    );
    const campaigns = await listInstantlyCampaigns(apiKey);
    return {
      workspaceName: workspace.name || "Instantly workspace",
      workspaceId: workspace.id,
      campaignCount: campaigns.length,
    };
  } catch (workspaceError) {
    // Keys scoped to campaigns (no workspaces:read) can still list campaigns.
    try {
      const campaigns = await listInstantlyCampaigns(apiKey);
      return {
        workspaceName: "Instantly workspace",
        campaignCount: campaigns.length,
      };
    } catch {
      throw workspaceError instanceof Error
        ? workspaceError
        : new Error("Could not connect to Instantly. Check the API v2 key.");
    }
  }
}

export async function listInstantlyCampaigns(apiKey: string) {
  const data = await instantlyJson<{
    items?: InstantlyCampaign[];
    data?: InstantlyCampaign[];
  }>(apiKey, "/campaigns?limit=50");

  const items = data.items || data.data || [];
  return items
    .filter((item) => Boolean(item?.id))
    .map((item) => ({
      id: item.id,
      name: item.name || "Untitled campaign",
      status: Number(item.status ?? 0),
    }));
}

export async function activateInstantlyCampaign(
  apiKey: string,
  campaignId: string,
) {
  return instantlyJson<InstantlyCampaign>(
    apiKey,
    `/campaigns/${encodeURIComponent(campaignId)}/activate`,
    { method: "POST" },
  );
}

export async function pauseInstantlyCampaign(
  apiKey: string,
  campaignId: string,
) {
  return instantlyJson<InstantlyCampaign>(
    apiKey,
    `/campaigns/${encodeURIComponent(campaignId)}/pause`,
    { method: "POST" },
  );
}

export async function addInstantlyLead(
  apiKey: string,
  input: {
    campaignId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  },
) {
  return instantlyJson<InstantlyLead>(apiKey, "/leads", {
    method: "POST",
    body: JSON.stringify({
      campaign: input.campaignId,
      email: input.email.trim().toLowerCase(),
      first_name: input.firstName?.trim() || undefined,
      last_name: input.lastName?.trim() || undefined,
      company_name: input.companyName?.trim() || undefined,
    }),
  });
}
