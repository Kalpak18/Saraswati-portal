"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, Trophy } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { CATEGORIES, LEVELS, levelLabel, levelRank } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { PageIntro } from "../components/PageIntro";
import { AchievementCard } from "../components/AchievementCard";
import { byPrestige, type PublicAchievement } from "../lib/showcase";

const GROUP_PREVIEW = 9;

type Group = { key: string; title: string; year: string | null; level: string | null; rows: PublicAchievement[] };

export default function AchievementsContent({ rows, initialExam = "" }: { rows: PublicAchievement[]; initialExam?: string }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.academic_year).filter(Boolean) as string[])).sort().reverse(),
    [rows],
  );
  const categories = useMemo(() => CATEGORIES.filter((c) => rows.some((r) => r.category === c.key)), [rows]);
  // Every competitive exam / event on record, most entries first.
  const exams = useMemo(() => {
    const count = new Map<string, number>();
    for (const r of rows) {
      const k = r.exam_name || r.title;
      count.set(k, (count.get(k) ?? 0) + 1);
    }
    return Array.from(count.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [rows]);
  const levels = useMemo(() => LEVELS.filter((l) => rows.some((r) => r.level === l.key)), [rows]);

  const [year, setYear] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [exam, setExam] = useState<string>(initialExam);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) =>
      (!year || r.academic_year === year) &&
      (!category || r.category === category) &&
      (!level || r.level === level) &&
      (!exam || (r.exam_name || r.title) === exam) &&
      (!needle || [r.student_name, r.exam_name, r.title, r.award, r.standard_label]
        .some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [rows, year, category, level, exam, q]);

  // One section per exam / event per year, most prestigious section first.
  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const r of filtered) {
      const title = r.exam_name || r.title;
      const key = `${title}|${r.academic_year ?? ""}`;
      const g = map.get(key) ?? { key, title, year: r.academic_year, level: null, rows: [] };
      g.rows.push(r);
      if (levelRank(r.level) > levelRank(g.level)) g.level = r.level;
      map.set(key, g);
    }
    const list = Array.from(map.values());
    for (const g of list) g.rows.sort(byPrestige);
    return list.sort((a, b) =>
      (b.year ?? "").localeCompare(a.year ?? "") ||
      levelRank(b.level) - levelRank(a.level) ||
      b.rows.length - a.rows.length);
  }, [filtered]);

  const chip = (active: boolean) => cn(
    "flex-none rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-colors",
    active ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-ink-700 ring-ink-200 hover:bg-brand-50 hover:text-brand-800",
  );

  return (
    <>
      <PageIntro
        eyebrow={t("कर्तृत्व", "Achievements")}
        title={t("आमची यशोगाथा", "Where our students shine")}
        subtitle={t(
          "ऑलिम्पियाड, NMMS, शिष्यवृत्ती, क्रीडा आणि सांस्कृतिक स्पर्धांतील आमच्या विद्यार्थ्यांचे यश.",
          "Results from Olympiads, NMMS, scholarship exams, sports meets and cultural competitions.",
        )}
      />

      {/* Filters */}
      <div className="sticky top-16 z-30 border-b border-ink-100 bg-white/90 backdrop-blur-md sm:top-18 lg:top-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button className={chip(!category)} onClick={() => setCategory("")}>{t("सर्व", "All")}</button>
            {categories.map((c) => (
              <button key={c.key} className={chip(category === c.key)} onClick={() => setCategory(c.key)}>
                {c[lang]}
              </button>
            ))}
          </div>
          <div className="flex flex-1 gap-2 lg:justify-end">
            {exams.length > 1 && (
              <FilterSelect value={exam} onChange={setExam} label={t("परीक्षा", "Exam")}
                options={[{ v: "", l: t("सर्व परीक्षा", "All exams") }, ...exams.map((x) => ({ v: x, l: x }))]} />
            )}
            {years.length > 1 && (
              <FilterSelect value={year} onChange={setYear} label={t("वर्ष", "Year")}
                options={[{ v: "", l: t("सर्व वर्षे", "All years") }, ...years.map((y) => ({ v: y, l: y }))]} />
            )}
            {levels.length > 1 && (
              <FilterSelect value={level} onChange={setLevel} label={t("स्तर", "Level")}
                options={[{ v: "", l: t("सर्व स्तर", "All levels") }, ...levels.map((l) => ({ v: l.key, l: l[lang] }))]} />
            )}
            <label className="relative min-w-0 flex-1 lg:max-w-60">
              <span className="sr-only">{t("शोधा", "Search")}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("नाव किंवा परीक्षा शोधा", "Search name or exam")}
                className="h-9 w-full rounded-full border border-ink-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <Trophy className="mx-auto h-12 w-12 text-ink-300" />
            <p className="mt-4 font-display text-xl font-semibold text-ink-900">
              {rows.length ? t("या निवडीत काही सापडले नाही", "Nothing matches these filters") : t("यशोगाथा लवकरच", "Achievements coming soon")}
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {groups.map((g) => {
              const open = expanded.has(g.key);
              const shown = open ? g.rows : g.rows.slice(0, GROUP_PREVIEW);
              const lv = levelLabel(g.level, lang);
              return (
                <section key={g.key}>
                  <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-ink-100 pb-4">
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{g.title}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                        {g.year && <span className="tabular-nums">{g.year}</span>}
                        {lv && <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-800">{lv}</span>}
                      </div>
                    </div>
                    <div className="text-sm text-ink-500">
                      {lang === "mr" ? `${g.rows.length} विद्यार्थी` : `${g.rows.length} ${g.rows.length === 1 ? "student" : "students"}`}
                    </div>
                  </header>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((a) => <AchievementCard key={a.id} a={a} />)}
                  </div>
                  {g.rows.length > GROUP_PREVIEW && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setExpanded((s) => { const n = new Set(s); if (open) n.delete(g.key); else n.add(g.key); return n; })}
                        className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
                      >
                        {open ? t("कमी दाखवा", "Show less") : t(`सर्व ${g.rows.length} पहा`, `Show all ${g.rows.length}`)}
                        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                      </button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function FilterSelect({
  value, onChange, label, options,
}: { value: string; onChange: (v: string) => void; label: string; options: { v: string; l: string }[] }) {
  return (
    <label className="relative flex-none">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 max-w-48 appearance-none truncate rounded-full border border-ink-200 bg-white pl-3.5 pr-8 text-sm text-ink-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </label>
  );
}
