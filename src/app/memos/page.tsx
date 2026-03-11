"use client";

import { startTransition } from "react";
import { Pin, PinOff, Plus, Save, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { useDailyLogStore } from "@/lib/store";

const inputClassName =
  "mt-2 w-full rounded-2xl border border-[#e7decd] bg-cloud px-4 py-3 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

export default function MemosPage() {
  const draftEntry = useDailyLogStore((state) => state.draftEntry);
  const savedEntry = useDailyLogStore((state) => state.savedEntry);
  const syncSource = useDailyLogStore((state) => state.syncSource);
  const syncState = useDailyLogStore((state) => state.syncState);
  const syncMessage = useDailyLogStore((state) => state.syncMessage);
  const addMemo = useDailyLogStore((state) => state.addMemo);
  const updateMemo = useDailyLogStore((state) => state.updateMemo);
  const removeMemo = useDailyLogStore((state) => state.removeMemo);
  const toggleMemoPinned = useDailyLogStore((state) => state.toggleMemoPinned);
  const saveDraft = useDailyLogStore((state) => state.saveDraft);

  const onSave = () => {
    startTransition(() => {
      void saveDraft();
    });
  };

  return (
    <div className="space-y-4 py-1 sm:space-y-5">
      <SectionCard
        title={"\u30e1\u30e2"}
        description={"\u9078\u629e\u4e2d\u306e\u65e5\u4ed8\u306b\u3072\u3082\u3065\u304f\u30e1\u30e2\u3092\u8ffd\u52a0\u30fb\u7de8\u96c6\u30fb\u30d4\u30f3\u7559\u3081\u3067\u304d\u307e\u3059\u3002"}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={addMemo}
              className="inline-flex items-center gap-2 rounded-full bg-oat px-4 py-2 text-sm font-semibold text-ink"
            >
              <Plus className="h-4 w-4" />
              {"\u30e1\u30e2\u8ffd\u52a0"}
            </button>
            <button
              onClick={onSave}
              disabled={syncState === "saving"}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {syncState === "saving" ? "\u4fdd\u5b58\u4e2d" : "\u4fdd\u5b58"}
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] bg-oat px-4 py-3 text-sm text-ink/70">
          <span>{`\u9078\u629e\u4e2d\u306e\u65e5\u4ed8 ${savedEntry.date.slice(0, 10)}`}</span>
          <span>{`\u4fdd\u5b58\u5143: ${syncSource}`}</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {draftEntry.memos.length > 0 ? (
            draftEntry.memos.map((memo) => (
              <article key={memo.id} className="rounded-[1.6rem] bg-white p-5 shadow-panel">
                <div className="flex items-center justify-between gap-3">
                  <input
                    className="w-full border-none bg-transparent text-base font-semibold text-ink outline-none"
                    placeholder={"\u30e1\u30e2\u30bf\u30a4\u30c8\u30eb"}
                    value={memo.title}
                    onChange={(event) => updateMemo(memo.id, { title: event.target.value })}
                  />
                  <button
                    onClick={() => toggleMemoPinned(memo.id)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${memo.pinned ? "bg-ember text-white" : "bg-oat text-ink/75"}`}
                    aria-label={memo.pinned ? "\u30d4\u30f3\u7559\u3081\u3092\u5916\u3059" : "\u30d4\u30f3\u7559\u3081\u3059\u308b"}
                  >
                    {memo.pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <textarea
                  className={`${inputClassName} min-h-36 resize-none`}
                  placeholder={"\u5185\u5bb9\u3092\u5165\u529b"}
                  value={memo.content}
                  onChange={(event) => updateMemo(memo.id, { content: event.target.value })}
                />
                <input
                  className={inputClassName}
                  placeholder={"\u30bf\u30b0\u306f\u30ab\u30f3\u30de\u533a\u5207\u308a\u3067\u5165\u529b"}
                  value={memo.tags.join(", ")}
                  onChange={(event) =>
                    updateMemo(memo.id, {
                      tags: event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    })
                  }
                />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {memo.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-oat px-3 py-1 text-xs font-semibold text-ink/70">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => removeMemo(memo.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#f0d7cf] px-3 py-2 text-xs font-semibold text-[#b2512d]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {"\u524a\u9664"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <article className="rounded-[1.6rem] bg-white p-6 text-sm text-ink/60 shadow-panel">
              {"\u3053\u306e\u65e5\u4ed8\u306e\u30e1\u30e2\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002\u300c\u30e1\u30e2\u8ffd\u52a0\u300d\u304b\u3089\u958b\u59cb\u3067\u304d\u307e\u3059\u3002"}
            </article>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={"\u4fdd\u5b58\u72b6\u6cc1"}
        description={"\u30e1\u30e2\u306e\u5909\u66f4\u306f\u65e5\u6b21\u30a8\u30f3\u30c8\u30ea\u30fc\u5168\u4f53\u3068\u4e00\u7dd2\u306b\u4fdd\u5b58\u3055\u308c\u307e\u3059\u3002"}
      >
        <div className="rounded-[1.35rem] bg-moss p-5 text-sm text-white/85">
          {syncMessage ?? "\u30e1\u30e2\u3092\u7de8\u96c6\u3057\u305f\u3089\u4fdd\u5b58\u3092\u62bc\u3057\u3066\u304f\u3060\u3055\u3044\u3002"}
        </div>
      </SectionCard>
    </div>
  );
}