"use client";

import Image from "next/image";
import { CloudSun, ImageIcon, NotebookText, Pin, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatFileSize, formatShortDate } from "@/lib/format";
import { useDailyLogStore } from "@/lib/store";

const weatherLabelMap = {
  sunny: "晴れ",
  cloudy: "曇り",
  rainy: "雨",
  snowy: "雪",
  other: "その他"
} as const;

const windLabelMap = {
  calm: "無風",
  light: "微風",
  moderate: "やや強い",
  strong: "強い",
  veryStrong: "非常に強い"
} as const;

const syncSourceMap = {
  local: "ローカル",
  mock: "モック",
  file: "保存ファイル",
  database: "データベース"
} as const;

export default function HomePage() {
  const savedEntry = useDailyLogStore((state) => state.savedEntry);
  const pinnedMemos = useDailyLogStore((state) => state.pinnedMemos);
  const upcomingSchedules = useDailyLogStore((state) => state.upcomingSchedules);
  const salesTrend = useDailyLogStore((state) => state.salesTrend);
  const lastSavedAt = useDailyLogStore((state) => state.lastSavedAt);
  const syncSource = useDailyLogStore((state) => state.syncSource);
  const syncMessage = useDailyLogStore((state) => state.syncMessage);

  const attachments = savedEntry.attachments ?? [];
  const memos = savedEntry.memos ?? [];
  const schedules = savedEntry.schedules ?? [];

  const derivedPinnedMemos = [
    ...memos.filter((memo) => memo.pinned),
    ...pinnedMemos.filter((memo) => !memos.some((entryMemo) => entryMemo.id === memo.id))
  ];

  const achievedRate = savedEntry.sales.target > 0
    ? Math.round((savedEntry.sales.total / savedEntry.sales.target) * 100)
    : 0;
  const maxTrend = Math.max(...salesTrend.map((item) => Math.max(item.sales, item.target)), 1);
  const isFirstSetup =
    savedEntry.sales.total === 0 &&
    savedEntry.sales.customers === 0 &&
    !savedEntry.diary.trim() &&
    memos.length === 0 &&
    schedules.length === 0 &&
    attachments.length === 0;
  const leadAttachment = attachments[0] ?? null;

  return (
    <div className="space-y-4 py-1 sm:space-y-5">
      <section className="overflow-hidden rounded-[1.8rem] bg-moss bg-grain px-5 py-6 text-cloud shadow-panel sm:px-6 sm:py-7">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_320px] lg:items-end">
          <div className="min-w-0 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">ダッシュボード</p>
            <h2 className="mt-2 font-display text-[1.9rem] leading-tight sm:text-[2.45rem]">
              今日の店舗状況を、ひと目で確認。
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
              日報、売上、予定、メモを同じ日付に紐づけて、入力から振り返りまでをひとつの流れで見られます。
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-white/10 p-4 backdrop-blur">
            <p className="text-sm text-white/75">{formatShortDate(savedEntry.date)}</p>
            <div className="mt-2 flex items-center gap-3 text-xl font-semibold sm:text-2xl">
              <CloudSun className="h-6 w-6 shrink-0" />
              <span className="truncate">
                {weatherLabelMap[savedEntry.weather]} {savedEntry.temperature}℃
              </span>
            </div>
            <p className="mt-2 text-sm text-white/75">
              風: {windLabelMap[savedEntry.wind]} / {lastSavedAt
                ? `最終保存 ${new Date(lastSavedAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}`
                : "未保存"}
            </p>
            <p className="mt-2 text-xs text-white/60">{`保存元: ${syncSourceMap[syncSource]}`}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="今日の売上"
          value={formatCurrency(savedEntry.sales.total)}
          hint={`目標 ${formatCurrency(savedEntry.sales.target)}`}
          accent="ember"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="目標達成率"
          value={`${achievedRate}%`}
          hint={syncMessage ?? "保存状況はここに表示されます。"}
          accent="moss"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="客数"
          value={`${savedEntry.sales.customers}`}
          hint={`客単価 ${formatCurrency(savedEntry.sales.averageSpend)}`}
          icon={<NotebookText className="h-4 w-4" />}
        />
        <StatCard
          label="メモ数"
          value={`${memos.length}`}
          hint="ピン留めすると下にまとまって表示されます。"
          icon={<Pin className="h-4 w-4" />}
        />
      </section>

      <SectionCard
        title={isFirstSetup ? "はじめ方" : "使い方メモ"}
        description={
          isFirstSetup
            ? "最初の記録は3分くらいで作れます。迷ったらこの順に触るのがおすすめです。"
            : "迷ったときに戻れるよう、よく使う流れをここに残しています。"
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-[1.25rem] bg-oat p-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">Step 1</p>
            <p className="mt-3 font-semibold text-ink">記録で売上と日記を入れる</p>
            <p className="mt-2 text-sm leading-6 text-ink/75">
              まずは今日の売上、客数、ひとことメモだけでも入れるとホームが動き始めます。
            </p>
          </article>
          <article className="rounded-[1.25rem] bg-oat p-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">Step 2</p>
            <p className="mt-3 font-semibold text-ink">画像も一緒に残す</p>
            <p className="mt-2 text-sm leading-6 text-ink/75">
              売場や店頭の写真を同じ日に添付しておくと、前年同時期の見直しがかなりしやすくなります。
            </p>
          </article>
          <article className="rounded-[1.25rem] bg-oat p-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">Step 3</p>
            <p className="mt-3 font-semibold text-ink">分析とメモで振り返る</p>
            <p className="mt-2 text-sm leading-6 text-ink/75">
              データが増えるほど、売上の流れや残しておきたい気づきが見やすくなります。
            </p>
          </article>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard
          title="売上サマリー"
          description="週間の売上推移を、スクロールなしで全件見渡せる幅に整えています。"
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
          title="直近の予定"
          description="今日から数日先までの動きを確認できます。"
        >
          <div className="space-y-2.5">
            {upcomingSchedules.slice(0, 4).map((schedule) => (
              <div key={schedule.id} className="rounded-[1.2rem] border border-oat bg-cloud px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{schedule.title || "予定"}</p>
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
          title="今日の記録"
          description="日記、メモ、カテゴリ別売上をまとめて確認できます。"
        >
          <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[1.3rem] bg-oat p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">日記</p>
              <p className="mt-3 text-sm leading-7 text-ink/80">{savedEntry.diary || "まだ記録がありません。"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {savedEntry.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/70">
                    #{tag}
                  </span>
                ))}
              </div>
            </article>

            <article className="rounded-[1.3rem] bg-white p-4 ring-1 ring-oat">
              <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">カテゴリ別売上</p>
              <div className="mt-3 space-y-2.5">
                {savedEntry.sales.categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{category.name}</span>
                    <span className="shrink-0 font-semibold">{formatCurrency(category.amount)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-ink/70">{savedEntry.sales.note || "売上メモはまだありません。"}</p>
            </article>
          </div>
        </SectionCard>

        <SectionCard
          title="添付画像"
          description="その日の売場や店頭の写真をここから見返せます。"
        >
          {leadAttachment ? (
            <div className="space-y-3">
              <Image
                src={leadAttachment.url}
                alt={leadAttachment.name}
                width={1200}
                height={900}
                unoptimized
                className="aspect-[4/3] w-full rounded-[1.2rem] object-cover"
              />
              <div className="rounded-[1.2rem] bg-oat p-4">
                <p className="font-semibold text-ink">{leadAttachment.name}</p>
                <p className="mt-2 text-sm text-ink/70">{formatFileSize(leadAttachment.size)} / 全 {savedEntry.attachments.length} 枚</p>
                <p className="mt-2 text-sm text-ink/70">
                  {leadAttachment.keepForever
                    ? "この画像は期限なしで保持します。"
                    : `削除予定 ${leadAttachment.expiresAt ? formatShortDate(leadAttachment.expiresAt) : "未設定"}`}
                </p>
              </div>
            </div>
          ) : (
            <article className="rounded-[1.25rem] bg-oat p-4 text-sm text-ink/60">
              <div className="flex items-center gap-2 text-ink/75">
                <ImageIcon className="h-4 w-4" />
                まだ画像はありません。記録画面から追加するとここに表示されます。
              </div>
            </article>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="ピン留めメモ"
          description="後で見返したいメモをここに集めておけます。"
        >
          <div className="space-y-2.5">
            {derivedPinnedMemos.length > 0 ? (
              derivedPinnedMemos.map((memo) => (
                <article key={memo.id} className="rounded-[1.25rem] bg-oat p-4">
                  <p className="font-semibold text-ink">{memo.title || "メモ"}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/75">{memo.content || "内容はまだありません。"}</p>
                </article>
              ))
            ) : (
              <article className="rounded-[1.25rem] bg-oat p-4 text-sm text-ink/60">
                ピン留めされたメモはまだありません。
              </article>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
