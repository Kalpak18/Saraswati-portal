import * as XLSX from "xlsx";
import { toISODate } from "@/lib/excel/dates";
import {
  splitLabelValue, isRollLabel, isDivisionLabel, isStandardLabel, isGRLabel,
  normalizeDivision, normalizeStandard, parseNum, toArabicDigits,
} from "@/lib/i18n/normalize";

// ============================================================
// Types
// ============================================================
export type ParsedSubject = {
  paper_no: number | null;
  date: string | null;   // ISO date or null
  subject: string;
  marks_obtained: number | null;
  max_marks: number | null;
  grade: string | null;
};

export type ParsedStudentBlock = {
  raw_student_name: string;
  roll_no: number | null;              // "हजेरी क्र. : 12" / "Roll No: 12"
  division_canonical: string | null;    // "अ" / "ब" / …
  gr_no: string | null;                // "GR क्र. : 1023"
  test_type: string | null;             // per-block test type (from the block's own title row)
  academic_year: string | null;         // per-block academic year
  class_hint: string | null;            // per-block standard hint
  subjects: ParsedSubject[];
  warnings: string[];
};

export type ParsedFile = {
  test_type: string | null;      // e.g. "आठवडी परीक्षा"
  class_hint: string | null;     // e.g. "10 वी"
  academic_year: string | null;  // e.g. "2026-27"
  students: ParsedStudentBlock[];
  warnings: string[];
};

// ============================================================
// Header row detection: "10 वी आठवडी परीक्षा 2026-27"
// ============================================================
const YEAR_RE = /(\d{4})[\s\-–—\/]*(\d{2,4})/;

function parseHeaderTitle(raw: string): {
  test_type: string | null;
  class_hint: string | null;
  academic_year: string | null;
} {
  const s = String(raw || "").trim().replace(/\s+/g, " ");
  if (!s) return { test_type: null, class_hint: null, academic_year: null };

  let academic_year: string | null = null;
  const yr = s.match(YEAR_RE);
  if (yr) {
    const a = yr[1];
    const b = yr[2].length === 4 ? yr[2].slice(-2) : yr[2].padStart(2, "0");
    academic_year = `${a}-${b}`;
  }

  // Strip year off
  let rest = academic_year ? s.replace(YEAR_RE, "").trim() : s;

  // Try to peel class: leading tokens like "10 वी" / "9th" / "10th SSC"
  const classRe = /^([०-९0-9]{1,2}\s*(वी|th|rd|nd|st)?(?:\s*SSC)?)/i;
  let class_hint: string | null = null;
  const cm = rest.match(classRe);
  if (cm) {
    class_hint = cm[1].trim();
    rest = rest.slice(cm[0].length).trim();
  }

  const test_type = rest || null;
  return { test_type, class_hint, academic_year };
}

// ============================================================
// Student-name row detection: "विद्यार्थ्याचे नाव : Kalpak"
// ============================================================
const NAME_LABELS = [
  "विद्यार्थ्याचे नाव",
  "विद्यार्थ्याचे  नाव",
  "विद्यार्थ्यांचे नाव",
  "विद्यार्थ्याचें नाव",
  "student name",
  "name of student",
  "नाव",
  "name",
];

function stripNameLabel(raw: string): string | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  for (const lbl of NAME_LABELS) {
    if (lower.startsWith(lbl.toLowerCase())) {
      // trim label and separator (: or -)
      const rest = s
        .slice(lbl.length)
        .replace(/^[\s:\-–—]+/, "")
        .trim();
      if (rest) return rest;
    }
  }
  return null;
}

// ============================================================
// Column header detection: पेपर क्र | दिनांक | विषय | गुण | पैकी गुण | Grade
// ============================================================
type ColMap = {
  paper?: number;
  date?: number;
  subject?: number;
  obtained?: number;
  max?: number;
  grade?: number;
};

function detectColumns(row: unknown[]): ColMap | null {
  const map: ColMap = {};
  let hits = 0;
  row.forEach((cell, i) => {
    const t = String(cell || "").trim().toLowerCase();
    if (!t) return;
    if (t.includes("पेपर") || t.includes("paper")) { map.paper = i; hits++; }
    else if (t.includes("दिनांक") || t.includes("date") || t.includes("तारीख")) { map.date = i; hits++; }
    else if (t.includes("विषय") || t.includes("subject")) { map.subject = i; hits++; }
    else if (t.includes("पैकी")) { map.max = i; hits++; }   // "पैकी गुण"
    else if (t.includes("max") || t.includes("out of")) { map.max = i; hits++; }
    else if (t === "गुण" || t.includes("marks obtained") || t.includes("obtained")) { map.obtained = i; hits++; }
    else if (t.startsWith("गुण")) { map.obtained = i; hits++; }
    else if (t.includes("grade") || t.includes("श्रेणी")) { map.grade = i; hits++; }
  });
  // We need at least subject + max_marks to consider it a valid table header
  if (map.subject === undefined) return null;
  if (map.max === undefined && map.obtained === undefined) return null;
  return hits >= 3 ? map : null;
}

// ============================================================
// Cell helpers
// ============================================================
function toNumber(v: unknown): number | null {
  return readMark(v).value;
}

// Absent / not-applicable markers teachers type in a marks cell.
const ABSENT = /^(ab|abs|absent|a|-+|—|na|n\/a|गैरहजर|ग\.?\s*ह\.?|अनुपस्थित|गैर)$/i;

/**
 * A marks cell → number, tolerating real-world entry:
 *   २६ (Marathi digits) · 12½ · 12.5 · "26/40" (marks/max in one cell) ·
 *   AB / Absent / गैरहजर / "-" (absent → blank).
 * Anything else that isn't a number is reported, never silently guessed.
 */
export function readMark(v: unknown): { value: number | null; max?: number; absent?: boolean; unreadable?: string } {
  if (v == null || v === "") return { value: null };
  if (typeof v === "number") return { value: Number.isFinite(v) ? v : null };
  const raw = String(v).trim();
  if (!raw) return { value: null };
  if (ABSENT.test(raw)) return { value: null, absent: true };
  const s = toArabicDigits(raw).replace(/½/g, ".5").replace(/¼/g, ".25").replace(/¾/g, ".75").replace(/\s+/g, "");
  const frac = s.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);          // "26/40"
  if (frac) return { value: Number(frac[1]), max: Number(frac[2]) };
  const num = s.match(/^-?\d+(?:\.\d+)?/);
  if (num && /^-?\d+(?:\.\d+)?(marks?|गुण)?$/i.test(s)) return { value: Number(num[0]) };
  return { value: null, unreadable: raw };
}

// Dates go through the shared reader (no UTC shift, Indian day-first order).
export const toDateISO = toISODate;

function isBlankRow(row: unknown[]): boolean {
  return row.every((c) => c == null || String(c).trim() === "");
}

// ============================================================
// Parse a single sheet into rows-as-arrays
// ============================================================
type Grid = unknown[][];

function sheetToGrid(ws: XLSX.WorkSheet): Grid {
  return XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: true,
  }) as Grid;
}

// ============================================================
// Parse a single "block" of a student starting at row `start`
// A block = optional name row(s) + a column header + N subject rows.
// Returns the block and the row index AFTER the block.
// ============================================================
function parseStudentBlock(
  grid: Grid,
  start: number,
  fallbackTitle: ReturnType<typeof parseHeaderTitle>,
): { block: ParsedStudentBlock | null; next: number } {
  const warnings: string[] = [];

  // Find the student name (may sit before or on the column-header row)
  const cursor = start;
  let studentName: string | null = null;

  // scan up to 6 rows ahead looking for a name label OR a column-header row
  let headerRowIdx = -1;
  let colMap: ColMap | null = null;

  const scanLimit = Math.min(grid.length, start + 8);
  for (let i = cursor; i < scanLimit; i++) {
    const row = grid[i] ?? [];
    if (isBlankRow(row)) continue;

    // Try name row first
    for (const cell of row) {
      const nm = stripNameLabel(String(cell ?? ""));
      if (nm && !studentName) {
        studentName = nm;
        break;
      }
    }
    // If the cell WAS "विद्यार्थ्याचे नाव :" alone, the name is in a neighbouring cell:
    if (!studentName) {
      const labelIdx = row.findIndex((c) =>
        NAME_LABELS.some((l) => String(c || "").toLowerCase().trim().startsWith(l.toLowerCase())),
      );
      if (labelIdx >= 0) {
        // If the label cell itself doesn't include the name, look right on same row
        for (let j = labelIdx + 1; j < row.length; j++) {
          const v = String(row[j] ?? "").trim();
          if (v) { studentName = v; break; }
        }
      }
    }

    // Try column header
    const cm = detectColumns(row);
    if (cm) {
      headerRowIdx = i;
      colMap = cm;
      break;
    }
  }

  if (headerRowIdx < 0 || !colMap) {
    return { block: null, next: grid.length };
  }

  // If name still not found, scan a few rows before header (only if not already claimed by previous block)
  if (!studentName) {
    for (let i = Math.max(start, headerRowIdx - 4); i < headerRowIdx; i++) {
      const row = grid[i] ?? [];
      for (const cell of row) {
        const nm = stripNameLabel(String(cell ?? ""));
        if (nm) { studentName = nm; break; }
      }
      if (studentName) break;
    }
  }

  // Parse subject rows until a blank row or a new name-label / new header row
  const subjects: ParsedSubject[] = [];
  let i = headerRowIdx + 1;
  for (; i < grid.length; i++) {
    const row = grid[i] ?? [];
    if (isBlankRow(row)) { i++; break; }

    // Stop if this row is a new name-label or a new column header (next student block)
    const hasLabel = row.some((c) => stripNameLabel(String(c ?? "")) !== null || NAME_LABELS.some((l) => String(c || "").toLowerCase().trim().startsWith(l.toLowerCase())));
    if (hasLabel) break;
    if (detectColumns(row)) break;

    // Read cells by column index
    const subject = String(row[colMap.subject!] ?? "").trim();
    if (!subject) continue; // skip garbage rows without a subject

    const paper_no = colMap.paper !== undefined ? (toNumber(row[colMap.paper]) ?? null) : null;
    const date = colMap.date !== undefined ? toDateISO(row[colMap.date]) : null;
    const mark = colMap.obtained !== undefined ? readMark(row[colMap.obtained]) : { value: null };
    const obtained = mark.value;
    // "26/40" in the marks cell also gives the max when the max column is empty.
    const max = (colMap.max !== undefined ? toNumber(row[colMap.max]) : null) ?? mark.max ?? null;
    if (mark.unreadable) warnings.push(`${subject}: marks “${mark.unreadable}” isn't a number — left blank`);
    if (obtained != null && max != null && obtained > max) warnings.push(`${subject}: marks ${obtained} are more than the maximum ${max}`);
    if (obtained != null && obtained < 0) warnings.push(`${subject}: negative marks ${obtained}`);
    const gradeCell = colMap.grade !== undefined ? row[colMap.grade] : "";
    const grade = String(gradeCell ?? "").trim() || null;

    subjects.push({
      paper_no: paper_no != null ? Math.trunc(paper_no) : null,
      date,
      subject,
      marks_obtained: obtained,
      max_marks: max,
      grade,
    });
  }

  if (subjects.length === 0) {
    return { block: null, next: i };
  }

  if (!studentName) {
    warnings.push("Student name not found for this block");
  }

  // Scan every pre-header row for labelled fields AND a title row
  let rollNo: number | null = null;
  let divisionCanon: string | null = null;
  let grNo: string | null = null;
  let blockTitle = fallbackTitle;

  const preHeaderStart = Math.max(start, 0);
  for (let r = preHeaderStart; r < headerRowIdx; r++) {
    const row = grid[r] ?? [];
    // 1) title row detection: first non-empty cell that isn't a name/roll/div/gr label
    if (blockTitle === fallbackTitle) {
      const nonEmpty = row.find((c) => String(c ?? "").trim() !== "");
      if (nonEmpty != null) {
        const s = String(nonEmpty).trim();
        const kv = splitLabelValue(s);
        const isMetaLabel =
          !!kv &&
          (isRollLabel(kv.label) || isDivisionLabel(kv.label) ||
           isGRLabel(kv.label) || isStandardLabel(kv.label) ||
           NAME_LABELS.some((l) => kv.label.toLowerCase().startsWith(l.toLowerCase())));
        const isNameRow = stripNameLabel(s) !== null;
        if (!isMetaLabel && !isNameRow) {
          const parsed = parseHeaderTitle(s);
          if (parsed.test_type || parsed.academic_year || parsed.class_hint) {
            blockTitle = parsed;
          }
        }
      }
    }

    // 2) labelled fields
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const kv = splitLabelValue(cell);
      if (!kv) continue;
      const val = kv.value || (row[c + 1] != null ? String(row[c + 1]).trim() : "");
      if (!val) continue;
      if (rollNo == null && isRollLabel(kv.label)) {
        rollNo = parseNum(val);
      } else if (!divisionCanon && isDivisionLabel(kv.label)) {
        divisionCanon = normalizeDivision(val);
        if (!divisionCanon) warnings.push(`Unknown division "${val}"`);
      } else if (!grNo && isGRLabel(kv.label)) {
        grNo = val;
      } else if (isStandardLabel(kv.label)) {
        void normalizeStandard(val);
      }
    }
  }

  return {
    block: {
      raw_student_name: studentName ?? "",
      roll_no: rollNo,
      division_canonical: divisionCanon,
      gr_no: grNo,
      test_type: blockTitle.test_type,
      academic_year: blockTitle.academic_year,
      class_hint: blockTitle.class_hint,
      subjects,
      warnings,
    },
    next: i,
  };
}

// ============================================================
// Parse a single sheet — may contain 1..N student blocks stacked vertically
// ============================================================
function parseSheet(ws: XLSX.WorkSheet): {
  header: ReturnType<typeof parseHeaderTitle>;
  students: ParsedStudentBlock[];
} {
  const grid = sheetToGrid(ws);
  let header = { test_type: null, class_hint: null, academic_year: null } as ReturnType<typeof parseHeaderTitle>;

  // First non-empty row is the title
  let i = 0;
  for (; i < grid.length; i++) {
    if (!isBlankRow(grid[i])) {
      const cell = grid[i].find((c) => String(c ?? "").trim() !== "");
      header = parseHeaderTitle(String(cell ?? ""));
      i++;
      break;
    }
  }

  const students: ParsedStudentBlock[] = [];
  while (i < grid.length) {
    while (i < grid.length && isBlankRow(grid[i])) i++;
    if (i >= grid.length) break;
    const { block, next } = parseStudentBlock(grid, i, header);
    if (block) students.push(block);
    if (next <= i) i++; else i = next;
  }

  return { header, students };
}

// Sheet names we always skip (documentation / helper sheets)
const SKIP_SHEET_PATTERNS = [
  /^how\s*to\s*fill/i,
  /^notes?$/i,
  /^instructions?$/i,
  /^readme$/i,
  /^help$/i,
];

// ============================================================
// Top-level: parse an ArrayBuffer / Uint8Array to a ParsedFile
// ============================================================
export function parseResultsWorkbook(buf: ArrayBuffer | Uint8Array): ParsedFile {
  const wb = XLSX.read(buf, { cellDates: true, raw: true });   // raw: CSV text stays text (no UTC date guessing)

  const allStudents: ParsedStudentBlock[] = [];
  const warnings: string[] = [];
  let header: ReturnType<typeof parseHeaderTitle> = { test_type: null, class_hint: null, academic_year: null };

  for (const name of wb.SheetNames) {
    // Skip documentation sheets
    if (SKIP_SHEET_PATTERNS.some((re) => re.test(name.trim()))) continue;

    const ws = wb.Sheets[name];
    const { header: h, students } = parseSheet(ws);

    // Record the first non-empty header we see, purely for the file-level display default.
    if (header.test_type === null && header.class_hint === null && header.academic_year === null) {
      header = h;
    }

    // If a sheet has NO name row inside (multi-sheet-per-student mode),
    // use the sheet name as the student name.
    for (const s of students) {
      if (!s.raw_student_name && wb.SheetNames.length > 1) {
        s.raw_student_name = name.trim();
      }
      // Per-student problems go into the list the upload screen shows.
      for (const w of s.warnings) {
        warnings.push(`${s.raw_student_name || `Sheet “${name}”`}${s.roll_no != null ? ` (roll ${s.roll_no})` : ""}: ${w}`);
      }
    }

    allStudents.push(...students);
  }

  return {
    test_type: header.test_type,
    class_hint: header.class_hint,
    academic_year: header.academic_year,
    students: allStudents,
    warnings,
  };
}
