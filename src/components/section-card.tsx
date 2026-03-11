import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, actions, className, children }: SectionCardProps) {
  return (
    <section className={cn("rounded-[1.8rem] border border-white/70 bg-white/90 p-4 shadow-panel sm:p-5", className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-[1.35rem] leading-tight text-ink sm:text-[1.5rem]">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-ink/65">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}