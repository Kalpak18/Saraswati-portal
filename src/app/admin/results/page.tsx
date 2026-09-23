import Link from "next/link";
import { Upload } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

export default async function ResultsPage() {
  const supabase = await createSupabaseServer();
  const { data: exams } = await supabase
    .from("exams")
    .select("id, test_type, academic_year, exam_start_date, exam_end_date, division_id, divisions(name, standards(name))")
    .order("exam_start_date", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Results / Report cards</h1>
        <Link href="/admin/results/upload">
          <Button><Upload className="mr-1 h-4 w-4" /> Upload new result</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Test type</th>
              <th className="px-4 py-3">Academic year</th>
              <th className="px-4 py-3">Exam dates</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(!exams || exams.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                No exams uploaded yet. Click <b>Upload new result</b> to start.
              </td></tr>
            )}
            {exams?.map((e) => {
              const div = e.divisions as unknown as { name: string; standards: { name: string } | null } | null;
              const label = div ? `${div.standards?.name ?? ""} — ${div.name}`.trim() : "";
              return (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{label}</td>
                  <td className="px-4 py-3 text-gray-700">{e.test_type}</td>
                  <td className="px-4 py-3 text-gray-700">{e.academic_year}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {e.exam_start_date === e.exam_end_date
                      ? e.exam_start_date
                      : `${e.exam_start_date} → ${e.exam_end_date}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/results/${e.id}`} className="text-indigo-600 hover:underline">
                      View report cards →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
