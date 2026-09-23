"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateStudentMarks } from "../../../actions";

type Row = {
  subject_id: string;
  subject_name: string;
  paper_no: number | null;
  paper_date: string | null;
  max_marks: number | null;
  marks_obtained: number | null;
  grade: string | null;
};

export default function EditMarksForm({ examId, studentId, rows }: {
  examId: string; studentId: string; rows: Row[];
}) {
  const router = useRouter();
  const [state, setState] = useState<Row[]>(rows);
  const [pending, startTransition] = useTransition();

  async function onSave() {
    startTransition(async () => {
      try {
        await updateStudentMarks({
          exam_id: examId,
          student_id: studentId,
          entries: state.map((r) => ({
            subject_id: r.subject_id,
            marks_obtained: r.marks_obtained,
            grade: r.grade,
          })),
        });
        toast.success("Saved");
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="py-1 pr-3">#</th>
            <th className="py-1 pr-3">Date</th>
            <th className="py-1 pr-3">Subject</th>
            <th className="py-1 pr-3 text-right">Max</th>
            <th className="py-1 pr-3">Marks</th>
            <th className="py-1 pr-3">Grade</th>
          </tr>
        </thead>
        <tbody>
          {state.map((r, i) => (
            <tr key={r.subject_id} className="border-t border-gray-100">
              <td className="py-1 pr-3 text-gray-600">{r.paper_no ?? "-"}</td>
              <td className="py-1 pr-3 text-gray-600">{r.paper_date ?? "-"}</td>
              <td className="py-1 pr-3 font-medium text-gray-900">{r.subject_name}</td>
              <td className="py-1 pr-3 text-right text-gray-500">{r.max_marks ?? "-"}</td>
              <td className="py-1 pr-3">
                <Input
                  type="number" step="any"
                  className="h-8 w-24"
                  value={r.marks_obtained ?? ""}
                  onChange={(e) => {
                    const list = [...state];
                    list[i] = { ...r, marks_obtained: e.target.value === "" ? null : Number(e.target.value) };
                    setState(list);
                  }} />
              </td>
              <td className="py-1 pr-3">
                <Input
                  className="h-8 w-20"
                  value={r.grade ?? ""}
                  onChange={(e) => {
                    const list = [...state];
                    list[i] = { ...r, grade: e.target.value || null };
                    setState(list);
                  }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-end">
        <Button onClick={onSave} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </div>
  );
}
