"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SoftPanel } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  loadChecklistIntegrations,
  setChecklistIntegration,
  socialIntegrationMeta,
  type ChecklistIntegrationId,
} from "@/lib/social-integrations";
import { cn } from "@/lib/utils";

export function ChecklistIntegrationPage({
  id,
}: {
  id: ChecklistIntegrationId;
}) {
  const meta = socialIntegrationMeta(id);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(Boolean(loadChecklistIntegrations()[id]));
  }, [id]);

  function toggle(next: boolean) {
    setChecklistIntegration(id, next);
    setEnabled(next);
  }

  return (
    <AppShell
      section="Integrations"
      title={meta?.name ?? id}
      subtitle={
        meta?.tip ??
        "Enable this social channel so you can select it when creating a post."
      }
    >
      <SoftPanel className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
              Social Media
            </p>
            <p className="mt-1 text-sm text-[#5c6578]">
              Mark this integration as connected to use it from Create a Post
              and Queue.
            </p>
          </div>
          <Badge
            className={cn(
              "border-0",
              enabled
                ? "bg-[#dcfce7] text-[#15803d]"
                : "bg-[#eef1f6] text-[#5c6578]",
            )}
          >
            {enabled ? "Connected" : "Not connected"}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3">
          {enabled ? (
            <Button
              type="button"
              variant="outline"
              className="border-[#1e3a5f]/25"
              onClick={() => toggle(false)}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
              onClick={() => toggle(true)}
            >
              Connect integration
            </Button>
          )}
          <Link
            href="/dashboard/parasite-posting/compose"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-[#1e3a5f]/25",
            )}
          >
            Create a Post
          </Link>
        </div>
      </SoftPanel>
    </AppShell>
  );
}
