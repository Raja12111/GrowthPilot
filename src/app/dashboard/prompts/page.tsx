"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, SoftPanel } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createWritingPrompt,
  loadActivePromptId,
  loadWritingPrompts,
  saveActivePromptId,
  saveWritingPrompts,
  type PromptMode,
  type WritingPrompt,
} from "@/lib/writing-prompts";
import { cn } from "@/lib/utils";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [activeWrite, setActiveWrite] = useState<string | null>(null);
  const [activeRewrite, setActiveRewrite] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<PromptMode>("write");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setPrompts(loadWritingPrompts());
    setActiveWrite(loadActivePromptId("write"));
    setActiveRewrite(loadActivePromptId("rewrite"));
  }, []);

  const sorted = useMemo(
    () =>
      [...prompts].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [prompts],
  );

  function persist(next: WritingPrompt[]) {
    setPrompts(next);
    saveWritingPrompts(next);
  }

  function resetForm() {
    setName("");
    setBody("");
    setMode("write");
    setEditingId(null);
  }

  function savePrompt() {
    setError(null);
    setNotice(null);
    if (!name.trim() || !body.trim()) {
      setError("Give the prompt a name and the instruction text.");
      return;
    }

    if (editingId) {
      persist(
        prompts.map((item) =>
          item.id === editingId
            ? { ...item, name: name.trim(), body: body.trim(), mode }
            : item,
        ),
      );
      setNotice("Prompt updated.");
      resetForm();
      return;
    }

    const created = createWritingPrompt({ name, body, mode });
    persist([created, ...prompts]);
    if (mode === "write" || mode === "both") {
      saveActivePromptId("write", created.id);
      setActiveWrite(created.id);
    }
    setNotice("Prompt saved. Create a Post will use it for Write.");
    resetForm();
  }

  function editPrompt(prompt: WritingPrompt) {
    setEditingId(prompt.id);
    setName(prompt.name);
    setBody(prompt.body);
    setMode(prompt.mode);
    setError(null);
    setNotice(null);
  }

  function removePrompt(id: string) {
    const next = prompts.filter((item) => item.id !== id);
    persist(next);
    if (activeWrite === id) {
      saveActivePromptId("write", next[0]?.id || null);
      setActiveWrite(next[0]?.id || null);
    }
    if (activeRewrite === id) {
      saveActivePromptId("rewrite", next[0]?.id || null);
      setActiveRewrite(next[0]?.id || null);
    }
    if (editingId === id) resetForm();
    setNotice("Prompt removed.");
  }

  function setDefault(prompt: WritingPrompt) {
    if (prompt.mode === "rewrite") {
      saveActivePromptId("rewrite", prompt.id);
      setActiveRewrite(prompt.id);
    } else if (prompt.mode === "write") {
      saveActivePromptId("write", prompt.id);
      setActiveWrite(prompt.id);
    } else {
      saveActivePromptId("write", prompt.id);
      saveActivePromptId("rewrite", prompt.id);
      setActiveWrite(prompt.id);
      setActiveRewrite(prompt.id);
    }
    setNotice(`“${prompt.name}” is now the default prompt.`);
  }

  return (
    <AppShell
      section="Parasite Posting"
      title="Prompts"
      subtitle="Add writing prompts here, then use them with Write / Rewrite on Create a Post."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SoftPanel className="space-y-4">
          <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            {editingId ? "Edit prompt" : "Add a prompt"}
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="prompt-name">Name</Label>
            <Input
              id="prompt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. LinkedIn thought leadership"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prompt-mode">Use for</Label>
            <select
              id="prompt-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as PromptMode)}
              className="flex h-10 w-full rounded-md border border-[#d8dee8] bg-white px-3 text-sm text-[#1c1f26] outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25"
            >
              <option value="write">Write</option>
              <option value="rewrite">Rewrite</option>
              <option value="both">Write & Rewrite</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prompt-body">Prompt</Label>
            <Textarea
              id="prompt-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Tell the writer how to sound, what to include, and what to avoid. This becomes the system prompt for Write / Rewrite."
            />
          </div>
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={savePrompt}
              className="bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
            >
              {editingId ? "Save changes" : "Add prompt"}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
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

        <div className="space-y-3">
          {sorted.length === 0 ? (
            <EmptyState
              title="No prompts yet"
              description="Add a prompt on the left. Write and Rewrite on Create a Post will use it."
            />
          ) : (
            sorted.map((prompt) => {
              const isWriteDefault = activeWrite === prompt.id;
              const isRewriteDefault = activeRewrite === prompt.id;
              return (
                <SoftPanel key={prompt.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#1c1f26]">{prompt.name}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-[#5c6578]">
                        {prompt.body}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="border-0 bg-[#eef1f6] text-[#5c6578]">
                        {prompt.mode === "both"
                          ? "Write & Rewrite"
                          : prompt.mode === "write"
                            ? "Write"
                            : "Rewrite"}
                      </Badge>
                      {isWriteDefault ? (
                        <Badge className="border-0 bg-[#dcfce7] text-[#15803d]">
                          Default Write
                        </Badge>
                      ) : null}
                      {isRewriteDefault ? (
                        <Badge className="border-0 bg-[#dcfce7] text-[#15803d]">
                          Default Rewrite
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefault(prompt)}
                      className="border-[#1e3a5f]/25"
                    >
                      Use as default
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editPrompt(prompt)}
                      className="border-[#1e3a5f]/25"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removePrompt(prompt.id)}
                      className="border-[#1e3a5f]/25"
                    >
                      Delete
                    </Button>
                  </div>
                </SoftPanel>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
