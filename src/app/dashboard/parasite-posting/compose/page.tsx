"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import {
  Bold,
  ChevronDown,
  Eraser,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Save,
  Settings2,
  Smile,
  Sparkles,
  Strikethrough,
  Underline,
  Wand2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SoftPanel } from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { loadGhostConnection } from "@/lib/ghost-client";
import { loadBlueskyConnection } from "@/lib/bluesky-client";
import { loadDevtoConnection } from "@/lib/devto-client";
import { loadHashnodeConnection } from "@/lib/hashnode-client";
import { loadLiveJournalConnection } from "@/lib/livejournal-client";
import { loadMastodonConnection } from "@/lib/mastodon-client";
import { loadMediumConnection } from "@/lib/medium-client";
import { loadOpenAiConnection } from "@/lib/openai-client";
import { loadTumblrConnection } from "@/lib/tumblr-client";
import {
  defaultPlatforms,
  deriveTitle,
  loadPosts,
  loadPreselectedPlatforms,
  savePosts,
  savePreselectedPlatforms,
  type ParasitePost,
  type Platform,
  type PlatformId,
} from "@/lib/parasite-data";
import {
  publishToBlueskyNow,
  publishToDevtoNow,
  publishToGhostNow,
  publishToHashnodeNow,
  publishToLiveJournalNow,
  publishToMastodonNow,
  publishToTelegramNow,
  publishToThreadsNow,
  publishToTumblrNow,
  publishToWebflowNow,
  publishToWordPressNow,
} from "@/lib/publish-now";
import {
  loadChecklistIntegrations,
} from "@/lib/social-integrations";
import { loadTelegramConnection } from "@/lib/telegram-client";
import { loadThreadsConnection } from "@/lib/threads-client";
import { loadWebflowConnection } from "@/lib/webflow-client";
import { loadWordPressConnection } from "@/lib/wordpress-client";
import {
  loadWritingPrompts,
  resolvePrompt,
  type WritingPrompt,
} from "@/lib/writing-prompts";
import { cn } from "@/lib/utils";

const EMOJIS = ["😀", "🔥", "✨", "🚀", "💡", "✅", "📈", "🙌", "❤️", "👏"];

function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after = before,
) {
  const selected = value.slice(start, end) || "text";
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  return {
    next,
    cursor: start + before.length + selected.length + after.length,
  };
}

export default function ComposePage() {
  const [platforms] = useState<Platform[]>(defaultPlatforms);
  const [selected, setSelected] = useState<PlatformId[]>([]);
  const [preselected, setPreselected] = useState<PlatformId[]>([]);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [body, setBody] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [perPlatform, setPerPlatform] = useState(false);
  const [platformBodies, setPlatformBodies] = useState<
    Partial<Record<PlatformId, string>>
  >({});
  const [activePlatformEdit, setActivePlatformEdit] =
    useState<PlatformId | null>(null);
  const [interlink, setInterlink] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [styleMode, setStyleMode] = useState<"Normal" | "Heading">("Normal");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [writingPrompts, setWritingPrompts] = useState<WritingPrompt[]>([]);
  const [writePromptId, setWritePromptId] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ghost = Boolean(loadGhostConnection());
    const telegram = Boolean(loadTelegramConnection());
    const webflow = Boolean(loadWebflowConnection());
    const livejournal = Boolean(loadLiveJournalConnection());
    const threads = Boolean(loadThreadsConnection());
    const devto = Boolean(loadDevtoConnection());
    const hashnode = Boolean(loadHashnodeConnection());
    const bluesky = Boolean(loadBlueskyConnection());
    const wordpress = Boolean(loadWordPressConnection());
    const tumblr = Boolean(loadTumblrConnection());
    const mastodon = Boolean(loadMastodonConnection());
    const checklist = loadChecklistIntegrations();
    const nextConnected: Record<string, boolean> = {
      ghost,
      telegram,
      webflow,
      livejournal,
      threads,
      devto,
      hashnode,
      bluesky,
      wordpress,
      tumblr,
      mastodon,
      ...checklist,
      // Medium API tokens are no longer issued; checklist/manual OR rare legacy token
      medium: Boolean(loadMediumConnection()) || Boolean(checklist.medium),
    };
    setConnected(nextConnected);
    const saved = loadPreselectedPlatforms();
    setPreselected(saved);
    const initial =
      saved.length > 0
        ? saved.filter((id) => nextConnected[id])
        : platforms.filter((p) => nextConnected[p.id]).map((p) => p.id);
    setSelected(initial);
    if (initial[0]) setActivePlatformEdit(initial[0]);
    const prompts = loadWritingPrompts();
    setWritingPrompts(prompts);
    const writePrompt = resolvePrompt(prompts, "write");
    if (writePrompt) setWritePromptId(writePrompt.id);
  }, [platforms]);

  const anyConnected = useMemo(
    () => Object.values(connected).some(Boolean),
    [connected],
  );

  const charLimit = useMemo(() => {
    if (selected.length === 0) return 280;
    return Math.min(
      ...selected.map(
        (id) => platforms.find((p) => p.id === id)?.limit ?? 280,
      ),
    );
  }, [platforms, selected]);

  const activeBody =
    perPlatform && activePlatformEdit
      ? (platformBodies[activePlatformEdit] ?? body)
      : body;

  const charCount = activeBody.length;
  const charPct = Math.min(100, Math.round((charCount / charLimit) * 100));

  function setActiveBody(next: string) {
    if (perPlatform && activePlatformEdit) {
      setPlatformBodies((prev) => ({ ...prev, [activePlatformEdit]: next }));
    } else {
      setBody(next);
    }
  }

  function togglePlatform(id: PlatformId) {
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      if (!activePlatformEdit || !next.includes(activePlatformEdit)) {
        setActivePlatformEdit(next[0] ?? null);
      }
      return next;
    });
  }

  function saveSelection() {
    savePreselectedPlatforms(selected);
    setPreselected(selected);
    setNotice(
      selected.length
        ? `Saved ${selected.length} preselected platform${selected.length === 1 ? "" : "s"}.`
        : "Cleared preselected platforms.",
    );
  }

  function applyFormat(type: "bold" | "italic" | "underline" | "strike" | "ul" | "ol" | "link" | "clear" | "heading") {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    let result = { next: activeBody, cursor: end };

    if (type === "bold") result = wrapSelection(activeBody, start, end, "**");
    if (type === "italic") result = wrapSelection(activeBody, start, end, "_");
    if (type === "underline") result = wrapSelection(activeBody, start, end, "<u>", "</u>");
    if (type === "strike") result = wrapSelection(activeBody, start, end, "~~");
    if (type === "link") {
      const url = targetUrl.trim() || "https://";
      result = wrapSelection(activeBody, start, end, "[", `](${url})`);
    }
    if (type === "ul") {
      const selectedText = activeBody.slice(start, end) || "item";
      result = {
        next: `${activeBody.slice(0, start)}- ${selectedText}${activeBody.slice(end)}`,
        cursor: start + selectedText.length + 2,
      };
    }
    if (type === "ol") {
      const selectedText = activeBody.slice(start, end) || "item";
      result = {
        next: `${activeBody.slice(0, start)}1. ${selectedText}${activeBody.slice(end)}`,
        cursor: start + selectedText.length + 3,
      };
    }
    if (type === "heading") {
      const selectedText = activeBody.slice(start, end) || "Heading";
      result = {
        next: `${activeBody.slice(0, start)}## ${selectedText}${activeBody.slice(end)}`,
        cursor: start + selectedText.length + 3,
      };
      setStyleMode("Heading");
    }
    if (type === "clear") {
      result = {
        next: activeBody
          .replace(/\*\*/g, "")
          .replace(/_/g, "")
          .replace(/~~/g, "")
          .replace(/<\/?u>/g, "")
          .replace(/^#+\s+/gm, "")
          .replace(/^\d+\.\s+/gm, "")
          .replace(/^-\s+/gm, ""),
        cursor: 0,
      };
      setStyleMode("Normal");
    }

    setActiveBody(result.next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.cursor, result.cursor);
    });
  }

  function selectedPlatformNames() {
    return selected
      .map((id) => platforms.find((p) => p.id === id)?.name)
      .filter((name): name is string => Boolean(name));
  }

  function openAiPayload() {
    const connection = loadOpenAiConnection();
    return {
      apiKey: connection?.apiKey,
      model: connection?.model,
      platforms: selectedPlatformNames(),
      targetUrl: targetUrl.trim() || undefined,
    };
  }

  function selectedPrompt(mode: "write" | "rewrite") {
    return resolvePrompt(writingPrompts, mode, writePromptId);
  }

  function rewriteBody() {
    const source = activeBody.trim();
    if (!source) {
      setError("Write something first, then use Rewrite.");
      return;
    }
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "rewrite",
            body: source,
            systemPrompt: selectedPrompt("rewrite")?.body,
            ...openAiPayload(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          text?: string;
          error?: string;
          code?: string;
          model?: string;
        };
        if (!data.ok || !data.text?.trim()) {
          if (data.code === "OPENAI_NOT_CONFIGURED") {
            setError(
              "OpenAI is not connected. Open Integrations → OpenAI (same RankBrain X Chat Completions API), or set OPENAI_API_KEY.",
            );
            return;
          }
          setError(data.error || "Rewrite failed.");
          return;
        }
        setActiveBody(data.text.trim());
        setNotice(
          `Rewrite applied with OpenAI${data.model ? ` (${data.model})` : ""}.`,
        );
      } catch {
        setError("Network error while calling OpenAI rewrite.");
      }
    });
  }

  function writeBody() {
    const topic = activeBody.trim();
    if (!topic) {
      setError("Add a brief or topic in the editor, then use Write.");
      return;
    }
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "write",
            topic,
            systemPrompt: selectedPrompt("write")?.body,
            ...openAiPayload(),
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          text?: string;
          error?: string;
          code?: string;
          model?: string;
        };
        if (!data.ok || !data.text?.trim()) {
          if (data.code === "OPENAI_NOT_CONFIGURED") {
            setError(
              "OpenAI is not connected. Open Integrations → OpenAI (same RankBrain X Chat Completions API), or set OPENAI_API_KEY.",
            );
            return;
          }
          setError(data.error || "Write failed.");
          return;
        }
        setActiveBody(data.text.trim());
        setNotice(
          `Draft written with OpenAI${data.model ? ` (${data.model})` : ""}.`,
        );
      } catch {
        setError("Network error while calling OpenAI write.");
      }
    });
  }

  function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(String(reader.result || ""));
      setNotice(`Image attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      setActiveBody(`${activeBody}${emoji}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${activeBody.slice(0, start)}${emoji}${activeBody.slice(end)}`;
    setActiveBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + emoji.length;
      el.setSelectionRange(cursor, cursor);
    });
    setShowEmoji(false);
  }

  function composedBodyForPublish(platformId?: PlatformId) {
    const base =
      perPlatform && platformId
        ? (platformBodies[platformId] ?? body)
        : body;
    if (interlink && targetUrl.trim()) {
      return `${base.trim()}\n\n${targetUrl.trim()}`.trim();
    }
    return base.trim();
  }

  function savePost(
    status: ParasitePost["status"],
    autoPublish: "none" | "selected" = "none",
  ) {
    setError(null);
    setNotice(null);
    setShowPostMenu(false);

    const publishBody = composedBodyForPublish(selected[0]);
    if (!publishBody) {
      setError("Write your post before publishing.");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one platform.");
      return;
    }

    startTransition(async () => {
      const title = deriveTitle(publishBody);
      const next: ParasitePost = {
        id: crypto.randomUUID(),
        title,
        body: publishBody,
        targetUrl: targetUrl.trim(),
        platforms: selected,
        status,
        createdAt: new Date().toISOString(),
        publishedAt:
          status === "Published" ? new Date().toISOString() : undefined,
      };

      const messages: string[] = [];
      const failures: string[] = [];

      async function runAuto(
        id: PlatformId,
        runner: (post: ParasitePost) => Promise<string>,
        assign: (url: string) => void,
        assignError: (message: string) => void,
      ) {
        if (autoPublish !== "selected" || !selected.includes(id)) return;
        if (!connected[id]) {
          failures.push(`Connect ${id} under Integrations.`);
          return;
        }
        try {
          const platformPost = {
            ...next,
            body: composedBodyForPublish(id),
            title: deriveTitle(composedBodyForPublish(id)),
          };
          const url = await runner(platformPost);
          assign(url);
          messages.push(url || `${id} published`);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : `${id} publish failed.`;
          assignError(message);
          failures.push(message);
        }
      }

      await runAuto(
        "ghost",
        publishToGhostNow,
        (url) => {
          next.ghostUrl = url;
        },
        (message) => {
          next.ghostError = message;
        },
      );
      await runAuto(
        "telegram",
        publishToTelegramNow,
        (url) => {
          next.telegramUrl = url;
        },
        (message) => {
          next.telegramError = message;
        },
      );
      await runAuto(
        "webflow",
        publishToWebflowNow,
        (url) => {
          next.webflowUrl = url;
        },
        (message) => {
          next.webflowError = message;
        },
      );
      await runAuto(
        "livejournal",
        publishToLiveJournalNow,
        (url) => {
          next.livejournalUrl = url;
        },
        (message) => {
          next.livejournalError = message;
        },
      );
      await runAuto(
        "threads",
        publishToThreadsNow,
        (url) => {
          next.threadsUrl = url;
        },
        (message) => {
          next.threadsError = message;
        },
      );
      await runAuto(
        "devto",
        publishToDevtoNow,
        (url) => {
          next.devtoUrl = url;
        },
        (message) => {
          next.devtoError = message;
        },
      );
      await runAuto(
        "hashnode",
        publishToHashnodeNow,
        (url) => {
          next.hashnodeUrl = url;
        },
        (message) => {
          next.hashnodeError = message;
        },
      );
      await runAuto(
        "bluesky",
        publishToBlueskyNow,
        (url) => {
          next.blueskyUrl = url;
        },
        (message) => {
          next.blueskyError = message;
        },
      );
      await runAuto(
        "wordpress",
        publishToWordPressNow,
        (url) => {
          next.wordpressUrl = url;
        },
        (message) => {
          next.wordpressError = message;
        },
      );
      await runAuto(
        "tumblr",
        publishToTumblrNow,
        (url) => {
          next.tumblrUrl = url;
        },
        (message) => {
          next.tumblrError = message;
        },
      );
      await runAuto(
        "mastodon",
        publishToMastodonNow,
        (url) => {
          next.mastodonUrl = url;
        },
        (message) => {
          next.mastodonError = message;
        },
      );

      if (messages.length > 0) {
        next.status = "Published";
        next.publishedAt = new Date().toISOString();
      } else if (autoPublish === "selected" && failures.length > 0) {
        next.status = "Queued";
      }

      const posts = loadPosts();
      savePosts([next, ...posts]);
      setBody("");
      setPlatformBodies({});
      setImagePreview(null);
      setTargetUrl("");

      if (failures.length && messages.length === 0) {
        setError(failures.join(" · "));
      } else if (failures.length) {
        setNotice(messages.join(" · "));
        setError(failures.join(" · "));
      } else if (messages.length) {
        setNotice(messages.join(" · "));
      } else if (status === "Queued") {
        setNotice("Post added to queue.");
      } else if (status === "Published") {
        setNotice("Marked as published.");
      } else {
        setNotice("Draft saved.");
      }
    });
  }

  return (
    <AppShell
      title="Create a Post"
      subtitle="Select platforms, write once, and post now — SoMePoster-style compose."
    >
      <div className="space-y-4">
        <SoftPanel className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1c1f26]">
              Select platforms
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-3 py-1.5 text-xs text-[#5c6578]">
                <span className="uppercase tracking-[0.12em]">
                  Preselected platforms:
                </span>
                <select
                  className="bg-transparent text-sm text-[#1c1f26] outline-none"
                  value=""
                  onChange={(e) => {
                    const id = e.target.value as PlatformId;
                    if (!id) return;
                    if (!selected.includes(id)) {
                      setSelected((prev) => [...prev, id]);
                    }
                  }}
                >
                  <option value="">
                    {preselected.length
                      ? `${preselected.length} saved`
                      : "No preselected platforms"}
                  </option>
                  {preselected.map((id) => {
                    const platform = platforms.find((p) => p.id === id);
                    return (
                      <option key={id} value={id}>
                        {platform?.name ?? id}
                      </option>
                    );
                  })}
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={selected.length === 0}
                onClick={saveSelection}
                className="border-[#1e3a5f]/25"
              >
                <Save className="size-3.5" />
                Save Selection
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {platforms.map((platform) => {
              const isSelected = selected.includes(platform.id);
              const isReady = Boolean(connected[platform.id]);
              return (
                <button
                  key={platform.id}
                  type="button"
                  title={
                    isReady
                      ? platform.name
                      : `${platform.name} — connect in Integrations`
                  }
                  onClick={() => {
                    if (!isReady) return;
                    togglePlatform(platform.id);
                  }}
                  className={cn(
                    "relative flex size-11 items-center justify-center rounded-full border text-xs font-semibold transition",
                    isSelected && isReady
                      ? "border-[#15803d] bg-[#16a34a] text-white shadow-sm"
                      : isReady
                        ? "border-[#86efac] bg-[#f0fdf4] text-[#15803d] hover:border-[#16a34a]"
                        : "border-[#e4e8ef] bg-[#f3f5f8] text-[#9aa3b2]",
                  )}
                >
                  {platform.short}
                  {isReady ? (
                    <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#16a34a] ring-2 ring-white" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </SoftPanel>

        {!anyConnected ? (
          <div className="flex flex-col gap-3 rounded-xl border border-[#c5d4eb] bg-[#eef3f9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-[#1e3a5f]">
              <Link2 className="size-4 shrink-0" />
              Connect a social account to start creating posts.
            </p>
            <Link
              href="/dashboard/integrations"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1e3a5f] px-4 text-sm font-medium text-white hover:bg-[#162d4a]"
            >
              Connect accounts
            </Link>
          </div>
        ) : null}

        <SoftPanel className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#e4e8ef] px-3 py-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-semibold text-white">
              G
            </div>
            <select
              value={styleMode}
              onChange={(e) => {
                const value = e.target.value as "Normal" | "Heading";
                setStyleMode(value);
                if (value === "Heading") applyFormat("heading");
              }}
              className="h-8 rounded-md border border-[#d8dee8] bg-white px-2 text-sm text-[#1c1f26]"
            >
              <option>Normal</option>
              <option>Heading</option>
            </select>
            <div className="flex flex-wrap items-center gap-0.5">
              {(
                [
                  ["bold", Bold],
                  ["italic", Italic],
                  ["underline", Underline],
                  ["strike", Strikethrough],
                  ["ol", ListOrdered],
                  ["ul", List],
                  ["link", Link2],
                  ["clear", Eraser],
                ] as const
              ).map(([type, Icon]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => applyFormat(type)}
                  className="inline-flex size-8 items-center justify-center rounded-md text-[#5c6578] hover:bg-[#eef1f6] hover:text-[#1c1f26]"
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-2 py-1.5 text-xs text-[#5c6578]">
                <span>Prompt</span>
                <select
                  className="max-w-[160px] bg-transparent text-sm text-[#1c1f26] outline-none"
                  value={writePromptId}
                  onChange={(e) => setWritePromptId(e.target.value)}
                >
                  {writingPrompts.length === 0 ? (
                    <option value="">Default</option>
                  ) : (
                    writingPrompts.map((prompt) => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </option>
                    ))
                  )}
                </select>
                <Link
                  href="/dashboard/prompts"
                  className="text-[#1e3a5f] underline"
                >
                  Add
                </Link>
              </label>
              <Button
                type="button"
                variant="outline"
                className="border-[#1e3a5f]/25"
                onClick={() => {
                  setNotice(
                    "AI Image: attach a visual with Add Image, or paste an image URL into the post.",
                  );
                  fileRef.current?.click();
                }}
              >
                <ImagePlus className="size-3.5" />
                AI Image
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-[#1e3a5f]/25"
                disabled={isPending}
                onClick={writeBody}
              >
                <Wand2 className="size-3.5" />
                {isPending ? "Writing…" : "Write"}
              </Button>
              <Button
                type="button"
                className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
                disabled={isPending}
                onClick={rewriteBody}
              >
                <Sparkles className="size-3.5" />
                {isPending ? "Rewriting…" : "Rewrite"}
              </Button>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md text-[#5c6578] hover:bg-[#eef1f6]"
                title="Composer settings"
                onClick={() =>
                  setNotice(
                    "Tip: turn on Edit Content/Image Per Platform to customize each channel.",
                  )
                }
              >
                <Settings2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 px-4 py-4">
            {perPlatform && selected.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selected.map((id) => {
                  const platform = platforms.find((p) => p.id === id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActivePlatformEdit(id)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        activePlatformEdit === id
                          ? "bg-[#1e3a5f] text-white"
                          : "bg-[#eef1f6] text-[#5c6578]",
                      )}
                    >
                      {platform?.name ?? id}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <textarea
              ref={textareaRef}
              value={activeBody}
              onChange={(e) => setActiveBody(e.target.value)}
              placeholder="What's on your mind? Paste a draft to Rewrite, or a brief to Write with OpenAI."
              className="min-h-44 w-full resize-y bg-transparent text-base leading-relaxed text-[#1c1f26] outline-none placeholder:text-[#9aa3b2]"
            />

            {imagePreview ? (
              <div className="overflow-hidden rounded-xl border border-[#d8dee8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Attached"
                  className="max-h-56 w-full object-cover"
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-[#e4e8ef] pt-3">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickImage}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-[#5c6578] hover:bg-[#eef1f6]"
                  title="Add Image"
                >
                  <ImagePlus className="size-5" />
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmoji((v) => !v)}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-[#5c6578] hover:bg-[#eef1f6]"
                    title="Add Emoji"
                  >
                    <Smile className="size-5" />
                  </button>
                  {showEmoji ? (
                    <div className="absolute bottom-11 left-0 z-20 grid grid-cols-5 gap-1 rounded-xl border border-[#d8dee8] bg-white p-2 shadow-lg">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="size-8 rounded-md text-lg hover:bg-[#eef1f6]"
                          onClick={() => insertEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <label className="ml-1 flex items-center gap-2 text-sm text-[#5c6578]">
                  <span
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition",
                      perPlatform ? "bg-[#1e3a5f]" : "bg-[#d8dee8]",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={perPlatform}
                      onChange={(e) => {
                        setPerPlatform(e.target.checked);
                        if (e.target.checked && selected[0]) {
                          setActivePlatformEdit(selected[0]);
                        }
                      }}
                    />
                    <span
                      className={cn(
                        "inline-block size-4 translate-x-0.5 rounded-full bg-white transition",
                        perPlatform && "translate-x-4",
                      )}
                    />
                  </span>
                  Edit Content/Image Per Platform
                </label>

                <label
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    selected.some((id) =>
                      [
                        "ghost",
                        "webflow",
                        "wordpress",
                        "medium",
                        "tumblr",
                        "wix",
                      ].includes(id),
                    )
                      ? "text-[#5c6578]"
                      : "text-[#9aa3b2]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={interlink}
                    disabled={
                      !selected.some((id) =>
                        [
                          "ghost",
                          "webflow",
                          "wordpress",
                          "medium",
                          "tumblr",
                          "wix",
                        ].includes(id),
                      )
                    }
                    onChange={(e) => setInterlink(e.target.checked)}
                    className="size-4 rounded border-[#c9d3e3]"
                  />
                  Interlink web2 to social media
                </label>

                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#5c6578]">
                    <span
                      className="relative inline-flex size-8 items-center justify-center"
                      aria-hidden
                    >
                      <svg viewBox="0 0 36 36" className="size-8 -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="#e4e8ef"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke={charPct > 95 ? "#b45309" : "#1e3a5f"}
                          strokeWidth="3"
                          strokeDasharray={`${(charPct / 100) * 94} 94`}
                        />
                      </svg>
                    </span>
                    {charCount} / {charLimit}
                  </div>

                  <div className="relative flex">
                    <Button
                      type="button"
                      disabled={isPending || !anyConnected}
                      onClick={() => savePost("Published", "selected")}
                      className="rounded-r-none bg-[#1e3a5f] px-4 text-white hover:bg-[#162d4a]"
                    >
                      {isPending ? "Posting…" : "Post Now"}
                    </Button>
                    <Button
                      type="button"
                      disabled={isPending || !anyConnected}
                      onClick={() => setShowPostMenu((v) => !v)}
                      className="rounded-l-none border-l border-white/20 bg-[#1e3a5f] px-2 text-white hover:bg-[#162d4a]"
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    {showPostMenu ? (
                      <div className="absolute bottom-11 right-0 z-20 min-w-44 overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-lg">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#eef1f6]"
                          onClick={() => savePost("Published", "selected")}
                        >
                          <Wand2 className="size-3.5" />
                          Post Now
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#eef1f6]"
                          onClick={() => savePost("Queued")}
                        >
                          <Redo2 className="size-3.5" />
                          Add to Queue
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#eef1f6]"
                          onClick={() => savePost("Draft")}
                        >
                          <Save className="size-3.5" />
                          Save Draft
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="Optional link / CTA URL"
                  className="h-9 flex-1 rounded-lg border border-[#d8dee8] bg-white px-3 text-sm outline-none focus:border-[#1e3a5f]/40"
                />
                <Link
                  href="/dashboard/integrations"
                  className="text-sm font-medium text-[#1e3a5f] underline"
                >
                  Manage integrations
                </Link>
              </div>

              {error ? (
                <p className="rounded-lg bg-[#f8ece8] px-3 py-2 text-sm text-[#7a3e2e]">
                  {error}
                </p>
              ) : null}
              {notice ? (
                <p className="rounded-lg bg-[#eef3f9] px-3 py-2 text-sm text-[#1e3a5f]">
                  {notice}
                </p>
              ) : null}

              {!anyConnected ? null : (
                <p className="text-xs text-[#5c6578]">
                  Gray icons need a connection. Open{" "}
                  <Link
                    href="/dashboard/integrations"
                    className="text-[#1e3a5f] underline"
                  >
                  Integrations
                </Link>{" "}
                for setup — auto channels (Ghost, Telegram, Webflow,
                LiveJournal, Threads, DEV.to) publish immediately.
                </p>
              )}
            </div>
          </div>
        </SoftPanel>
      </div>
    </AppShell>
  );
}
