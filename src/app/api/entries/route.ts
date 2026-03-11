import { NextRequest, NextResponse } from "next/server";
import { todayEntry } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import {
  mapDailyEntryToPrisma,
  mapEntryRecordToDomain,
  normalizeDailyEntry,
  parseDailyEntryInput
} from "@/lib/server/daily-entry";
import { getStoredEntry, listStoredEntrySummaries, saveStoredEntry } from "@/lib/server/file-entry-store";
import type { DailyEntry, ScheduleItem } from "@/types/domain";

const DEMO_USER_EMAIL = "demo@dailylog.local";
const DEMO_USER_NAME = "DailyLog Demo";

const entryInclude = {
  salesRecord: {
    include: {
      categories: true
    }
  }
} as const;

const isPrismaAvailable = () => Boolean(process.env.DATABASE_URL);

const createBlankEntry = (date: string): DailyEntry => ({
  ...structuredClone(todayEntry),
  id: `entry-${date.slice(0, 10)}`,
  date,
  temperature: 0,
  wind: "calm",
  diary: "",
  tags: [],
  sales: {
    ...structuredClone(todayEntry.sales),
    total: 0,
    target: 0,
    customers: 0,
    averageSpend: 0,
    note: "",
    categories: todayEntry.sales.categories.map((category) => ({
      ...category,
      amount: 0
    }))
  },
  schedules: [],
  memos: []
});

const entryResponse = (entry: DailyEntry, source: "mock" | "database" | "file") =>
  NextResponse.json({
    kind: "entry",
    entry: normalizeDailyEntry(entry),
    source
  });

const summaryResponse = (
  summaries: Array<{ date: string; weather: string; totalSales: number; hasEntry: boolean }>,
  source: "mock" | "database" | "file"
) =>
  NextResponse.json({
    kind: "summaries",
    summaries,
    source
  });

const getDemoUser = async () =>
  prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: { name: DEMO_USER_NAME },
    create: {
      email: DEMO_USER_EMAIL,
      name: DEMO_USER_NAME
    }
  });

const getMonthRange = (month: string) => {
  const [year, monthValue] = month.split("-").map(Number);
  const start = new Date(year, monthValue - 1, 1);
  const end = new Date(year, monthValue, 1);
  return { start, end };
};

const getDayRange = (date: string) => {
  const day = date.slice(0, 10);
  const start = new Date(`${day}T00:00:00+09:00`);
  const end = new Date(`${day}T00:00:00+09:00`);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const mapScheduleRecord = (record: {
  id: string;
  title: string;
  startDatetime: Date;
  endDatetime: Date | null;
  category: string;
  reminderMinutes: number[];
}): ScheduleItem => ({
  id: record.id,
  title: record.title,
  start: record.startDatetime.toISOString(),
  end: record.endDatetime?.toISOString(),
  category: record.category as ScheduleItem["category"],
  reminderMinutes: record.reminderMinutes
});

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  const date = request.nextUrl.searchParams.get("date") ?? todayEntry.date;

  if (month) {
    if (!isPrismaAvailable()) {
      const summaries = await listStoredEntrySummaries(month);
      return summaryResponse(summaries, summaries.length > 0 ? "file" : "mock");
    }

    try {
      const user = await getDemoUser();
      const range = getMonthRange(month);
      const records = await prisma.dailyEntry.findMany({
        where: {
          userId: user.id,
          date: {
            gte: range.start,
            lt: range.end
          }
        },
        include: entryInclude,
        orderBy: {
          date: "asc"
        }
      });

      const summaries = records.map((record) => {
        const entry = mapEntryRecordToDomain(record);
        return {
          date: entry.date,
          weather: entry.weather,
          totalSales: entry.sales.total,
          hasEntry: true
        };
      });

      return summaryResponse(summaries, "database");
    } catch (error) {
      console.error("GET /api/entries?month failed", error);
      const summaries = await listStoredEntrySummaries(month);
      return summaryResponse(summaries, summaries.length > 0 ? "file" : "mock");
    }
  }

  if (!isPrismaAvailable()) {
    const storedEntry = await getStoredEntry(date);
    return entryResponse(storedEntry ?? createBlankEntry(date), storedEntry ? "file" : "mock");
  }

  try {
    const user = await getDemoUser();
    const dayRange = getDayRange(date);

    const [record, schedules] = await Promise.all([
      prisma.dailyEntry.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: new Date(date)
          }
        },
        include: entryInclude
      }),
      prisma.schedule.findMany({
        where: {
          userId: user.id,
          startDatetime: {
            gte: dayRange.start,
            lt: dayRange.end
          }
        },
        orderBy: {
          startDatetime: "asc"
        }
      })
    ]);

    const scheduleItems = schedules.map(mapScheduleRecord);

    if (!record) {
      const storedEntry = await getStoredEntry(date);
      if (storedEntry) {
        return entryResponse(storedEntry, "file");
      }

      return entryResponse({ ...createBlankEntry(date), schedules: scheduleItems }, scheduleItems.length > 0 ? "database" : "mock");
    }

    return entryResponse(mapEntryRecordToDomain(record, scheduleItems), "database");
  } catch (error) {
    console.error("GET /api/entries failed", error);
    const storedEntry = await getStoredEntry(date);
    return entryResponse(storedEntry ?? createBlankEntry(date), storedEntry ? "file" : "mock");
  }
}

export async function PUT(request: NextRequest) {
  const payload = parseDailyEntryInput(await request.json());

  if (!payload) {
    return NextResponse.json({ message: "Invalid daily entry payload." }, { status: 400 });
  }

  if (!isPrismaAvailable()) {
    const savedEntry = await saveStoredEntry(payload);
    return entryResponse(savedEntry, "file");
  }

  try {
    const user = await getDemoUser();
    const entryData = mapDailyEntryToPrisma(payload);
    const dayRange = getDayRange(payload.date);

    const savedEntry = await prisma.dailyEntry.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: entryData.date
        }
      },
      create: {
        userId: user.id,
        date: entryData.date,
        weather: entryData.weather,
        temperature: entryData.temperature,
        windStrength: entryData.windStrength,
        diaryContent: entryData.diaryContent,
        tags: entryData.tags
      },
      update: {
        weather: entryData.weather,
        temperature: entryData.temperature,
        windStrength: entryData.windStrength,
        diaryContent: entryData.diaryContent,
        tags: entryData.tags
      }
    });

    await prisma.salesRecord.upsert({
      where: {
        entryId: savedEntry.id
      },
      create: {
        entryId: savedEntry.id,
        totalSales: entryData.sales.totalSales,
        customerCount: entryData.sales.customerCount,
        targetSales: entryData.sales.targetSales,
        memo: entryData.sales.memo,
        categories: {
          create: entryData.sales.categories
        }
      },
      update: {
        totalSales: entryData.sales.totalSales,
        customerCount: entryData.sales.customerCount,
        targetSales: entryData.sales.targetSales,
        memo: entryData.sales.memo,
        categories: {
          deleteMany: {},
          create: entryData.sales.categories
        }
      }
    });

    await prisma.schedule.deleteMany({
      where: {
        userId: user.id,
        startDatetime: {
          gte: dayRange.start,
          lt: dayRange.end
        }
      }
    });

    if (entryData.schedules.length > 0) {
      await prisma.schedule.createMany({
        data: entryData.schedules.map((schedule) => ({
          userId: user.id,
          title: schedule.title,
          startDatetime: schedule.startDatetime,
          endDatetime: schedule.endDatetime,
          category: schedule.category,
          reminderMinutes: schedule.reminderMinutes
        }))
      });
    }

    const [record, schedules] = await Promise.all([
      prisma.dailyEntry.findUniqueOrThrow({
        where: {
          id: savedEntry.id
        },
        include: entryInclude
      }),
      prisma.schedule.findMany({
        where: {
          userId: user.id,
          startDatetime: {
            gte: dayRange.start,
            lt: dayRange.end
          }
        },
        orderBy: {
          startDatetime: "asc"
        }
      })
    ]);

    return entryResponse(mapEntryRecordToDomain(record, schedules.map(mapScheduleRecord)), "database");
  } catch (error) {
    console.error("PUT /api/entries failed", error);

    try {
      const savedEntry = await saveStoredEntry(payload);
      return entryResponse(savedEntry, "file");
    } catch (fileError) {
      console.error("PUT /api/entries file fallback failed", fileError);
      return NextResponse.json(
        {
          message: "Failed to save daily entry."
        },
        { status: 500 }
      );
    }
  }
}