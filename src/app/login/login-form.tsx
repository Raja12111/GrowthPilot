"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SoftPanel } from "@/components/ui-blocks";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_LOGIN, ensureDemoAccount, login } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>(DEMO_LOGIN.email);
  const [password, setPassword] = useState<string>(DEMO_LOGIN.password);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void ensureDemoAccount();
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await ensureDemoAccount();
        await login({ email, password });
        const next =
          searchParams.get("next") || "/dashboard/parasite-posting/compose";
        router.replace(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign in failed.");
      }
    });
  }

  function fillDemo() {
    setEmail(DEMO_LOGIN.email);
    setPassword(DEMO_LOGIN.password);
    setError(null);
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
          <h1 className="text-xl font-medium text-[#1c1f26]">Sign in to post</h1>
          <p className="text-sm text-[#5c6578]">
            Log in to create, queue, and publish posts from your account.
          </p>
        </div>

        <div className="rounded-xl border border-[#d8dee8] bg-[#f7f8fa] px-3 py-3 text-sm text-[#1c1f26]">
          <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
            Demo login
          </p>
          <p className="mt-1">
            Email: <span className="font-medium">{DEMO_LOGIN.email}</span>
          </p>
          <p>
            Password: <span className="font-medium">{DEMO_LOGIN.password}</span>
          </p>
          <button
            type="button"
            onClick={fillDemo}
            className="mt-2 text-sm font-medium text-[#1e3a5f] underline"
          >
            Fill demo credentials
          </button>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            className="w-full border-[#1e3a5f]/30"
            onClick={() => {
              setEmail(DEMO_LOGIN.email);
              setPassword(DEMO_LOGIN.password);
              setError(null);
              startTransition(async () => {
                try {
                  await ensureDemoAccount();
                  await login({
                    email: DEMO_LOGIN.email,
                    password: DEMO_LOGIN.password,
                  });
                  const next =
                    searchParams.get("next") ||
                    "/dashboard/parasite-posting/compose";
                  router.replace(next);
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Sign in failed.",
                  );
                }
              });
            }}
          >
            {isPending ? "Signing in…" : "Continue with demo account"}
          </Button>
        </form>

        <p className="text-sm text-[#5c6578]">
          No account yet?{" "}
          <Link href="/signup" className="font-medium text-[#1e3a5f] underline">
            Create one
          </Link>
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "px-0")}>
          Back to home
        </Link>
      </SoftPanel>
    </main>
  );
}
