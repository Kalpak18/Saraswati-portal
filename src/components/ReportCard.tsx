// Pure server component — no client JS needed.
// Renders in the same layout as the school's Excel: header + logo, exam title,
// student name, paper table (as-in-file), signature lines. Print-ready.

export type ReportCardData = {
  school: { name: string; address: string; logo_url: string | null };
  className: string;
  test_type: string;
  academic_year: string;
  exam_date: string | null;
  student: { roll_no: number; name: string; gr_no?: string | null };
  papers: {
    paper_no: number | null;
    paper_date: string | null;
    subject_name: string;
    marks_obtained: number | null;
    max_marks: number | null;
    grade: string | null;
  }[];
};

export function ReportCard({ data }: { data: ReportCardData }) {
  return (
    <div className="report-card mx-auto max-w-[720px] bg-white p-8 text-gray-900 print:p-6 print:max-w-none">
      <header className="mb-4 flex items-center gap-4 border-b border-gray-900 pb-3">
        {data.school.logo_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={data.school.logo_url} alt="" className="h-16 w-16 object-contain" />
        )}
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold">{data.school.name}</h1>
          {data.school.address && <div className="text-xs text-gray-600">{data.school.address}</div>}
        </div>
      </header>

      <h2 className="mb-3 text-center text-lg font-semibold">
        {data.className} {data.test_type} {data.academic_year}
      </h2>

      <div className="mb-3 flex flex-wrap justify-between text-sm">
        <div><b>विद्यार्थ्याचे नाव :</b> {data.student.name}</div>
        <div className="flex gap-4">
          <div><b>हजेरी क्र.:</b> {data.student.roll_no}</div>
          {data.student.gr_no && <div><b>GR No.:</b> {data.student.gr_no}</div>}
        </div>
      </div>

      <table className="w-full border-collapse border border-gray-900 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-900 px-2 py-1 text-left">पेपर क्र</th>
            <th className="border border-gray-900 px-2 py-1 text-left">दिनांक</th>
            <th className="border border-gray-900 px-2 py-1 text-left">विषय</th>
            <th className="border border-gray-900 px-2 py-1 text-right">गुण</th>
            <th className="border border-gray-900 px-2 py-1 text-right">पैकी गुण</th>
            <th className="border border-gray-900 px-2 py-1 text-center">Grade</th>
          </tr>
        </thead>
        <tbody>
          {data.papers.map((p, i) => (
            <tr key={i}>
              <td className="border border-gray-900 px-2 py-1">{p.paper_no ?? ""}</td>
              <td className="border border-gray-900 px-2 py-1">{p.paper_date ?? ""}</td>
              <td className="border border-gray-900 px-2 py-1">{p.subject_name}</td>
              <td className="border border-gray-900 px-2 py-1 text-right">{p.marks_obtained ?? ""}</td>
              <td className="border border-gray-900 px-2 py-1 text-right">{p.max_marks ?? ""}</td>
              <td className="border border-gray-900 px-2 py-1 text-center">{p.grade ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 grid grid-cols-3 gap-6 text-center text-xs text-gray-700">
        <div className="border-t border-gray-500 pt-1">वर्गशिक्षक</div>
        <div className="border-t border-gray-500 pt-1">मुख्याध्यापक</div>
        <div className="border-t border-gray-500 pt-1">पालक स्वाक्षरी</div>
      </div>
    </div>
  );
}
