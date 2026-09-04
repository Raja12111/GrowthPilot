"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { getCurrentUser, logout, type GrowthPilotUser } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const parasiteSubs = [
  { href: "/dashboard/parasite-posting/compose", label: "Create a Post" },
  { href: "/dashboard/prompts", label: "Prompts" },
  { href: "/dashboard/parasite-posting/queue", label: "Queue" },
  { href: "/dashboard/parasite-posting/published", label: "Published" },
  { href: "/dashboard/parasite-posting/history", label: "History" },
];

function NavSection({
  label,
  open,
  onToggle,
  active,
  children,
  primary = false,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  active: boolean;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <div className={cn(primary ? "mb-4" : "mt-3")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-300",
          active
            ? "bg-[#1e3a5f] text-[#f8fafc] shadow-sm"
            : "bg-white text-[#1c1f26] hover:bg-[#eef1f6]",
          primary ? "text-[0.95rem]" : "",
        )}
      >
        <span>{label}</span>
        <span
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-md text-xs transition-transform duration-300",
            open ? "rotate-180" : "rotate-0",
            active ? "bg-white/15" : "bg-[#1e3a5f]/10",
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-2 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0 lg:pl-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubLink({
  href,
  label,
  pathname,
  exact = false,
}: {
  href: string;
  label: string;
  pathname: string;
  exact?: boolean;
}) {
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-all duration-200 lg:border-l-2 lg:pl-3",
        active
          ? "border-[#1e3a5f] bg-white font-medium text-[#1c1f26] shadow-sm"
          : "border-transparent text-[#5c6578] hover:translate-x-0.5 hover:bg-white hover:text-[#1c1f26] lg:border-[#1e3a5f]/15",
      )}
    >
      {label}
    </Link>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  section = "Parasite Posting",
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  section?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<GrowthPilotUser | null>(null);
  const parasiteActive =
    (pathname.startsWith("/dashboard/parasite-posting") &&
      !pathname.match(
        /\/dashboard\/parasite-posting\/(ghost|telegram|webflow|livejournal|threads)(\/|$)/,
      )) ||
    pathname.startsWith("/dashboard/prompts");
  const instantlyActive = pathname.startsWith("/dashboard/instantly");
  const integrationsActive =
    pathname.startsWith("/dashboard/integrations") || instantlyActive;
  const supportActive = pathname.startsWith("/dashboard/support");
  const [parasiteOpen, setParasiteOpen] = useState(true);

  useEffect(() => {
    if (parasiteActive) {
      setParasiteOpen(true);
    }
  }, [parasiteActive]);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [pathname]);

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <RequireAuth>
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#eef2f7,transparent_45%),linear-gradient(180deg,#f7f8fa_0%,#ffffff_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:flex-row lg:gap-8 lg:py-8">
        <aside className="lg:sticky lg:top-6 lg:h-fit lg:w-60 lg:shrink-0">
          <div className="flex items-center justify-between gap-3 lg:block">
            <Link
              href="/"
              className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f] transition-opacity hover:opacity-80"
            >
              GrowthPilot
            </Link>
            <p className="hidden text-xs uppercase tracking-[0.16em] text-[#5c6578] lg:mt-1 lg:block">
              Content tools
            </p>
          </div>

          <Link
            href="/dashboard/parasite-posting/compose"
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#1e3a5f] px-3 py-2.5 text-sm font-medium text-[#f8fafc] shadow-sm transition-all duration-200 hover:bg-[#162d4a] lg:mt-6"
          >
            Create a Post
          </Link>

          <nav className="mt-4 lg:mt-6">
            <NavSection
              label="Parasite Posting"
              primary
              open={parasiteOpen}
              onToggle={() => setParasiteOpen((v) => !v)}
              active={parasiteActive}
            >
              {parasiteSubs.map((item) => (
                <SubLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  pathname={pathname}
                />
              ))}
            </NavSection>

            <Link
              href="/dashboard/instantly"
              className={cn(
                "mt-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-300",
                instantlyActive
                  ? "bg-[#1e3a5f] text-[#f8fafc] shadow-sm"
                  : "bg-white text-[#1c1f26] hover:bg-[#eef1f6]",
              )}
            >
              <span>Instantly Email</span>
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-md text-[10px] font-semibold uppercase",
                  instantlyActive
                    ? "bg-white/15 text-white"
                    : "bg-[#1e3a5f]/10 text-[#1e3a5f]",
                )}
              >
                Out
              </span>
            </Link>

            <Link
              href="/dashboard/integrations"
              className={cn(
                "mt-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-300",
                integrationsActive && !instantlyActive
                  ? "bg-[#1e3a5f] text-[#f8fafc] shadow-sm"
                  : "bg-white text-[#1c1f26] hover:bg-[#eef1f6]",
              )}
            >
              <span>Integrations</span>
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-md text-[10px] font-semibold uppercase",
                  integrationsActive
                    ? "bg-white/15 text-white"
                    : "bg-[#1e3a5f]/10 text-[#1e3a5f]",
                )}
              >
                All
              </span>
            </Link>

            <Link
              href="/dashboard/support"
              className={cn(
                "mt-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-300",
                supportActive
                  ? "bg-[#1e3a5f] text-[#f8fafc] shadow-sm"
                  : "bg-white text-[#1c1f26] hover:bg-[#eef1f6]",
              )}
            >
              <span>Support</span>
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-md text-[10px] font-semibold uppercase",
                  supportActive
                    ? "bg-white/15 text-white"
                    : "bg-[#1e3a5f]/10 text-[#1e3a5f]",
                )}
              >
                Docs
              </span>
            </Link>
          </nav>

          <div className="mt-6 rounded-xl border border-[#d8dee8] bg-white px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#5c6578]">
              Signed in
            </p>
            <p className="mt-1 truncate text-sm font-medium text-[#1c1f26]">
              {user?.name || "Account"}
            </p>
            <p className="truncate text-xs text-[#5c6578]">{user?.email}</p>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 w-full rounded-lg border border-[#d8dee8] bg-[#f7f8fa] px-3 py-2 text-sm font-medium text-[#1c1f26] transition hover:bg-[#eef1f6]"
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="page-enter min-w-0 flex-1 space-y-6">
          <header className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-[#5c6578]">
              {section}
            </p>
            <h1 className="font-[family-name:var(--font-instrument)] text-3xl text-[#1e3a5f] sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="max-w-2xl text-sm leading-relaxed text-[#5c6578] sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </header>
          {children}
        </div>
      </div>
    </div>
    </RequireAuth>
  );
}
