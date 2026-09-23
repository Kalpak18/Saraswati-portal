import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { loadReportCard } from "@/lib/reportCard";
import { ReportCard } from "@/components/ReportCard";
import PrintButton from "@/components/PrintButton";

export default async function PrintAllPage(props: PageProps<"/admin/results/[examId]/print-all">) {
  const { examId } = await props.params;
  const supabase = await createSupabaseServer();

  const { data: exam } = await supabase
    .from("exams")
    .select("division_id")
    .eq("id", examId)
    .single();
  if (!exam) notFound();

  // Only students who have marks recorded for this exam
  const { data: markRows } = await supabase
    .from("marks")
    .select("student_id")
    .eq("exam_id", examId);
  const studentIds = Array.from(new Set((markRows ?? []).map((m) => m.student_id)));

  const cards = await Promise.all(
    studentIds.map((sid) => loadReportCard(supabase, examId, sid)),
  );

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-[720px] justify-end gap-2 px-2 pb-2 print:hidden">
        <PrintButton label={`Print / Save ${cards.length} cards`} />
      </div>
      {cards.map((c, i) =>
        c ? (
          <div key={i} className="mb-6 print:mb-0 print:break-after-page">
            <ReportCard data={c} />
          </div>
        ) : null,
      )}
    </div>
  );
}
