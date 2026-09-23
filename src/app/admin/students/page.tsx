import { createSupabaseServer } from "@/lib/supabase/server";
import StudentsClient from "./StudentsClient";

export default async function StudentsPage(props: PageProps<"/admin/students">) {
  const sp = await props.searchParams;
  const divisionParam = typeof sp.division === "string" ? sp.division : "";

  const supabase = await createSupabaseServer();

  const [{ data: standards }, { data: divisions }] = await Promise.all([
    supabase.from("standards")
      .select("id, name, academic_year, display_order")
      .order("academic_year", { ascending: false })
      .order("display_order", { ascending: true }),
    supabase.from("divisions")
      .select("id, standard_id, name, is_active, display_order")
      .order("display_order", { ascending: true }),
  ]);

  const divs = (divisions ?? []).filter((d) => d.is_active);
  const selectedDivisionId = divisionParam || divs[0]?.id || "";

  const { data: students } = selectedDivisionId
    ? await supabase
        .from("students")
        .select("id, gr_no, roll_no, student_name, parent_mobile, dob, gender, admission_date, is_active")
        .eq("division_id", selectedDivisionId)
        .order("roll_no", { ascending: true })
    : { data: [] };

  return (
    <StudentsClient
      standards={standards ?? []}
      divisions={divs}
      selectedDivisionId={selectedDivisionId}
      students={students ?? []}
    />
  );
}
