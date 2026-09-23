import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { loadReportCard } from "@/lib/reportCard";
import { ReportCard } from "@/components/ReportCard";
import PrintButton from "@/components/PrintButton";

export default async function StudentCardPage(
  props: PageProps<"/admin/results/[examId]/[studentId]">,
) {
  const { examId, studentId } = await props.params;
  const supabase = await createSupabaseServer();
  const data = await loadReportCard(supabase, examId, studentId);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-[720px] justify-end gap-2 px-2 pb-2 print:hidden">
        <PrintButton />
      </div>
      <ReportCard data={data} />
    </div>
  );
}
