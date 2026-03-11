"use client";

import { startTransition } from "react";
import { ChevronLeft, ChevronRight, Download, Mic, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { formatCurrency } from "@/lib/format";
import { useDailyLogStore } from "@/lib/store";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-[#e7decd] bg-cloud px-3.5 py-2.5 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

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

const shiftDate = (value: string, offset: number) => {
  const base = new Date(value);
  base.setDate(base.getDate() + offset);
  const year = base.getFullYear();
  const month = `${base.getMonth() + 1}`.padStart(2, "0");
  const day = `${base.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}T09:00:00+09:00`;
};

export default function EntriesPage() {
  const draftEntry = useDailyLogStore((state) => state.draftEntry);
  const lastSavedAt = useDailyLogStore((state) => state.lastSavedAt);
  const syncState = useDailyLogStore((state) => state.syncState);
  const syncSource = useDailyLogStore((state) => state.syncSource);
  const syncMessage = useDailyLogStore((state) => state.syncMessage);
  const updateEntryField = useDailyLogStore((state) => state.updateEntryField);
  const updateSalesField = useDailyLogStore((state) => state.updateSalesField);
  const updateTagString = useDailyLogStore((state) => state.updateTagString);
  const addSalesCategory = useDailyLogStore((state) => state.addSalesCategory);
  const updateCategoryName = useDailyLogStore((state) => state.updateCategoryName);
  const updateCategoryAmount = useDailyLogStore((state) => state.updateCategoryAmount);
  const removeSalesCategory = useDailyLogStore((state) => state.removeSalesCategory);
  const loadEntry = useDailyLogStore((state) => state.loadEntry);
  const saveDraft = useDailyLogStore((state) => state.saveDraft);
  const resetDemoData = useDailyLogStore((state) => state.resetDemoData);

  const onLoad = () => {
    startTransition(() => {
      void loadEntry(draftEntry.date);
    });
  };

  const onSave = () => {
    startTransition(() => {
      void saveDraft();
    });
  };

  const onReset = () => {
    startTransition(() => {
      resetDemoData();
    });
  };

  const jumpDate = (offset: number) => {
    const nextDate = shiftDate(draftEntry.date, offset);
    updateEntryField("date", nextDate);
    startTransition(() => {
      void loadEntry(nextDate);
    });
  };

  const isBusy = syncState === "loading" || syncState === "saving";
  const statusTone =
    syncState === "error"
      ? "text-[#ffe5d6]"
      : syncState === "saving" || syncState === "loading"
        ? "text-white"
        : "text-white/80";

  return (
    <div className="space-y-4 py-1 sm:space-y-5">
      <SectionCard
        title={"\u65e5\u6b21\u30a8\u30f3\u30c8\u30ea\u30fc"}
        description={"\u65e5\u5831\u3068\u58f2\u4e0a\u3092\u307e\u3068\u3081\u3066\u7de8\u96c6\u3057\u3066\u3001API \u7d4c\u7531\u3067\u4fdd\u5b58\u3067\u304d\u307e\u3059\u3002"}
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-full bg-oat px-3.5 py-2 text-sm font-semibold text-ink">
              <Mic className="h-4 w-4" />
              {"\u97f3\u58f0\u5165\u529b"}
            </button>
            <button
              onClick={onLoad}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-full border border-oat bg-white px-3.5 py-2 text-sm font-semibold text-ink disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {"\u8aad\u8fbc"}
            </button>
            <button
              onClick={onReset}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-full border border-oat bg-white px-3.5 py-2 text-sm font-semibold text-ink disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              {"\u30b5\u30f3\u30d7\u30eb\u306b\u623b\u3059"}
            </button>
            <button
              onClick={onSave}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {syncState === "saving" ? "\u4fdd\u5b58\u4e2d" : "\u4fdd\u5b58"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4 min-w-0">
            <div className="rounded-[1.25rem] bg-oat p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => jumpDate(-1)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-60"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {"\u524d\u65e5"}
                </button>
                <button
                  type="button"
                  onClick={() => jumpDate(1)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-60"
                >
                  {"\u7fcc\u65e5"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <p className="text-sm text-ink/65">{`\u9078\u629e\u4e2d: ${draftEntry.date.slice(0, 10)}`}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink/75">
                {"\u65e5\u4ed8"}
                <input
                  className={inputClassName}
                  value={draftEntry.date.slice(0, 10)}
                  onChange={(event) => updateEntryField("date", `${event.target.value}T09:00:00+09:00`)}
                  type="date"
                />
              </label>
              <label className="block text-sm font-medium text-ink/75">
                {"\u5929\u6c17"}
                <select
                  className={inputClassName}
                  value={draftEntry.weather}
                  onChange={(event) => updateEntryField("weather", event.target.value as typeof draftEntry.weather)}
                >
                  {Object.entries(weatherLabelMap).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-ink/75">
                {"\u6c17\u6e29"}
                <input
                  className={inputClassName}
                  value={draftEntry.temperature}
                  onChange={(event) => updateEntryField("temperature", Number(event.target.value || 0))}
                  type="number"
                />
              </label>
              <label className="block text-sm font-medium text-ink/75">
                {"\u98a8\u306e\u5f37\u3055"}
                <select
                  className={inputClassName}
                  value={draftEntry.wind}
                  onChange={(event) => updateEntryField("wind", event.target.value as typeof draftEntry.wind)}
                >
                  {Object.entries(windLabelMap).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-ink/75">
              {"\u65e5\u8a18\u30fb\u30e1\u30e2"}
              <textarea
                className={`${inputClassName} min-h-44 resize-none`}
                value={draftEntry.diary}
                onChange={(event) => updateEntryField("diary", event.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-ink/75">
              {"\u30bf\u30b0"}
              <input
                className={inputClassName}
                value={draftEntry.tags.join(", ")}
                onChange={(event) => updateTagString(event.target.value)}
                placeholder={"\u4f8b: \u65b0\u5546\u54c1, \u4ed5\u5165\u308c, \u30a4\u30d9\u30f3\u30c8"}
              />
            </label>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="rounded-[1.35rem] bg-oat p-4">
              <p className="text-sm font-semibold text-ink">{"\u58f2\u4e0a\u5165\u529b"}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-ink/75">
                  {"\u5f53\u65e5\u58f2\u4e0a"}
                  <input
                    className={inputClassName}
                    value={draftEntry.sales.total}
                    onChange={(event) => updateSalesField("total", Number(event.target.value || 0))}
                    type="number"
                  />
                </label>
                <label className="block text-sm font-medium text-ink/75">
                  {"\u76ee\u6a19\u58f2\u4e0a"}
                  <input
                    className={inputClassName}
                    value={draftEntry.sales.target}
                    onChange={(event) => updateSalesField("target", Number(event.target.value || 0))}
                    type="number"
                  />
                </label>
                <label className="block text-sm font-medium text-ink/75">
                  {"\u5ba2\u6570"}
                  <input
                    className={inputClassName}
                    value={draftEntry.sales.customers}
                    onChange={(event) => updateSalesField("customers", Number(event.target.value || 0))}
                    type="number"
                  />
                </label>
                <div className="rounded-xl bg-white px-3.5 py-3 text-sm text-ink/70">
                  <p className="font-semibold text-ink">{"\u5ba2\u5358\u4fa1"}</p>
                  <p className="mt-1.5 text-lg font-semibold">{formatCurrency(draftEntry.sales.averageSpend)}</p>
                </div>
              </div>
              <label className="mt-3 block text-sm font-medium text-ink/75">
                {"\u58f2\u4e0a\u30e1\u30e2"}
                <textarea
                  className={`${inputClassName} min-h-24 resize-none`}
                  value={draftEntry.sales.note}
                  onChange={(event) => updateSalesField("note", event.target.value)}
                />
              </label>
            </div>

            <div className="rounded-[1.35rem] bg-white p-4 ring-1 ring-oat">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{"\u30ab\u30c6\u30b4\u30ea\u5225\u58f2\u4e0a"}</p>
                <button
                  type="button"
                  onClick={addSalesCategory}
                  className="inline-flex items-center gap-2 rounded-full bg-oat px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {"\u30ab\u30c6\u30b4\u30ea\u8ffd\u52a0"}
                </button>
              </div>
              <div className="mt-3 space-y-2.5">
                {draftEntry.sales.categories.map((category) => (
                  <div key={category.id} className="rounded-xl bg-cloud p-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                      <label className="block text-sm font-medium text-ink/75">
                        {"\u30ab\u30c6\u30b4\u30ea\u540d"}
                        <input
                          className={inputClassName}
                          value={category.name}
                          onChange={(event) => updateCategoryName(category.id, event.target.value)}
                        />
                      </label>
                      <label className="block text-sm font-medium text-ink/75">
                        {"\u91d1\u984d"}
                        <input
                          className={inputClassName}
                          value={category.amount}
                          onChange={(event) => updateCategoryAmount(category.id, Number(event.target.value || 0))}
                          type="number"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeSalesCategory(category.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#f0d7cf] px-3 py-2 text-xs font-semibold text-[#b2512d]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {"\u524a\u9664"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.35rem] bg-moss p-4 text-cloud">
              <p className="text-sm font-semibold">{"\u4fdd\u5b58\u72b6\u6cc1"}</p>
              <p className={`mt-2 text-sm leading-6 ${statusTone}`}>
                {syncMessage ??
                  (lastSavedAt
                    ? `\u6700\u7d42\u4fdd\u5b58 ${new Date(lastSavedAt).toLocaleString("ja-JP")}`
                    : "\u307e\u3060\u4fdd\u5b58\u3057\u3066\u3044\u307e\u305b\u3093\u3002")}
              </p>
              <p className="mt-2 text-xs text-white/60">{`\u4fdd\u5b58\u5143: ${syncSource}`}</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}