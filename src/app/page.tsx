"use client";

import { CloudSun, NotebookText, Pin, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { useDailyLogStore } from "@/lib/store";

const weatherLabelMap = {
  sunny: "\u6674\u308c",
  cloudy: "\u66c7\u308a",
  rainy: "\u96e8",
  snowy: "\u96ea",
  other: "\u305d\u306e\u4ed6"
} as const;

const windLabelMap = {
  calm: "\u7121\u98a8",
  light: "\u5fae\u98a8",
  moderate: "\u3084\u3084\u5f37\u3044",
  strong: "\u5f37\u3044",
  veryStrong: "\u975e\u5e38\u306b\u5f37\u3044"
} as const;

const syncSourceMap = {
  local: "local",
  mock: "mock",
  file: "file",
  database: "database"
} as const;

export default function HomePage() {
  const savedEntry = useDailyLogStore((state) => state.savedEntry);
  const pinnedMemos = useDailyLogStore((state) => state.pinnedMemos);
  const upcomingSchedules = useDailyLogStore((state) => state.upcomingSchedules);
  const salesTrend = useDailyLogStore((state) => state.salesTrend);
  const lastSavedAt = useDailyLogStore((state) => state.lastSavedAt);
  const syncSource = useDailyLogStore((state) => state.syncSource);
  const syncMessage = useDailyLogStore((state) => state.syncMessage);

  const derivedPinnedMemos = [
    ...savedEntry.memos.filter((memo) => memo.pinned),
    ...pinnedMemos.filter((memo) => !savedEntry.memos.some((entryMemo) => entryMemo.id === memo.id))
  ];

  const achievedRate = savedEntry.sales.target > 0
    ? Math.round((savedEntry.sales.total / savedEntry.sales.target) * 100)
    : 0;
  const maxTrend = Math.max(...salesTrend.map((item) => Math.max(item.sales, item.target)), 1);

  return (
    <div className="space-y-4 py-1 sm:space-y-5">
      <section className="overflow-hidden rounded-[1.8rem] bg-moss bg-grain px-5 py-6 text-cloud shadow-panel sm:px-6 sm:py-7">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_320px] lg:items-end">
          <div className="min-w-0 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">{"\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9"}</p>
            <h2 className="mt-2 font-display text-[1.9rem] leading-tight sm:text-[2.45rem]">
              {"\u4eca\u65e5\u306e\u5e97\u8217\u72b6\u6cc1\u3092\u3001\u3072\u3068\u76ee\u3067\u78ba\u8a8d\u3002"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
              {
                "\u65e5\u5831\u3001\u58f2\u4e0a\u3001\u4e88\u5b9a\u3001\u30e1\u30e2\u3092\u540c\u3058\u65e5\u4ed8\u306b\u7d10\u3065\u3051\u3066\u3001\u5165\u529b\u304b\u3089\u632f\u308a\u8fd4\u308a\u307e\u3067\u3092\u3072\u3068\u3064\u306e\u6d41\u308c\u3067\u898b\u3089\u308c\u307e\u3059\u3002"
              }
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-white/10 p-4 backdrop-blur">
            <p className="text-sm text-white/75">{formatShortDate(savedEntry.date)}</p>
            <div className="mt-2 flex items-center gap-3 text-xl font-semibold sm:text-2xl">
              <CloudSun className="h-6 w-6 shrink-0" />
              <span className="truncate">
                {weatherLabelMap[savedEntry.weather]} {savedEntry.temperature}{"\u2103"}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/75">
              {"\u98a8"}: {windLabelMap[savedEntry.wind]} / {lastSavedAt
                ? `\u6700\u7d42\u4fdd\u5b58 ${new Date(lastSavedAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}`
                : "\u672a\u4fdd\u5b58"}
            </p>
            <p className="mt-2 text-xs text-white/60">{`\u4fdd\u5b58\u5143: ${syncSourceMap[syncSource]}`}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={"\u4eca\u65e5\u306e\u58f2\u4e0a"}
          value={formatCurrency(savedEntry.sales.total)}
          hint={`\u76ee\u6a19 ${formatCurrency(savedEntry.sales.target)}`}
          accent="ember"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label={"\u76ee\u6a19\u9054\u6210\u7387"}
          value={`${achievedRate}%`}
          hint={syncMessage ?? "\u4fdd\u5b58\u72b6\u6cc1\u306f\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059\u3002"}
          accent="moss"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label={"\u5ba2\u6570"}
          value={`${savedEntry.sales.customers}`}
          hint={`\u5ba2\u5358\u4fa1 ${formatCurrency(savedEntry.sales.averageSpend)}`}
          icon={<NotebookText className="h-4 w-4" />}
        />
        <StatCard
          label={"\u30e1\u30e2\u6570"}
          value={`${savedEntry.memos.length}`}
          hint={"\u30d4\u30f3\u7559\u3081\u3059\u308b\u3068\u4e0b\u306b\u307e\u3068\u307e\u3063\u3066\u8868\u793a\u3055\u308c\u307e\u3059\u3002"}
          icon={<Pin className="h-4 w-4" />}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard
          title={"\u58f2\u4e0a\u30b5\u30de\u30ea\u30fc"}
          description={"\u9031\u9593\u306e\u58f2\u4e0a\u63a8\u79fb\u3092\u3001\u30b9\u30af\u30ed\u30fc\u30eb\u306a\u3057\u3067\u5168\u4ef6\u898b\u6e21\u305b\u308b\u5e45\u306b\u6574\u3048\u3066\u3044\u307e\u3059\u3002"}
          className="overflow-hidden"
        >
          <div className="space-y-3">
            {salesTrend.map((point) => {
              const salesWidth = Math.max(Math.round((point.sales / maxTrend) * 100), 6);
              const targetWidth = Math.max(Math.round((point.target / maxTrend) * 100), 8);

              return (
                <div key={point.label} className="grid gap-2 sm:grid-cols-[3rem_minmax(0,1fr)_88px] sm:items-center">
                  <p className="text-sm font-medium text-ink/70">{point.label}</p>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-oat">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-wheat" style={{ width: `${targetWidth}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full bg-ember" style={{ width: `${salesWidth}%` }} />
                  </div>
                  <p className="text-right text-sm font-semibold text-ink">{formatCurrency(point.sales)}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title={"\u76f4\u8fd1\u306e\u4e88\u5b9a"}
          description={"\u4eca\u65e5\u304b\u3089\u6570\u65e5\u5148\u307e\u3067\u306e\u52d5\u304d\u3092\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002"}
        >
          <div className="space-y-2.5">
            {upcomingSchedules.slice(0, 4).map((schedule) => (
              <div key={schedule.id} className="rounded-[1.2rem] border border-oat bg-cloud px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{schedule.title || "\u4e88\u5b9a"}</p>
                    <p className="mt-1 text-sm text-ink/65">
                      {formatShortDate(schedule.start)} {new Date(schedule.start).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="rounded-full bg-oat px-3 py-1 text-xs font-semibold text-ink/70">
                    {schedule.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title={"\u4eca\u65e5\u306e\u8a18\u9332"}
          description={"\u65e5\u8a18\u3001\u30e1\u30e2\u3001\u30ab\u30c6\u30b4\u30ea\u5225\u58f2\u4e0a\u3092\u307e\u3068\u3081\u3066\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002"}
        >
          <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[1.3rem] bg-oat p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">{"\u65e5\u8a18"}</p>
              <p className="mt-3 text-sm leading-7 text-ink/80">{savedEntry.diary || "\u307e\u3060\u8a18\u9332\u304c\u3042\u308a\u307e\u305b\u3093\u3002"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {savedEntry.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/70">
                    #{tag}
                  </span>
                ))}
              </div>
            </article>

            <article className="rounded-[1.3rem] bg-white p-4 ring-1 ring-oat">
              <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">{"\u30ab\u30c6\u30b4\u30ea\u5225\u58f2\u4e0a"}</p>
              <div className="mt-3 space-y-2.5">
                {savedEntry.sales.categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{category.name}</span>
                    <span className="shrink-0 font-semibold">{formatCurrency(category.amount)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-ink/70">{savedEntry.sales.note || "\u58f2\u4e0a\u30e1\u30e2\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002"}</p>
            </article>
          </div>
        </SectionCard>

        <SectionCard
          title={"\u30d4\u30f3\u7559\u3081\u30e1\u30e2"}
          description={"\u5f8c\u3067\u898b\u8fd4\u3057\u305f\u3044\u30e1\u30e2\u3092\u3053\u3053\u306b\u96c6\u3081\u3066\u304a\u3051\u307e\u3059\u3002"}
        >
          <div className="space-y-2.5">
            {derivedPinnedMemos.length > 0 ? (
              derivedPinnedMemos.map((memo) => (
                <article key={memo.id} className="rounded-[1.25rem] bg-oat p-4">
                  <p className="font-semibold text-ink">{memo.title || "\u30e1\u30e2"}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/75">{memo.content || "\u5185\u5bb9\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002"}</p>
                </article>
              ))
            ) : (
              <article className="rounded-[1.25rem] bg-oat p-4 text-sm text-ink/60">
                {"\u30d4\u30f3\u7559\u3081\u3055\u308c\u305f\u30e1\u30e2\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002"}
              </article>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}