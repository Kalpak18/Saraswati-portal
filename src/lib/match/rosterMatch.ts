import { matchStudent, type MatchResult } from "@/lib/match/nameMatch";

// Roster entry shape shared by the achievements importer and editor.
export type RosterEntry = {
  id: string;
  name: string;
  roll_no: number;
  standard: string | null;   // canonical
  division: string | null;   // canonical
};

// Match a name from an external result sheet against the whole school.
// When the sheet says which standard the student is in, only that
// standard is searched first — two "Riya Patil"s in 6th and 9th are then
// not a coin toss. Falls back to the whole school if nothing there fits.
export function matchInRoster<T extends RosterEntry>(
  name: string,
  roster: T[],
  hint: { standard?: string | null; division?: string | null; roll_no?: number | null } = {},
): MatchResult & { pool: T[] } {
  let pool = roster;
  if (hint.standard) {
    const same = roster.filter((r) => r.standard === hint.standard);
    if (same.length > 0) pool = same;
  }

  // Roll number + division inside a known standard is exact.
  if (hint.standard && hint.division && hint.roll_no != null) {
    const exact = pool.find((r) => r.division === hint.division && r.roll_no === hint.roll_no);
    if (exact) {
      const m = matchStudent(name, [exact]);
      // Only trust the roll if the name is at least plausibly the same child.
      if (m.score >= 0.6) {
        return { status: "matched", student_id: exact.id, score: m.score, candidates: [exact], pool };
      }
    }
  }

  const res = matchStudent(name, pool);
  if (res.status === "unmatched" && pool !== roster) {
    const wide = matchStudent(name, roster);
    // A match in another standard always needs a human look.
    if (wide.score > res.score) {
      return { ...wide, status: wide.status === "matched" ? "review" : wide.status, pool: roster };
    }
  }
  return { ...res, pool };
}
