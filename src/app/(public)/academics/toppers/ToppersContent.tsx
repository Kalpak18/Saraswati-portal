"use client";

import { Award, Trophy } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { PageIntro } from "../../components/PageIntro";

type Row = {
  id: string;
  rank: number;
  note: string | null;
  photo_url: string | null;
  students: unknown;
  exams: unknown;
};

export default function ToppersContent({ toppers }: { toppers: Row[] }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  // Group by exam so the page reads exam-by-exam.
  const groups = new Map<string, { label: string; rows: Row[] }>();
  for (const r of toppers) {
    const exam = r.exams as { test_type: string; academic_year: string } | null;
    const key = exam ? `${exam.test_type} · ${exam.academic_year}` : t("इतर", "Other");
    const g = groups.get(key) ?? { label: key, rows: [] };
    g.rows.push(r);
    groups.set(key, g);
  }

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

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {toppers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <Trophy className="mx-auto h-12 w-12 text-ink-300" />
            <p className="mt-4 font-display text-xl font-semibold text-ink-900">
              {t("लवकरच जाहीर", "Toppers coming soon")}
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {Array.from(groups.values()).map((g) => (
              <section key={g.label}>
                <h2 className="mb-8 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                  {g.label}
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {g.rows.map((r) => {
                    const s = r.students as { student_name: string } | null;
                    return (
                      <article
                        key={r.id}
                        className="group flex flex-col items-center overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="relative">
                          <div className="h-24 w-24 overflow-hidden rounded-full bg-linear-to-br from-brand-50 to-brand-100 ring-4 ring-white">
                            {r.photo_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={r.photo_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-display text-3xl font-semibold text-brand-700">
                                {s?.student_name?.trim().charAt(0).toUpperCase() ?? "?"}
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white shadow-md ring-2 ring-white">
                            {r.rank <= 3 ? <Award className="h-4 w-4" /> : `#${r.rank}`}
                          </div>
                        </div>
                        <div className="mt-4 line-clamp-1 font-display text-base font-semibold text-ink-900">
                          {s?.student_name ?? "—"}
                        </div>
                        {r.note && (
                          <div className="mt-2 line-clamp-2 text-xs text-brand-700">{r.note}</div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
