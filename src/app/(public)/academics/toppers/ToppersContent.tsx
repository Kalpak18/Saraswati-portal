"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { cn } from "@/lib/utils";
import { PageIntro } from "../../components/PageIntro";
import { TopperPodium } from "../../components/TopperPodium";
import { groupToppers, type PublicTopper } from "../../lib/showcase";

export default function ToppersContent({ toppers }: { toppers: PublicTopper[] }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  const groups = useMemo(() => groupToppers(toppers), [toppers]);
  const years = useMemo(() => Array.from(new Set(groups.map((g) => g.year ?? ""))).filter(Boolean), [groups]);
  const [year, setYear] = useState<string | null>(null);
  const activeYear = year ?? years[0] ?? null;
  const visible = groups.filter((g) => !activeYear || g.year === activeYear);

  return (
    <>
      <PageIntro
        eyebrow={t("शैक्षणिक", "Academics")}
        title={t("गुणवंत विद्यार्थी", "Our shining stars")}
        subtitle={t(
          "प्रत्येक परीक्षेत उंच शिखर गाठणारे — आमचा अभिमान.",
          "The students who reached the highest marks in each exam — our pride.",
        )}
      />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {years.length > 1 && (
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                aria-pressed={y === activeYear}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium tabular-nums ring-1 transition-colors",
                  y === activeYear ? "bg-ink-900 text-white ring-ink-900" : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50",
                )}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <Trophy className="mx-auto h-12 w-12 text-ink-300" />
            <p className="mt-4 font-display text-xl font-semibold text-ink-900">{t("लवकरच जाहीर", "Toppers coming soon")}</p>
          </div>
        ) : (
          <div className="space-y-20">
            {visible.map((g) => (
              <section key={g.key} aria-label={`${g.standard ?? ""} ${g.exam}`}>
                <TopperPodium group={g} />
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
