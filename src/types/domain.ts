export type Weather = "sunny" | "cloudy" | "rainy" | "snowy" | "other";
export type WindStrength = "calm" | "light" | "moderate" | "strong" | "veryStrong";

export type SalesCategory = {
  id: string;
  name: string;
  amount: number;
};

export type SalesSnapshot = {
  total: number;
  target: number;
  customers: number;
  averageSpend: number;
  note: string;
  categories: SalesCategory[];
};

export type ScheduleItem = {
  id: string;
  title: string;
  start: string;
  end?: string;
  category: "業務" | "仕入れ" | "会議" | "プライベート" | "その他";
  reminderMinutes: number[];
};

export type MemoItem = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
};

export type DailyEntry = {
  id: string;
  date: string;
  weather: Weather;
  temperature: number;
  wind: WindStrength;
  diary: string;
  tags: string[];
  sales: SalesSnapshot;
  schedules: ScheduleItem[];
  memos: MemoItem[];
};

export type SalesTrendPoint = {
  label: string;
  sales: number;
  target: number;
};
