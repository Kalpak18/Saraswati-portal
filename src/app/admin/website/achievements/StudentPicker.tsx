"use client";

import { useMemo } from "react";
import { Link2, Unlink, UserRound } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { matchInRoster } from "@/lib/match/rosterMatch";
import type { RosterStudent } from "./roster";

// Name field that suggests roster students as you type. Linking is
// optional: an achievement can belong to a former student or a group.
export function StudentPicker({
  roster, studentId, studentName, onChange,
}: {
  roster: RosterStudent[];
  studentId: string | null;
  studentName: string;
  onChange: (v: { student_id: string | null; student_name: string; standard_label?: string | null }) => void;
}) {
  const linked = studentId ? roster.find((r) => r.id === studentId) : undefined;

  const suggestions = useMemo(() => {
    if (linked || studentName.trim().length < 2) return [];
    const m = matchInRoster(studentName, roster);
    const ids = new Set(m.candidates.map((c) => c.id));
    return roster.filter((r) => ids.has(r.id)).slice(0, 4);
  }, [linked, studentName, roster]);

  return (
    <div className="space-y-2">
      <Input
        label="Student name"
        placeholder="Type to search the roster, or enter any name"
        value={studentName}
        onChange={(e) => onChange({ student_id: null, student_name: e.target.value })}
        leftAdornment={<UserRound className="h-4 w-4" />}
      />
      {linked ? (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800 ring-1 ring-brand-100">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 flex-none" />
            <span className="truncate">
              Linked to roster · {linked.standard_label ?? "—"} {linked.division_label ?? ""} · Roll {linked.roll_no}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onChange({ student_id: null, student_name: studentName })}
            className="inline-flex flex-none items-center gap-1 font-medium hover:underline"
          >
            <Unlink className="h-3.5 w-3.5" /> Unlink
          </button>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange({ student_id: s.id, student_name: s.name, standard_label: s.standard_label })}
              className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
            >
              {s.name} <span className="text-ink-400">· {s.standard_label ?? "—"} {s.division_label ?? ""}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
