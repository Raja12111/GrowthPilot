import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SoftPanel } from "@/components/ui-blocks";
import { buttonVariants } from "@/components/ui/button";
import { getSupportGuide, supportGuides } from "@/lib/support-guides";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return supportGuides.map((guide) => ({ slug: guide.slug }));
}

export default async function SupportGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getSupportGuide(slug);
  if (!guide) notFound();

  return (
    <AppShell
      section="Support"
      title={guide.title}
      subtitle={guide.summary}
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/support"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-[#1e3a5f]/25",
          )}
        >
          All support
        </Link>
        {guide.href ? (
          <Link
            href={guide.href}
            className={cn(
              buttonVariants(),
              "bg-[#1e3a5f] text-white hover:bg-[#162d4a]",
            )}
          >
            Open in GrowthPilot
          </Link>
        ) : null}
      </div>

      <SoftPanel className="space-y-5">
        <ol className="space-y-4">
          {guide.steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-semibold text-white">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-[#1c1f26]">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#5c6578]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </SoftPanel>
    </AppShell>
  );
}
