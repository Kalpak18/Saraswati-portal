import * as XLSX from "xlsx";
import { toArabicDigits } from "@/lib/i18n/normalize";

// One date reader for every Excel / CSV import.
//
// Why not `date.toISOString()`: SheetJS turns an Excel date cell into a
// JS Date at *local* midnight. toISOString() converts to UTC, and India is
// UTC+5:30 — so 14 May became 13 May. A wrong date of birth means a parent
// typing the right one is told "no result found". We read the local
// calendar parts instead, and never go through UTC.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  जानेवारी: 1, फेब्रुवारी: 2, मार्च: 3, एप्रिल: 4, मे: 5, जून: 6, जुलै: 7, ऑगस्ट: 8, सप्टेंबर: 9, ऑक्टोबर: 10, नोव्हेंबर: 11, डिसेंबर: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

/** A real calendar date (rejects 31/02, month 13…). */
function valid(y: number, m: number, d: number): string | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

const fullYear = (y: number) => (y < 100 ? (y > 50 ? 1900 + y : 2000 + y) : y);

/**
 * Any date an Excel cell or CSV can hold → "YYYY-MM-DD", or null.
 * Written dates are read day-first (Indian style: 14/05/2010), unless the
 * year comes first (2010-05-14).
 */
export function toISODate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    // SheetJS can hand back 23:59:59.999 of the day before (float rounding),
    // so snap to the nearest minute first.
    const t = new Date(Math.round(v.getTime() / 60000) * 60000);
    return valid(t.getFullYear(), t.getMonth() + 1, t.getDate());   // local parts — no UTC shift
  }
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);                           // Excel serial number
    return d ? valid(d.y, d.m, d.d) : null;
  }
  const s = toArabicDigits(String(v)).trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;

  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);                  // 2010-05-14
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2}|\d{4})\b/);            // 14/05/2010, 14.05.10
  if (m) return valid(fullYear(+m[3]), +m[2], +m[1]);
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?[ -]?([a-zऀ-ॿ]+)[ ,-]*(\d{2}|\d{4})$/);  // 14 May 2010
  if (m) {
    const mo = MONTHS[m[2]] ?? MONTHS[m[2].slice(0, 3)];
    if (mo) return valid(fullYear(+m[3]), mo, +m[1]);
  }
  m = s.match(/^([a-z]+)[ -](\d{1,2}),? (\d{4})$/);                         // May 14, 2010
  if (m && MONTHS[m[1].slice(0, 3)]) return valid(+m[3], MONTHS[m[1].slice(0, 3)], +m[2]);
  return null;
}
