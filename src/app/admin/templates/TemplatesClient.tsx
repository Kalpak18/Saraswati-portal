"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ============================================================
// All templates ship EMPTY: headers + blank rows ready to type into.
// A separate "How to fill" sheet inside each workbook explains every column
// and shows a filled sample.
// ============================================================

function saveWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename, { compression: true });
}

const BLANK_ROW_COUNT_ROSTER = 60;   // one class ≈ 30–60 students
const BLANK_PAPER_ROWS       = 20;   // enough for a full weekly/semester exam
const BULK_STUDENT_BLOCKS    = 10;   // 10 empty student blocks in bulk-stacked
const BULK_MULTI_SHEETS      = 10;   // 10 empty per-student sheets

// ------------------------------------------------------------
// 1. Students roster — bulk-add students to a division
// ------------------------------------------------------------
function studentsRosterTemplate() {
  const rows: unknown[][] = [
    ["gr_no", "roll_no", "student_name", "parent_mobile", "dob", "gender", "admission_date"],
  ];
  for (let i = 0; i < BLANK_ROW_COUNT_ROSTER; i++) rows.push(["", "", "", "", "", "", ""]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 12 }, { wch: 8 }, { wch: 32 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 15 },
  ];

  const notes = XLSX.utils.aoa_to_sheet([
    ["Students roster — how to fill"],
    [""],
    ["Column",         "Required?", "Notes"],
    ["gr_no",          "Optional",  "General-Register / admission number. Unique across school if provided."],
    ["roll_no",        "Required",  "Integer. Unique within a division."],
    ["student_name",   "Required",  "Marathi / English — both OK."],
    ["parent_mobile",  "Required",  "Text — preserves leading zeros / +91 codes."],
    ["dob",            "Required",  "YYYY-MM-DD or DD/MM/YYYY or Excel date cell."],
    ["gender",         "Optional",  "M / F / Other."],
    ["admission_date", "Optional",  "Same date formats as DOB."],
    [""],
    ["Sample filled row:"],
    ["gr_no", "roll_no", "student_name", "parent_mobile", "dob", "gender", "admission_date"],
    ["1023", 1, "कु. भालेराव साक्षी संदीप", "9876543210", "2010-05-14", "F", "2024-06-15"],
    [""],
    ["Behaviour:"],
    ["• Save the file, then upload at: Students → Import Excel (after picking a division)."],
    ["• Re-uploading is safe — rows upsert on (division, roll_no)."],
  ]);
  notes["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 70 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.utils.book_append_sheet(wb, notes, "How to fill");
  return wb;
}

// ------------------------------------------------------------
// 2. Result — single student (empty)
// ------------------------------------------------------------
function resultSingleTemplate() {
  const wb = XLSX.utils.book_new();
  const rows: unknown[][] = [
    ["10 वी आठवडी परीक्षा 2026-27"],       // ← edit: class + test type + year
    ["विद्यार्थ्याचे नाव : "],               // ← type student name after ":"
    ["हजेरी क्र. : "],                       // ← type Roll No after ":"
    ["तुकडी : "],                            // ← type Division letter after ":" (अ/A/…)
    ["GR क्र. : "],                          // ← optional: GR / admission no.
    ["पेपर क्र.", "दिनांक", "विषय", "गुण", "पैकी गुण", "Grade"],
  ];
  for (let i = 1; i <= BLANK_PAPER_ROWS; i++) rows.push([i, "", "", "", "", ""]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, ws, "Result");

  const notes = XLSX.utils.aoa_to_sheet([
    ["Result — single student — how to fill"],
    [""],
    ["Row 1", "Title format: <Standard> <Test type> <Academic year>. Change the words but keep the format."],
    ["Row 2", "विद्यार्थ्याचे नाव : <name> — type the student's name after the colon."],
    ["Row 3", "हजेरी क्र. : <roll no> — Roll No (Marathi/English digits both fine)."],
    ["Row 4", "तुकडी : <division> — Division (अ/A, ब/B, क/C, ड/D — either language)."],
    ["Row 5", "GR क्र. : <gr no> — OPTIONAL. Best identifier when available."],
    ["Row 6", "Column headers — leave as-is."],
    ["Row 7+", "One row per paper. Fill:"],
    ["",      "  • दिनांक — date of the paper (YYYY-MM-DD or Excel date)"],
    ["",      "  • विषय — subject name"],
    ["",      "  • गुण — marks obtained (leave blank if absent)"],
    ["",      "  • पैकी गुण — max marks for this paper"],
    ["",      "  • Grade — optional. Free text (A+, A, B+, %, etc.) — stored as typed."],
    [""],
    ["Extra rows in the template are placeholder blanks — delete the unused ones or leave them empty."],
    ["Only rows with a subject filled in are saved. Empty rows are ignored."],
    [""],
    ["Sample filled row:"],
    ["पेपर क्र.", "दिनांक", "विषय", "गुण", "पैकी गुण", "Grade"],
    [1, "2026-07-27", "Science 1", 26, 40, "B+"],
  ]);
  notes["!cols"] = [{ wch: 10 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, notes, "How to fill");
  return wb;
}

// ------------------------------------------------------------
// 3. Result — bulk (stacked): N empty student blocks in one sheet
// ------------------------------------------------------------
function resultBulkStackedTemplate() {
  const wb = XLSX.utils.book_new();
  const rows: unknown[][] = [];

  for (let s = 0; s < BULK_STUDENT_BLOCKS; s++) {
    rows.push(["10 वी आठवडी परीक्षा 2026-27"]);
    rows.push(["विद्यार्थ्याचे नाव : "]);
    rows.push(["हजेरी क्र. : "]);
    rows.push(["तुकडी : "]);
    rows.push(["GR क्र. : "]);
    rows.push(["पेपर क्र.", "दिनांक", "विषय", "गुण", "पैकी गुण", "Grade"]);
    for (let i = 1; i <= BLANK_PAPER_ROWS; i++) rows.push([i, "", "", "", "", ""]);
    rows.push([]); // blank separator
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, ws, "Result-Bulk-Stacked");

  const notes = XLSX.utils.aoa_to_sheet([
    ["Result — bulk stacked — how to fill"],
    [""],
    [`This template gives you ${BULK_STUDENT_BLOCKS} empty student blocks in one sheet.`],
    ["Each block:"],
    ["  Row A: <Standard> <Test type> <Year>"],
    ["  Row B: विद्यार्थ्याचे नाव : <student name>"],
    ["  Row C: हजेरी क्र. : <roll no>"],
    ["  Row D: तुकडी : <division letter> — allows one file to contain students from many divisions"],
    ["  Row E: GR क्र. : <gr no> — optional"],
    ["  Row F: column headers"],
    ["  Row G+: paper rows, then a blank row separator"],
    [""],
    ["Add more blocks by copying an existing one — the parser handles any number."],
    ["Names are matched to your class roster automatically. Any unmatched name can be:"],
    ["  • Manually mapped to an existing student, OR"],
    ["  • Created as a new student (inline form in the preview screen), OR"],
    ["  • Skipped."],
    [""],
    ["Blank rows and blocks with no filled paper rows are ignored."],
  ]);
  notes["!cols"] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, notes, "How to fill");
  return wb;
}

// ------------------------------------------------------------
// 4. Result — bulk (multi-sheet): one sheet per student
// ------------------------------------------------------------
function resultBulkMultiSheetTemplate() {
  const wb = XLSX.utils.book_new();

  for (let s = 1; s <= BULK_MULTI_SHEETS; s++) {
    const rows: unknown[][] = [
      ["10 वी आठवडी परीक्षा 2026-27"],
      ["विद्यार्थ्याचे नाव : "],
      ["हजेरी क्र. : "],
      ["तुकडी : "],
      ["GR क्र. : "],
      ["पेपर क्र.", "दिनांक", "विषय", "गुण", "पैकी गुण", "Grade"],
    ];
    for (let i = 1; i <= BLANK_PAPER_ROWS; i++) rows.push([i, "", "", "", "", ""]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 8 }];
    // Rename each sheet to the student's name once you fill it in.
    XLSX.utils.book_append_sheet(wb, ws, `Student ${s}`);
  }

  const notes = XLSX.utils.aoa_to_sheet([
    ["Result — bulk multi-sheet — how to fill"],
    [""],
    [`This template gives you ${BULK_MULTI_SHEETS} empty per-student sheets.`],
    [""],
    ["For each student sheet:"],
    ["  1. Rename the sheet tab to the student's name (right-click → Rename)."],
    ["  2. Fill Row 2: विद्यार्थ्याचे नाव : <name>  (name here takes precedence over sheet name)"],
    ["  3. Fill paper rows."],
    [""],
    ["If the sheet has no name row, the sheet-tab name is used as the student name."],
    ["Sheet names are limited to 31 characters by Excel."],
    ["Add / remove sheets freely — the parser reads all of them."],
  ]);
  notes["!cols"] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, notes, "How to fill");
  return wb;
}

// ============================================================
// UI
// ============================================================
const CARDS = [
  {
    title: "Students roster",
    desc: "Empty roster. Fill rows, then use it at Students → Import Excel.",
    filename: "Template-Students-Roster.xlsx",
    build: studentsRosterTemplate,
  },
  {
    title: "Result — single student",
    desc: "One file, one student, empty paper rows.",
    filename: "Template-Result-Single-Student.xlsx",
    build: resultSingleTemplate,
  },
  {
    title: "Result — bulk (stacked)",
    desc: `${BULK_STUDENT_BLOCKS} empty student blocks in one sheet. Copy blocks for more.`,
    filename: "Template-Result-Bulk-Stacked.xlsx",
    build: resultBulkStackedTemplate,
  },
  {
    title: "Result — bulk (multi-sheet)",
    desc: `${BULK_MULTI_SHEETS} empty per-student sheets. Rename tabs to student names.`,
    filename: "Template-Result-Bulk-MultiSheet.xlsx",
    build: resultBulkMultiSheetTemplate,
  },
];

export default function TemplatesClient() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Templates</h1>
        <p className="mt-1 text-sm text-gray-500">
          Download → open in Excel / LibreOffice → fill the rows → upload back into the app.
          Every template has a <b>How to fill</b> sheet inside.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CARDS.map((c) => (
          <div key={c.filename} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3">
              <div className="font-semibold text-gray-900">{c.title}</div>
              <div className="text-xs text-gray-500">{c.desc}</div>
            </div>
            <Button variant="secondary" onClick={() => saveWorkbook(c.build(), c.filename)}>
              <Download className="mr-1 h-4 w-4" /> Download
            </Button>
            <div className="mt-2 text-[10px] text-gray-400 break-all">{c.filename}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
