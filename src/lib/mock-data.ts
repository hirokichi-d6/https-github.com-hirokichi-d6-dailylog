import type { DailyEntry, MemoItem, SalesTrendPoint, ScheduleItem } from "@/types/domain";

export const todayEntry: DailyEntry = {
  id: "entry-today",
  date: "2026-03-09T09:00:00+09:00",
  weather: "sunny",
  temperature: 16,
  temperatureMin: 9,
  temperatureMax: 16,
  wind: "light",
  diary:
    "新商品の試飲導線が機能し、夕方の来店数が伸びた。スタッフ共有用に陳列写真を残しておく。",
  tags: ["新商品", "試飲", "夕方ピーク"],
  sales: {
    total: 152000,
    target: 180000,
    customers: 48,
    averageSpend: 3167,
    note: "近隣イベントの流入あり。ギフト需要が強い。",
    categories: [
      { id: "cat-1", name: "日本酒", amount: 72000 },
      { id: "cat-2", name: "ワイン", amount: 43000 },
      { id: "cat-3", name: "食品", amount: 21000 },
      { id: "cat-4", name: "ギフト", amount: 16000 }
    ]
  },
  schedules: [
    {
      id: "sch-1",
      title: "発注確認",
      start: "2026-03-09T10:00:00+09:00",
      end: "2026-03-09T10:30:00+09:00",
      category: "仕入れ",
      reminderMinutes: [15]
    },
    {
      id: "sch-2",
      title: "SNS投稿",
      start: "2026-03-09T15:00:00+09:00",
      end: "2026-03-09T15:30:00+09:00",
      category: "業務",
      reminderMinutes: [5]
    }
  ],
  memos: [
    {
      id: "memo-1",
      title: "春の陳列メモ",
      content: "入口右手の平台は桜ラベルを集約。POPは価格より用途訴求を優先。",
      tags: ["売場", "春施策"],
      pinned: true
    }
  ],
  attachments: []
};

export const upcomingSchedules: ScheduleItem[] = [
  ...todayEntry.schedules,
  {
    id: "sch-3",
    title: "スタッフ面談",
    start: "2026-03-10T13:00:00+09:00",
    end: "2026-03-10T14:00:00+09:00",
    category: "会議",
    reminderMinutes: [60, 15]
  },
  {
    id: "sch-4",
    title: "棚卸し準備",
    start: "2026-03-11T18:00:00+09:00",
    end: "2026-03-11T19:00:00+09:00",
    category: "業務",
    reminderMinutes: [15]
  }
];

export const pinnedMemos: MemoItem[] = [
  todayEntry.memos[0],
  {
    id: "memo-2",
    title: "定休日ルール",
    content: "祝前日は閉店後に冷蔵ケースの補充を前倒し。月末の棚卸しは前営業日に実施。",
    tags: ["運用", "固定"],
    pinned: true
  }
];

export const salesTrend: SalesTrendPoint[] = [
  { label: "3/3", sales: 98000, target: 120000 },
  { label: "3/4", sales: 126000, target: 120000 },
  { label: "3/5", sales: 118000, target: 120000 },
  { label: "3/6", sales: 164000, target: 150000 },
  { label: "3/7", sales: 189000, target: 170000 },
  { label: "3/8", sales: 142000, target: 150000 },
  { label: "3/9", sales: 152000, target: 180000 }
];

export const categoryAverages = [
  { label: "月", value: 132000 },
  { label: "火", value: 118000 },
  { label: "水", value: 121000 },
  { label: "木", value: 128000 },
  { label: "金", value: 165000 },
  { label: "土", value: 184000 },
  { label: "日", value: 156000 }
];

export const comparisonRows = [
  { label: "前日比", value: "+12,000円", rate: "+8.6%" },
  { label: "前週同曜日比", value: "+18,500円", rate: "+13.9%" },
  { label: "前月同日比", value: "-4,000円", rate: "-2.6%" },
  { label: "今週平均", value: "141,286円", rate: "+6.1%" }
];
