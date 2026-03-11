"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { useDailyLogStore } from "@/lib/store";
import type { ScheduleItem } from "@/types/domain";

type EntrySummary = {
  date: string;
  weather: string;
  totalSales: number;
  hasEntry: boolean;
};

type EntrySummaryResponse = {
  kind: "summaries";
  summaries: EntrySummary[];
  source: "mock" | "file" | "database";
};

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-[#e7decd] bg-cloud px-3.5 py-2.5 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

const scheduleCategories: Array<ScheduleItem["category"]> = [
  "\u696d\u52d9",
  "\u4ed5\u5165\u308c",
  "\u4f1a\u8b70",
  "\u30d7\u30e9\u30a4\u30d9\u30fc\u30c8",
  "\u305d\u306e\u4ed6"
];

const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);
const weatherBadgeMap: Record<string, string> = {
  sunny: "\u6674",
  cloudy: "\u66c7",
  rainy: "\u96e8",
  snowy: "\u96ea",
  other: "\u4ed6"
};

const toDateTimeLocal = (value: string) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const fromDateTimeLocal = (value: string) => `${value}:00+09:00`;

export default function CalendarPage() {
  const draftEntry = useDailyLogStore((state) => state.draftEntry);
  const savedEntry = useDailyLogStore((state) => state.savedEntry);
  const upcomingSchedules = useDailyLogStore((state) => state.upcomingSchedules);
  const syncSource = useDailyLogStore((state) => state.syncSource);
  const syncState = useDailyLogStore((state) => state.syncState);
  const syncMessage = useDailyLogStore((state) => state.syncMessage);
  const loadEntry = useDailyLogStore((state) => state.loadEntry);
  const addSchedule = useDailyLogStore((state) => state.addSchedule);
  const updateSchedule = useDailyLogStore((state) => state.updateSchedule);
  const removeSchedule = useDailyLogStore((state) => state.removeSchedule);
  const saveDraft = useDailyLogStore((state) => state.saveDraft);
  const [summaries, setSummaries] = useState<EntrySummary[]>([]);
  const [summarySource, setSummarySource] = useState<"mock" | "file" | "database">("mock");

  const calendarDays = useMemo(() => {
    const activeDate = new Date(savedEntry.date);
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: lastDay }, (_, index) => {
      const day = new Date(year, month, index + 1);
      return `${toIsoDate(day)}T09:00:00+09:00`;
    });
  }, [savedEntry.date]);

  useEffect(() => {
    const controller = new AbortController();
    const month = savedEntry.date.slice(0, 7);

    const run = async () => {
      try {
        const response = await fetch(`/api/entries?month=${month}`, {
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Failed to load month summaries (${response.status})`);
        }

        const payload = (await response.json()) as EntrySummaryResponse;
        setSummaries(payload.summaries);
        setSummarySource(payload.source);
      } catch {
        if (!controller.signal.aborted) {
          setSummaries([]);
          setSummarySource("mock");
        }
      }
    };

    void run();

    return () => controller.abort();
  }, [savedEntry.date]);

  const onSelectDay = (date: string) => {
    startTransition(() => {
      void loadEntry(date);
    });
  };

  const onSave = () => {
    startTransition(() => {
      void saveDraft();
    });
  };

  const futureSchedules = upcomingSchedules
    .filter((schedule) => schedule.start.slice(0, 10) !== draftEntry.date.slice(0, 10))
    .slice(0, 4);

  const summaryMap = new Map(summaries.map((summary) => [summary.date.slice(0, 10), summary]));

  return (
    <div className="space-y-4 py-1 sm:space-y-5">
      <SectionCard
        title={"\u30ab\u30ec\u30f3\u30c0\u30fc"}
        description={"\u65e5\u4ed8\u3068\u4e88\u5b9a\u3092\u4e00\u7dd2\u306b\u5207\u308a\u66ff\u3048\u3066\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002"}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addSchedule}
              className="inline-flex items-center gap-2 rounded-full bg-oat px-3 py-2 text-sm font-semibold text-ink"
            >
              <Plus className="h-4 w-4" />
              {"\u4e88\u5b9a\u8ffd\u52a0"}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={syncState === "saving"}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {syncState === "saving" ? "\u4fdd\u5b58\u4e2d" : "\u4fdd\u5b58"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {calendarDays.map((day) => {
              const shortDay = day.slice(0, 10);
              const isActive = shortDay === savedEntry.date.slice(0, 10);
              const summary = summaryMap.get(shortDay);
              const scheduleCount = shortDay === draftEntry.date.slice(0, 10)
                ? draftEntry.schedules.length
                : upcomingSchedules.filter((schedule) => schedule.start.startsWith(shortDay)).length;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={`min-h-28 rounded-[1.2rem] p-3 text-left transition ${
                    isActive
                      ? "bg-moss text-cloud"
                      : "bg-white ring-1 ring-oat hover:-translate-y-0.5 hover:shadow-panel"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-ink"}`}>
                      {formatShortDate(day)}
                    </p>
                    {summary ? (
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                          isActive ? "bg-white/15 text-white" : "bg-oat text-ink/70"
                        }`}
                      >
                        {weatherBadgeMap[summary.weather] ?? "\u8a18\u9332"}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {summary ? (
                      <div className={`rounded-xl px-2.5 py-2 text-xs ${isActive ? "bg-white/15 text-white" : "bg-oat text-ink/80"}`}>
                        {`\u58f2\u4e0a ${formatCurrency(summary.totalSales)}`}
                      </div>
                    ) : (
                      <div
                        className={`rounded-xl border border-dashed px-2.5 py-2.5 text-xs ${
                          isActive ? "border-white/30 text-white/70" : "border-[#dbcdb3] text-ink/45"
                        }`}
                      >
                        {"\u672a\u8a18\u9332"}
                      </div>
                    )}
                    <div className={`rounded-xl px-2.5 py-2 text-xs ${isActive ? "bg-white/15 text-white" : "bg-oat text-ink/80"}`}>
                      {`\u4e88\u5b9a ${scheduleCount}\u4ef6`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 rounded-[1.45rem] bg-oat p-4 min-w-0">
            <div>
              <p className="text-sm text-ink/60">{"\u9078\u629e\u4e2d\u306e\u65e5\u4ed8"}</p>
              <h3 className="mt-1 font-display text-[1.8rem] text-ink">{formatShortDate(draftEntry.date)}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/65">{`\u8aad\u8fbc\u5143 ${syncSource} / \u6708\u4e00\u89a7 ${summarySource}`}</p>
            </div>

            <div className="rounded-[1.2rem] bg-white px-4 py-3.5">
              <p className="text-sm font-semibold text-ink">{"\u5f53\u65e5\u58f2\u4e0a"}</p>
              <p className="mt-1.5 text-[1.65rem] font-semibold text-ink">{formatCurrency(draftEntry.sales.total)}</p>
              <p className="mt-1 text-sm text-ink/60">{`\u76ee\u6a19 ${formatCurrency(draftEntry.sales.target)}`}</p>
            </div>

            <div className="rounded-[1.2rem] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{"\u5f53\u65e5\u306e\u4e88\u5b9a"}</p>
                <span className="text-xs text-ink/55">{syncMessage ?? "\u4fee\u6b63\u5f8c\u306b\u4fdd\u5b58\u3057\u3066\u304f\u3060\u3055\u3044"}</span>
              </div>
              <div className="mt-3 space-y-3">
                {draftEntry.schedules.length > 0 ? (
                  draftEntry.schedules.map((schedule) => (
                    <article key={schedule.id} className="rounded-xl bg-cloud p-3">
                      <div className="grid gap-3">
                        <label className="block text-sm font-medium text-ink/75">
                          {"\u4e88\u5b9a\u30bf\u30a4\u30c8\u30eb"}
                          <input
                            className={inputClassName}
                            value={schedule.title}
                            onChange={(event) => updateSchedule(schedule.id, { title: event.target.value })}
                            placeholder={"\u4f8b: \u767a\u6ce8\u78ba\u8a8d"}
                          />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block text-sm font-medium text-ink/75">
                            {"\u958b\u59cb"}
                            <input
                              className={inputClassName}
                              type="datetime-local"
                              value={toDateTimeLocal(schedule.start)}
                              onChange={(event) => updateSchedule(schedule.id, { start: fromDateTimeLocal(event.target.value) })}
                            />
                          </label>
                          <label className="block text-sm font-medium text-ink/75">
                            {"\u7d42\u4e86"}
                            <input
                              className={inputClassName}
                              type="datetime-local"
                              value={schedule.end ? toDateTimeLocal(schedule.end) : ""}
                              onChange={(event) =>
                                updateSchedule(schedule.id, {
                                  end: event.target.value ? fromDateTimeLocal(event.target.value) : undefined
                                })
                              }
                            />
                          </label>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                          <label className="block text-sm font-medium text-ink/75">
                            {"\u30ab\u30c6\u30b4\u30ea"}
                            <select
                              className={inputClassName}
                              value={schedule.category}
                              onChange={(event) =>
                                updateSchedule(schedule.id, { category: event.target.value as ScheduleItem["category"] })
                              }
                            >
                              {scheduleCategories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-sm font-medium text-ink/75">
                            {"\u30ea\u30de\u30a4\u30f3\u30c0\u30fc"}
                            <input
                              className={inputClassName}
                              value={schedule.reminderMinutes.join(", ")}
                              onChange={(event) =>
                                updateSchedule(schedule.id, {
                                  reminderMinutes: event.target.value
                                    .split(",")
                                    .map((value) => Number(value.trim()))
                                    .filter((value) => Number.isFinite(value) && value > 0)
                                })
                              }
                              placeholder="5, 15, 60"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeSchedule(schedule.id)}
                            className="inline-flex items-center gap-2 self-end rounded-full border border-[#f0d7cf] px-3 py-2 text-xs font-semibold text-[#b2512d]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {"\u524a\u9664"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-xl bg-cloud px-4 py-5 text-sm text-ink/55">
                    {"\u307e\u3060\u4e88\u5b9a\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u300c\u4e88\u5b9a\u8ffd\u52a0\u300d\u304b\u3089\u59cb\u3081\u3089\u308c\u307e\u3059\u3002"}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.2rem] bg-white p-4">
              <p className="text-sm font-semibold text-ink">{"\u76f4\u5f8c\u306e\u4e88\u5b9a"}</p>
              <div className="mt-3 space-y-2.5">
                {futureSchedules.length > 0 ? (
                  futureSchedules.map((schedule) => (
                    <div key={schedule.id} className="rounded-xl bg-cloud px-3.5 py-3 text-sm text-ink/75">
                      <p className="font-semibold text-ink">{schedule.title || "\u4e88\u5b9a"}</p>
                      <p className="mt-1">
                        {formatShortDate(schedule.start)} {new Date(schedule.start).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-cloud px-3.5 py-4 text-sm text-ink/55">
                    {"\u76f4\u5f8c\u306e\u4e88\u5b9a\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}