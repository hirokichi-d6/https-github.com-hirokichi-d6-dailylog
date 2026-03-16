"use client";

import Image from "next/image";
import { startTransition, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ImagePlus,
  Mic,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { formatCurrency, formatFileSize, formatShortDate } from "@/lib/format";
import { useDailyLogStore } from "@/lib/store";
import type { EntryAttachment } from "@/types/domain";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-[#e7decd] bg-cloud px-3.5 py-2.5 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";
const attachmentRetentionMonths = 13;
const maxAttachmentCount = 6;

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

const shiftDate = (value: string, offset: number) => {
  const base = new Date(value);
  base.setDate(base.getDate() + offset);
  const year = base.getFullYear();
  const month = `${base.getMonth() + 1}`.padStart(2, "0");
  const day = `${base.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}T09:00:00+09:00`;
};

const addMonths = (value: Date, months: number) => {
  const next = new Date(value);
  next.setMonth(next.getMonth() + months);
  return next;
};

const readFileAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    reader.readAsDataURL(file);
  });

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の展開に失敗しました。"));
    image.src = src;
  });

const convertFileToAttachment = async (file: File): Promise<EntryAttachment> => {
  const sourceUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(sourceUrl);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("画像の変換に失敗しました。");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82);
  });

  if (!blob) {
    throw new Error("画像の圧縮に失敗しました。");
  }

  const dataUrl = await readFileAsDataUrl(blob);
  const createdAt = new Date();

  return {
    id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    url: dataUrl,
    mimeType: blob.type || "image/jpeg",
    size: blob.size,
    createdAt: createdAt.toISOString(),
    expiresAt: addMonths(createdAt, attachmentRetentionMonths).toISOString(),
    keepForever: false
  };
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
  const addAttachments = useDailyLogStore((state) => state.addAttachments);
  const removeAttachment = useDailyLogStore((state) => state.removeAttachment);
  const toggleAttachmentKeepForever = useDailyLogStore((state) => state.toggleAttachmentKeepForever);
  const loadEntry = useDailyLogStore((state) => state.loadEntry);
  const saveDraft = useDailyLogStore((state) => state.saveDraft);
  const resetDemoData = useDailyLogStore((state) => state.resetDemoData);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const onSelectFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    if (draftEntry.attachments.length >= maxAttachmentCount) {
      setUploadMessage(`画像は最大 ${maxAttachmentCount} 枚までです。`);
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const pickedFiles = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, Math.max(0, maxAttachmentCount - draftEntry.attachments.length));

      if (pickedFiles.length === 0) {
        throw new Error("画像ファイルを選んでください。");
      }

      const attachments = await Promise.all(pickedFiles.map(convertFileToAttachment));
      addAttachments(attachments);
      setUploadMessage(`${attachments.length} 枚の画像を追加しました。保存するとこの日の記録に紐づきます。`);
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "画像の追加に失敗しました。");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isBusy = syncState === "loading" || syncState === "saving" || isUploading;
  const statusTone =
    syncState === "error"
      ? "text-[#ffe5d6]"
      : syncState === "saving" || syncState === "loading"
        ? "text-white"
        : "text-white/80";

  return (
    <div className="space-y-4 py-1 sm:space-y-5">
      <SectionCard
        title="日次エントリー"
        description="日報、売上、画像をまとめて編集して、その日の記録として保存できます。"
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-full bg-oat px-3.5 py-2 text-sm font-semibold text-ink">
              <Mic className="h-4 w-4" />
              音声入力
            </button>
            <button
              onClick={onLoad}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-full border border-oat bg-white px-3.5 py-2 text-sm font-semibold text-ink disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              読込
            </button>
            <button
              onClick={onReset}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-full border border-oat bg-white px-3.5 py-2 text-sm font-semibold text-ink disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              サンプルに戻す
            </button>
            <button
              onClick={onSave}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {syncState === "saving" ? "保存中" : "保存"}
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
                  前日
                </button>
                <button
                  type="button"
                  onClick={() => jumpDate(1)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-60"
                >
                  翌日
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <p className="text-sm text-ink/65">{`選択中: ${draftEntry.date.slice(0, 10)}`}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink/75">
                日付
                <input
                  className={inputClassName}
                  value={draftEntry.date.slice(0, 10)}
                  onChange={(event) => updateEntryField("date", `${event.target.value}T09:00:00+09:00`)}
                  type="date"
                />
              </label>
              <label className="block text-sm font-medium text-ink/75">
                天気
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
                最低気温
                <input
                  className={inputClassName}
                  value={draftEntry.temperatureMin ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    updateEntryField("temperatureMin", value === "" ? null : Number(value));
                  }}
                  type="number"
                  step="0.1"
                  placeholder="例: 8.5"
                />
              </label>
              <label className="block text-sm font-medium text-ink/75">
                最高気温
                <input
                  className={inputClassName}
                  value={draftEntry.temperatureMax ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    updateEntryField("temperatureMax", value === "" ? null : Number(value));
                  }}
                  type="number"
                  step="0.1"
                  placeholder="例: 16.0"
                />
              </label>
              <label className="block text-sm font-medium text-ink/75">
                風の強さ
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
              日記・メモ
              <textarea
                className={`${inputClassName} min-h-44 resize-none`}
                value={draftEntry.diary}
                onChange={(event) => updateEntryField("diary", event.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-ink/75">
              タグ
              <input
                className={inputClassName}
                value={draftEntry.tags.join(", ")}
                onChange={(event) => updateTagString(event.target.value)}
                placeholder="例: 新商品, 仕入れ, イベント"
              />
            </label>

            <div className="rounded-[1.35rem] bg-white p-4 ring-1 ring-oat">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">画像添付</p>
                  <p className="mt-1 text-sm leading-6 text-ink/65">
                    売場写真や店頭の様子をこの日に紐づけて保存します。通常は 13 か月保存、`残す` を付けると期限なしになります。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void onSelectFiles(event.target.files);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy || draftEntry.attachments.length >= maxAttachmentCount}
                    className="inline-flex items-center gap-2 rounded-full bg-oat px-3 py-2 text-xs font-semibold text-ink disabled:opacity-60"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    画像を追加
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-[1.2rem] bg-cloud px-4 py-3 text-sm text-ink/70">
                <p>上限: {maxAttachmentCount} 枚 / 画像は自動で圧縮して保存します。</p>
                <p className="mt-1">保存後は他の PC から同じアカウントで見返せます。</p>
                {uploadMessage ? <p className="mt-2 font-medium text-moss">{uploadMessage}</p> : null}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {draftEntry.attachments.length > 0 ? (
                  draftEntry.attachments.map((attachment) => (
                    <article key={attachment.id} className="overflow-hidden rounded-[1.2rem] border border-oat bg-cloud">
                      <Image
                        src={attachment.url}
                        alt={attachment.name}
                        width={1200}
                        height={900}
                        unoptimized
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <div className="space-y-2 p-3">
                        <div>
                          <p className="truncate text-sm font-semibold text-ink">{attachment.name}</p>
                          <p className="mt-1 text-xs text-ink/60">{formatFileSize(attachment.size)}</p>
                        </div>
                        <p className="text-xs leading-5 text-ink/65">
                          {attachment.keepForever
                            ? "保持: 期限なし"
                            : `削除予定: ${attachment.expiresAt ? formatShortDate(attachment.expiresAt) : "未設定"}`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleAttachmentKeepForever(attachment.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#d7cbb7] bg-white px-3 py-1.5 text-xs font-semibold text-ink"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {attachment.keepForever ? "通常保存に戻す" : "残す"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#f0d7cf] bg-white px-3 py-1.5 text-xs font-semibold text-[#b2512d]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            削除
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <article className="rounded-[1.2rem] border border-dashed border-[#d7cbb7] bg-cloud px-4 py-6 text-sm text-ink/60 sm:col-span-2 xl:col-span-3">
                    まだ画像はありません。売場、店頭、POP、棚の様子などを残すと振り返りしやすくなります。
                  </article>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="rounded-[1.35rem] bg-oat p-4">
              <p className="text-sm font-semibold text-ink">売上入力</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-ink/75">
                  当日売上
                  <input
                    className={inputClassName}
                    value={draftEntry.sales.total}
                    onChange={(event) => updateSalesField("total", Number(event.target.value || 0))}
                    type="number"
                  />
                </label>
                <label className="block text-sm font-medium text-ink/75">
                  目標売上
                  <input
                    className={inputClassName}
                    value={draftEntry.sales.target}
                    onChange={(event) => updateSalesField("target", Number(event.target.value || 0))}
                    type="number"
                  />
                </label>
                <label className="block text-sm font-medium text-ink/75">
                  客数
                  <input
                    className={inputClassName}
                    value={draftEntry.sales.customers}
                    onChange={(event) => updateSalesField("customers", Number(event.target.value || 0))}
                    type="number"
                  />
                </label>
                <div className="rounded-xl bg-white px-3.5 py-3 text-sm text-ink/70">
                  <p className="font-semibold text-ink">客単価</p>
                  <p className="mt-1.5 text-lg font-semibold">{formatCurrency(draftEntry.sales.averageSpend)}</p>
                </div>
              </div>
              <label className="mt-3 block text-sm font-medium text-ink/75">
                売上メモ
                <textarea
                  className={`${inputClassName} min-h-24 resize-none`}
                  value={draftEntry.sales.note}
                  onChange={(event) => updateSalesField("note", event.target.value)}
                />
              </label>
            </div>

            <div className="rounded-[1.35rem] bg-white p-4 ring-1 ring-oat">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">カテゴリ別売上</p>
                <button
                  type="button"
                  onClick={addSalesCategory}
                  className="inline-flex items-center gap-2 rounded-full bg-oat px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  <Plus className="h-3.5 w-3.5" />
                  カテゴリ追加
                </button>
              </div>
              <div className="mt-3 space-y-2.5">
                {draftEntry.sales.categories.map((category) => (
                  <div key={category.id} className="rounded-xl bg-cloud p-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                      <label className="block text-sm font-medium text-ink/75">
                        カテゴリ名
                        <input
                          className={inputClassName}
                          value={category.name}
                          onChange={(event) => updateCategoryName(category.id, event.target.value)}
                        />
                      </label>
                      <label className="block text-sm font-medium text-ink/75">
                        金額
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
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.35rem] bg-moss p-4 text-cloud">
              <p className="text-sm font-semibold">保存状況</p>
              <p className={`mt-2 text-sm leading-6 ${statusTone}`}>
                {syncMessage ??
                  (lastSavedAt
                    ? `最終保存 ${new Date(lastSavedAt).toLocaleString("ja-JP")}`
                    : "まだ保存していません。")}
              </p>
              <p className="mt-2 text-xs text-white/60">{`保存元: ${syncSource}`}</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
