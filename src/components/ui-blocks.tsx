import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1e3a5f]/20 bg-white/70 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 size-10 rounded-full bg-[#e8eef7]" />
      <p className="font-[family-name:var(--font-instrument)] text-2xl text-[#1e3a5f]">
        {title}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5c6578]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SoftPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[#1e3a5f]/10 bg-white/90 p-5 shadow-[0_12px_40px_-28px_rgba(28,31,38,0.35)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_18px_48px_-28px_rgba(28,31,38,0.4)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
