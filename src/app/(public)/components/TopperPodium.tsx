"use client";

import { Crown } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { cn } from "@/lib/utils";
import type { PublicTopper, TopperGroup } from "../lib/showcase";
import { Reveal } from "./motion";

// Ranks 1–3 on a podium (2 · 1 · 3 on wide screens, 1 · 2 · 3 stacked on
// phones), everyone after that in a compact list below.
export function TopperPodium({ group }: { group: TopperGroup }) {
  const { lang } = useLang();
  const podium = group.rows.filter((r) => r.rank <= 3);
  const rest = group.rows.filter((r) => r.rank > 3);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 text-center">
        <div className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">
          {group.standard} · {group.exam}
        </div>
        {group.year && <div className="text-xs tabular-nums text-ink-500">{group.year}</div>}
      </div>

      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
        {podium.map((r) => (
          <Reveal
            key={r.id}
            from="up"
            // Rank 3 rises first, then 2, then the winner — a reveal with a drumroll.
            delay={(3 - Math.min(r.rank, 3)) * 180}
            className={cn(
              r.rank === 1 && "sm:order-2",
              r.rank === 2 && "sm:order-1",
              r.rank === 3 && "sm:order-3",
            )}
          >
            <PodiumCard r={r} lang={lang} />
          </Reveal>
        ))}
      </div>

      {rest.length > 0 && (
        <ol className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-2 sm:grid-cols-2">
          {rest.map((r) => (
            <Reveal as="li" key={r.id} delay={400 + (r.rank - 4) * 60} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-xs">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-800 ring-1 ring-brand-100">
                {r.rank}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-ink-900">{r.student_name || "—"}</span>
              {r.percentage != null && (
                <span className="font-display font-semibold tabular-nums text-brand-800">{r.percentage}%</span>
              )}
            </Reveal>
          ))}
        </ol>
      )}
    </div>
  );
}

const PODIUM = {
  1: { ring: "ring-amber-300", chip: "from-amber-300 to-amber-500 text-amber-950", base: "sm:pt-10 sm:pb-8 border-amber-200 bg-linear-to-b from-amber-50 to-white", size: "h-28 w-28 sm:h-32 sm:w-32" },
  2: { ring: "ring-slate-300", chip: "from-slate-200 to-slate-400 text-slate-900", base: "sm:pt-8 border-slate-200 bg-linear-to-b from-slate-50 to-white", size: "h-24 w-24" },
  3: { ring: "ring-orange-300", chip: "from-orange-300 to-orange-500 text-orange-950", base: "sm:pt-6 border-orange-200 bg-linear-to-b from-orange-50 to-white", size: "h-24 w-24" },
} as const;

function PodiumCard({ r, className, lang }: { r: PublicTopper; className?: string; lang: "mr" | "en" }) {
  const tone = PODIUM[(r.rank as 1 | 2 | 3)] ?? PODIUM[3];
  const name = r.student_name || "—";
  return (
    <article className={cn(
      "relative flex flex-col items-center rounded-3xl border px-5 py-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",
      tone.base, className,
    )}>
      {r.rank === 1 && <Crown className="absolute -top-4 h-8 w-8 fill-amber-300 text-amber-500 drop-shadow" aria-hidden="true" />}
      <div className="relative">
        <div className={cn("overflow-hidden rounded-full bg-linear-to-br from-brand-50 to-brand-100 ring-4 shadow-md", tone.ring, tone.size)}>
          {r.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={r.photo_url} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-4xl font-semibold text-brand-700">
              {name.trim().charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className={cn(
          "absolute -bottom-2 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold shadow-md ring-2 ring-white",
          tone.chip,
        )}>
          {r.rank}
        </div>
      </div>
      <h3 className="mt-6 line-clamp-2 font-display text-lg font-semibold leading-snug text-ink-900">{name}</h3>
      {r.percentage != null && (
        <div className="mt-2 font-display text-3xl font-semibold tabular-nums text-brand-800">{r.percentage}%</div>
      )}
      {r.total != null && r.max_total != null && (
        <div className="text-xs tabular-nums text-ink-500">
          {lang === "mr" ? `${r.total} / ${r.max_total} गुण` : `${r.total} / ${r.max_total} marks`}
        </div>
      )}
      {r.note && <div className="mt-2 line-clamp-2 text-xs text-brand-700">{r.note}</div>}
    </article>
  );
}
