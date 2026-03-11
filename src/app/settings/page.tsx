import Link from "next/link";
import { SectionCard } from "@/components/section-card";

const settingGroups = [
  {
    title: "\u30a2\u30ab\u30a6\u30f3\u30c8",
    items: ["\u30e1\u30fc\u30eb + \u30d1\u30b9\u30ef\u30fc\u30c9\u8a8d\u8a3c", "Google OAuth", "\u9023\u643a\u8a2d\u5b9a"]
  },
  {
    title: "\u65e5\u5831\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8",
    items: ["\u66dc\u65e5\u5225\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8", "\u5165\u529b\u88dc\u52a9 ON/OFF", "\u56fa\u5b9a\u30bf\u30b0"]
  },
  {
    title: "\u8868\u793a\u8a2d\u5b9a",
    items: ["\u30c6\u30fc\u30de", "\u30d5\u30a9\u30f3\u30c8\u30b5\u30a4\u30ba", "\u30c0\u30fc\u30af\u30e2\u30fc\u30c9"]
  },
  {
    title: "\u30d0\u30c3\u30af\u30a2\u30c3\u30d7",
    items: ["CSV / JSON \u30a8\u30af\u30b9\u30dd\u30fc\u30c8", "\u65e5\u6b21\u81ea\u52d5\u30d0\u30c3\u30af\u30a2\u30c3\u30d7", "\u5b8c\u5168\u524a\u9664"]
  }
];

export default function SettingsPage() {
  return (
    <div className="space-y-4 py-1 sm:space-y-5">
      <SectionCard
        title={"\u8a2d\u5b9a"}
        description={"\u8a8d\u8a3c\u3001\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3001\u8868\u793a\u3001\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u306e\u65b9\u5411\u6027\u3092\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002"}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {settingGroups.map((group) => (
            <article key={group.title} className="rounded-[1.35rem] bg-white p-4 shadow-panel">
              <h3 className="font-display text-[1.35rem] text-ink">{group.title}</h3>
              <div className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <div key={item} className="rounded-xl bg-oat px-4 py-3 text-sm text-ink/80">
                    {item}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={"\u30c7\u30fc\u30bf\u51fa\u529b"}
        description={"\u8a66\u3057\u3066\u3044\u308b\u30c7\u30fc\u30bf\u3092\u3059\u3050\u306b\u51fa\u529b\u3057\u3066\u4fdd\u5b58\u65b9\u6cd5\u3092\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002"}
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/exports" className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white">
            {"\u51fa\u529b\u753b\u9762\u3092\u958b\u304f"}
          </Link>
          <div className="rounded-full bg-oat px-4 py-2 text-sm text-ink/75">
            {"\u73fe\u5728\u306f CSV / JSON \u51fa\u529b\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u3059\u3002"}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}