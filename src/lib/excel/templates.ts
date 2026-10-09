import * as XLSX from "xlsx";

// Ready-to-fill Excel templates offered on Admin → Templates. Kept apart
// from the page so tests can build each one and run it through the same
// importer the admin uses.

const BLANK_ROW_COUNT_ROSTER = 60;
const BLANK_PAPER_ROWS       = 20;
const BULK_STUDENT_BLOCKS    = 10;
const BULK_MULTI_SHEETS      = 10;

// ------------------------------------------------------------
// 1. Students roster
// ------------------------------------------------------------
export function studentsRosterTemplate() {
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
    ["parent_mobile",  "Required",  "10-digit mobile. +91, spaces or a leading 0 are fine."],
    ["dob",            "Required",  "DD/MM/YYYY (e.g. 14/05/2010), 14.05.2010, 2010-05-14 or an Excel date cell."],
    ["gender",         "Optional",  "M / F / Other."],
    [""],
    ["Sample filled row:"],
    ["roll_no", "student_name", "parent_mobile", "dob", "gender"],
    [1, "कु. भालेराव साक्षी संदीप", "9876543210", "2010-05-14", "F"],
    [""],
    ["Behaviour:"],
    ["• Save the file, then upload at: Students → Import Excel (after picking a division)."],
    ["• Re-uploading is safe — a roll number already in the division is updated, new ones are added."],
    ["• Headers may also be in Marathi (हजेरी क्र., नाव, पालक मोबाईल, जन्मतारीख, लिंग) and in any order."],
    ["• You will see every problem row before anything is saved."],
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
export function resultSingleTemplate() {
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
export function resultBulkStackedTemplate() {
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
export function resultBulkMultiSheetTemplate() {
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
// 5. Competitive exam results (Olympiad, NMMS, scholarship…)
// ------------------------------------------------------------
export function competitiveResultsTemplate() {
  const rows: unknown[][] = [
    ["MTS Olympiad 2026-27 — State Level Merit List"],
    [],
    ["Sr No", "Student Name", "Class", "Division", "Roll No", "Marks", "Out of", "Rank", "Award", "Level"],
  ];
  for (let i = 1; i <= 40; i++) rows.push([i, "", "", "", "", "", "", "", "", ""]);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 7 }, { wch: 7 }, { wch: 6 }, { wch: 22 }, { wch: 10 }];

  const notes = XLSX.utils.aoa_to_sheet([
    ["Competitive exam results — how to fill"],
    [""],
    ["Row 1", "Title: exam name, year and (optionally) “State Level” etc. It fills the exam / year / level for every row."],
    ["Row 3", "Column headers. Only Student Name is required; keep any others you have, in any order."],
    [""],
    ["Student Name", "As on the merit list. Matched to your roster automatically; you confirm unclear ones."],
    ["Class / Division / Roll No", "Optional, but makes matching exact (10th, १० वी, Std 10 all work)."],
    ["Marks / Out of", "e.g. 57 and 60. “57/60” in the Marks column also works."],
    ["Rank", "1, 1st, I, प्रथम… all work."],
    ["Award", "e.g. Gold medal, Scholarship, Qualified. Gold / Silver / Bronze show a medal on the website."],
    ["Level", "School / Taluka / District / State / National / International (Marathi words work too)."],
    [""],
    ["Upload at: Website → Achievements → Import results. Organisers' own merit-list files usually work as they are."],
  ]);
  notes["!cols"] = [{ wch: 26 }, { wch: 100 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  XLSX.utils.book_append_sheet(wb, notes, "How to fill");
  return wb;
}

export const TEMPLATES = [
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
  {
    title: "Competitive exam results",
    description: "Olympiad, NMMS, scholarship or sports merit list — import at Website → Achievements.",
    filename: "competitive-exam-results.xlsx",
    build: competitiveResultsTemplate,
  },
];
