"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { findStudents, listExamsForStudent } from "./actions";

type Student = {
  id: string; roll_no: number; student_name: string;
  class_name: string; academic_year: string;
};
type Exam = { id: string; test_type: string; academic_year: string; exam_date: string | null; exam_start_date?: string | null; exam_end_date?: string | null };

export default function LookupForm() {
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [students, setStudents] = useState<Student[] | null>(null);
  const [picked, setPicked] = useState<Student | null>(null);
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await findStudents({ mobile, dob });
        setStudents(res);
        setPicked(null); setExams(null);
        if (res.length === 0) toast.error("No student found for these details");
        else if (res.length === 1) await pick(res[0]);
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  async function pick(s: Student) {
    setPicked(s);
    startTransition(async () => {
      try {
        const list = await listExamsForStudent(s.id);
        setExams(list);
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSearch} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">पालकाचा मोबाईल · Parent mobile</span>
          <Input required value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">जन्मतारीख · Date of birth</span>
          <Input required type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </label>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "…" : "परिणाम पहा / View Result"}
        </Button>
      </form>

      {students && students.length > 1 && !picked && (
        <div>
          <div className="mb-2 text-sm font-medium text-gray-700">Select child:</div>
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
            {students.map((s) => (
              <li key={s.id}>
                <button onClick={() => pick(s)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50">
                  <span>{s.student_name}</span>
                  <span className="text-xs text-gray-500">{s.class_name} · #{s.roll_no}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {picked && (
        <div>
          <div className="mb-2 text-sm">
            <b>{picked.student_name}</b> — {picked.class_name} ({picked.academic_year})
          </div>
          {!exams ? (
            <div className="text-sm text-gray-500">Loading exams…</div>
          ) : exams.length === 0 ? (
            <div className="text-sm text-gray-500">No results uploaded yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
              {exams.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/lookup/${e.id}/${picked.id}`}
                    className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span>
                      {e.test_type}
                      {e.exam_start_date && (
                        <span className="ml-2 text-xs text-gray-500">
                          {e.exam_start_date}{e.exam_end_date && e.exam_end_date !== e.exam_start_date && <> → {e.exam_end_date}</>}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">{e.academic_year}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
