import * as XLSX from "xlsx";
import { normalizeDivision, normalizeGender, normalizeStandard, parseNum, toArabicDigits } from "@/lib/i18n/normalize";
import { toISODate } from "@/lib/excel/dates";

// Reads a class roster (Excel or CSV) into clean rows, with a clear reason
// for every row it can't use. Built for files as schools actually keep
// them: Marathi or English headers in any order, a title row above the
// table, Marathi digits, mobiles typed as numbers or with +91 / spaces,
// dates as Excel dates or 14/05/2010 / 14.05.2010, and blank lines.
//
// One division per file, or the whole school in one file: add Class and
// Division columns and every row says where it belongs.

export type StudentRow = {
  row: number;                 // spreadsheet row, for messages
  roll_no: number;
  student_name: string;
  parent_mobile: string;
  dob: string;                 // YYYY-MM-DD
  gender: "M" | "F" | "Other" | null;
  /** Whole-school files only: canonical class ("१० वी") and division ("अ"). */
  standard?: string;
  division?: string;
};

export type StudentImport = {
  rows: StudentRow[];
  errors: { row: number; message: string }[];
  warnings: string[];
  /** True when the file has Class + Division columns (rows carry standard/division). */
  wholeSchool: boolean;
};

type Field = "roll" | "name" | "mobile" | "dob" | "gender" | "standard" | "division";

const norm = (v: unknown) => toArabicDigits(String(v ?? "")).toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, " ").trim();

// First match wins; specific phrases before the general words they contain.
const RULES: [Field, RegExp][] = [
  ["dob", /\b(dob|date of birth|birth ?date)\b|जन्म/],
  ["mobile", /mobile|phone|contact|whatsapp|मोबा|संपर्क|फोन/],
  ["roll", /\broll|हजेरी/],
  ["gender", /\b(gender|sex)\b|लिंग/],
  ["division", /\b(div|division|section|sec)\b|तुकडी/],
  ["standard", /\b(class|std|standard|grade)\b|इयत्ता|वर्ग/],
  ["name", /\bname\b|student|नाव|विद्यार्थी/],
];

/** Which roster field a header cell names (also used by the marks-sheet reader). */
export function classify(h: unknown): Field | null {
  const s = norm(h);
  if (!s) return null;
  for (const [f, re] of RULES) {
    // "Father's name" / "पालकाचे नाव" is not the student's name.
    if (f === "name" && /father|mother|guardian|parent|वडील|वडिल|आई|पालक/.test(s)) return null;
    if (re.test(s)) return f;
  }
  return null;
}

/** Any way a mobile is typed → "+91XXXXXXXXXX" (or +<code>… for abroad), or null. */
export function normalizeMobile(v: unknown): string | null {
  const digits = toArabicDigits(String(v ?? "")).replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15 && String(v).trim().startsWith("+")) return `+${digits}`;
  return null;
}

export function parseStudentsWorkbook(buf: ArrayBuffer | Uint8Array): StudentImport {
  const wb = XLSX.read(buf, { cellDates: true, raw: true });   // raw: CSV text stays text (no UTC date guessing)
  const out: StudentImport = { rows: [], errors: [], warnings: [], wholeSchool: false };
  const sheetName = wb.SheetNames.find((n) => !/how to|notes?|instructions?|readme|help|सूचना/i.test(n)) ?? wb.SheetNames[0];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, defval: "", blankrows: true, raw: true });

  // Header = the first of the top rows that names a roll and a name column.
  let headerIdx = -1;
  let col: Partial<Record<Field, number>> = {};
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const map: Partial<Record<Field, number>> = {};
    (grid[i] ?? []).forEach((c, j) => { const f = classify(c); if (f && map[f] === undefined) map[f] = j; });
    if (map.roll !== undefined && map.name !== undefined) { headerIdx = i; col = map; break; }
  }
  if (headerIdx < 0) {
    out.errors.push({ row: 1, message: "Couldn't find the header row — it needs at least a Roll No and a Name column (e.g. roll_no, student_name)." });
    return out;
  }
  out.wholeSchool = col.standard !== undefined && col.division !== undefined;
  if (col.standard !== undefined && col.division === undefined) {
    out.warnings.push("There's a Class column but no Division column — add one to import the whole school; for now everything goes into the division you picked.");
  }
  for (const f of ["mobile", "dob"] as const) {
    if (col[f] === undefined) out.warnings.push(`No ${f === "mobile" ? "parent mobile" : "date of birth"} column found — every row will be missing it.`);
  }

  const seenRoll = new Map<string, number>();   // "class|division|roll" → row
  for (let i = headerIdx + 1; i < grid.length; i++) {
    const r = grid[i] ?? [];
    const get = (f: Field) => (col[f] !== undefined ? r[col[f]!] : "");
    const rowNo = i + 1;
    // Blank lines (including the template's empty rows) are skipped quietly.
    if ([get("roll"), get("name"), get("mobile"), get("dob")].every((c) => String(c ?? "").trim() === "")) continue;

    const problems: string[] = [];
    const rollN = parseNum(get("roll"));
    const roll = rollN != null && Number.isInteger(rollN) && rollN >= 1 && rollN <= 9999 ? rollN : null;
    if (roll == null) problems.push(String(get("roll")).trim() ? `roll no “${get("roll")}” isn't a whole number` : "roll no is empty");

    const name = String(get("name") ?? "").replace(/\s+/g, " ").trim();
    if (!name) problems.push("name is empty");
    else if (name.length > 200) problems.push("name is longer than 200 characters");

    const mobile = normalizeMobile(get("mobile"));
    if (!mobile) problems.push(String(get("mobile")).trim() ? `mobile “${get("mobile")}” isn't a 10-digit number` : "parent mobile is empty");

    const dob = toISODate(get("dob"));
    if (!dob) problems.push(String(get("dob")).trim() ? `date of birth “${String(get("dob"))}” isn't a date (use DD/MM/YYYY)` : "date of birth is empty");
    else if (dob > new Date().toISOString().slice(0, 10)) problems.push(`date of birth ${dob} is in the future`);

    let standard: string | undefined, division: string | undefined;
    if (out.wholeSchool) {
      const stdRaw = String(get("standard") ?? "").trim(), divRaw = String(get("division") ?? "").trim();
      standard = normalizeStandard(stdRaw) ?? undefined;
      division = normalizeDivision(divRaw) ?? undefined;
      if (!stdRaw) problems.push("class is empty");
      else if (!standard) problems.push(`class “${stdRaw}” isn't recognised (use 1–12, e.g. 10th or १० वी)`);
      if (!divRaw) problems.push("division is empty");
      else if (!division) problems.push(`division “${divRaw}” isn't recognised (use A–G or अ–ग)`);
    }

    const rollKey = `${standard ?? ""}|${division ?? ""}|${roll}`;
    if (roll != null && seenRoll.has(rollKey)) {
      problems.push(`roll no ${roll}${out.wholeSchool ? ` in ${standard} ${division}` : ""} is already used in row ${seenRoll.get(rollKey)}`);
    }

    if (problems.length) { out.errors.push({ row: rowNo, message: problems.join("; ") }); continue; }
    seenRoll.set(rollKey, rowNo);

    const age = new Date().getFullYear() - Number(dob!.slice(0, 4));
    if (age < 2 || age > 25) out.warnings.push(`Row ${rowNo} (${name}): date of birth ${dob} gives age ${age} — please double-check.`);

    const g = String(get("gender") ?? "").trim();
    out.rows.push({
      row: rowNo, roll_no: roll!, student_name: name, parent_mobile: mobile!, dob: dob!,
      gender: g ? normalizeGender(g) : null,
      ...(out.wholeSchool ? { standard, division } : {}),
    });
  }
  return out;
}
