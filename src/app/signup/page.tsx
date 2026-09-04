"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SoftPanel } from "@/components/ui-blocks";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await signup({ name, email, password });
        router.replace("/dashboard/parasite-posting/compose");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign up failed.");
      }
    });
  }

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#eef2f7,transparent_45%),linear-gradient(180deg,#f7f8fa_0%,#ffffff_100%)]" />
      <SoftPanel className="w-full max-w-md space-y-5">
        <div className="space-y-1">
          <Link
            href="/"
            className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]"
          >
            GrowthPilot
          </Link>
          <h1 className="text-xl font-medium text-[#1c1f26]">
            Create an account
          </h1>
          <p className="text-sm text-[#5c6578]">
            Sign up to compose posts and connect publishing platforms.
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error ? (
            <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-sm text-[#8a1f11]">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
          >
            {isPending ? "Creating…" : "Create account & start posting"}
          </Button>
        </form>

        <p className="text-sm text-[#5c6578]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#1e3a5f] underline">
            Sign in
          </Link>
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "px-0")}>
          Back to home
        </Link>
      </SoftPanel>
    </main>
  );
}
