import { NextRequest, NextResponse } from "next/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { todayEntry } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import {
  mapDailyEntryToPrisma,
  mapEntryRecordToDomain,
  normalizeDailyEntry,
  parseDailyEntryInput,
  pruneExpiredAttachments
} from "@/lib/server/daily-entry";
import { getStoredEntry, listStoredEntrySummaries, saveStoredEntry } from "@/lib/server/file-entry-store";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { DailyEntry, ScheduleItem } from "@/types/domain";

const DEMO_USER_EMAIL = "demo@dailylog.local";
const DEMO_USER_NAME = "DailyLog Demo";

const entryInclude = {
  salesRecord: {
    include: {
      categories: true
    }
  },
  attachments: true
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
  memos: [],
  attachments: []
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

const unauthorizedResponse = () =>
  NextResponse.json(
    {
      message: "Unauthorized"
    },
    { status: 401 }
  );

const isLocalDevelopmentRequest = (request: NextRequest) => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const hostname = request.nextUrl.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};

const getDemoUser = async () =>
  prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: { name: DEMO_USER_NAME },
    create: {
      email: DEMO_USER_EMAIL,
      name: DEMO_USER_NAME
    }
  });

const getAuthenticatedSupabaseUser = async (): Promise<SupabaseUser | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
};

const getRequestUser = async (request: NextRequest) => {
  if (!isPrismaAvailable()) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    return getDemoUser();
  }

  const authUser = await getAuthenticatedSupabaseUser();

  if (!authUser?.email) {
    if (isLocalDevelopmentRequest(request)) {
      return getDemoUser();
    }

    return null;
  }

  return prisma.user.upsert({
    where: {
      id: authUser.id
    },
    update: {
      email: authUser.email,
      name: typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : authUser.email
    },
    create: {
      id: authUser.id,
      email: authUser.email,
      name: typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : authUser.email
    }
  });
};

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

const deleteExpiredDatabaseAttachments = async (userId: string) => {
  await prisma.attachment.deleteMany({
    where: {
      keepForever: false,
      expiresAt: {
        not: null,
        lte: new Date()
      },
      entry: {
        is: {
          userId
        }
      }
    }
  });
};

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  const date = request.nextUrl.searchParams.get("date") ?? todayEntry.date;

  if (month) {
    if (!isPrismaAvailable()) {
      const summaries = await listStoredEntrySummaries(month);
      return summaryResponse(summaries, summaries.length > 0 ? "file" : "mock");
    }

    const user = await getRequestUser(request);

    if (!user) {
      return unauthorizedResponse();
    }

    try {
      await deleteExpiredDatabaseAttachments(user.id);

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
      return NextResponse.json({ message: "Failed to load summaries." }, { status: 500 });
    }
  }

  if (!isPrismaAvailable()) {
    const storedEntry = await getStoredEntry(date);
    return entryResponse(storedEntry ?? createBlankEntry(date), storedEntry ? "file" : "mock");
  }

  const user = await getRequestUser(request);

  if (!user) {
    return unauthorizedResponse();
  }

  try {
    await deleteExpiredDatabaseAttachments(user.id);

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
      return entryResponse({ ...createBlankEntry(date), schedules: scheduleItems }, "database");
    }

    return entryResponse(mapEntryRecordToDomain(record, scheduleItems), "database");
  } catch (error) {
    console.error("GET /api/entries failed", error);
    return NextResponse.json({ message: "Failed to load entry." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const payload = parseDailyEntryInput(await request.json());

  if (!payload) {
    return NextResponse.json({ message: "Invalid daily entry payload." }, { status: 400 });
  }

  if (!isPrismaAvailable()) {
    const savedEntry = await saveStoredEntry(pruneExpiredAttachments(payload));
    return entryResponse(savedEntry, "file");
  }

  const user = await getRequestUser(request);

  if (!user) {
    return unauthorizedResponse();
  }

  try {
    await deleteExpiredDatabaseAttachments(user.id);

    const entryData = mapDailyEntryToPrisma(pruneExpiredAttachments(payload));
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

    await prisma.attachment.deleteMany({
      where: {
        entryId: savedEntry.id
      }
    });

    if (entryData.attachments.length > 0) {
      await prisma.attachment.createMany({
        data: entryData.attachments.map((attachment) => ({
          entryId: savedEntry.id,
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          keepForever: attachment.keepForever,
          expiresAt: attachment.expiresAt,
          createdAt: attachment.createdAt
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
    return NextResponse.json({ message: "Failed to save daily entry." }, { status: 500 });
  }
}
