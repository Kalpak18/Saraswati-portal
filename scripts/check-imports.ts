/**
 * Import checks: every Excel template, filled the way a school really fills
 * it, run through the same parser the admin upload uses.
 *
 *   npm run check:imports        (runs in India's time zone on purpose)
 *
 * Exits non-zero on any failure, so it can gate a deploy.
 */
import * as XLSX from "xlsx";
import {
  studentsRosterTemplate, resultSingleTemplate, resultBulkStackedTemplate,
  resultBulkMultiSheetTemplate, competitiveResultsTemplate,
  schoolRosterTemplate, classMarksSheetTemplate,
} from "../src/lib/excel/templates";
import { parseStudentsWorkbook } from "../src/lib/excel/parseStudents";
import { parseResultsWorkbook, readMark } from "../src/lib/excel/parseResults";
import { parseAchievementsWorkbook } from "../src/lib/excel/parseAchievements";
import { toISODate } from "../src/lib/excel/dates";

let failed = 0, passed = 0;
function eq(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed++; return; }
  failed++;
  console.log(`✗ ${label}\n    expected ${e}\n    actual   ${a}`);
}
function ok(label: string, cond: boolean, detail?: unknown) {
  if (cond) { passed++; return; }
  failed++;
  console.log(`✗ ${label}${detail !== undefined ? `\n    ${JSON.stringify(detail)}` : ""}`);
}

/** Write rows into a template sheet (as Excel would save it) and read it back. */
function fill(wb: XLSX.WorkBook, sheet: string, origin: string, rows: unknown[][]): ArrayBuffer {
  XLSX.utils.sheet_add_aoa(wb.Sheets[sheet], rows, { origin, cellDates: true });
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
const local = (y: number, m: number, d: number) => new Date(y, m - 1, d);   // what Excel stores for a date cell

// ------------------------------------------------------------------ dates
console.log("• dates");
eq("excel date cell", toISODate(local(2010, 5, 14)), "2010-05-14");
eq("dd/mm/yyyy", toISODate("14/05/2010"), "2010-05-14");
eq("dd-mm-yyyy", toISODate("14-05-2010"), "2010-05-14");
eq("dd.mm.yyyy", toISODate("14.05.2010"), "2010-05-14");
eq("d/m/yy", toISODate("4/5/10"), "2010-05-04");
eq("iso", toISODate("2010-05-14"), "2010-05-14");
eq("marathi digits", toISODate("१४/०५/२०१०"), "2010-05-14");
eq("14 May 2010", toISODate("14 May 2010"), "2010-05-14");
eq("May 14, 2010", toISODate("May 14, 2010"), "2010-05-14");
eq("31/02 rejected", toISODate("31/02/2010"), null);
eq("13th month rejected", toISODate("14/13/2010"), null);
eq("text rejected", toISODate("abc"), null);
eq("excel serial", toISODate(40312), "2010-05-14");

// ------------------------------------------------------------------ marks
console.log("• marks");
eq("number", readMark(26).value, 26);
eq("marathi digits", readMark("२६").value, 26);
eq("half", readMark("12½").value, 12.5);
eq("decimal", readMark("12.5").value, 12.5);
eq("26/40", readMark("26/40"), { value: 26, max: 40 });
eq("AB absent", readMark("AB"), { value: null, absent: true });
eq("गैरहजर absent", readMark("गैरहजर"), { value: null, absent: true });
eq("dash absent", readMark("-"), { value: null, absent: true });
eq("unreadable flagged", readMark("Pass"), { value: null, unreadable: "Pass" });

// ------------------------------------------------------------------ roster template
console.log("• students roster template");
{
  const buf = fill(studentsRosterTemplate(), "Students", "A2", [
    [1, "कु. भालेराव साक्षी संदीप", 9876543210, local(2010, 5, 14), "F"],        // number mobile, date cell
    [2, "  Rahul   More ", "+91 98220 14571", "14/05/2011", "Male"],               // spaces, written date
    ["३", "ओम काळे", "09822014572", "१५.०६.२०११", "पुरुष"],                      // Marathi digits everywhere
    [4, "Short Mobile", "12345", "01/01/2011", ""],                                // bad mobile → error
    [2, "Duplicate Roll", "9822014573", "01/01/2011", ""],                         // duplicate roll → error
    [5, "Bad Date", "9822014574", "31/02/2011", ""],                               // impossible date → error
    [],                                                                            // blank row → ignored
    [6, "Future Child", "9822014575", "01/01/2099", ""],                           // future → error
  ]);
  const r = parseStudentsWorkbook(buf);
  eq("valid rows", r.rows.map((x) => x.roll_no), [1, 2, 3]);
  eq("row 1", r.rows[0], { row: 2, roll_no: 1, student_name: "कु. भालेराव साक्षी संदीप", parent_mobile: "+919876543210", dob: "2010-05-14", gender: "F" });
  eq("row 2 cleaned", [r.rows[1].student_name, r.rows[1].parent_mobile, r.rows[1].dob, r.rows[1].gender], ["Rahul More", "+919822014571", "2011-05-14", "M"]);
  eq("row 3 marathi", [r.rows[2].roll_no, r.rows[2].parent_mobile, r.rows[2].dob, r.rows[2].gender], [3, "+919822014572", "2011-06-15", "M"]);
  eq("error rows", r.errors.map((e) => e.row), [5, 6, 7, 9]);
  ok("mobile error says why", /isn't a 10-digit number/.test(r.errors[0].message), r.errors[0]);
  ok("duplicate roll explained", /already used in row 3/.test(r.errors[1].message), r.errors[1]);
  ok("template's 60 blank rows ignored", r.errors.length === 4);
}
{ // a school's own sheet: title row, Marathi headers, extra columns, father's name first
  const ws = XLSX.utils.aoa_to_sheet([
    ["सरस्वती विद्यालय — इयत्ता ८ वी अ"],
    ["अ.क्र.", "वडिलांचे नाव", "विद्यार्थ्याचे नाव", "हजेरी क्र.", "जन्मतारीख", "पालक मोबाईल", "लिंग"],
    [1, "Sandeep Bhalerao", "Sakshi Bhalerao", 7, "05/09/2012", "9876500001", "मुलगी"],
  ]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const r = parseStudentsWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
  eq("marathi headers + father's name ignored", r.rows[0], { row: 3, roll_no: 7, student_name: "Sakshi Bhalerao", parent_mobile: "+919876500001", dob: "2012-09-05", gender: "F" });
}
{ // CSV export
  const csv = "Roll No,Name,Mobile No,DOB\n1,Asha Patil,98765 43210,2012-01-02\n";
  const r = parseStudentsWorkbook(new TextEncoder().encode(csv));
  eq("csv", r.rows[0], { row: 2, roll_no: 1, student_name: "Asha Patil", parent_mobile: "+919876543210", dob: "2012-01-02", gender: null });
}

// ------------------------------------------------------------------ single result template
console.log("• result — single student template");
{
  const wb = resultSingleTemplate();
  XLSX.utils.sheet_add_aoa(wb.Sheets.Result, [
    ["विद्यार्थ्याचे नाव : कु. भालेराव साक्षी"],
    ["हजेरी क्र. : १२"],
    ["तुकडी : B"],
  ], { origin: "A2" });
  const buf = fill(wb, "Result", "B6", [
    [local(2026, 7, 27), "Marathi", "२६", 40],
    ["28/07/2026", "Science 1", "AB", 40],
    ["", "English", "12½", 20],
    ["", "Maths", "26/40", ""],
    ["", "History", "Pass", 20],
    ["", "Geography", 45, 40],
  ]);
  const f = parseResultsWorkbook(buf);
  const st = f.students[0];
  eq("title", [f.test_type, f.class_hint, f.academic_year], ["आठवडी परीक्षा", "10 वी", "2026-27"]);
  eq("student", [st.raw_student_name, st.roll_no, st.division_canonical], ["कु. भालेराव साक्षी", 12, "ब"]);
  eq("subjects", st.subjects.map((s) => s.subject), ["Marathi", "Science 1", "English", "Maths", "History", "Geography"]);
  eq("marks", st.subjects.map((s) => s.marks_obtained), [26, null, 12.5, 26, null, 45]);
  eq("max", st.subjects.map((s) => s.max_marks), [40, 40, 20, 40, 20, 40]);
  eq("paper dates (no timezone shift)", st.subjects.slice(0, 2).map((s) => s.date), ["2026-07-27", "2026-07-28"]);
  eq("paper numbers kept", st.subjects.map((s) => s.paper_no), [1, 2, 3, 4, 5, 6]);
  ok("unreadable marks reported", f.warnings.some((w) => /History.*“Pass”/.test(w)), f.warnings);
  ok("marks over max reported", f.warnings.some((w) => /Geography.*45.*40/.test(w)), f.warnings);
  ok("only 6 paper rows (template's empty numbered rows ignored)", st.subjects.length === 6);
}

// ------------------------------------------------------------------ stacked template
console.log("• result — bulk stacked template");
{
  const wb = resultBulkStackedTemplate();
  const ws = wb.Sheets["Result-Bulk-Stacked"];
  const block = 26; // 5 header rows + 20 papers + 1 blank
  const kids = [["Asha Patil", "1", "A"], ["Rahul More", "2", "अ"], ["Om Kale", "३", "a"]];
  kids.forEach(([name, roll, div], k) => {
    const top = k * block;
    XLSX.utils.sheet_add_aoa(ws, [[`विद्यार्थ्याचे नाव : ${name}`], [`हजेरी क्र. : ${roll}`], [`तुकडी : ${div}`]], { origin: `A${top + 2}` });
    XLSX.utils.sheet_add_aoa(ws, [["", "Marathi", 30 + k, 40], ["", "Hindi", 20 + k, 40]], { origin: `B${top + 6}` });
  });
  const f = parseResultsWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
  eq("students found", f.students.map((s) => s.raw_student_name), ["Asha Patil", "Rahul More", "Om Kale"]);
  eq("rolls", f.students.map((s) => s.roll_no), [1, 2, 3]);
  eq("divisions (A / अ / a all = अ)", f.students.map((s) => s.division_canonical), ["अ", "अ", "अ"]);
  eq("each has its own 2 papers", f.students.map((s) => s.subjects.map((x) => x.marks_obtained)), [[30, 20], [31, 21], [32, 22]]);
  ok("the 7 empty blocks are ignored", f.students.length === 3);
}

// ------------------------------------------------------------------ multi-sheet template
console.log("• result — bulk multi-sheet template");
{
  const wb = resultBulkMultiSheetTemplate();
  // Sheet 1: name row filled. Sheet 2: renamed tab, name row left empty.
  XLSX.utils.sheet_add_aoa(wb.Sheets["Student 1"], [["विद्यार्थ्याचे नाव : Asha Patil"], ["हजेरी क्र. : 1"]], { origin: "A2" });
  XLSX.utils.sheet_add_aoa(wb.Sheets["Student 1"], [["", "Marathi", 35, 40]], { origin: "B6" });
  wb.SheetNames[1] = "Rahul More"; wb.Sheets["Rahul More"] = wb.Sheets["Student 2"]; delete wb.Sheets["Student 2"];
  XLSX.utils.sheet_add_aoa(wb.Sheets["Rahul More"], [["", "Marathi", 28, 40]], { origin: "B6" });
  const f = parseResultsWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
  eq("names (row, then sheet tab)", f.students.map((s) => s.raw_student_name), ["Asha Patil", "Rahul More"]);
  eq("marks", f.students.map((s) => s.subjects[0].marks_obtained), [35, 28]);
  ok("blank sheets + 'How to fill' ignored", f.students.length === 2);
}

// ------------------------------------------------------------------ competitive template
console.log("• competitive exam results template");
{
  const buf = fill(competitiveResultsTemplate(), "Results", "B4", [
    ["Sakshi Bhalerao", "8th", "B", 12, 57, 60, 1, "Gold medal", "State"],
    ["Om Kale", "८ वी", "", "", "52/60", "", "द्वितीय", "Silver", "जिल्हा"],
    ["Riya Patil", "9", "A", 3, "AB", 60, "", "", ""],
  ]);
  const f = parseAchievementsWorkbook(buf);
  eq("file exam / year / level", [f.exam_name, f.academic_year, f.level], ["MTS Olympiad", "2026-27", "state"]);
  eq("names", f.rows.map((r) => r.student_name), ["Sakshi Bhalerao", "Om Kale", "Riya Patil"]);
  eq("class", f.rows.map((r) => r.standard), ["८ वी", "८ वी", "९ वी"]);
  eq("rank", f.rows.map((r) => r.rank), [1, 2, null]);
  eq("score / max", f.rows.map((r) => [r.score, r.max_score]), [[57, 60], [52, 60], [null, 60]]);
  eq("percentage", f.rows.map((r) => r.percentage), [95, 86.7, null]);
  eq("medal", f.rows.map((r) => r.medal), ["gold", "silver", null]);
  eq("level per row", f.rows.map((r) => r.level), ["state", "district", "state"]);
  ok("serial-number column not taken as rank", f.rows[2].rank === null);
  ok("the 37 empty template rows ignored", f.rows.length === 3);
}

// ------------------------------------------------------------------ whole-school roster
console.log("• whole-school roster template");
{
  const buf = fill(schoolRosterTemplate(), "Students", "A2", [
    ["1st", "A", 1, "Asha Patil", "9876543210", "14/05/2019", "F"],
    ["१० वी", "ब", 1, "Om Kale", "9822014571", "05/09/2011", "M"],
    ["10th", "B", 2, "Riya More", "9822014572", "06/09/2011", ""],
    ["Std 4", "अ", 1, "Same roll other class", "9822014573", "01/01/2016", ""],
    ["10", "b", 2, "Duplicate in 10 B", "9822014574", "01/01/2011", ""],
    ["13th", "A", 1, "Bad class", "9822014575", "01/01/2011", ""],
    ["5th", "Z", 1, "Bad division", "9822014576", "01/01/2015", ""],
  ]);
  const r = parseStudentsWorkbook(buf);
  ok("detected as whole school", r.wholeSchool);
  eq("class + division per row", r.rows.map((x) => `${x.standard} ${x.division} ${x.roll_no}`), ["१ ली अ 1", "१० वी ब 1", "१० वी ब 2", "४ थी अ 1"]);
  eq("errors", r.errors.map((e) => e.row), [6, 7, 8]);
  ok("duplicate is per class+division", /roll no 2 in १० वी ब is already used in row 4/.test(r.errors[0].message), r.errors[0]);
  ok("bad class explained", /class “13th” isn't recognised/.test(r.errors[1].message), r.errors[1]);
  ok("bad division explained", /division “Z” isn't recognised/.test(r.errors[2].message), r.errors[2]);
  ok("500 blank rows ignored", r.rows.length + r.errors.length === 7);
}
{
  const r = parseStudentsWorkbook(XLSX.write(studentsRosterTemplate(), { type: "array", bookType: "xlsx" }));
  ok("single-division roster is not whole-school", !r.wholeSchool);
}

// ------------------------------------------------------------------ class marks sheet
console.log("• class marks sheet template");
{
  const wb = classMarksSheetTemplate({ title: "10 वी प्रथम सत्र परीक्षा 2026-27", subjects: ["Marathi", "Hindi", "English", "Science 1"] });
  XLSX.utils.sheet_add_aoa(wb.Sheets.Marks, [["परीक्षा दिनांक / Exam date :", "05/10/2026"]], { origin: "A2" });
  XLSX.utils.sheet_add_aoa(wb.Sheets.Marks, [["पैकी गुण / Out of", "", "", 100, 100, 80, 40]], { origin: "A4" });
  XLSX.utils.sheet_add_aoa(wb.Sheets.Marks, [["दिनांक / Paper date", "", "", "", local(2026, 10, 7), "", ""]], { origin: "A5" });
  const buf = fill(wb, "Marks", "A6", [
    ["अ", 1, "Asha Patil", 78, "६५", "72½", 38],
    ["A", 2, "Rahul More", "AB", 55, 60, "41"],
    ["ब", "१", "Om Kale", "", "", "", ""],
    ["B", 3, "", 50, 50, 50, 20],
    ["Z", 4, "Bad Div", 10, 10, 10, 10],
  ]);
  const f = parseResultsWorkbook(buf);
  eq("title", [f.test_type, f.class_hint, f.academic_year], ["प्रथम सत्र परीक्षा", "10 वी", "2026-27"]);
  eq("students", f.students.map((s) => `${s.division_canonical} ${s.roll_no} ${s.raw_student_name}`), ["अ 1 Asha Patil", "अ 2 Rahul More", "ब 1 Om Kale", "null 4 Bad Div"]);
  eq("subjects (Science 1 stays a name)", f.students[0].subjects.map((x) => x.subject), ["Marathi", "Hindi", "English", "Science 1"]);
  eq("marks", f.students.slice(0, 2).map((s) => s.subjects.map((x) => x.marks_obtained)), [[78, 65, 72.5, 38], [null, 55, 60, 41]]);
  eq("max from Out of row", f.students[0].subjects.map((x) => x.max_marks), [100, 100, 80, 40]);
  eq("dates: exam date, paper date overrides", f.students[0].subjects.map((x) => x.date), ["2026-10-05", "2026-10-07", "2026-10-05", "2026-10-05"]);
  ok("over-max flagged", f.warnings.some((w) => /Rahul More.*Science 1: 41 is more than 40/.test(w)), f.warnings);
  ok("marks without name flagged", f.warnings.some((w) => /Row 9: marks without a student name/.test(w)), f.warnings);
  ok("bad division flagged", f.warnings.some((w) => /division “Z” isn't recognised/.test(w)), f.warnings);
  ok("100 blank rows ignored", f.students.length === 4);
}
{ // pre-filled from the roster (what "Download marks sheet" gives)
  const wb = classMarksSheetTemplate({ title: "५ वी परीक्षा 2026-27", students: [{ division: "अ", roll_no: 1, name: "Asha" }, { division: "ब", roll_no: 1, name: "Om" }] });
  const f = parseResultsWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
  eq("prefilled sheet round-trips", f.students.map((s) => `${s.division_canonical} ${s.roll_no} ${s.raw_student_name}`), ["अ 1 Asha", "ब 1 Om"]);
  ok("no exam date → asked on next screen", f.warnings.some((w) => /No exam date/.test(w)), f.warnings);
}
{ // a school's own register: Sr No / Total / % / Result columns, max in headings, one tab per division
  const tab = (rows: unknown[][]) => XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, tab([
    ["Saraswati Vidyalaya — 8th Unit Test 1 2026-27"],
    ["Sr No", "Roll No", "Name of Student", "Marathi (25)", "Maths/25", "Total", "%", "Result"],
    [1, 1, "Kiran Jadhav", 20, 22, 42, 84, "Pass"],
    [2, 2, "Neha Shinde", "ab", 18, 18, 36, "Fail"],
    ["", "", "Total", "", "", "", "", ""],
  ]), "A");
  XLSX.utils.book_append_sheet(wb, tab([
    ["Saraswati Vidyalaya — 8th Unit Test 1 2026-27"],
    ["Sr No", "Roll No", "Name of Student", "Marathi (25)", "Maths/25", "Total", "%", "Result"],
    [1, 1, "Sahil Patil", 15, 25, 40, 80, "Pass"],
  ]), "B");
  const f = parseResultsWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
  eq("division from tab name", f.students.map((s) => `${s.division_canonical} ${s.roll_no} ${s.raw_student_name}`), ["अ 1 Kiran Jadhav", "अ 2 Neha Shinde", "ब 1 Sahil Patil"]);
  eq("only real subjects, max from heading", f.students[0].subjects.map((x) => `${x.subject}/${x.max_marks}`), ["Marathi/25", "Maths/25"]);
  eq("absent", f.students[1].subjects[0].marks_obtained, null);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
