import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SoftPanel } from "@/components/ui-blocks";
import { buttonVariants } from "@/components/ui/button";
import {
  supportGuidesByCategory,
} from "@/lib/support-guides";
import { cn } from "@/lib/utils";

export default function SupportIndexPage() {
  const connect = supportGuidesByCategory("connect");
  const tutorials = supportGuidesByCategory("tutorial");

  return (
    <AppShell
      section="Support"
      title="How can we help you?"
      subtitle="Browse connection guides and tutorials adapted from SoMePoster’s support system for GrowthPilot."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SoftPanel className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
            Connect Platforms
          </p>
          <p className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            {connect.length} guides
          </p>
          <p className="text-sm text-[#5c6578]">
            Step-by-step setup for every platform GrowthPilot supports.
          </p>
        </SoftPanel>
        <SoftPanel className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
            Tutorials
          </p>
          <p className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
            {tutorials.length} articles
          </p>
          <p className="text-sm text-[#5c6578]">
            Create posts, manage media, and clean up published items.
          </p>
        </SoftPanel>
      </div>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
          Connect your platforms
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {connect.map((guide) => (
            <SoftPanel key={guide.slug} className="flex flex-col gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
                  Connecting Platforms
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-instrument)] text-xl text-[#1e3a5f]">
                  {guide.title}
                </h3>
                <p className="mt-2 text-sm text-[#5c6578]">{guide.summary}</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/support/${guide.slug}`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-[#1e3a5f]/25",
                  )}
                >
                  Read guide
                </Link>
                {guide.href ? (
                  <Link
                    href={guide.href}
                    className={cn(
                      buttonVariants(),
                      "bg-[#1e3a5f] text-white hover:bg-[#162d4a]",
                    )}
                  >
                    Open setup
                  </Link>
                ) : null}
              </div>
            </SoftPanel>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
          Tutorials
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tutorials.map((guide) => (
            <SoftPanel key={guide.slug} className="flex flex-col gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#5c6578]">
                  Tutorial
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-instrument)] text-xl text-[#1e3a5f]">
                  {guide.title}
                </h3>
                <p className="mt-2 text-sm text-[#5c6578]">{guide.summary}</p>
              </div>
              <Link
                href={`/dashboard/support/${guide.slug}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-auto w-fit border-[#1e3a5f]/25",
                )}
              >
                Read tutorial
              </Link>
            </SoftPanel>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
