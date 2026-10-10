"use client";

import { Award, Dumbbell, GraduationCap, Medal, Music, Trophy } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { categoryLabel, levelLabel, levelRank, medalLabel, ordinal, percentOf } from "@/lib/achievements";
import type { PublicAchievement } from "../lib/showcase";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  competitive: GraduationCap,
  academic: GraduationCap,
  sports: Dumbbell,
  cultural: Music,
  other: Trophy,
};

// Seal colours: medal metals, otherwise the brand teal.
function sealTone(a: PublicAchievement) {
  const m = a.medal ?? (a.rank === 1 ? "gold" : a.rank === 2 ? "silver" : a.rank === 3 ? "bronze" : null);
  if (m === "gold")   return "from-amber-300 to-amber-500 text-amber-950 ring-amber-200";
  if (m === "silver") return "from-slate-200 to-slate-400 text-slate-900 ring-slate-200";
  if (m === "bronze") return "from-orange-300 to-orange-500 text-orange-950 ring-orange-200";
  return "from-brand-600 to-brand-800 text-white ring-brand-200";
}

export function AchievementCard({ a, className }: { a: PublicAchievement; className?: string }) {
  const { lang } = useLang();
  const Icon = CATEGORY_ICON[a.category] ?? Trophy;
  const level = levelLabel(a.level, lang);
  const high = levelRank(a.level) >= levelRank("state");
  const pct = percentOf(a.score, a.max_score);
  const headline = a.student_name || a.title;
  const subject = a.student_name ? (a.exam_name || a.title) : a.exam_name;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        high ? "border-accent-200" : "border-ink-100",
        className,
      )}
    >
      {/* Certificate band */}
      <div className={cn("h-1.5 w-full", high ? "bg-linear-to-r from-accent-400 via-accent-500 to-accent-400" : "bg-linear-to-r from-brand-500 to-brand-700")} />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Photo or seal */}
          <div className="relative flex-none">
            {a.photo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={a.photo_url} alt="" loading="lazy" className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-md" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-brand-50 to-brand-100 font-display text-2xl font-semibold text-brand-800 ring-4 ring-white shadow-md">
                {headline.trim().charAt(0).toUpperCase() || <Icon className="h-6 w-6" />}
              </div>
            )}
            {(a.rank || a.medal) && (
              <div className={cn(
                "absolute -bottom-1 -right-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-linear-to-br px-1.5 text-[11px] font-bold shadow ring-2",
                sealTone(a),
              )}>
                {a.rank ? a.rank : <Medal className="h-3.5 w-3.5" />}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {level && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  high ? "bg-accent-100 text-accent-800" : "bg-brand-50 text-brand-800",
                )}>
                  {level}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                <Icon className="h-3 w-3" /> {categoryLabel(a.category, lang)}
              </span>
            </div>
            <h3 className="mt-1.5 line-clamp-2 font-display text-lg font-semibold leading-snug text-ink-900">
              {headline}
            </h3>
            {a.standard_label && <div className="text-xs text-ink-500">{a.standard_label}</div>}
          </div>
        </div>

        {subject && (
          <div className="mt-4 line-clamp-2 text-sm font-medium text-ink-800">{subject}</div>
        )}

        {/* Result line */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {a.rank != null && (
              <span className="inline-flex items-center gap-1 font-semibold text-ink-900">
                <Award className="h-4 w-4 text-accent-500" />
                {lang === "mr" ? `क्रमांक ${a.rank}` : `${ordinal(a.rank, "en")} rank`}
              </span>
            )}
            {(a.award || a.medal) && (
              <span className="text-ink-600">{a.award || medalLabel(a.medal, lang)}</span>
            )}
          </div>
          {a.score != null && (
            <div className="text-right">
              <div className="font-display text-xl font-semibold tabular-nums leading-none text-brand-800">
                {pct != null ? `${pct}%` : a.score}
              </div>
              {a.max_score != null && (
                <div className="mt-0.5 text-[10px] tabular-nums text-ink-400">{a.score}/{a.max_score}</div>
              )}
            </div>
          )}
        </div>

        {a.academic_year && (
          <div className="mt-3 border-t border-dashed border-ink-100 pt-2 text-[11px] tabular-nums text-ink-400">
            {a.academic_year}
          </div>
        )}
      </div>
    </article>
  );
}
