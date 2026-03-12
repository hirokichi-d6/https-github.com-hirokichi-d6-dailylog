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
import { AuthStatus } from "@/components/auth-status";
import { getServerAuthUser } from "@/lib/supabase-server";

const navigation: Array<{ href: Route; label: string; icon: LucideIcon }> = [
  { href: "/", label: "ホーム", icon: LayoutDashboard },
  { href: "/entries", label: "記録", icon: FilePenLine },
  { href: "/analytics", label: "分析", icon: BarChart3 },
  { href: "/calendar", label: "カレンダー", icon: CalendarRange },
  { href: "/memos", label: "メモ", icon: NotebookPen },
  { href: "/exports", label: "出力", icon: Download },
  { href: "/settings", label: "設定", icon: Settings }
];

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const user = await getServerAuthUser();

  return (
    <div className="min-h-screen bg-cloud text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1360px] flex-col gap-4 px-3 pb-6 pt-3 sm:px-4 lg:flex-row lg:px-5">
        <aside className="rounded-[1.8rem] border border-white/70 bg-white/85 p-3 shadow-panel backdrop-blur lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[248px] lg:p-5">
          <div className="mb-6 rounded-[1.5rem] bg-moss px-4 py-5 text-cloud">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">DailyLog</p>
            <h1 className="mt-2 font-display text-[1.65rem] leading-tight">店舗運営を、毎日つながる記録へ。</h1>
            <p className="mt-2 text-sm leading-6 text-white/80">
              日報、売上、予定、メモをひとつにまとめて、振り返りまで見通しやすくするダッシュボードです。
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

          <AuthStatus email={user?.email ?? null} />

          <div className="mt-6 rounded-[1.35rem] bg-oat p-4 text-sm text-ink/80">
            <p className="font-semibold text-ink">今日のひとこと</p>
            <p className="mt-2 leading-6">
              夕方のピーク前に、売場写真と売上メモを残しておくと週越しの振り返りがかなり楽になります。
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}