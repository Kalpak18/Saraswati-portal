"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DobPicker } from "@/components/ui/DobPicker";
import { CountryCodeSelect } from "@/components/ui/CountryCodeSelect";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countries";
import {
  findStudents,
  listExamsForStudent,
  type LookupExam,
  type LookupStudent,
} from "./actions";

type School = { name: string | null; logo_url: string | null };
type Step = "identify" | "children" | "student";

// Survives the round-trip to a report card and back, so "← Back" does not
// dump the parent on an empty form again.
const SS_KEY = "saraswati:lookup";

type Saved = {
  mobile: string;
  countryIso?: string;
  dob: string;
  students: LookupStudent[];
  picked: LookupStudent | null;
  exams: LookupExam[] | null;
  step: Step;
};

// sessionStorage is browser-only. useSyncExternalStore hands back the server
// snapshot (null) during SSR and hydration, then the real value — so the
// restore never causes a hydration mismatch, and never needs an effect.
const subscribeNever = () => () => {};
const readSaved = () => {
  try {
    return sessionStorage.getItem(SS_KEY);
  } catch {
    return null; // private mode / storage blocked
  }
};

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function examDates(e: LookupExam) {
  const start = fmtDate(e.exam_start_date ?? e.exam_date);
  const end = fmtDate(e.exam_end_date);
  if (!start) return "";
  return end && end !== start ? `${start} – ${end}` : start;
}

function percentTone(p: number) {
  if (p >= 60) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  if (p >= 35) return "bg-amber-50 text-amber-700 ring-amber-600/20";
  return "bg-red-50 text-red-700 ring-red-600/20";
}

export default function LookupForm({ school }: { school: School }) {
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [dob, setDob] = useState("");
  const [students, setStudents] = useState<LookupStudent[]>([]);
  const [picked, setPicked] = useState<LookupStudent | null>(null);
  const [exams, setExams] = useState<LookupExam[] | null>(null);
  const [step, setStep] = useState<Step>("identify");
  const [pending, startTransition] = useTransition();

  // Restore a previous lookup (e.g. after viewing a report card), once.
  const savedRaw = useSyncExternalStore(subscribeNever, readSaved, () => null);
  const [restored, setRestored] = useState(false);
  if (!restored && savedRaw && step === "identify") {
    setRestored(true);
    try {
      const s = JSON.parse(savedRaw) as Saved;
      if (s?.step && s.step !== "identify") {
        setMobile(s.mobile ?? "");
        setCountry(COUNTRIES.find((c) => c.iso === s.countryIso) ?? DEFAULT_COUNTRY);
        setDob(s.dob ?? "");
        setStudents(s.students ?? []);
        setPicked(s.picked ?? null);
        setExams(s.exams ?? null);
        setStep(s.step);
      }
    } catch {
      /* corrupt entry — start fresh */
    }
  }

  useEffect(() => {
    try {
      if (step === "identify") sessionStorage.removeItem(SS_KEY);
      else sessionStorage.setItem(SS_KEY, JSON.stringify({ mobile, countryIso: country.iso, dob, students, picked, exams, step }));
    } catch {
      /* non-fatal */
    }
  }, [mobile, country, dob, students, picked, exams, step]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const digits = mobile.replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 15) {
      toast.error("पूर्ण मोबाईल नंबर टाका · Enter the full mobile number");
      return;
    }
    if (!dob) {
      toast.error("जन्मतारीख निवडा · Select the date of birth");
      return;
    }
    startTransition(async () => {
      try {
        const res = await findStudents({ mobile: digits, dob });
        setStudents(res);
        setPicked(null);
        setExams(null);
        if (res.length === 0) {
          toast.error("या माहितीसाठी विद्यार्थी सापडला नाही · No student found for these details");
          return;
        }
        if (res.length === 1) {
          pick(res[0]);
          return;
        }
        setStep("children");
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  function pick(s: LookupStudent) {
    setPicked(s);
    setExams(null);
    setStep("student");
    startTransition(async () => {
      try {
        setExams(await listExamsForStudent(s.id));
      } catch (err) {
        toast.error((err as Error).message);
        setExams([]);
      }
    });
  }

  function reset() {
    setStudents([]);
    setPicked(null);
    setExams(null);
    setDob("");
    setMobile("");
    setCountry(DEFAULT_COUNTRY);
    setRestored(true);
    setStep("identify");
  }

  // ── Screen 1 — identify ────────────────────────────────────────────────
  if (step === "identify") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            {school.logo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={school.logo_url} alt="" className="h-16 w-16 rounded object-contain" />
            )}
            <h1 className="text-xl font-semibold text-gray-900">{school.name || "Saraswati Portal"}</h1>
            <p className="text-sm text-gray-500">परिणाम पहा · View Result</p>
          </div>

          <form onSubmit={onSearch} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-gray-700">पालकाचा मोबाईल · Parent mobile</span>
              <div className="flex items-stretch gap-2">
                <CountryCodeSelect value={country} onChange={setCountry} disabled={pending} />
                <Input
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={15}
                  placeholder="9822014571"
                  className="flex-1"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-gray-700">विद्यार्थ्याची जन्मतारीख · Student&apos;s date of birth</span>
              <DobPicker value={dob} onChange={setDob} disabled={pending} />
            </div>

            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "शोधत आहे…" : "परिणाम पहा · View Result"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ── Screen 2 — pick a child ────────────────────────────────────────────
  if (step === "children") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-gray-900">पाल्य निवडा · Select child</h1>
            <p className="mt-1 text-sm text-gray-500">
              या मोबाईल नंबरवर {students.length} विद्यार्थी आढळले
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {students.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => pick(s)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  <span className="font-medium text-gray-900">{s.student_name}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {s.class_name} · हजेरी क्र. {s.roll_no}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button onClick={reset} className="mt-5 text-sm text-indigo-600 hover:underline">
            ← नवीन शोध · New search
          </button>
        </div>
      </div>
    );
  }

  // ── Screen 3 — student details + results ───────────────────────────────
  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {school.logo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={school.logo_url} alt="" className="h-8 w-8 shrink-0 rounded object-contain" />
            )}
            <span className="truncate text-sm font-medium text-gray-700">
              {school.name || "Saraswati Portal"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {students.length > 1 && (
              <button onClick={() => setStep("children")} className="text-sm text-indigo-600 hover:underline">
                पाल्य बदला
              </button>
            )}
            <button onClick={reset} className="text-sm text-indigo-600 hover:underline">
              नवीन शोध
            </button>
          </div>
        </div>

        {/* Student details */}
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {picked?.student_name}
          </h1>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-gray-500">वर्ग · Standard</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">{picked?.standard_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">तुकडी · Division</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">{picked?.division_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">हजेरी क्र. · Roll no.</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">{picked?.roll_no}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">शैक्षणिक वर्ष · Year</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">{picked?.academic_year || "—"}</dd>
            </div>
            {picked?.gr_no && (
              <div>
                <dt className="text-xs text-gray-500">जी.आर. क्र. · GR no.</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">{picked.gr_no}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Results */}
        <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
          निकाल · Results {exams && exams.length > 0 && <span className="font-normal">({exams.length})</span>}
        </h2>

        {!exams ? (
          <div className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm">
            निकाल लोड होत आहेत…
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-900">अद्याप निकाल उपलब्ध नाही</p>
            <p className="mt-1 text-sm text-gray-500">No results have been uploaded for this student yet.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {exams.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/lookup/${e.id}/${picked!.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-transparent transition-all hover:shadow-md hover:ring-indigo-200"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-900">{e.test_type}</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {examDates(e)}
                      {examDates(e) && " · "}
                      {e.academic_year}
                      {e.subject_count > 0 && ` · ${e.subject_count} पेपर`}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {e.percent != null ? (
                      <div className="text-right">
                        <div
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${percentTone(e.percent)}`}
                        >
                          {e.percent}%
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {e.obtained} / {e.total}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">श्रेणी</span>
                    )}
                    <span aria-hidden className="text-gray-300">›</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
