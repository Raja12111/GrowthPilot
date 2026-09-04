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
  loadTelegramConnection,
  saveTelegramConnection,
  type TelegramConnection,
} from "@/lib/telegram-client";
import { cn } from "@/lib/utils";

export default function TelegramAutomationPage() {
  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = loadTelegramConnection();
    if (saved) {
      setConnection(saved);
      setBotToken(saved.botToken);
      setChannelId(saved.channelId);
    }
  }, []);

  function connectTelegram() {
    setError(null);
    setNotice(null);
    if (!botToken.trim() || !channelId.trim()) {
      setError("Bot Token and Channel ID are required.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            botToken: botToken.trim(),
            channelId: channelId.trim(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          botUsername?: string;
          channel?: { title?: string; id?: string };
        };

        if (!data.ok) {
          setError(data.error || "Could not connect to Telegram.");
          return;
        }

        const next: TelegramConnection = {
          botToken: botToken.trim(),
          channelId: channelId.trim(),
          connectedAt: new Date().toISOString(),
          botUsername: data.botUsername,
          channelTitle: data.channel?.title,
        };
        saveTelegramConnection(next);
        setConnection(next);
        setNotice(
          `Connected ${data.botUsername || "bot"} → ${data.channel?.title || "channel"}. You can auto-publish from Create a Post or Queue.`,
        );
      } catch {
        setError("Network error while connecting to Telegram.");
      }
    });
  }

  function disconnectTelegram() {
    saveTelegramConnection(null);
    setConnection(null);
    setNotice("Telegram disconnected.");
  }

  return (
    <AppShell
      section="Integrations"
      title="Telegram"
      subtitle="Connect Telegram like SoMePoster — paste Bot Token + Channel ID, then auto-post to your channel."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
              Connect Telegram
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
            <Label htmlFor="tg-token">Bot Token</Label>
            <Input
              id="tg-token"
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="1234567890:AAHjshd83hdjshdjs73hshd7dsh"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tg-channel">Channel ID</Label>
            <Input
              id="tg-channel"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="-1001234567890"
              className="bg-white focus-visible:ring-[#1e3a5f]/25"
            />
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {notice ? <p className="text-sm text-[#1e3a5f]">{notice}</p> : null}
          {connection?.channelTitle ? (
            <p className="text-sm text-[#5c6578]">
              Channel:{" "}
              <span className="font-medium text-[#1c1f26]">
                {connection.channelTitle}
              </span>
              {connection.botUsername ? (
                <>
                  {" "}
                  · Bot:{" "}
                  <span className="font-medium text-[#1c1f26]">
                    {connection.botUsername}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              disabled={isPending}
              onClick={connectTelegram}
              className="flex-1 bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]"
            >
              {isPending ? "Connecting…" : "Save & Connect"}
            </Button>
            {connection ? (
              <Button
                variant="outline"
                className="flex-1 border-[#1e3a5f]/25"
                onClick={disconnectTelegram}
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
              <span className="font-medium text-[#1c1f26]">1.</span> Open
              Telegram, search <strong>BotFather</strong>, open{" "}
              <strong>@BotFather</strong> (blue verified check), tap Start.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">2.</span> Send{" "}
              <code className="rounded bg-[#eef1f6] px-1 text-xs">/newbot</code>
              . Set a Bot name and username ending in{" "}
              <code className="rounded bg-[#eef1f6] px-1 text-xs">bot</code>.
              Copy the <strong>Bot Token</strong>.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">3.</span> Open your
              channel → Administrators → Add Admin → add your bot. Enable{" "}
              <strong>Post Messages</strong> and Save.
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">4.</span> Get Channel
              ID with <strong>@RawDataBot</strong> (add as admin, send a
              message). Copy{" "}
              <code className="rounded bg-[#eef1f6] px-1 text-xs">
                chat.id
              </code>{" "}
              like{" "}
              <code className="rounded bg-[#eef1f6] px-1 text-xs">
                -100xxxxxxxxxx
              </code>
              .
            </li>
            <li>
              <span className="font-medium text-[#1c1f26]">5.</span> Paste Bot
              Token + Channel ID here, click <strong>Save & Connect</strong>.
            </li>
          </ol>
          <p className="rounded-xl bg-[#f8ece8] px-3 py-2 text-xs leading-relaxed text-[#7a3e2e]">
            Keep the bot as a channel administrator. If you remove it, posting
            stops.
          </p>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
