import { levelRank } from "@/lib/achievements";

// Shapes and queries shared by the public achievement / topper sections.
// Kept out of the "use client" card files so server pages can import the
// column lists and sorters as real values.

export type PublicAchievement = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  achieved_on: string | null;
  photo_url: string | null;
  student_name: string | null;
  standard_label: string | null;
  exam_name: string | null;
  level: string | null;
  rank: number | null;
  score: number | null;
  max_score: number | null;
  award: string | null;
  medal: string | null;
  academic_year: string | null;
};

export const ACHIEVEMENT_COLUMNS =
  "id, title, description, category, achieved_on, photo_url, student_name, standard_label, exam_name, level, rank, score, max_score, award, medal, academic_year";

// Most impressive first: higher level, then medal/rank, then most recent.
export function byPrestige(a: PublicAchievement, b: PublicAchievement): number {
  const lv = levelRank(b.level) - levelRank(a.level);
  if (lv !== 0) return lv;
  const ra = a.rank ?? (a.medal ? MEDAL_ORDER[a.medal] : 99);
  const rb = b.rank ?? (b.medal ? MEDAL_ORDER[b.medal] : 99);
  if (ra !== rb) return ra - rb;
  return (b.achieved_on ?? b.academic_year ?? "").localeCompare(a.achieved_on ?? a.academic_year ?? "");
}
const MEDAL_ORDER: Record<string, number> = { gold: 1, silver: 2, bronze: 3 };

export type PublicTopper = {
  id: string;
  rank: number;
  note: string | null;
  photo_url: string | null;
  student_name: string | null;
  standard_label: string | null;
  exam_label: string | null;
  academic_year: string | null;
  percentage: number | null;
  total: number | null;
  max_total: number | null;
};

export const TOPPER_COLUMNS =
  "id, rank, note, photo_url, student_name, standard_label, exam_label, academic_year, percentage, total, max_total";

export type TopperGroup = { key: string; exam: string; standard: string | null; year: string | null; rows: PublicTopper[] };

// One group per test of a standard, newest academic year first, then class.
export function groupToppers(rows: PublicTopper[]): TopperGroup[] {
  const map = new Map<string, TopperGroup>();
  for (const r of rows) {
    const key = `${r.academic_year ?? ""}|${r.exam_label ?? ""}|${r.standard_label ?? ""}`;
    const g = map.get(key) ?? { key, exam: r.exam_label ?? "", standard: r.standard_label, year: r.academic_year, rows: [] };
    g.rows.push(r);
    map.set(key, g);
  }
  const groups = Array.from(map.values());
  for (const g of groups) g.rows.sort((a, b) => a.rank - b.rank);
  return groups.sort((a, b) =>
    (b.year ?? "").localeCompare(a.year ?? "") ||
    (a.standard ?? "").localeCompare(b.standard ?? "", undefined, { numeric: true }) ||
    a.exam.localeCompare(b.exam));
}
