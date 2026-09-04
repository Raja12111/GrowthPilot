"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SoftPanel } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loadLiveJournalConnection,
  saveLiveJournalConnection,
  type LiveJournalConnection,
} from "@/lib/livejournal-client";
import { cn } from "@/lib/utils";

export default function LiveJournalAutomationPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [connection, setConnection] = useState<LiveJournalConnection | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadLiveJournalConnection();
    if (saved) {
      setConnection(saved);
      setUsername(saved.username);
      setPassword(saved.password);
    }
  }, []);

  function connectLiveJournal() {
    setError(null);
    setNotice(null);
    if (!username.trim() || !password.trim()) {
      setError("Username and account password are required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/livejournal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            username: username.trim(),
            password: password.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          account?: {
            username?: string;
            fullname?: string;
            profileUrl?: string;
          };
        };

        if (!data.ok) {
          setError(data.error || "Could not connect to LiveJournal.");
          return;
        }

        const next: LiveJournalConnection = {
          username: username.trim(),
          password: password.trim(),
          connectedAt: new Date().toISOString(),
          fullname: data.account?.fullname,
          profileUrl: data.account?.profileUrl,
        };
        saveLiveJournalConnection(next);
        setConnection(next);
        setNotice(
          `Connected as ${data.account?.fullname || data.account?.username || username}. You can auto-publish from Create a Post or Queue.`,
        );
      } catch {
        setError("Network error while connecting to LiveJournal.");
      }
    });
  }

  function disconnectLiveJournal() {
    saveLiveJournalConnection(null);
    setConnection(null);
    setNotice("LiveJournal disconnected.");
  }

  return (
    <AppShell
      section="Integrations"
      title="LiveJournal"
      subtitle="Connect LiveJournal like SoMePoster — enter username + password, then auto-publish posts."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect LiveJournal
            </h2>
            {connection ? (
              <Badge className="border-0 bg-[#dcfce7] text-[#15803d]">
                Connected
              </Badge>
            ) : (
              <Badge className="border-0 bg-[#eef1f6] text-[#5c6578]">
                Not connected
              </Badge>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lj-username">Username</Label>
            <Input
              id="lj-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_livejournal_username"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lj-password">Account password</Label>
            <Input
              id="lj-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your LiveJournal password"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
              autoComplete="current-password"
            />
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {notice ? <p className="text-sm text-[#1e3a5f]">{notice}</p> : null}
          {connection?.fullname ? (
            <p className="text-sm text-[#5c6578]">
              Account:{" "}
              <span className="font-medium text-[#1c1f26]">
                {connection.fullname}
              </span>
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              disabled={isPending}
              onClick={connectLiveJournal}
              className="flex-1 bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
            >
              {isPending ? "Connecting…" : "Save & Connect"}
            </Button>
            {connection ? (
              <Button
                variant="outline"
                className="flex-1 border-[#1e3a5f]/25"
                onClick={disconnectLiveJournal}
              >
                Disconnect
              </Button>
            ) : null}
          </div>

          <Link
            href="/dashboard/parasite-posting/compose"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full border-[#1e3a5f]/25",
            )}
          >
            Create a Post
          </Link>
        </SoftPanel>

        <SoftPanel className="space-y-4">
          <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            How to connect (SoMePoster steps)
          </h2>
          <ol className="space-y-3 text-sm leading-relaxed text-[#5c6578]">
            <li>
              <span className="font-medium text-[#1c1f26]">1.</span> Open{" "}
              <strong>Integrations → LiveJournal</strong> (or this page) and
              click connect.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">2.</span> Enter your
              LiveJournal <strong>username</strong> and{" "}
              <strong>account password</strong>.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">3.</span> Click{" "}
              <strong>Save &amp; Connect</strong>. GrowthPilot verifies login
              with LiveJournal’s challenge auth, then you’re ready to publish.
            </li>
          </ol>
          <p className="rounded-xl bg-[#f8ece8] px-3 py-2 text-xs leading-relaxed text-[#7a3e2e]">
            Credentials stay in this browser for posting. Prefer an app-specific
            / secondary password if your LiveJournal account supports it.
          </p>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
