"use client";

import Link from "next/link";
import { Trophy, Music, Dumbbell, GraduationCap, ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { SectionHeader } from "../components/SectionHeader";

type Achievement = {
  id: string;
  title: string;
  description: string;
  category: string;
  achieved_on: string | null;
  photo_url: string | null;
};

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  academic: GraduationCap,
  sports: Dumbbell,
  cultural: Music,
  other: Trophy,
};

const CATEGORY_TONE: Record<string, string> = {
  academic: "bg-brand-50 text-brand-700 ring-brand-200",
  sports:   "bg-accent-50 text-accent-700 ring-accent-200",
  cultural: "bg-purple-50 text-purple-700 ring-purple-200",
  other:    "bg-ink-100 text-ink-700 ring-ink-200",
};

export default function HomeAchievements({ achievements }: { achievements: Achievement[] }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  const rows = achievements.slice(0, 6);

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("कर्तृत्व", "Standing out")}
          title={t("यशोगाथा", "Recent achievements")}
          subtitle={t(
            "शैक्षणिक, क्रीडा आणि सांस्कृतिक क्षेत्रांतील आमच्या विद्यार्थ्यांची कामगिरी.",
            "Academic, sports and cultural highlights from around the school.",
          )}
          action={{ href: "/academics/toppers", label: t("अधिक पहा", "See more") }}
        />

        {rows.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <Trophy className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-4 font-display text-lg font-semibold text-ink-900">
              {t("यशोगाथा लवकरच", "Achievements coming soon")}
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((a) => {
              const Icon = CATEGORY_ICON[a.category] ?? Trophy;
              const tone = CATEGORY_TONE[a.category] ?? CATEGORY_TONE.other;
              return (
                <article
                  key={a.id}
                  className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-ink-100 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ring-1 ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                      <span>{a.category}</span>
                      {a.achieved_on && <span className="tabular-nums">· {a.achieved_on}</span>}
                    </div>
                    <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold text-ink-900">
                      {a.title}
                    </h3>
                    {a.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-ink-600">{a.description}</p>
                    )}
                  </div>
                  <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 flex-none text-ink-300 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
