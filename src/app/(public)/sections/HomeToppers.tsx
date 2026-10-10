"use client";

import { useMemo, useState } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../components/SectionHeader";
import { TopperPodium } from "../components/TopperPodium";
import { groupToppers, type PublicTopper } from "../lib/showcase";
import { pick, type HomeSection } from "@/lib/homeSections";

export default function HomeToppers({ toppers, s }: { toppers: PublicTopper[]; s: HomeSection }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  // Only the latest academic year's results on the home page.
  const groups = useMemo(() => {
    const all = groupToppers(toppers);
    const latest = all[0]?.year;
    return all.filter((g) => g.year === latest).slice(0, 8);
  }, [toppers]);
  const [active, setActive] = useState(0);
  const g = groups[Math.min(active, groups.length - 1)];
  // Like every data section, stay out of the way until there is data.
  if (!g) return null;

  return (
    <section className="relative isolate overflow-hidden bg-linear-to-b from-white to-brand-50/50 sec">
      <div className="sec-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-brand-100/50 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-64 w-64 rounded-full bg-accent-100/60 blur-3xl" />
      </div>

      <div className="sec-wrap">
        <SectionHeader
          eyebrow={pick(s.content.eyebrow, lang)}
          title={pick(s.content.title, lang)}
          subtitle={pick(s.content.subtitle, lang) || undefined}
          action={{ href: "/academics/toppers", label: t("सर्व पहा", "See all toppers") }}
        />

        <>
            {groups.length > 1 && (
              <div role="tablist" aria-label={t("इयत्ता निवडा", "Choose class")}
                className="mt-10 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {groups.map((x, i) => (
                  <button
                    key={x.key}
                    role="tab"
                    aria-selected={i === active}
                    onClick={() => setActive(i)}
                    className={cn(
                      "flex-none rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors",
                      i === active
                        ? "bg-brand-700 text-white ring-brand-700 shadow-sm"
                        : "bg-white text-ink-700 ring-ink-200 hover:bg-brand-50 hover:text-brand-800",
                    )}
                  >
                    {x.standard ?? "—"}
                    <span className={cn("ml-1.5 text-xs", i === active ? "text-brand-100" : "text-ink-400")}>{x.exam}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-8" role="tabpanel">
              <TopperPodium key={g.key} group={g} />
            </div>
        </>
      </div>
    </section>
  );
}
