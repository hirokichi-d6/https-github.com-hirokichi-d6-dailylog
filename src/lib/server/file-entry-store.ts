import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pruneExpiredAttachments } from "@/lib/server/daily-entry";
import type { DailyEntry, Weather } from "@/types/domain";

const resolveDataDirectory = () => {
  if (process.env.DAILYLOG_DATA_DIR?.trim()) {
    return process.env.DAILYLOG_DATA_DIR.trim();
  }

  // Vercel functions cannot persist writes in the project directory.
  // Use /tmp so demo deployments can still save temporarily.
  if (process.env.VERCEL) {
    return path.join("/tmp", "dailylog-data");
  }

  return path.join(process.cwd(), "data");
};

const dataDirectory = resolveDataDirectory();
const entriesFilePath = path.join(dataDirectory, "entries.json");

type EntryCollection = Record<string, DailyEntry>;

export type EntrySummary = {
  date: string;
  weather: Weather;
  totalSales: number;
  hasEntry: boolean;
};

const keyFromDate = (value: string) => value.slice(0, 10);

const ensureDataDirectory = async () => {
  await mkdir(dataDirectory, { recursive: true });
};

const sortEntries = (entries: EntryCollection): EntryCollection =>
  Object.fromEntries(Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)));

const readEntries = async (): Promise<EntryCollection> => {
  await ensureDataDirectory();

  try {
    const raw = await readFile(entriesFilePath, "utf8");
    const parsed = JSON.parse(raw) as EntryCollection;
    return parsed ?? {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message.includes("ENOENT")) {
      return {};
    }

    throw error;
  }
};

const writeEntries = async (entries: EntryCollection) => {
  await ensureDataDirectory();
  const payload = JSON.stringify(sortEntries(entries), null, 2);
  await writeFile(entriesFilePath, payload, "utf8");
};

const pruneEntryCollection = (entries: EntryCollection) => {
  let hasChanges = false;

  const nextEntries = Object.fromEntries(
    Object.entries(entries).map(([key, entry]) => {
      const prunedEntry = pruneExpiredAttachments(entry);

      if (prunedEntry.attachments.length !== (entry.attachments ?? []).length) {
        hasChanges = true;
      }

      return [key, prunedEntry];
    })
  );

  return { entries: nextEntries, hasChanges };
};

export const getStoredEntry = async (date: string) => {
  const storedEntries = await readEntries();
  const { entries, hasChanges } = pruneEntryCollection(storedEntries);

  if (hasChanges) {
    await writeEntries(entries);
  }

  return entries[keyFromDate(date)] ?? null;
};

export const saveStoredEntry = async (entry: DailyEntry) => {
  const storedEntries = await readEntries();
  const { entries } = pruneEntryCollection(storedEntries);
  const normalizedKey = keyFromDate(entry.date);
  entries[normalizedKey] = pruneExpiredAttachments(entry);
  await writeEntries(entries);
  return entries[normalizedKey];
};

export const listStoredEntries = async (month?: string): Promise<DailyEntry[]> => {
  const storedEntries = await readEntries();
  const { entries, hasChanges } = pruneEntryCollection(storedEntries);

  if (hasChanges) {
    await writeEntries(entries);
  }

  return Object.entries(entries)
    .filter(([key]) => !month || key.startsWith(month))
    .map(([, entry]) => entry)
    .sort((left, right) => left.date.localeCompare(right.date));
};

export const listStoredEntrySummaries = async (month: string): Promise<EntrySummary[]> => {
  const entries = await listStoredEntries(month);

  return entries.map((entry) => ({
    date: entry.date,
    weather: entry.weather,
    totalSales: entry.sales.total,
    hasEntry: true
  }));
};