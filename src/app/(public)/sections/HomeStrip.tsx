"use client";

import { Users, GraduationCap, Languages, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";

/**
 * At-a-glance strip: four institutional facts that lend immediate credibility
 * right below the hero. Numbers are DB-driven when we can, hard values
 * otherwise (education board, languages).
 */
export default function HomeStrip({ studentsCount }: { studentsCount: number }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  const stats = [
    {
      icon: Users,
      value: studentsCount > 0 ? studentsCount.toLocaleString() : "1,000+",
      label: t("विद्यार्थी", "Students"),
    },
    {
      icon: GraduationCap,
      value: "SSC",
      label: t("मान्यताप्राप्त बोर्ड", "Board affiliated"),
    },
    {
      icon: Languages,
      value: t("MR + EN", "MR + EN"),
      label: t("द्विभाषिक", "Bilingual"),
    },
    {
      icon: ShieldCheck,
      value: t("१०० %", "100 %"),
      label: t("सुरक्षित परिसर", "Safe campus"),
    },
  ];

  return (
    <section className="relative border-b border-ink-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-10 grid grid-cols-2 gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-xl shadow-ink-900/5 sm:grid-cols-4 sm:gap-4 sm:p-6 lg:-mt-14">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-3 rounded-lg p-2">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-lg font-semibold leading-tight text-ink-900 tabular-nums sm:text-xl">
                    {s.value}
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
                    {s.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
