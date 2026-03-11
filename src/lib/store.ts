"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  pinnedMemos as defaultPinnedMemos,
  salesTrend as defaultSalesTrend,
  todayEntry,
  upcomingSchedules as defaultUpcomingSchedules
} from "@/lib/mock-data";
import type { DailyEntry, MemoItem, SalesSnapshot, SalesTrendPoint, ScheduleItem } from "@/types/domain";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const scheduleCategories = ["\u696d\u52d9", "\u4ed5\u5165\u308c", "\u4f1a\u8b70", "\u30d7\u30e9\u30a4\u30d9\u30fc\u30c8", "\u305d\u306e\u4ed6"] as const;

const isScheduleCategory = (value: string): value is ScheduleItem["category"] =>
  scheduleCategories.includes(value as ScheduleItem["category"]);

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
    category: isScheduleCategory(schedule.category) ? schedule.category : "\u696d\u52d9",
    reminderMinutes
  };
};

const normalizeEntry = (entry: DailyEntry): DailyEntry => ({
  ...entry,
  temperature: Number(entry.temperature) || 0,
  tags: entry.tags.map((tag) => tag.trim()).filter(Boolean),
  sales: normalizeSales(entry.sales),
  schedules: (entry.schedules ?? [])
    .map(normalizeSchedule)
    .filter((schedule) => schedule.title || schedule.start)
    .sort((left, right) => left.start.localeCompare(right.start)),
  memos: (entry.memos ?? []).map(normalizeMemo).filter((memo) => memo.title || memo.content)
});

const createInitialEntry = () => normalizeEntry(clone(todayEntry));
const createInitialTrend = () => clone(defaultSalesTrend);
const createPinnedMemos = () => clone(defaultPinnedMemos);

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
  name: "\u65b0\u898f\u30ab\u30c6\u30b4\u30ea",
  amount: 0
});

const createSchedule = (date: string): ScheduleItem => ({
  id: `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  start: `${date.slice(0, 10)}T10:00:00+09:00`,
  end: `${date.slice(0, 10)}T11:00:00+09:00`,
  category: "\u696d\u52d9",
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
  updateEntryField: <K extends keyof Pick<DailyEntry, "date" | "weather" | "temperature" | "wind" | "diary">>(
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
  loadEntry: (date?: string) => Promise<void>;
  saveDraft: () => Promise<void>;
  resetDemoData: () => void;
};

const getLoadMessage = (source: Exclude<SyncSource, "local">) => {
  switch (source) {
    case "database":
      return "\u30c7\u30fc\u30bf\u30d9\u30fc\u30b9\u304b\u3089\u8aad\u307f\u8fbc\u307f\u307e\u3057\u305f\u3002";
    case "file":
      return "\u4fdd\u5b58\u30d5\u30a1\u30a4\u30eb\u304b\u3089\u8aad\u307f\u8fbc\u307f\u307e\u3057\u305f\u3002";
    default:
      return "\u30e2\u30c3\u30af\u30c7\u30fc\u30bf\u3092\u8868\u793a\u3057\u3066\u3044\u307e\u3059\u3002";
  }
};

const getSaveMessage = (source: Exclude<SyncSource, "local">) => {
  switch (source) {
    case "database":
      return "\u30c7\u30fc\u30bf\u30d9\u30fc\u30b9\u306b\u4fdd\u5b58\u3057\u307e\u3057\u305f\u3002";
    case "file":
      return "\u30b5\u30fc\u30d0\u30fc\u306e\u4fdd\u5b58\u30d5\u30a1\u30a4\u30eb\u306b\u4fdd\u5b58\u3057\u307e\u3057\u305f\u3002";
    default:
      return "\u30e2\u30c3\u30af\u4fdd\u5b58\u3068\u3057\u3066\u53cd\u6620\u3057\u307e\u3057\u305f\u3002";
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
      loadEntry: async (date) => {
        const targetDate = date ?? get().draftEntry.date;

        set({
          syncState: "loading",
          syncMessage: "\u8a18\u9332\u3092\u8aad\u307f\u8fbc\u3093\u3067\u3044\u307e\u3059\u3002"
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
            syncMessage: "\u8a18\u9332\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002",
            hasBootstrapped: true
          });
        }
      },
      saveDraft: async () => {
        const payload = normalizeEntry(get().draftEntry);

        set({
          draftEntry: payload,
          syncState: "saving",
          syncMessage: "\u4fdd\u5b58\u3057\u3066\u3044\u307e\u3059\u3002"
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
            syncMessage: "\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002"
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
          syncMessage: "\u30c7\u30e2\u30c7\u30fc\u30bf\u306b\u623b\u3057\u307e\u3057\u305f\u3002",
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
      })
    }
  )
);