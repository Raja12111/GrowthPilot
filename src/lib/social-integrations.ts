import { defaultPlatforms, type PlatformId } from "@/lib/parasite-data";

export const AUTO_INTEGRATION_IDS = [
  "ghost",
  "telegram",
  "webflow",
  "livejournal",
  "threads",
  "devto",
  "hashnode",
  "bluesky",
  "wordpress",
  "tumblr",
  "mastodon",
] as const;

export type AutoIntegrationId = (typeof AUTO_INTEGRATION_IDS)[number];

export const CHECKLIST_INTEGRATION_IDS = [
  "linkedin",
  "reddit",
  "quora",
  "x",
  "facebook",
  "instagram",
  "pinterest",
  "youtube",
  "whatsapp",
  "medium",
  "shopify",
  "wix",
  "github",
] as const;

export type ChecklistIntegrationId = (typeof CHECKLIST_INTEGRATION_IDS)[number];

const CHECKLIST_KEY = "growthpilot.integrations.checklist.v1";

export function isAutoIntegration(id: string): id is AutoIntegrationId {
  return (AUTO_INTEGRATION_IDS as readonly string[]).includes(id);
}

export function isChecklistIntegration(
  id: string,
): id is ChecklistIntegrationId {
  return (CHECKLIST_INTEGRATION_IDS as readonly string[]).includes(id);
}

export function loadChecklistIntegrations(): Record<
  ChecklistIntegrationId,
  boolean
> {
  const defaults = Object.fromEntries(
    CHECKLIST_INTEGRATION_IDS.map((id) => [id, false]),
  ) as Record<ChecklistIntegrationId, boolean>;

  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(CHECKLIST_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<
      Record<ChecklistIntegrationId, boolean>
    >;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function saveChecklistIntegrations(
  next: Record<ChecklistIntegrationId, boolean>,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
}

export function setChecklistIntegration(
  id: ChecklistIntegrationId,
  enabled: boolean,
) {
  const current = loadChecklistIntegrations();
  const next = { ...current, [id]: enabled };
  saveChecklistIntegrations(next);
  return next;
}

export function socialIntegrationMeta(id: PlatformId) {
  return defaultPlatforms.find((p) => p.id === id);
}

export function integrationHref(id: PlatformId) {
  return `/dashboard/integrations/${id}`;
}
