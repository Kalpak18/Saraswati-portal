"use client";

import * as XLSX from "xlsx";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

function download(wb: XLSX.WorkBook, name: string) {
  XLSX.writeFile(wb, name);
}

const BLANK_ROW_COUNT_ROSTER = 60;
const BLANK_PAPER_ROWS       = 20;
const BULK_STUDENT_BLOCKS    = 10;
const BULK_MULTI_SHEETS      = 10;

// ------------------------------------------------------------
// 1. Students roster
// ------------------------------------------------------------
function studentsRosterTemplate() {
  const rows: unknown[][] = [
    ["roll_no", "student_name", "parent_mobile", "dob", "gender"],
  ];
  for (let i = 0; i < BLANK_ROW_COUNT_ROSTER; i++) rows.push(["", "", "", "", ""]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 8 }, { wch: 32 }, { wch: 15 }, { wch: 12 }, { wch: 8 }];

  const notes = XLSX.utils.aoa_to_sheet([
    ["Students roster — how to fill"],
    [""],
    ["Column",         "Required?", "Notes"],
    ["roll_no",        "Required",  "Integer. Unique within a division."],
    ["student_name",   "Required",  "Marathi / English — both OK."],
    ["parent_mobile",  "Required",  "Text — preserves leading zeros / +91 codes."],
    ["dob",            "Required",  "YYYY-MM-DD or DD/MM/YYYY or Excel date cell."],
    ["gender",         "Optional",  "M / F / Other."],
    [""],
    ["Sample filled row:"],
    ["roll_no", "student_name", "parent_mobile", "dob", "gender"],
    [1, "कु. भालेराव साक्षी संदीप", "9876543210", "2010-05-14", "F"],
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
// 2. Result — single student
// ------------------------------------------------------------
function resultSingleTemplate() {
  const wb = XLSX.utils.book_new();
  const rows: unknown[][] = [
    ["10 वी आठवडी परीक्षा 2026-27"],
    ["विद्यार्थ्याचे नाव : "],
    ["हजेरी क्र. : "],
    ["तुकडी : "],
    ["पेपर क्र.", "दिनांक", "विषय", "गुण", "पैकी गुण"],
  ];
  for (let i = 1; i <= BLANK_PAPER_ROWS; i++) rows.push([i, "", "", "", ""]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 8 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, "Result");

  const notes = XLSX.utils.aoa_to_sheet([
    ["Result — single student — how to fill"],
    [""],
    ["Row 1", "Title format: <Standard> <Test type> <Academic year>. Change the words but keep the format."],
    ["Row 2", "विद्यार्थ्याचे नाव : <name> — type the student's name after the colon."],
    ["Row 3", "हजेरी क्र. : <roll no> — Roll No (Marathi/English digits both fine)."],
    ["Row 4", "तुकडी : <division> — Division (अ/A, ब/B, क/C, ड/D — either language)."],
    ["Row 5", "Column headers — leave as-is."],
    ["Row 6+", "One row per paper. Fill:"],
    ["",      "  • दिनांक — date of the paper (YYYY-MM-DD or Excel date)"],
    ["",      "  • विषय — subject name"],
    ["",      "  • गुण — marks obtained (leave blank if absent)"],
    ["",      "  • पैकी गुण — max marks for this paper"],
    [""],
    ["Sample filled row:"],
    ["पेपर क्र.", "दिनांक", "विषय", "गुण", "पैकी गुण"],
    [1, "2026-07-27", "Science 1", 26, 40],
  ]);
  notes["!cols"] = [{ wch: 10 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, notes, "How to fill");
  return wb;
}

// ------------------------------------------------------------
// 3. Result — bulk (stacked)
// ------------------------------------------------------------
function resultBulkStackedTemplate() {
  const wb = XLSX.utils.book_new();
  const rows: unknown[][] = [];

  for (let s = 0; s < BULK_STUDENT_BLOCKS; s++) {
    rows.push(["10 वी आठवडी परीक्षा 2026-27"]);
    rows.push(["विद्यार्थ्याचे नाव : "]);
    rows.push(["हजेरी क्र. : "]);
    rows.push(["तुकडी : "]);
    rows.push(["पेपर क्र.", "दिनांक", "विषय", "गुण", "पैकी गुण"]);
    for (let i = 1; i <= BLANK_PAPER_ROWS; i++) rows.push([i, "", "", "", ""]);
    rows.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 8 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, "Result-Bulk-Stacked");

  const notes = XLSX.utils.aoa_to_sheet([
    ["Result — bulk stacked — how to fill"],
    [""],
    [`This template gives you ${BULK_STUDENT_BLOCKS} empty student blocks in one sheet.`],
    ["Each block:"],
    ["  Row A: <Standard> <Test type> <Year>"],
    ["  Row B: विद्यार्थ्याचे नाव : <student name>"],
    ["  Row C: हजेरी क्र. : <roll no>"],
    ["  Row D: तुकडी : <division letter>"],
    ["  Row E: column headers"],
    ["  Row F+: paper rows, then a blank row separator"],
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
// 4. Result — bulk (multi-sheet)
// ------------------------------------------------------------
function resultBulkMultiSheetTemplate() {
  const wb = XLSX.utils.book_new();

  for (let s = 1; s <= BULK_MULTI_SHEETS; s++) {
    const rows: unknown[][] = [
      ["10 वी आठवडी परीक्षा 2026-27"],
      ["विद्यार्थ्याचे नाव : "],
      ["हजेरी क्र. : "],
      ["तुकडी : "],
      ["पेपर क्र.", "दिनांक", "विषय", "गुण", "पैकी गुण"],
    ];
    for (let i = 1; i <= BLANK_PAPER_ROWS; i++) rows.push([i, "", "", "", ""]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 8 }, { wch: 10 }];
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

// ------------------------------------------------------------
// UI
// ------------------------------------------------------------
const TEMPLATES = [
  {
    title: "Students roster",
    description: "Bulk-add students. Columns: roll_no, student_name, parent_mobile, dob, gender.",
    filename: "students-roster.xlsx",
    build: studentsRosterTemplate,
  },
  {
    title: "Result — single student",
    description: "Blank result template for one student. Use for weekly-test files.",
    filename: "result-single-student.xlsx",
    build: resultSingleTemplate,
  },
  {
    title: "Result — bulk (stacked)",
    description: "Multiple student blocks stacked vertically inside one sheet.",
    filename: "result-bulk-stacked.xlsx",
    build: resultBulkStackedTemplate,
  },
  {
    title: "Result — bulk (multi-sheet)",
    description: "One sheet per student — good for classes with many papers.",
    filename: "result-bulk-multisheet.xlsx",
    build: resultBulkMultiSheetTemplate,
  },
];

export default function TemplatesClient() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Templates"
        description="Download ready-to-fill Excel files for students and results."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <Card key={t.filename}>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-semibold text-ink-900">{t.title}</h3>
                <p className="mt-1 text-sm text-ink-600">{t.description}</p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => download(t.build(), t.filename)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
