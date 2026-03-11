import type {
  DailyEntry,
  MemoItem,
  SalesCategory,
  SalesSnapshot,
  ScheduleItem,
  Weather,
  WindStrength
} from "@/types/domain";

type EntryCategoryRecord = {
  id: string;
  categoryName: string;
  amount: unknown;
};

type EntryRecord = {
  id: string;
  date: Date;
  weather: "SUNNY" | "CLOUDY" | "RAINY" | "SNOWY" | "OTHER" | null;
  temperature: unknown;
  windStrength: "CALM" | "LIGHT" | "MODERATE" | "STRONG" | "VERY_STRONG" | null;
  diaryContent: string | null;
  tags: string[];
  salesRecord:
    | {
        totalSales: unknown;
        targetSales: unknown;
        customerCount: number | null;
        memo: string | null;
        categories: EntryCategoryRecord[];
      }
    | null;
};

type PersistedWeather = Exclude<EntryRecord["weather"], null>;
type PersistedWindStrength = Exclude<EntryRecord["windStrength"], null>;

const weatherMap: Record<Weather, PersistedWeather> = {
  sunny: "SUNNY",
  cloudy: "CLOUDY",
  rainy: "RAINY",
  snowy: "SNOWY",
  other: "OTHER"
};

const windMap: Record<WindStrength, PersistedWindStrength> = {
  calm: "CALM",
  light: "LIGHT",
  moderate: "MODERATE",
  strong: "STRONG",
  veryStrong: "VERY_STRONG"
};

const reverseWeatherMap: Record<PersistedWeather, Weather> = {
  SUNNY: "sunny",
  CLOUDY: "cloudy",
  RAINY: "rainy",
  SNOWY: "snowy",
  OTHER: "other"
};

const reverseWindMap: Record<PersistedWindStrength, WindStrength> = {
  CALM: "calm",
  LIGHT: "light",
  MODERATE: "moderate",
  STRONG: "strong",
  VERY_STRONG: "veryStrong"
};

const scheduleCategories = ["\u696d\u52d9", "\u4ed5\u5165\u308c", "\u4f1a\u8b70", "\u30d7\u30e9\u30a4\u30d9\u30fc\u30c8", "\u305d\u306e\u4ed6"] as const;

const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isScheduleCategory = (value: string): value is ScheduleItem["category"] =>
  scheduleCategories.includes(value as ScheduleItem["category"]);

const normalizeMemo = (memo: MemoItem): MemoItem => ({
  ...memo,
  title: memo.title.trim(),
  content: memo.content.trim(),
  tags: memo.tags.map((tag) => tag.trim()).filter(Boolean)
});

const normalizeSchedule = (schedule: ScheduleItem): ScheduleItem => ({
  ...schedule,
  title: schedule.title.trim(),
  category: isScheduleCategory(schedule.category) ? schedule.category : "\u696d\u52d9",
  reminderMinutes: Array.from(
    new Set(
      (schedule.reminderMinutes ?? [])
        .map((value) => Math.max(0, Math.floor(numberValue(value))))
        .filter((value) => value > 0)
    )
  ).sort((left, right) => left - right)
});

export const normalizeSalesSnapshot = (sales: SalesSnapshot): SalesSnapshot => {
  const total = Math.max(0, Math.floor(numberValue(sales.total)));
  const target = Math.max(0, Math.floor(numberValue(sales.target)));
  const customers = Math.max(0, Math.floor(numberValue(sales.customers)));

  return {
    ...sales,
    total,
    target,
    customers,
    averageSpend: customers > 0 ? Math.round(total / customers) : 0,
    categories: sales.categories
      .map((category) => ({
        ...category,
        name: category.name.trim(),
        amount: Math.max(0, Math.floor(numberValue(category.amount)))
      }))
      .filter((category) => category.name)
  };
};

export const normalizeDailyEntry = (entry: DailyEntry): DailyEntry => ({
  ...entry,
  temperature: numberValue(entry.temperature),
  tags: entry.tags.map((tag) => tag.trim()).filter(Boolean),
  sales: normalizeSalesSnapshot(entry.sales),
  schedules: entry.schedules
    .map(normalizeSchedule)
    .filter((schedule) => schedule.title || schedule.start)
    .sort((left, right) => left.start.localeCompare(right.start)),
  memos: entry.memos.map(normalizeMemo).filter((memo) => memo.title || memo.content)
});

export const mapEntryRecordToDomain = (record: EntryRecord, schedules: ScheduleItem[] = []): DailyEntry => {
  const salesCategories: SalesCategory[] =
    record.salesRecord?.categories.map((category: EntryCategoryRecord) => ({
      id: category.id,
      name: category.categoryName,
      amount: numberValue(category.amount)
    })) ?? [];

  const sales = normalizeSalesSnapshot({
    total: numberValue(record.salesRecord?.totalSales),
    target: numberValue(record.salesRecord?.targetSales),
    customers: record.salesRecord?.customerCount ?? 0,
    averageSpend: 0,
    note: record.salesRecord?.memo ?? "",
    categories: salesCategories
  });

  return {
    id: record.id,
    date: record.date.toISOString(),
    weather: record.weather ? reverseWeatherMap[record.weather] : "sunny",
    temperature: numberValue(record.temperature),
    wind: record.windStrength ? reverseWindMap[record.windStrength] : "calm",
    diary: record.diaryContent ?? "",
    tags: record.tags,
    sales,
    schedules,
    memos: []
  };
};

export const mapDailyEntryToPrisma = (entry: DailyEntry) => {
  const normalized = normalizeDailyEntry(entry);

  return {
    date: new Date(normalized.date),
    weather: weatherMap[normalized.weather],
    temperature: normalized.temperature,
    windStrength: windMap[normalized.wind],
    diaryContent: normalized.diary,
    tags: normalized.tags,
    sales: {
      totalSales: normalized.sales.total,
      customerCount: normalized.sales.customers,
      targetSales: normalized.sales.target,
      memo: normalized.sales.note,
      categories: normalized.sales.categories.map((category) => ({
        categoryName: category.name,
        amount: category.amount
      }))
    },
    schedules: normalized.schedules.map((schedule) => ({
      title: schedule.title || "\u4e88\u5b9a",
      startDatetime: new Date(schedule.start),
      endDatetime: schedule.end ? new Date(schedule.end) : null,
      category: schedule.category,
      reminderMinutes: schedule.reminderMinutes
    }))
  };
};

const isWeather = (value: string): value is Weather =>
  ["sunny", "cloudy", "rainy", "snowy", "other"].includes(value);

const isWindStrength = (value: string): value is WindStrength =>
  ["calm", "light", "moderate", "strong", "veryStrong"].includes(value);

export const parseDailyEntryInput = (payload: unknown): DailyEntry | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const entry = payload as Partial<DailyEntry>;

  if (
    typeof entry.id !== "string" ||
    typeof entry.date !== "string" ||
    typeof entry.diary !== "string" ||
    !isWeather(String(entry.weather)) ||
    !isWindStrength(String(entry.wind)) ||
    !Array.isArray(entry.tags) ||
    !entry.sales ||
    typeof entry.sales !== "object"
  ) {
    return null;
  }

  const sales = entry.sales as Partial<SalesSnapshot>;
  const categories = Array.isArray(sales.categories) ? sales.categories : [];
  const schedules = Array.isArray(entry.schedules) ? entry.schedules : [];
  const memos = Array.isArray(entry.memos) ? entry.memos : [];
  const weather = entry.weather as Weather;
  const wind = entry.wind as WindStrength;

  return normalizeDailyEntry({
    id: entry.id,
    date: entry.date,
    weather,
    temperature: numberValue(entry.temperature),
    wind,
    diary: entry.diary,
    tags: entry.tags.filter((tag): tag is string => typeof tag === "string"),
    sales: {
      total: numberValue(sales.total),
      target: numberValue(sales.target),
      customers: numberValue(sales.customers),
      averageSpend: numberValue(sales.averageSpend),
      note: typeof sales.note === "string" ? sales.note : "",
      categories: categories
        .filter(
          (category): category is SalesCategory =>
            Boolean(category) &&
            typeof category === "object" &&
            typeof category.id === "string" &&
            typeof category.name === "string"
        )
        .map((category) => ({
          id: category.id,
          name: category.name,
          amount: numberValue(category.amount)
        }))
    },
    schedules: schedules
      .filter(
        (schedule): schedule is ScheduleItem =>
          Boolean(schedule) &&
          typeof schedule === "object" &&
          typeof schedule.id === "string" &&
          typeof schedule.title === "string" &&
          typeof schedule.start === "string" &&
          (!schedule.end || typeof schedule.end === "string") &&
          typeof schedule.category === "string" &&
          isScheduleCategory(schedule.category) &&
          Array.isArray(schedule.reminderMinutes)
      )
      .map((schedule) => ({
        id: schedule.id,
        title: schedule.title,
        start: schedule.start,
        end: schedule.end,
        category: schedule.category,
        reminderMinutes: schedule.reminderMinutes.map((value) => numberValue(value))
      })),
    memos: memos
      .filter(
        (memo): memo is MemoItem =>
          Boolean(memo) &&
          typeof memo === "object" &&
          typeof memo.id === "string" &&
          typeof memo.title === "string" &&
          typeof memo.content === "string" &&
          Array.isArray(memo.tags) &&
          typeof memo.pinned === "boolean"
      )
      .map((memo) => ({
        id: memo.id,
        title: memo.title,
        content: memo.content,
        tags: memo.tags.filter((tag): tag is string => typeof tag === "string"),
        pinned: memo.pinned
      }))
  });
};