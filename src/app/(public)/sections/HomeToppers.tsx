"use client";

import Link from "next/link";
import { Trophy, ArrowRight, Award, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { SectionHeader } from "../components/SectionHeader";

type Topper = {
  id: string;
  rank: number;
  note: string | null;
  photo_url: string | null;
  students: unknown;
  exams: unknown;
};

export default function HomeToppers({ toppers }: { toppers: Topper[] }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  const rows = toppers.map((r) => {
    const student = r.students as { id: string; student_name: string; gr_no: string | null } | null;
    const exam = r.exams as { test_type: string; academic_year: string; exam_start_date: string | null } | null;
    return {
      id: r.id,
      rank: r.rank,
      note: r.note,
      photo_url: r.photo_url,
      name: student?.student_name ?? "—",
      exam: exam ? `${exam.test_type} · ${exam.academic_year}` : "",
    };
  });

  // When empty, show a warm empty state instead of hiding the whole strip —
  // so admins immediately notice the section exists and can populate it.
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white to-brand-50/40 py-20 sm:py-28">
      {/* Decorative watermarks */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-64 w-64 rounded-full bg-accent-100/60 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("आमचा अभिमान", "Our pride")}
          title={t("गुणवंत विद्यार्थी", "Our shining stars")}
          subtitle={t(
            "यशस्वी विद्यार्थ्यांचे कौतुक — त्यांची मेहनत, त्यांचे यश आणि आमचे प्रोत्साहन.",
            "Celebrating the students who put in the work — and made us proud.",
          )}
          action={{ href: "/academics/toppers", label: t("सर्व पहा", "See all toppers") }}
        />

        {rows.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-white/70 p-14 text-center backdrop-blur">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Trophy className="h-7 w-7" />
            </div>
            <h3 className="font-display text-xl font-semibold text-ink-900">
              {t("लवकरच जाहीर", "Toppers coming soon")}
            </h3>
            <p className="max-w-md text-sm text-ink-500">
              {t(
                "पुढील परीक्षेच्या निकालानंतर आमचे गुणवंत विद्यार्थी येथे दिसतील.",
                "As soon as our next exam is finalised, our top performers will appear here.",
              )}
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {rows.slice(0, 8).map((r) => (
              <TopperCard key={r.id} data={r} />
            ))}
          </div>
        )}

        {/* Achievement micro-marquee */}
        <div className="mt-10 flex items-center gap-3 rounded-full border border-brand-100 bg-white px-4 py-3 text-xs text-ink-600 shadow-xs sm:mt-14">
          <Sparkles className="h-4 w-4 flex-none text-accent-500" />
          <span className="line-clamp-1">
            {t(
              "गेल्या शैक्षणिक वर्षात १५+ जिल्हास्तरीय पारितोषिकं · राज्यस्तरीय क्रीडा स्पर्धांमध्ये यशस्वी सहभाग.",
              "15+ district-level awards last academic year · State-level sports representation.",
            )}
          </span>
        </div>
      </div>
    </section>
  );
}

function TopperCard({
  data,
}: {
  data: { id: string; rank: number; note: string | null; photo_url: string | null; name: string; exam: string };
}) {
  const rankTone =
    data.rank === 1 ? { chip: "bg-accent-500 text-white",  ring: "ring-accent-300" }
    : data.rank === 2 ? { chip: "bg-ink-400 text-white",    ring: "ring-ink-200" }
    : data.rank === 3 ? { chip: "bg-accent-700 text-white", ring: "ring-accent-200" }
    :                   { chip: "bg-brand-700 text-white",  ring: "ring-brand-200" };

  return (
    <article className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <div className={`h-24 w-24 overflow-hidden rounded-full bg-linear-to-br from-brand-50 to-brand-100 ring-4 ${rankTone.ring}`}>
          {data.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={data.photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-3xl font-semibold text-brand-700">
              {data.name.trim().charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className={`absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-md ring-2 ring-white ${rankTone.chip}`}>
          {data.rank <= 3 ? <Award className="h-4 w-4" /> : `#${data.rank}`}
        </div>
      </div>
      <div className="mt-4 line-clamp-1 font-display text-base font-semibold text-ink-900">
        {data.name}
      </div>
      {data.exam && (
        <div className="mt-0.5 line-clamp-1 text-[11px] font-medium uppercase tracking-wider text-ink-500">
          {data.exam}
        </div>
      )}
      {data.note && (
        <div className="mt-2 line-clamp-2 text-xs text-brand-700">
          {data.note}
        </div>
      )}
    </article>
  );
}
