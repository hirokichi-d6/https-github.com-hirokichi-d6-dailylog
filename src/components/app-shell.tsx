import type { Route } from "next";
import Link from "next/link";
import {
  BarChart3,
  CalendarRange,
  Download,
  FilePenLine,
  LayoutDashboard,
  NotebookPen,
  Settings,
  type LucideIcon
} from "lucide-react";
import type { ReactNode } from "react";

const navigation: Array<{ href: Route; label: string; icon: LucideIcon }> = [
  { href: "/", label: "\u30db\u30fc\u30e0", icon: LayoutDashboard },
  { href: "/entries", label: "\u8a18\u9332", icon: FilePenLine },
  { href: "/analytics", label: "\u5206\u6790", icon: BarChart3 },
  { href: "/calendar", label: "\u30ab\u30ec\u30f3\u30c0\u30fc", icon: CalendarRange },
  { href: "/memos", label: "\u30e1\u30e2", icon: NotebookPen },
  { href: "/exports", label: "\u51fa\u529b", icon: Download },
  { href: "/settings", label: "\u8a2d\u5b9a", icon: Settings }
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-cloud text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1360px] flex-col gap-4 px-3 pb-6 pt-3 sm:px-4 lg:flex-row lg:px-5">
        <aside className="rounded-[1.8rem] border border-white/70 bg-white/85 p-3 shadow-panel backdrop-blur lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[248px] lg:p-5">
          <div className="mb-6 rounded-[1.5rem] bg-moss px-4 py-5 text-cloud">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">DailyLog</p>
            <h1 className="mt-2 font-display text-[1.65rem] leading-tight">
              {"\u5e97\u8217\u904b\u55b6\u3092\u3001\u6bce\u65e5\u3064\u306a\u304c\u308b\u8a18\u9332\u3078\u3002"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/80">
              {
                "\u65e5\u5831\u3001\u58f2\u4e0a\u3001\u4e88\u5b9a\u3001\u30e1\u30e2\u3092\u3072\u3068\u3064\u306b\u307e\u3068\u3081\u3066\u3001\u632f\u308a\u8fd4\u308a\u307e\u3067\u898b\u901a\u3057\u3084\u3059\u304f\u3059\u308b\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9\u3067\u3059\u3002"
              }
            </p>
          </div>

          <nav className="grid gap-1.5">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-oat"
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-6 rounded-[1.35rem] bg-oat p-4 text-sm text-ink/80">
            <p className="font-semibold text-ink">{"\u4eca\u65e5\u306e\u3072\u3068\u3053\u3068"}</p>
            <p className="mt-2 leading-6">
              {
                "\u5915\u65b9\u306e\u30d4\u30fc\u30af\u524d\u306b\u3001\u58f2\u5834\u5199\u771f\u3068\u58f2\u4e0a\u30e1\u30e2\u3092\u6b8b\u3057\u3066\u304a\u304f\u3068\u9031\u8d8a\u3057\u306e\u632f\u308a\u8fd4\u308a\u304c\u304b\u306a\u308a\u697d\u306b\u306a\u308a\u307e\u3059\u3002"
              }
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}