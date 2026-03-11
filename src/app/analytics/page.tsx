"use client";

import { SectionCard } from "@/components/section-card";
import { formatCurrency } from "@/lib/format";
import { categoryAverages } from "@/lib/mock-data";
import { useDailyLogStore } from "@/lib/store";

const formatRate = (current: number, previous: number) => {
  if (previous === 0) {
    return "-";
  }

  const delta = ((current - previous) / previous) * 100;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
};

export default function AnalyticsPage() {
  const savedEntry = useDailyLogStore((state) => state.savedEntry);
  const salesTrend = useDailyLogStore((state) => state.salesTrend);
  const syncSource = useDailyLogStore((state) => state.syncSource);
  const syncMessage = useDailyLogStore((state) => state.syncMessage);
  const maxWeekly = Math.max(...salesTrend.map((point) => Math.max(point.sales, point.target)), 1);
  const maxAverage = Math.max(...categoryAverages.map((item) => item.value), 1);

  const latest = salesTrend.at(-1);
  const previous = salesTrend.at(-2);
  const weekAverage = Math.round(salesTrend.reduce((sum, point) => sum + point.sales, 0) / Math.max(salesTrend.length, 1));
  const comparisonRows = [
    {
      label: "\u524d\u65e5\u6bd4",
      value: previous ? formatCurrency((latest?.sales ?? 0) - previous.sales) : "-",
      rate: previous ? formatRate(latest?.sales ?? 0, previous.sales) : "-"
    },
    {
      label: "\u76ee\u6a19\u5dee\u5206",
      value: latest ? formatCurrency(latest.sales - latest.target) : "-",
      rate: latest ? formatRate(latest.sales, latest.target) : "-"
    },
    {
      label: "\u9031\u9593\u5e73\u5747\u6bd4",
      value: formatCurrency(savedEntry.sales.total - weekAverage),
      rate: formatRate(savedEntry.sales.total, weekAverage)
    },
    {
      label: "\u30ab\u30c6\u30b4\u30ea\u6570",
      value: `${savedEntry.sales.categories.length}\u4ef6`,
      rate: syncSource === "database" ? "DB\u4fdd\u5b58" : syncSource === "file" ? "\u30d5\u30a1\u30a4\u30eb\u4fdd\u5b58" : "\u30e2\u30c3\u30af\u8868\u793a"
    }
  ];

  return (
    <div className="space-y-4 py-1 sm:space-y-5">
      <SectionCard
        title={"\u58f2\u4e0a\u5206\u6790"}
        description={"\u4fdd\u5b58\u6e08\u307f\u30c7\u30fc\u30bf\u3092\u3082\u3068\u306b\u3001\u5dee\u5206\u3068\u69cb\u6210\u3092\u898b\u3084\u3059\u304f\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002"}
      >
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3 rounded-[1.45rem] bg-oat p-4 overflow-hidden">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-ink/60">{"\u672c\u65e5\u306e\u58f2\u4e0a"}</p>
                <p className="mt-1 font-display text-[1.85rem] text-ink">{formatCurrency(savedEntry.sales.total)}</p>
              </div>
              <p className="max-w-xs text-sm leading-6 text-ink/60">
                {syncMessage ?? "\u6700\u65b0\u306e\u4fdd\u5b58\u5185\u5bb9\u3092\u53cd\u6620\u3057\u3066\u3044\u307e\u3059\u3002"}
              </p>
            </div>

            <div className="grid grid-cols-7 items-end gap-2 sm:gap-3 h-56 sm:h-60">
              {salesTrend.map((point) => (
                <div key={point.label} className="flex min-w-0 flex-col items-center gap-2">
                  <div className="relative flex h-full w-full items-end justify-center rounded-t-[1rem] bg-white/60 px-1 pt-2">
                    <div
                      className="w-full rounded-t-[1rem] bg-moss/25"
                      style={{ height: `${Math.max((point.target / maxWeekly) * 100, 18)}%` }}
                    />
                    <div
                      className="absolute bottom-0 w-[72%] rounded-t-[1rem] bg-ember"
                      style={{ height: `${Math.max((point.sales / maxWeekly) * 100, 18)}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-ink/60">{point.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="rounded-[1.35rem] bg-white p-4 ring-1 ring-oat">
              <p className="text-sm font-semibold text-ink">{"\u6bd4\u8f03\u30b5\u30de\u30ea\u30fc"}</p>
              <div className="mt-3 space-y-2.5">
                {comparisonRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl bg-cloud px-3.5 py-3 text-sm">
                    <span className="text-ink/75">{row.label}</span>
                    <span className="text-right font-semibold text-ink">{row.value} / {row.rate}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.35rem] bg-white p-4 ring-1 ring-oat">
              <p className="text-sm font-semibold text-ink">{"\u30ab\u30c6\u30b4\u30ea\u69cb\u6210"}</p>
              <div className="mt-3 space-y-3">
                {savedEntry.sales.categories.map((category) => {
                  const share = Math.round((category.amount / Math.max(savedEntry.sales.total, 1)) * 100);
                  return (
                    <div key={category.id}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-ink/75">{category.name}</span>
                        <span className="shrink-0 font-semibold">{share}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-oat">
                        <div className="h-2.5 rounded-full bg-moss" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={"\u66dc\u65e5\u5225\u5e73\u5747"}
        description={"\u66dc\u65e5\u3054\u3068\u306e\u58f2\u4e0a\u30a4\u30e1\u30fc\u30b8\u3092\u30b3\u30f3\u30d1\u30af\u30c8\u306b\u898b\u6e21\u305b\u308b\u914d\u7f6e\u306b\u3057\u3066\u3044\u307e\u3059\u3002"}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {categoryAverages.map((item) => (
            <div key={item.label} className="rounded-[1.2rem] bg-white p-3.5 ring-1 ring-oat">
              <p className="text-sm font-semibold text-ink">{item.label}</p>
              <div className="mt-3 flex h-24 items-end rounded-[1rem] bg-oat p-2">
                <div
                  className="w-full rounded-[1rem] bg-ember"
                  style={{ height: `${Math.max(Math.round((item.value / maxAverage) * 100), 18)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-ink/70">{formatCurrency(item.value)}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}