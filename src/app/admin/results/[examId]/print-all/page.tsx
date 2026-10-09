import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { loadReportCards } from "@/lib/reportCard";
import { ReportCard } from "@/components/ReportCard";
import PrintButton from "@/components/PrintButton";

export default async function PrintAllPage(props: PageProps<"/admin/results/[examId]/print-all">) {
  const { examId } = await props.params;
  const supabase = await createSupabaseServer();

  // Every card in the division from 4 queries (not 4 per student).
  const cards = await loadReportCards(supabase, examId);
  if (cards.length === 0) {
    const { data: exam } = await supabase.from("exams").select("id").eq("id", examId).maybeSingle();
    if (!exam) notFound();
  }

  return (
    <div className="min-h-screen bg-ink-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-[720px] justify-end gap-2 px-2 pb-2 print:hidden">
        <PrintButton label={`Print / Save ${cards.length} cards`} />
      </div>
      {cards.map((c, i) => (
        <div key={i} className="mb-6 print:mb-0 print:break-after-page">
          <ReportCard data={c} />
        </div>
      ))}
    </div>
  );
}
