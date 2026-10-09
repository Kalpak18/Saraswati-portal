import * as XLSX from "xlsx";
import { normalizeStandard, normalizeDivision, parseNum, toArabicDigits } from "@/lib/i18n/normalize";
import { toISODate as toDateISO } from "@/lib/excel/dates";
import { readMark } from "@/lib/excel/parseResults";
import { detectLevel, detectMedal, parseRank, percentOf, type Level, type Medal } from "@/lib/achievements";

// Reads a competitive-exam result sheet (Olympiad, NMMS, scholarship,
// Homi Bhabha, MTS, sports meets…) into flat rows. These files come from
// many different organisers, so nothing is assumed about column order:
// the header row is found by scoring every early row against a bilingual
// vocabulary, and each column is mapped by what its header says.

// ============================================================
// Types
// ============================================================
export type ParsedAchievementRow = {
  key: string;                      // stable id for the preview table
  sheet: string;
  row_no: number;                   // 1-based spreadsheet row, for error messages
  student_name: string;
  standard: string | null;          // canonical, e.g. "१० वी"
  standard_raw: string | null;
  division: string | null;          // canonical, e.g. "अ"
  roll_no: number | null;
  exam_name: string | null;
  level: Level | null;
  rank: number | null;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  award: string | null;
  medal: Medal | null;
  achieved_on: string | null;       // ISO date
  academic_year: string | null;     // "2025-26"
  warnings: string[];
};

export type ParsedAchievementFile = {
  exam_name: string | null;         // best guess from the title row / sheet name
  level: Level | null;
  academic_year: string | null;
  rows: ParsedAchievementRow[];
  columns: Field[];                 // which fields were recognised, for the preview
  warnings: string[];
};

export type Field =
  | "name" | "standard" | "division" | "roll" | "exam" | "level" | "rank"
  | "score" | "max" | "percent" | "award" | "date" | "year" | "ignore";

// ============================================================
// Header vocabulary
// ============================================================
function normHeader(v: unknown): string {
  return toArabicDigits(String(v ?? ""))
    .toLowerCase()
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Tested in order; the first match wins. Specific phrases come before the
// generic words they contain ("exam date" before "exam", "out of" before
// "marks", "school name" before "name").
const FIELD_RULES: { field: Field; re: RegExp }[] = [
  { field: "ignore",   re: /^(sr|s\.?\s*no|sl\.?\s*no|serial|अ\.?\s*क्र|अनु\.?\s*क्र|अनुक्रमांक|क्र\.?|क्रमांक|no\.?)$/ },
  { field: "ignore",   re: /school|शाळ|father|mother|parent|वडील|वडिलांचे|आई|guardian|mobile|phone|contact|udise|address|पत्ता|gender|लिंग|caste|जात|aadhaar|आधार|dob|birth|जन्म|seat|बैठक|registration|reg\.?\s*no|centre\s*(name|code)|केंद्राचे/ },
  { field: "date",     re: /date|दिनांक|तारीख/ },
  { field: "year",     re: /year|वर्ष|session|सत्र/ },
  { field: "level",    re: /level|स्तर|पातळी/ },
  { field: "score",    re: /(marks|score|गुण).*(out\s*of|\/|पैकी)\s*\d+/ },
  { field: "max",      re: /out\s*of|max|पैकी|full\s*marks|कमाल/ },
  { field: "percent",  re: /%|percent|टक्के|टक्केवारी/ },
  { field: "rank",     re: /rank|position|place|merit|गुणवत्ता|स्थान|क्रमांक प्राप्त|यादी क्र/ },
  { field: "award",    re: /award|medal|prize|पारितोषिक|बक्षीस|पदक|result|निकाल|remark|शेरा|certificate|प्रमाणपत्र|scholarship|शिष्यवृत्ती|achievement|यश|status/ },
  { field: "score",    re: /marks|score|गुण|obtained|प्राप्त|total|एकूण/ },
  { field: "exam",     re: /exam|competition|olympiad|परीक्षा|स्पर्धा|event|contest|test|activity|उपक्रम/ },
  { field: "roll",     re: /roll|हजेरी/ },
  { field: "division", re: /^(div|division|तुकडी|section|sec)\.?$/ },
  { field: "standard", re: /std|standard|class|इयत्ता|वर्ग|grade/ },
  { field: "name",     re: /name|नाव|candidate|participant|विद्यार्थी|student/ },
];

function classifyHeader(h: string): Field | null {
  if (!h) return null;
  for (const r of FIELD_RULES) if (r.re.test(h)) return r.field;
  return null;
}

type ColMap = Partial<Record<Exclude<Field, "ignore">, number>>;

function mapHeaderRow(row: unknown[]): { map: ColMap; hits: number } {
  const map: ColMap = {};
  let hits = 0;
  row.forEach((cell, i) => {
    const f = classifyHeader(normHeader(cell));
    if (!f || f === "ignore") return;
    if (map[f] === undefined) { map[f] = i; hits++; return; }
    // NMMS-style sheets have "MAT गुण", "SAT गुण", "एकूण गुण": the total wins.
    if (f === "score" && /total|एकूण/.test(normHeader(cell))) map.score = i;
  });
  return { map, hits };
}

// A header needs a name column plus something that says what was achieved.
function isUsableHeader(map: ColMap): boolean {
  if (map.name === undefined) return false;
  return (
    map.rank !== undefined || map.score !== undefined || map.award !== undefined ||
    map.percent !== undefined || map.level !== undefined || map.exam !== undefined
  );
}

// ============================================================
// Title rows: "MTS Olympiad 2025-26 — State Level Merit List"
// ============================================================
const YEAR_RE = /(20\d{2})\s*[-–—/]\s*(\d{2,4})|\b(20\d{2})\b/;

export function normalizeYear(raw: unknown): string | null {
  const s = toArabicDigits(String(raw ?? ""));
  const m = s.match(YEAR_RE);
  if (!m) return null;
  if (m[1]) {
    const b = m[2].length === 4 ? m[2].slice(-2) : m[2].padStart(2, "0");
    return `${m[1]}-${b}`;
  }
  // A single calendar year. Competitive exams are usually named after the
  // year they are held in, which falls in the second half of the academic
  // year (Jan–Mar), so "2026" → "2025-26".
  const y = Number(m[3]);
  return `${y - 1}-${String(y % 100).padStart(2, "0")}`;
}

// Indian academic year starts in June.
function academicYearOfDate(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m] = iso.split("-").map(Number);
  const start = m >= 6 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

// "State Level", "राज्यस्तरीय", "जिल्हा स्तर" — an explicit level phrase.
// Bare words are not trusted in titles: "International Maths Olympiad"
// is the exam's name, not the level this student reached.
const LEVEL_PHRASE = /([^\s,|:–—-]+)\s*(level|स्तरीय|स्तर)\b|([^\s,|:–—-]+?)स्तरीय/i;

function titleLevel(s: string) {
  const m = s.match(LEVEL_PHRASE);
  return m ? detectLevel(m[0]) : null;
}

const MONTHS = /\b(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?)\b|जानेवारी|फेब्रुवारी|मार्च|एप्रिल|मे|जून|जुलै|ऑगस्ट|सप्टेंबर|ऑक्टोबर|नोव्हेंबर|डिसेंबर/gi;

function cleanTitle(s: string): string {
  return s
    .replace(YEAR_RE, "")
    .replace(LEVEL_PHRASE, "")
    .replace(MONTHS, "")
    .replace(/\b(merit\s*list|result(s)?|list)\b/gi, "")
    .replace(/गुणवत्ता\s*यादी|निकाल/g, "")
    .replace(/[\s\-–—:|,(]+$/g, "")
    .replace(/^[\s\-–—:|,]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const GENERIC_SHEET = /^(sheet|पत्रक)\s*\d*$/i;

// ============================================================
// Grid helpers
// ============================================================
type Grid = unknown[][];

function isBlankRow(row: unknown[] | undefined): boolean {
  return !row || row.every((c) => c == null || String(c).trim() === "");
}

function str(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).replace(/\s+/g, " ").trim();
}

// "Marks (out of 150)" / "गुण /100" → 150 / 100
function maxFromHeader(h: string): number | null {
  const m = toArabicDigits(h).match(/(?:out\s*of|\/|पैकी|max\.?)\s*(\d{1,4})/i);
  return m ? Number(m[1]) : null;
}

// ============================================================
// Sheet parser
// ============================================================
const HEADER_SCAN_ROWS = 25;

function parseSheet(ws: XLSX.WorkSheet, sheetName: string) {
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1, defval: "", blankrows: true, raw: true,
  }) as Grid;

  // 1. Best header row among the first few rows.
  let headerIdx = -1;
  let best: { map: ColMap; hits: number } = { map: {}, hits: 0 };
  for (let i = 0; i < Math.min(grid.length, HEADER_SCAN_ROWS); i++) {
    const cand = mapHeaderRow(grid[i] ?? []);
    if (isUsableHeader(cand.map) && cand.hits > best.hits) {
      best = cand;
      headerIdx = i;
    }
  }
  if (headerIdx < 0) return null;
  const col = best.map;
  const headerRow = grid[headerIdx] ?? [];

  // 2. Title rows above the header give the exam name, year and level.
  const titleParts: string[] = [];
  for (let i = 0; i < headerIdx; i++) {
    const cells = (grid[i] ?? []).map(str).filter(Boolean);
    if (cells.length > 0) titleParts.push(cells.join(" "));
  }
  const titleText = titleParts.join(" · ");
  let sheetExam = titleParts.length > 0 ? cleanTitle(titleParts[0]) : "";
  if (!sheetExam && !GENERIC_SHEET.test(sheetName.trim())) sheetExam = cleanTitle(sheetName);
  const sheetYear = normalizeYear(titleText) ?? normalizeYear(sheetName);
  const sheetLevel = titleLevel(titleText) ?? titleLevel(sheetName);

  // 3. "Grade" means class in Olympiad sheets but a result band elsewhere.
  //    Keep it as the standard only if its values look like class numbers.
  if (col.standard !== undefined && /grade/.test(normHeader(headerRow[col.standard]))) {
    const sample = grid.slice(headerIdx + 1, headerIdx + 21)
      .map((r) => str(r?.[col.standard!])).filter(Boolean);
    const numeric = sample.filter((v) => {
      const n = parseNum(v);
      return n != null && n >= 1 && n <= 12;
    });
    if (sample.length > 0 && numeric.length / sample.length < 0.6) {
      if (col.award === undefined) col.award = col.standard;
      delete col.standard;
    }
  }

  const headerMax = col.score !== undefined ? maxFromHeader(normHeader(headerRow[col.score])) : null;

  // 4. Data rows.
  const rows: ParsedAchievementRow[] = [];
  let blankRun = 0;
  for (let i = headerIdx + 1; i < grid.length; i++) {
    const row = grid[i] ?? [];
    if (isBlankRow(row)) {
      // Two blank rows in a row = end of table (footers, signatures follow).
      if (++blankRun >= 2 && rows.length > 0) break;
      continue;
    }
    blankRun = 0;

    const name = str(row[col.name!]);
    if (!name) continue;
    // Repeated header rows on printed multi-page lists.
    if (classifyHeader(normHeader(name)) === "name") continue;
    if (/^(total|एकूण|signature|सही|principal|मुख्याध्यापक)/i.test(name)) continue;
    // Names are words; a pure number here is a stray serial / total.
    if (/^[\d\s.,]+$/.test(toArabicDigits(name))) continue;

    const warnings: string[] = [];
    const get = (f: keyof ColMap) => (col[f] !== undefined ? row[col[f]!] : undefined);

    const stdRaw = str(get("standard")) || null;
    const standard = stdRaw ? normalizeStandard(stdRaw) : null;
    if (stdRaw && !standard) warnings.push(`Unrecognised standard "${stdRaw}"`);

    const divRaw = str(get("division"));
    const division = divRaw ? normalizeDivision(divRaw) : null;

    // "52/60", "५२", "AB" — read like report-card marks.
    const mark = readMark(get("score"));
    const score = mark.value;
    const max = parseNum(get("max")) ?? mark.max ?? headerMax;
    if (mark.unreadable) warnings.push(`Score "${mark.unreadable}" isn't a number`);

    let percentage: number | null = null;
    const pRaw = get("percent");
    if (pRaw !== undefined && pRaw !== "") {
      const p = parseNum(pRaw);
      // Excel stores a cell formatted as 87% as 0.87.
      percentage = p == null ? null : typeof pRaw === "number" && p <= 1 ? Math.round(p * 1000) / 10 : p;
    }
    if (percentage == null) percentage = percentOf(score, max);
    if (score != null && max != null && score > max) warnings.push(`Score ${score} is more than max ${max}`);

    const awardRaw = str(get("award")) || null;
    const rank = parseRank(get("rank"));
    const levelCell = str(get("level"));
    const examCell = str(get("exam"));
    const achieved_on = toDateISO(get("date"));
    const yearCell = str(get("year"));

    const r: ParsedAchievementRow = {
      key: `${sheetName}:${i + 1}`,
      sheet: sheetName,
      row_no: i + 1,
      student_name: name,
      standard,
      standard_raw: stdRaw,
      division,
      roll_no: parseNum(get("roll")),
      exam_name: examCell || sheetExam || null,
      level: detectLevel(levelCell) ?? titleLevel(awardRaw ?? "") ?? titleLevel(examCell) ?? sheetLevel,
      rank,
      score,
      max_score: max,
      percentage,
      award: awardRaw,
      medal: detectMedal(awardRaw),
      achieved_on,
      academic_year: normalizeYear(yearCell) ?? sheetYear ?? academicYearOfDate(achieved_on),
      warnings,
    };

    if (r.rank == null && r.score == null && r.percentage == null && !r.award) {
      r.warnings.push("No rank, marks or award on this row");
    }
    rows.push(r);
  }

  const columns = (Object.keys(col) as Field[]);
  return { rows, exam: sheetExam || null, year: sheetYear, level: sheetLevel, columns };
}

const SKIP_SHEET = [/^how\s*to/i, /^notes?$/i, /^instructions?$/i, /^readme$/i, /^help$/i, /^सूचना$/];

// ============================================================
// Entry point
// ============================================================
export function parseAchievementsWorkbook(buf: ArrayBuffer | Uint8Array): ParsedAchievementFile {
  const wb = XLSX.read(buf, { cellDates: true, raw: true });   // raw: CSV text stays text (no UTC date guessing)
  const out: ParsedAchievementFile = {
    exam_name: null, level: null, academic_year: null, rows: [], columns: [], warnings: [],
  };
  const cols = new Set<Field>();

  for (const name of wb.SheetNames) {
    if (SKIP_SHEET.some((re) => re.test(name.trim()))) continue;
    const parsed = parseSheet(wb.Sheets[name], name);
    if (!parsed) {
      out.warnings.push(`Sheet "${name}": no header row with a Name column was found`);
      continue;
    }
    out.exam_name ??= parsed.exam;
    out.academic_year ??= parsed.year;
    out.level ??= parsed.level;
    parsed.columns.forEach((c) => cols.add(c));
    out.rows.push(...parsed.rows);
  }

  out.columns = Array.from(cols);
  return out;
}
