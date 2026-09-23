import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { loadReportCard } from "@/lib/reportCard";
import { ReportCard } from "@/components/ReportCard";
import PrintButton from "@/components/PrintButton";

export default async function ParentCardPage(
  props: PageProps<"/lookup/[examId]/[studentId]">,
) {
  const { examId, studentId } = await props.params;
  const admin = createSupabaseAdmin();
  const data = await loadReportCard(admin, examId, studentId);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-[720px] justify-between gap-2 px-2 pb-2 print:hidden">
        <Link href="/lookup" className="text-sm text-indigo-600 hover:underline">← Back</Link>
        <PrintButton />
      </div>
      <ReportCard data={data} />
    </div>
  );
}
