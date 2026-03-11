import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapEntryRecordToDomain } from "@/lib/server/daily-entry";
import { listStoredEntries } from "@/lib/server/file-entry-store";

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

const toCsv = (entries: Awaited<ReturnType<typeof listStoredEntries>>) => {
  const header = [
    "date",
    "weather",
    "temperature",
    "wind",
    "diary",
    "tags",
    "totalSales",
    "targetSales",
    "customers",
    "averageSpend",
    "salesNote",
    "categories"
  ];

  const rows = entries.map((entry) => [
    entry.date,
    entry.weather,
    String(entry.temperature),
    entry.wind,
    entry.diary.replace(/\r?\n/g, " "),
    entry.tags.join("|") ,
    String(entry.sales.total),
    String(entry.sales.target),
    String(entry.sales.customers),
    String(entry.sales.averageSpend),
    entry.sales.note.replace(/\r?\n/g, " "),
    entry.sales.categories.map((category) => `${category.name}:${category.amount}`).join("|")
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
};

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  const format = request.nextUrl.searchParams.get("format") ?? "json";

  if (!month) {
    return NextResponse.json({ message: "month is required" }, { status: 400 });
  }

  let entries = await listStoredEntries(month);
  let source: "file" | "database" = "file";

  if (isPrismaAvailable()) {
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

      entries = records.map((record) => mapEntryRecordToDomain(record));
      source = "database";
    } catch (error) {
      console.error("GET /api/export failed to read database, falling back to file", error);
    }
  }

  if (format === "csv") {
    return new NextResponse(toCsv(entries), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dailylog-${month}.csv"`,
        "X-DailyLog-Source": source
      }
    });
  }

  return NextResponse.json(
    {
      month,
      source,
      count: entries.length,
      entries
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="dailylog-${month}.json"`
      }
    }
  );
}