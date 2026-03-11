import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: "moss" | "ember" | "oat";
  icon?: ReactNode;
};

export function StatCard({ label, value, hint, accent = "oat", icon }: StatCardProps) {
  const tone = {
    moss: "bg-moss text-cloud",
    ember: "bg-ember text-white",
    oat: "bg-oat text-ink"
  }[accent];

  return (
    <article className={cn("rounded-[1.5rem] p-4", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] opacity-80">{label}</p>
          <p className="mt-2 text-[1.65rem] font-semibold tracking-tight sm:text-[1.85rem]">{value}</p>
          {hint ? <p className="mt-1.5 text-xs leading-5 opacity-80">{hint}</p> : null}
        </div>
        {icon ? <div className="rounded-xl bg-white/15 p-2">{icon}</div> : null}
      </div>
    </article>
  );
}