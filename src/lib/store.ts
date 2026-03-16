"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  pinnedMemos as defaultPinnedMemos,
  salesTrend as defaultSalesTrend,
  todayEntry,
  upcomingSchedules as defaultUpcomingSchedules
} from "@/lib/mock-data";
import type {
  DailyEntry,
  EntryAttachment,
  MemoItem,
  SalesSnapshot,
  SalesTrendPoint,
  ScheduleItem
} from "@/types/domain";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const scheduleCategories = ["業務", "仕入れ", "会議", "プライベート", "その他"] as const;

const isScheduleCategory = (value: string): value is ScheduleItem["category"] =>
  scheduleCategories.includes(value as ScheduleItem["category"]);

const optionalNumber = (value: unknown) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundTemperature = (value: number) => Math.round(value * 10) / 10;

const normalizeTemperatureFields = (
  temperature: unknown,
  temperatureMin: unknown,
  temperatureMax: unknown
) => {
  let nextMin = optionalNumber(temperatureMin);
  let nextMax = optionalNumber(temperatureMax);
  const legacyTemperature = optionalNumber(temperature);

  if (nextMin === null && nextMax === null && legacyTemperature !== null && legacyTemperature !== 0) {
    nextMin = legacyTemperature;
    nextMax = legacyTemperature;
  }

  if (nextMin !== null && nextMax !== null && nextMin > nextMax) {
    [nextMin, nextMax] = [nextMax, nextMin];
  }

  const representativeTemperature =
    nextMin !== null && nextMax !== null
      ? roundTemperature((nextMin + nextMax) / 2)
      : nextMax ?? nextMin ?? legacyTemperature ?? 0;

  return {
    temperature: representativeTemperature,
    temperatureMin: nextMin,
    temperatureMax: nextMax
  };
};

const normalizeSales = (sales: SalesSnapshot): SalesSnapshot => {
  const customers = Math.max(0, Math.floor(Number(sales.customers) || 0));
  const total = Math.max(0, Math.floor(Number(sales.total) || 0));
  const target = Math.max(0, Math.floor(Number(sales.target) || 0));
  const categories = sales.categories
    .map((category) => ({
      ...category,
      name: category.name.trim(),
      amount: Math.max(0, Math.floor(Number(category.amount) || 0))
    }))
    .filter((category) => category.name);

  return {
    ...sales,
    total,
    target,
    customers,
    averageSpend: customers > 0 ? Math.round(total / customers) : 0,
    categories
  };
};

const normalizeMemo = (memo: MemoItem): MemoItem => ({
  ...memo,
  title: memo.title.trim(),
  content: memo.content.trim(),
  tags: memo.tags.map((tag) => tag.trim()).filter(Boolean)
});

const normalizeSchedule = (schedule: ScheduleItem): ScheduleItem => {
  const reminderMinutes = Array.from(
    new Set(
      (schedule.reminderMinutes ?? [])
        .map((value) => Math.max(0, Math.floor(Number(value) || 0)))
        .filter((value) => value > 0)
    )
  ).sort((left, right) => left - right);

  return {
    ...schedule,
    title: schedule.title.trim(),
    start: schedule.start,
    end: schedule.end,
    category: isScheduleCategory(schedule.category) ? schedule.category : "業務",
    reminderMinutes
  };
};

const normalizeAttachment = (attachment: EntryAttachment): EntryAttachment => ({
  ...attachment,
  name: attachment.name.trim() || "画像",
  url: attachment.url.trim(),
  mimeType: attachment.mimeType.trim() || "image/jpeg",
  size: Math.max(0, Math.floor(Number(attachment.size) || 0)),
  createdAt: new Date(attachment.createdAt).toISOString(),
  expiresAt: attachment.keepForever || !attachment.expiresAt ? null : new Date(attachment.expiresAt).toISOString(),
  keepForever: Boolean(attachment.keepForever)
});

const normalizeEntry = (entry: DailyEntry): DailyEntry => ({
  ...entry,
  ...normalizeTemperatureFields(entry.temperature, entry.temperatureMin, entry.temperatureMax),
  tags: entry.tags.map((tag) => tag.trim()).filter(Boolean),
  sales: normalizeSales(entry.sales),
  schedules: (entry.schedules ?? [])
    .map(normalizeSchedule)
    .filter((schedule) => schedule.title || schedule.start)
    .sort((left, right) => left.start.localeCompare(right.start)),
  memos: (entry.memos ?? []).map(normalizeMemo).filter((memo) => memo.title || memo.content),
  attachments: (entry.attachments ?? [])
    .map(normalizeAttachment)
    .filter((attachment) => attachment.url.startsWith("data:image/"))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
});

const createInitialEntry = () => normalizeEntry(clone(todayEntry));
const createInitialTrend = () => clone(defaultSalesTrend);
const createPinnedMemos = () => clone(defaultPinnedMemos);

const mergePersistedEntry = (entry: Partial<DailyEntry> | undefined, fallback: DailyEntry): DailyEntry =>
  normalizeEntry({
    ...fallback,
    ...entry,
    tags: entry?.tags ?? fallback.tags,
    sales: {
      ...fallback.sales,
      ...(entry?.sales ?? {}),
      categories: entry?.sales?.categories ?? fallback.sales.categories
    },
    schedules: entry?.schedules ?? fallback.schedules,
    memos: entry?.memos ?? fallback.memos,
    attachments: entry?.attachments ?? fallback.attachments
  });

const syncTrendWithEntry = (trend: SalesTrendPoint[], entry: DailyEntry) =>
  trend.map((point, index) =>
    index === trend.length - 1
      ? {
          ...point,
          sales: entry.sales.total,
          target: entry.sales.target
        }
      : point
  );

const mergeUpcomingSchedules = (entry: DailyEntry) => {
  const currentDate = entry.date.slice(0, 10);
  const preserved = clone(defaultUpcomingSchedules).filter((schedule) => schedule.start.slice(0, 10) !== currentDate);
  return [...clone(entry.schedules), ...preserved].sort((left, right) => left.start.localeCompare(right.start));
};

const mergePinnedMemos = (entry: DailyEntry, pinnedMemos: MemoItem[]) => {
  const entryPinned = entry.memos.filter((memo) => memo.pinned);
  const preserved = pinnedMemos.filter((memo) => !entry.memos.some((entryMemo) => entryMemo.id === memo.id));
  return [...entryPinned, ...preserved];
};

const createEmptyMemo = (): MemoItem => ({
  id: `memo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  content: "",
  tags: [],
  pinned: false
});

const createSalesCategory = () => ({
  id: `category-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "新規カテゴリ",
  amount: 0
});

const createSchedule = (date: string): ScheduleItem => ({
  id: `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  start: `${date.slice(0, 10)}T10:00:00+09:00`,
  end: `${date.slice(0, 10)}T11:00:00+09:00`,
  category: "業務",
  reminderMinutes: [15]
});

type SyncSource = "local" | "mock" | "file" | "database";
type SyncState = "idle" | "loading" | "saving" | "synced" | "error";

type EntryApiResponse = {
  kind?: "entry";
  entry: DailyEntry;
  source: Exclude<SyncSource, "local">;
};

type DailyLogState = {
  draftEntry: DailyEntry;
  savedEntry: DailyEntry;
  pinnedMemos: MemoItem[];
  upcomingSchedules: ScheduleItem[];
  salesTrend: SalesTrendPoint[];
  lastSavedAt: string | null;
  syncState: SyncState;
  syncSource: SyncSource;
  syncMessage: string | null;
  hasBootstrapped: boolean;
  updateEntryField: <K extends keyof Pick<DailyEntry, "date" | "weather" | "temperature" | "temperatureMin" | "temperatureMax" | "wind" | "diary">>(
    field: K,
    value: DailyEntry[K]
  ) => void;
  updateSalesField: <K extends keyof Pick<SalesSnapshot, "total" | "target" | "customers" | "note">>(
    field: K,
    value: SalesSnapshot[K]
  ) => void;
  updateTagString: (value: string) => void;
  addSalesCategory: () => void;
  updateCategoryName: (categoryId: string, name: string) => void;
  updateCategoryAmount: (categoryId: string, amount: number) => void;
  removeSalesCategory: (categoryId: string) => void;
  addSchedule: () => void;
  updateSchedule: (
    scheduleId: string,
    patch: Partial<Pick<ScheduleItem, "title" | "start" | "end" | "category" | "reminderMinutes">>
  ) => void;
  removeSchedule: (scheduleId: string) => void;
  addMemo: () => void;
  updateMemo: (memoId: string, patch: Partial<Pick<MemoItem, "title" | "content" | "tags" | "pinned">>) => void;
  removeMemo: (memoId: string) => void;
  toggleMemoPinned: (memoId: string) => void;
  addAttachments: (attachments: EntryAttachment[]) => void;
  removeAttachment: (attachmentId: string) => void;
  toggleAttachmentKeepForever: (attachmentId: string) => void;
  loadEntry: (date?: string) => Promise<void>;
  saveDraft: () => Promise<void>;
  resetDemoData: () => void;
};

const getLoadMessage = (source: Exclude<SyncSource, "local">) => {
  switch (source) {
    case "database":
      return "データベースから読み込みました。";
    case "file":
      return "保存ファイルから読み込みました。";
    default:
      return "モックデータを表示しています。";
  }
};

const getSaveMessage = (source: Exclude<SyncSource, "local">) => {
  switch (source) {
    case "database":
      return "データベースに保存しました。";
    case "file":
      return "サーバーの保存ファイルに保存しました。";
    default:
      return "モック保存として反映しました。";
  }
};

export const useDailyLogStore = create<DailyLogState>()(
  persist(
    (set, get) => ({
      draftEntry: createInitialEntry(),
      savedEntry: createInitialEntry(),
      pinnedMemos: createPinnedMemos(),
      upcomingSchedules: mergeUpcomingSchedules(createInitialEntry()),
      salesTrend: createInitialTrend(),
      lastSavedAt: null,
      syncState: "idle",
      syncSource: "local",
      syncMessage: null,
      hasBootstrapped: false,
      updateEntryField: (field, value) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            [field]: value
          }),
          syncState: state.syncState === "error" ? "idle" : state.syncState,
          syncMessage: null
        })),
      updateSalesField: (field, value) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            sales: {
              ...state.draftEntry.sales,
              [field]: value
            }
          }),
          syncState: state.syncState === "error" ? "idle" : state.syncState,
          syncMessage: null
        })),
      updateTagString: (value) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            tags: value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          }),
          syncState: state.syncState === "error" ? "idle" : state.syncState,
          syncMessage: null
        })),
      addSalesCategory: () =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            sales: {
              ...state.draftEntry.sales,
              categories: [...state.draftEntry.sales.categories, createSalesCategory()]
            }
          }),
          syncMessage: null
        })),
      updateCategoryName: (categoryId, name) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            sales: {
              ...state.draftEntry.sales,
              categories: state.draftEntry.sales.categories.map((category) =>
                category.id === categoryId
                  ? {
                      ...category,
                      name
                    }
                  : category
              )
            }
          }),
          syncMessage: null
        })),
      updateCategoryAmount: (categoryId, amount) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            sales: {
              ...state.draftEntry.sales,
              categories: state.draftEntry.sales.categories.map((category) =>
                category.id === categoryId
                  ? {
                      ...category,
                      amount: Math.max(0, Math.floor(Number(amount) || 0))
                    }
                  : category
              )
            }
          }),
          syncMessage: null
        })),
      removeSalesCategory: (categoryId) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            sales: {
              ...state.draftEntry.sales,
              categories: state.draftEntry.sales.categories.filter((category) => category.id !== categoryId)
            }
          }),
          syncMessage: null
        })),
      addSchedule: () =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            schedules: [...state.draftEntry.schedules, createSchedule(state.draftEntry.date)]
          }),
          syncMessage: null
        })),
      updateSchedule: (scheduleId, patch) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            schedules: state.draftEntry.schedules.map((schedule) =>
              schedule.id === scheduleId
                ? {
                    ...schedule,
                    ...patch,
                    reminderMinutes: patch.reminderMinutes ?? schedule.reminderMinutes
                  }
                : schedule
            )
          }),
          syncMessage: null
        })),
      removeSchedule: (scheduleId) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            schedules: state.draftEntry.schedules.filter((schedule) => schedule.id !== scheduleId)
          }),
          syncMessage: null
        })),
      addMemo: () =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            memos: [...state.draftEntry.memos, createEmptyMemo()]
          }),
          syncMessage: null
        })),
      updateMemo: (memoId, patch) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            memos: state.draftEntry.memos.map((memo) =>
              memo.id === memoId
                ? {
                    ...memo,
                    ...patch,
                    tags: patch.tags ?? memo.tags
                  }
                : memo
            )
          }),
          syncMessage: null
        })),
      removeMemo: (memoId) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            memos: state.draftEntry.memos.filter((memo) => memo.id !== memoId)
          }),
          pinnedMemos: state.pinnedMemos.filter((memo) => memo.id !== memoId),
          syncMessage: null
        })),
      toggleMemoPinned: (memoId) =>
        set((state) => {
          const draftEntry = normalizeEntry({
            ...state.draftEntry,
            memos: state.draftEntry.memos.map((memo) =>
              memo.id === memoId
                ? {
                    ...memo,
                    pinned: !memo.pinned
                  }
                : memo
            )
          });

          return {
            draftEntry,
            pinnedMemos: mergePinnedMemos(draftEntry, state.pinnedMemos),
            syncMessage: null
          };
        }),
      addAttachments: (attachments) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            attachments: [...state.draftEntry.attachments, ...attachments]
          }),
          syncMessage: null
        })),
      removeAttachment: (attachmentId) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            attachments: state.draftEntry.attachments.filter((attachment) => attachment.id !== attachmentId)
          }),
          syncMessage: null
        })),
      toggleAttachmentKeepForever: (attachmentId) =>
        set((state) => ({
          draftEntry: normalizeEntry({
            ...state.draftEntry,
            attachments: state.draftEntry.attachments.map((attachment) =>
              attachment.id === attachmentId
                ? {
                    ...attachment,
                    keepForever: !attachment.keepForever,
                    expiresAt: attachment.keepForever ? new Date(new Date(attachment.createdAt).setMonth(new Date(attachment.createdAt).getMonth() + 13)).toISOString() : null
                  }
                : attachment
            )
          }),
          syncMessage: null
        })),
      loadEntry: async (date) => {
        const targetDate = date ?? get().draftEntry.date;

        set({
          syncState: "loading",
          syncMessage: "記録を読み込んでいます。"
        });

        try {
          const response = await fetch(`/api/entries?date=${encodeURIComponent(targetDate)}`, {
            cache: "no-store"
          });

          if (!response.ok) {
            throw new Error(`Failed to load entry (${response.status})`);
          }

          const payload = (await response.json()) as EntryApiResponse;
          const entry = normalizeEntry(payload.entry);

          set((state) => ({
            draftEntry: entry,
            savedEntry: entry,
            pinnedMemos: mergePinnedMemos(entry, state.pinnedMemos),
            upcomingSchedules: mergeUpcomingSchedules(entry),
            salesTrend: syncTrendWithEntry(state.salesTrend.length > 0 ? state.salesTrend : createInitialTrend(), entry),
            syncState: "synced",
            syncSource: payload.source,
            syncMessage: getLoadMessage(payload.source),
            hasBootstrapped: true
          }));
        } catch (error) {
          console.error("loadEntry failed", error);
          set({
            syncState: "error",
            syncMessage: "記録の読み込みに失敗しました。",
            hasBootstrapped: true
          });
        }
      },
      saveDraft: async () => {
        const payload = normalizeEntry(get().draftEntry);

        set({
          draftEntry: payload,
          syncState: "saving",
          syncMessage: "保存しています。"
        });

        try {
          const response = await fetch("/api/entries", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`Failed to save entry (${response.status})`);
          }

          const result = (await response.json()) as EntryApiResponse;
          const entry = normalizeEntry(result.entry);
          const savedAt = new Date().toISOString();

          set((state) => ({
            draftEntry: entry,
            savedEntry: entry,
            pinnedMemos: mergePinnedMemos(entry, state.pinnedMemos),
            upcomingSchedules: mergeUpcomingSchedules(entry),
            salesTrend: syncTrendWithEntry(state.salesTrend.length > 0 ? state.salesTrend : createInitialTrend(), entry),
            lastSavedAt: savedAt,
            syncState: "synced",
            syncSource: result.source,
            syncMessage: getSaveMessage(result.source),
            hasBootstrapped: true
          }));
        } catch (error) {
          console.error("saveDraft failed", error);
          set({
            syncState: "error",
            syncMessage: "保存に失敗しました。"
          });
        }
      },
      resetDemoData: () => {
        const initialEntry = createInitialEntry();

        set({
          draftEntry: initialEntry,
          savedEntry: initialEntry,
          pinnedMemos: createPinnedMemos(),
          upcomingSchedules: mergeUpcomingSchedules(initialEntry),
          salesTrend: createInitialTrend(),
          lastSavedAt: null,
          syncState: "idle",
          syncSource: "local",
          syncMessage: "デモデータに戻しました。",
          hasBootstrapped: true
        });
      }
    }),
    {
      name: "dailylog-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        draftEntry: state.draftEntry,
        savedEntry: state.savedEntry,
        pinnedMemos: state.pinnedMemos,
        upcomingSchedules: state.upcomingSchedules,
        salesTrend: state.salesTrend,
        lastSavedAt: state.lastSavedAt,
        syncState: state.syncState,
        syncSource: state.syncSource,
        syncMessage: state.syncMessage,
        hasBootstrapped: state.hasBootstrapped
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<DailyLogState>) ?? {};

        return {
          ...currentState,
          ...persisted,
          draftEntry: mergePersistedEntry(persisted.draftEntry, currentState.draftEntry),
          savedEntry: mergePersistedEntry(persisted.savedEntry, currentState.savedEntry),
          pinnedMemos: persisted.pinnedMemos ?? currentState.pinnedMemos,
          upcomingSchedules: persisted.upcomingSchedules ?? currentState.upcomingSchedules,
          salesTrend: persisted.salesTrend ?? currentState.salesTrend
        };
      }
    }
  )
);
