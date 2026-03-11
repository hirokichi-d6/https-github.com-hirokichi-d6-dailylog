"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { useDailyLogStore } from "@/lib/store";

type EntrySummary = {
  date: string;
  weather: string;
  totalSales: number;
  hasEntry: boolean;
};

type SummaryResponse = {
  kind: "summaries";
  summaries: EntrySummary[];
  source: "mock" | "file" | "database";
};

const weatherLabelMap: Record<string, string> = {
  sunny: "\u6674\u308c",
  cloudy: "\u66c7\u308a",
  rainy: "\u96e8",
  snowy: "\u96ea",
  other: "\u305d\u306e\u4ed6"
};

export default function ExportsPage() {
  const savedEntry = useDailyLogStore((state) => state.savedEntry);
  const [month, setMonth] = useState(savedEntry.date.slice(0, 7));
  const [summaries, setSummaries] = useState<EntrySummary[]>([]);
  const [source, setSource] = useState<"mock" | "file" | "database">("mock");

  useEffect(() => {
    setMonth(savedEntry.date.slice(0, 7));
  }, [savedEntry.date]);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        const response = await fetch(`/api/entries?month=${month}`, {
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Failed to load month summaries (${response.status})`);
        }

        const payload = (await response.json()) as SummaryResponse;
        setSummaries(payload.summaries);
        setSource(payload.source);
      } catch {
        if (!controller.signal.aborted) {
          setSummaries([]);
          setSource("mock");
        }
      }
    };

    void run();

    return () => controller.abort();
  }, [month]);

  const totals = useMemo(() => {
    const totalSales = summaries.reduce((sum, summary) => sum + summary.totalSales, 0);
    return {
      count: summaries.length,
      totalSales,
      averageSales: summaries.length > 0 ? Math.round(totalSales / summaries.length) : 0
    };
  }, [summaries]);

  const csvHref = `/api/export?month=${month}&format=csv`;
  const jsonHref = `/api/export?month=${month}&format=json`;

  return (
    <div className="space-y-4 py-1 sm:space-y-5">
      <SectionCard
        title={"\u51fa\u529b"}
        description={"\u6708\u5358\u4f4d\u3067\u65e5\u5831\u30c7\u30fc\u30bf\u3092 CSV / JSON \u3067\u51fa\u529b\u3067\u304d\u307e\u3059\u3002"}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={csvHref}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-3.5 py-2 text-sm font-semibold text-white"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {"CSV \u3092\u51fa\u529b"}
            </a>
            <a
              href={jsonHref}
              className="inline-flex items-center gap-2 rounded-full bg-oat px-3.5 py-2 text-sm font-semibold text-ink"
            >
              <FileJson className="h-4 w-4" />
              {"JSON \u3092\u51fa\u529b"}
            </a>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-[1.35rem] bg-oat p-4">
              <label className="block text-sm font-medium text-ink/75">
                {"\u5bfe\u8c61\u6708"}
                <input
                  className="mt-1.5 w-full rounded-xl border border-[#e7decd] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                />
              </label>
              <div className="mt-4 space-y-2 text-sm text-ink/70">
                <p>{`\u4fdd\u5b58\u5143: ${source}`}</p>
                <p>{`\u8a18\u9332\u65e5\u6570: ${totals.count}\u65e5`}</p>
                <p>{`\u58f2\u4e0a\u5408\u8a08 ${formatCurrency(totals.totalSales)}`}</p>
                <p>{`\u65e5\u6b21\u5e73\u5747 ${formatCurrency(totals.averageSales)}`}</p>
              </div>
            </div>

            <div className="rounded-[1.35rem] bg-white p-4 ring-1 ring-oat">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Download className="h-4 w-4" />
                {"\u51fa\u529b\u5185\u5bb9"}
              </div>
              <ul className="mt-3 space-y-2 text-sm text-ink/75">
                <li>{"\u65e5\u4ed8\u3001\u5929\u6c17\u3001\u6c17\u6e29\u3001\u98a8"}</li>
                <li>{"\u65e5\u8a18\u3001\u58f2\u4e0a\u30e1\u30e2\u3001\u30bf\u30b0"}</li>
                <li>{"\u58f2\u4e0a\u5408\u8a08\u3001\u76ee\u6a19\u3001\u5ba2\u6570\u3001\u5ba2\u5358\u4fa1"}</li>
                <li>{"\u30ab\u30c6\u30b4\u30ea\u5225\u58f2\u4e0a\u306e\u660e\u7d30"}</li>
              </ul>
            </div>
          </div>

          <div className="rounded-[1.35rem] bg-white p-4 ring-1 ring-oat">
            <p className="text-sm font-semibold text-ink">{"\u5bfe\u8c61\u6708\u306e\u8a18\u9332\u4e00\u89a7"}</p>
            <div className="mt-3 space-y-2.5">
              {summaries.length > 0 ? (
                summaries.map((summary) => (
                  <div key={summary.date} className="rounded-xl bg-cloud px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{formatShortDate(summary.date)}</p>
                        <p className="mt-1 text-sm text-ink/65">{`\u5929\u6c17 ${weatherLabelMap[summary.weather] ?? summary.weather}`}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ink">{formatCurrency(summary.totalSales)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-cloud px-4 py-5 text-sm text-ink/55">
                  {"\u3053\u306e\u6708\u306e\u4fdd\u5b58\u30c7\u30fc\u30bf\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002"}
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}