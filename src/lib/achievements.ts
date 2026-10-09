// Shared vocabulary for achievements — used by the importer, the admin
// editor and the public showcase so a "state" level or a "gold" medal is
// spelled, ordered and labelled identically everywhere.

import { toArabicDigits } from "@/lib/i18n/normalize";

// ============================================================
// Levels — ordered lowest → highest
// ============================================================
export const LEVELS = [
  { key: "school",        mr: "शाळा",            en: "School" },
  { key: "centre",        mr: "केंद्र",           en: "Centre" },
  { key: "taluka",        mr: "तालुका",          en: "Taluka" },
  { key: "district",      mr: "जिल्हा",          en: "District" },
  { key: "division",      mr: "विभाग",           en: "Division" },
  { key: "state",         mr: "राज्य",           en: "State" },
  { key: "national",      mr: "राष्ट्रीय",        en: "National" },
  { key: "international", mr: "आंतरराष्ट्रीय",    en: "International" },
] as const;

export type Level = (typeof LEVELS)[number]["key"];

export function levelRank(level: string | null | undefined): number {
  const i = LEVELS.findIndex((l) => l.key === level);
  return i < 0 ? -1 : i;
}

export function levelLabel(level: string | null | undefined, lang: "mr" | "en"): string | null {
  const hit = LEVELS.find((l) => l.key === level);
  return hit ? hit[lang] : null;
}

// Order matters: "international" contains "national", and
// "आंतरराष्ट्रीय" contains "राष्ट्रीय" — test the longer word first.
const LEVEL_PATTERNS: { key: Level; re: RegExp }[] = [
  { key: "international", re: /international|आंतरराष्ट्रीय|आंतर राष्ट्रीय/i },
  { key: "national",      re: /national|all\s*india|राष्ट्रीय|अखिल भारतीय/i },
  { key: "state",         re: /\bstate\b|राज्य/i },
  { key: "division",      re: /\bdivision(al)?\b|\bregional\b|विभागीय|विभाग स्तर/i },
  { key: "district",      re: /district|जिल्हा/i },
  { key: "taluka",        re: /taluka|tehsil|block|तालुका/i },
  { key: "centre",        re: /\bcent(er|re)\b|केंद्र/i },
  { key: "school",        re: /\bschool\b|शाळा|शालेय/i },
];

export function detectLevel(raw: unknown): Level | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  for (const p of LEVEL_PATTERNS) if (p.re.test(s)) return p.key;
  return null;
}

// ============================================================
// Categories
// ============================================================
export const CATEGORIES = [
  { key: "competitive", mr: "स्पर्धा परीक्षा", en: "Competitive exam" },
  { key: "academic",    mr: "शैक्षणिक",      en: "Academic" },
  { key: "sports",      mr: "क्रीडा",         en: "Sports" },
  { key: "cultural",    mr: "सांस्कृतिक",      en: "Cultural" },
  { key: "other",       mr: "इतर",           en: "Other" },
] as const;

export type Category = (typeof CATEGORIES)[number]["key"];

export function categoryLabel(cat: string | null | undefined, lang: "mr" | "en"): string {
  const hit = CATEGORIES.find((c) => c.key === cat);
  return hit ? hit[lang] : (cat ?? "");
}

// ============================================================
// Medals
// ============================================================
export type Medal = "gold" | "silver" | "bronze";

export function detectMedal(raw: unknown): Medal | null {
  const s = String(raw ?? "").toLowerCase();
  if (!s) return null;
  if (/gold|सुवर्ण|सोने/.test(s)) return "gold";
  if (/silver|रौप्य|चांदी/.test(s)) return "silver";
  if (/bronze|कांस्य/.test(s)) return "bronze";
  return null;
}

export function medalLabel(medal: string | null | undefined, lang: "mr" | "en"): string | null {
  if (medal === "gold")   return lang === "mr" ? "सुवर्णपदक" : "Gold medal";
  if (medal === "silver") return lang === "mr" ? "रौप्यपदक" : "Silver medal";
  if (medal === "bronze") return lang === "mr" ? "कांस्यपदक" : "Bronze medal";
  return null;
}

// ============================================================
// Rank — "1", "1st", "I", "प्रथम", "पहिला", "१ ला", "Rank 3" …
// ============================================================
const WORD_RANKS: [RegExp, number][] = [
  [/प्रथम|पहिला|पहिली|first/i, 1],
  [/द्वितीय|दुसरा|दुसरी|second/i, 2],
  [/तृतीय|तिसरा|तिसरी|third/i, 3],
  [/चतुर्थ|चौथा|चौथी|fourth/i, 4],
  [/पाचवा|पाचवी|fifth/i, 5],
];
const ROMAN: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

export function parseRank(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isInteger(raw) && raw > 0 ? raw : null;
  const s = toArabicDigits(String(raw)).trim();
  if (!s) return null;
  const roman = ROMAN[s.toLowerCase().replace(/\.$/, "")];
  if (roman) return roman;
  const n = s.match(/\d+/);
  if (n) {
    const v = Number(n[0]);
    return v > 0 && v < 100000 ? v : null;
  }
  for (const [re, v] of WORD_RANKS) if (re.test(s)) return v;
  return null;
}

export function ordinal(n: number, lang: "mr" | "en"): string {
  if (lang === "mr") return `${n} वा`;
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function percentOf(score: number | null, max: number | null): number | null {
  if (score == null || max == null || max <= 0) return null;
  return Math.round((score / max) * 1000) / 10;
}
