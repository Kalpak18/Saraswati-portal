// Bilingual normalizer — Marathi ⇄ English.
// Canonical form is Marathi. Whatever the user or file provides
// (Marathi, English, mixed digits) is normalized once and matched forgivingly.

// ============================================================
// Digits
// ============================================================
const MR_TO_AR: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};
const AR_TO_MR: Record<string, string> = Object.fromEntries(
  Object.entries(MR_TO_AR).map(([mr, ar]) => [ar, mr]),
);

// Convert every Marathi digit in a string to Arabic. Useful before Number(...).
export function toArabicDigits(s: string): string {
  return String(s).replace(/[०-९]/g, (d) => MR_TO_AR[d] ?? d);
}
export function toMarathiDigits(s: string): string {
  return String(s).replace(/[0-9]/g, (d) => AR_TO_MR[d] ?? d);
}

// Robust Number parse that tolerates Marathi digits + whitespace.
export function parseNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = toArabicDigits(String(v)).trim().replace(/[^\d.\-]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// ============================================================
// Divisions — canonical Marathi, many surface forms accepted
// ============================================================
// Ordered map of canonical → all accepted alternatives (case-insensitive).
export const DIVISIONS: { canonical: string; english: string; aliases: string[] }[] = [
  { canonical: "अ", english: "A", aliases: ["अ", "a", "1", "१"] },
  { canonical: "ब", english: "B", aliases: ["ब", "b", "2", "२"] },
  { canonical: "क", english: "C", aliases: ["क", "c", "3", "३"] },
  { canonical: "ड", english: "D", aliases: ["ड", "d", "4", "४"] },
  { canonical: "इ", english: "E", aliases: ["इ", "e", "5", "५"] },
  { canonical: "फ", english: "F", aliases: ["फ", "f", "6", "६"] },
  { canonical: "ग", english: "G", aliases: ["ग", "g", "7", "७"] },
  { canonical: "SEMI", english: "SEMI", aliases: ["semi", "semi-english", "सेमी"] },
  { canonical: "ENG",  english: "ENG",  aliases: ["eng", "english", "इंग्रजी"] },
  { canonical: "MAR",  english: "MAR",  aliases: ["mar", "marathi", "मराठी"] },
];

// Return the canonical Marathi form (e.g. "अ") for any accepted input.
// Returns null when nothing matches.
export function normalizeDivision(raw: string): string | null {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase();
  const arabic = toArabicDigits(key);
  for (const d of DIVISIONS) {
    for (const a of d.aliases) {
      if (a.toLowerCase() === key || a.toLowerCase() === arabic) return d.canonical;
    }
  }
  return null;
}

// Human bilingual label for display — e.g. "अ / A"
export function displayDivision(canonical: string, lang: "mr" | "en" = "mr"): string {
  const hit = DIVISIONS.find((d) => d.canonical === canonical);
  if (!hit) return canonical;
  if (hit.canonical === hit.english) return hit.canonical; // SEMI/ENG/MAR — same
  return lang === "en" ? `${hit.english} / ${hit.canonical}` : `${hit.canonical} / ${hit.english}`;
}

// ============================================================
// Standards — 5th to 12th (extensible)
// ============================================================
// Canonical Marathi form; ordinal suffix follows Marathi convention:
//  1 ली · 2 री · 3 री · 4 थी · 5 वी · 6 वी · 7 वी · 8 वी · 9 वी · 10 वी · 11 वी · 12 वी
type StdEntry = { canonical: string; english: string; number: number; aliases: string[] };

// Build alias set for a given number: cover Marathi + English + digit variants.
function stdAliases(n: number): string[] {
  const ar = String(n);
  const mr = toMarathiDigits(ar);
  const ord =
    n === 1 ? ["st", "ली"] :
    n === 2 ? ["nd", "री"] :
    n === 3 ? ["rd", "री"] :
    n === 4 ? ["th", "थी"] :
    ["th", "वी"];
  const generic = [
    ar, mr,
    `${ar}th`, `${ar} th`,
    `${ar} ${ord[0]}`, `${ar}${ord[0]}`,
    `${mr} ${ord[1]}`, `${mr}${ord[1]}`,
    `std ${ar}`, `standard ${ar}`, `class ${ar}`, `grade ${ar}`,
    `इयत्ता ${mr}`, `वर्ग ${mr}`,
  ];
  // 10th / SSC & 12th / HSC alias
  if (n === 10) generic.push("ssc", "ssc board");
  if (n === 12) generic.push("hsc", "hsc board");
  return Array.from(new Set(generic.map((s) => s.toLowerCase())));
}

export const STANDARDS: StdEntry[] = ([5, 6, 7, 8, 9, 10, 11, 12] as number[]).map((n) => {
  const suffixMR = n === 1 ? "ली" : n === 2 || n === 3 ? "री" : n === 4 ? "थी" : "वी";
  const suffixEN = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return {
    canonical: `${toMarathiDigits(String(n))} ${suffixMR}`,   // e.g. "१० वी"
    english: `${n}${suffixEN}`,                                // e.g. "10th"
    number: n,
    aliases: stdAliases(n),
  };
});

// Find the standard's canonical form from any surface form.
// Returns null if not recognized — caller can fall back to raw string.
export function normalizeStandard(raw: string): string | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  const s2 = toArabicDigits(s).replace(/\s+/g, " ").trim();
  for (const st of STANDARDS) {
    if (st.aliases.includes(s) || st.aliases.includes(s2)) return st.canonical;
    // Loose numeric hit: contains standalone number that matches AND some ordinal-y suffix
    const numMatch = s2.match(/\b(\d{1,2})\b/);
    if (numMatch && Number(numMatch[1]) === st.number) return st.canonical;
  }
  return null;
}

export function displayStandard(canonical: string, lang: "mr" | "en" = "mr"): string {
  const hit = STANDARDS.find((s) => s.canonical === canonical);
  if (!hit) return canonical;
  return lang === "en" ? `${hit.english} / ${hit.canonical}` : `${hit.canonical} / ${hit.english}`;
}

// ============================================================
// Gender
// ============================================================
const GENDER_ALIASES: { canonical: "M" | "F" | "Other"; aliases: string[] }[] = [
  { canonical: "M",     aliases: ["m", "male", "boy", "पुरुष", "मुलगा", "पु", "श्री"] },
  { canonical: "F",     aliases: ["f", "female", "girl", "स्त्री", "मुलगी", "स्त्री", "कु", "कुमारी", "सौ"] },
  { canonical: "Other", aliases: ["o", "other", "इतर"] },
];

export function normalizeGender(raw: string): "M" | "F" | "Other" | null {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase().replace(/[.\s]/g, "");
  for (const g of GENDER_ALIASES) {
    if (g.aliases.some((a) => a.toLowerCase().replace(/[.\s]/g, "") === key)) return g.canonical;
  }
  return null;
}

export function displayGender(canonical: string, lang: "mr" | "en" = "mr"): string {
  if (canonical === "M") return lang === "en" ? "Male / पुरुष" : "पुरुष / Male";
  if (canonical === "F") return lang === "en" ? "Female / स्त्री" : "स्त्री / Female";
  return canonical;
}

// ============================================================
// Convenience: pull "label : value" from a cell like
//   "हजेरी क्र. : 12"   →   { label: "हजेरी क्र.", value: "12" }
//   "Roll No: 12"      →   { label: "Roll No",  value: "12" }
// ============================================================
export function splitLabelValue(cell: unknown): { label: string; value: string } | null {
  const s = String(cell ?? "").trim();
  if (!s) return null;
  const m = s.match(/^([^:：]+)[:：]\s*(.*)$/);
  if (!m) return null;
  return { label: m[1].trim(), value: m[2].trim() };
}

// Labels that mean "roll number" in either language
export const ROLL_LABELS = [
  "हजेरी क्र", "हजेरी क्रमांक", "अ.क्र", "roll no", "roll number", "roll",
];
// Labels that mean "division" in either language
export const DIVISION_LABELS = [
  "तुकडी", "विभाग", "division", "div", "section",
];
// Labels for standard
export const STANDARD_LABELS = [
  "इयत्ता", "वर्ग", "standard", "std", "class", "grade",
];
// Labels for GR
export const GR_LABELS = [
  "gr", "gr no", "gr क्र", "general register", "जनरल रजिस्टर",
];

function labelMatches(label: string, list: string[]): boolean {
  const k = label.toLowerCase().replace(/[.\s]/g, "");
  return list.some((l) => l.toLowerCase().replace(/[.\s]/g, "") === k);
}
export function isRollLabel(l: string)     { return labelMatches(l, ROLL_LABELS); }
export function isDivisionLabel(l: string) { return labelMatches(l, DIVISION_LABELS); }
export function isStandardLabel(l: string) { return labelMatches(l, STANDARD_LABELS); }
export function isGRLabel(l: string)       { return labelMatches(l, GR_LABELS); }
