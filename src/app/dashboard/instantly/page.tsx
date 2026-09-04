"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, SoftPanel } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadInstantlyConnection } from "@/lib/instantly-client";
import {
  campaignIsActive,
  campaignStatusLabel,
  type InstantlyCampaign,
} from "@/lib/instantly";
import { cn } from "@/lib/utils";

export default function InstantlyCampaignsPage() {
  const [connected, setConnected] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [campaigns, setCampaigns] = useState<InstantlyCampaign[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadCampaigns(key: string) {
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch("/api/instantly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "campaigns", apiKey: key }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          campaigns?: InstantlyCampaign[];
        };
        if (!data.ok) {
          setError(data.error || "Could not load campaigns.");
          return;
        }
        const next = data.campaigns || [];
        setCampaigns(next);
        setSelectedId((prev) => prev || next[0]?.id || "");
      } catch {
        setError("Network error while loading Instantly campaigns.");
      }
    });
  }

  useEffect(() => {
    const saved = loadInstantlyConnection();
    if (!saved) {
      setConnected(false);
      return;
    }
    setConnected(true);
    setApiKey(saved.apiKey);
    loadCampaigns(saved.apiKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runCampaignAction(
    campaignId: string,
    action: "activate" | "pause",
  ) {
    setError(null);
    setNotice(null);
    setBusyId(campaignId);
    startTransition(async () => {
      try {
        const response = await fetch("/api/instantly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, apiKey, campaignId }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
        };
        if (!data.ok) {
          setError(data.error || "Campaign update failed.");
          return;
        }
        setNotice(
          action === "activate"
            ? "Campaign started / resumed."
            : "Campaign paused.",
        );
        loadCampaigns(apiKey);
      } catch {
        setError("Network error while updating the campaign.");
      } finally {
        setBusyId(null);
      }
    });
  }

  function addLead() {
    setError(null);
    setNotice(null);
    if (!selectedId) {
      setError("Pick a campaign first.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid lead email.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/instantly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add-lead",
            apiKey,
            campaignId: selectedId,
            email,
            firstName,
            lastName,
            companyName,
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
        };
        if (!data.ok) {
          setError(data.error || "Could not add lead.");
          return;
        }
        setNotice(`Added ${email.trim()} to the campaign.`);
        setEmail("");
        setFirstName("");
        setLastName("");
        setCompanyName("");
      } catch {
        setError("Network error while adding the lead.");
      }
    });
  }

  if (!connected) {
    return (
      <AppShell
        section="Instantly Email"
        title="Campaigns"
        subtitle="Connect Instantly API v2, then add leads and start or pause campaigns."
      >
        <EmptyState
          title="Instantly is not connected"
          description="Paste an API v2 key under Integrations to manage campaigns here."
          action={
            <Link
              href="/dashboard/integrations/instantly"
              className={cn(
                buttonVariants(),
                "bg-[#1e3a5f] text-white hover:bg-[#162d4a]",
              )}
            >
              Connect Instantly
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      section="Instantly Email"
      title="Campaigns"
      subtitle="List Instantly campaigns, add leads, and start or pause sending."
    >
      <div className="space-y-4">
        {error ? (
          <p className="rounded-xl bg-[#f8ece8] px-3 py-2 text-sm text-[#7a3e2e]">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-xl bg-[#eef3f9] px-3 py-2 text-sm text-[#1e3a5f]">
            {notice}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SoftPanel className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
                Campaigns
              </h2>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => loadCampaigns(apiKey)}
                className="border-[#1e3a5f]/25"
              >
                {isPending && !busyId ? "Refreshing…" : "Refresh"}
              </Button>
            </div>

            {campaigns.length === 0 ? (
              <p className="text-sm text-[#5c6578]">
                No campaigns yet. Create one in Instantly, then refresh.
              </p>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className={cn(
                      "rounded-xl border px-3 py-3",
                      selectedId === campaign.id
                        ? "border-[#1e3a5f]/40 bg-[#f7f8fa]"
                        : "border-[#d8dee8] bg-white",
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => setSelectedId(campaign.id)}
                      >
                        <p className="font-medium text-[#1c1f26]">
                          {campaign.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[#5c6578]">
                          {campaign.id}
                        </p>
                      </button>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={cn(
                            "border-0",
                            campaignIsActive(campaign.status)
                              ? "bg-[#dcfce7] text-[#15803d]"
                              : "bg-[#eef1f6] text-[#5c6578]",
                          )}
                        >
                          {campaignStatusLabel(campaign.status)}
                        </Badge>
                        {campaignIsActive(campaign.status) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending && busyId === campaign.id}
                            onClick={() =>
                              runCampaignAction(campaign.id, "pause")
                            }
                            className="border-[#1e3a5f]/25"
                          >
                            {busyId === campaign.id ? "Updating…" : "Pause"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isPending && busyId === campaign.id}
                            onClick={() =>
                              runCampaignAction(campaign.id, "activate")
                            }
                            className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
                          >
                            {busyId === campaign.id ? "Updating…" : "Start"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SoftPanel>

          <SoftPanel className="space-y-4">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Add a lead
            </h2>
            <div className="space-y-1.5">
              <Label htmlFor="lead-campaign">Campaign</Label>
              <select
                id="lead-campaign"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-[#d8dee8] bg-white px-3 text-sm text-[#1c1f26] outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25"
              >
                {campaigns.length === 0 ? (
                  <option value="">No campaigns</option>
                ) : (
                  campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prospect@company.com"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead-first">First name</Label>
                <Input
                  id="lead-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-last">Last name</Label>
                <Input
                  id="lead-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-company">Company</Label>
              <Input
                id="lead-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <Button
              type="button"
              disabled={isPending || campaigns.length === 0}
              onClick={addLead}
              className="w-full bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
            >
              {isPending && !busyId ? "Adding…" : "Add lead to campaign"}
            </Button>
            <p className="text-xs text-[#5c6578]">
              Instantly sends from accounts already set up in that campaign.
              Create sequences in Instantly, then use GrowthPilot to feed leads
              and start/pause.
            </p>
          </SoftPanel>
        </div>
      </div>
    </AppShell>
  );
}
