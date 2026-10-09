import type { Branding } from "@/lib/branding";
import { SchoolLetterhead } from "./SchoolLetterhead";

// Pure server component — no client JS needed.
// Renders in the same layout as the school's Excel: header + logo, exam title,
// student name, paper table (as-in-file). Print-ready.

export type ReportCardData = {
  school: { name: string; name_mr: string; address: string; logo_url: string | null };
  /** Letterhead lines and layout from Settings → School identity. */
  branding: Branding;
  className: string;
  test_type: string;
  academic_year: string;
  exam_date: string | null;
  student: { roll_no: number; name: string };
  papers: {
    paper_no: number | null;
    paper_date: string | null;
    subject_name: string;
    marks_obtained: number | null;
    max_marks: number | null;
  }[];
};

export function ReportCard({ data }: { data: ReportCardData }) {
  return (
    <div className="report-card mx-auto max-w-180 bg-white p-4 text-ink-900 shadow-sm sm:p-6 sm:shadow print:max-w-none print:p-6 print:shadow-none">
      {/* School letterhead (Settings → School identity) */}
      <SchoolLetterhead school={data.school} branding={data.branding} />

      {/* Exam title */}
      <h2 className="mb-3 text-center font-display text-sm font-semibold sm:text-lg">
        {data.className} {data.test_type} {data.academic_year}
      </h2>

      {/* Student meta */}
      <div className="mb-3 flex flex-col gap-1 text-xs sm:flex-row sm:flex-wrap sm:justify-between sm:text-sm">
        <div>
          <b>विद्यार्थ्याचे नाव :</b> {data.student.name}
        </div>
        <div>
          <b>हजेरी क्र.:</b> <span className="tabular-nums">{data.student.roll_no}</span>
        </div>
      </div>

      {/* Paper table — horizontally scrolled on mobile, full width on print/laptop */}
      <div className="-mx-4 overflow-x-auto sm:mx-0 print:mx-0 print:overflow-visible">
        <table className="w-full min-w-[420px] border-collapse border border-ink-900 text-xs sm:text-sm">
          <thead>
            <tr className="bg-ink-100">
              <th className="border border-ink-900 px-2 py-1 text-left">पेपर क्र</th>
              <th className="border border-ink-900 px-2 py-1 text-left">दिनांक</th>
              <th className="border border-ink-900 px-2 py-1 text-left">विषय</th>
              <th className="border border-ink-900 px-2 py-1 text-right">गुण</th>
              <th className="border border-ink-900 px-2 py-1 text-right">पैकी गुण</th>
            </tr>
          </thead>
          <tbody>
            {data.papers.map((p, i) => (
              <tr key={i}>
                <td className="border border-ink-900 px-2 py-1 tabular-nums">{p.paper_no ?? ""}</td>
                <td className="border border-ink-900 px-2 py-1 tabular-nums">{p.paper_date ?? ""}</td>
                <td className="border border-ink-900 px-2 py-1">{p.subject_name}</td>
                <td className="border border-ink-900 px-2 py-1 text-right tabular-nums">{p.marks_obtained ?? ""}</td>
                <td className="border border-ink-900 px-2 py-1 text-right tabular-nums">{p.max_marks ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
