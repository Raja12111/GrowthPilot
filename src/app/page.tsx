import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#e8eef7_0%,transparent_45%),radial-gradient(ellipse_at_bottom_right,#dfe7f3_0%,transparent_40%),linear-gradient(160deg,#f7f8fa_0%,#eef2f7_55%,#ffffff_100%)]" />
        <div className="animate-drift absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#1e3a5f]/10 blur-3xl" />
        <div className="animate-drift absolute bottom-10 right-0 h-80 w-80 rounded-full bg-[#c5d4eb]/50 blur-3xl [animation-delay:1.5s]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-instrument)] text-2xl tracking-tight text-[#1e3a5f] transition-opacity hover:opacity-80"
        >
          GrowthPilot
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-[#1e3a5f]/30 bg-white/50",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants(),
              "bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]",
            )}
          >
            Create account
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[78vh] w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-rise space-y-6">
          <p className="font-[family-name:var(--font-instrument)] text-5xl leading-[0.95] tracking-tight text-[#1e3a5f] sm:text-6xl md:text-7xl">
            GrowthPilot
          </p>
          <h1 className="max-w-xl text-2xl font-medium leading-snug text-[#1c1f26] sm:text-3xl">
            Sign in, compose, and publish across platforms.
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-[#5c6578]">
            Create an account to save your posts, connect integrations, and
            publish from one workspace.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-[#1e3a5f] text-[#f8fafc] hover:bg-[#162d4a]",
              )}
            >
              Create account & post
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-[#1e3a5f]/30 bg-white/50",
              )}
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="animate-rise-delay relative overflow-hidden rounded-[1.5rem] border border-[#1e3a5f]/15 bg-[#1c1f26] p-6 text-[#f8fafc] shadow-[0_30px_80px_-40px_rgba(28,31,38,0.7)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(197,212,235,0.22),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(59,91,132,0.35),transparent_35%)]" />
          <div className="relative space-y-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[#c5d4eb]/90">
              Workflow
            </p>
            <p className="font-[family-name:var(--font-instrument)] text-3xl">
              Login → Create a Post
            </p>
            <ul className="space-y-3">
              {[
                "Sign up / sign in",
                "Connect platforms",
                "Write & publish",
                "Track in History",
              ].map((item) => (
                <li
                  key={item}
                  className="border-t border-white/10 pt-3 text-sm first:border-0 first:pt-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
