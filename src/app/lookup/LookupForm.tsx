"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Home, Search, Users } from "lucide-react";
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
        {/* Soft ambient background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent-100/50 blur-3xl" />
        </div>

        {/* Home link */}
        <Link
          href="/"
          className="group absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-700 shadow-sm ring-1 ring-ink-200 backdrop-blur transition-all hover:bg-white hover:text-brand-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:left-6 sm:top-6"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">मुख्यपृष्ठ · Home</span>
          <span className="sm:hidden">Home</span>
        </Link>

        <div className="w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-xl ring-1 ring-ink-100 backdrop-blur transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            {school.logo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={school.logo_url}
                alt=""
                className="h-16 w-16 rounded object-contain drop-shadow-sm transition-transform hover:scale-105"
              />
            )}
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
              {school.name || "Saraswati Portal"}
            </h1>
            <p className="inline-flex items-center gap-1.5 text-sm text-ink-500">
              <Search className="h-3.5 w-3.5" />
              परिणाम पहा · View Result
            </p>
          </div>

          <form onSubmit={onSearch} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink-700">पालकाचा मोबाईल · Parent mobile</span>
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
              <span className="font-medium text-ink-700">विद्यार्थ्याची जन्मतारीख · Student&apos;s date of birth</span>
              <DobPicker value={dob} onChange={setDob} disabled={pending} />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="group transition-transform active:scale-[0.98]"
            >
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  शोधत आहे…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
                  परिणाम पहा · View Result
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] text-ink-400">
            प्रश्न असल्यास शाळेशी संपर्क साधा · Contact the school if you need help
          </p>
        </div>
      </div>
    );
  }

  // ── Screen 2 — pick a child ────────────────────────────────────────────
  if (step === "children") {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent-100/50 blur-3xl" />
        </div>

        <Link
          href="/"
          className="group absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-700 shadow-sm ring-1 ring-ink-200 backdrop-blur transition-all hover:bg-white hover:text-brand-700 hover:shadow-md sm:left-6 sm:top-6"
        >
          <Home className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">मुख्यपृष्ठ · Home</span>
          <span className="sm:hidden">Home</span>
        </Link>

        <div className="w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-xl ring-1 ring-ink-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-ink-900">पाल्य निवडा · Select child</h1>
              <p className="mt-1 text-sm text-ink-500">
                या मोबाईल नंबरवर <b className="text-ink-700">{students.length}</b> विद्यार्थी आढळले
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {students.map((s, i) => (
              <li
                key={s.id}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
              >
                <button
                  onClick={() => pick(s)}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 transition-colors group-hover:bg-brand-100">
                      {s.student_name.trim().charAt(0)}
                    </span>
                    <span className="truncate font-medium text-ink-900">{s.student_name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-ink-500">
                    <span>{s.class_name} · हजेरी {s.roll_no}</span>
                    <span aria-hidden className="text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500">›</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={reset}
            className="mt-5 inline-flex items-center gap-1 text-sm text-brand-700 transition-colors hover:text-brand-900 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            नवीन शोध · New search
          </button>
        </div>
      </div>
    );
  }

  // ── Screen 3 — student details + results ───────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-b from-brand-50/40 via-white to-white px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="group inline-flex min-w-0 items-center gap-2 rounded-full bg-white/80 px-2.5 py-1.5 shadow-sm ring-1 ring-ink-200 backdrop-blur transition-all hover:bg-white hover:shadow-md"
          >
            <Home className="h-4 w-4 shrink-0 text-ink-500 transition-colors group-hover:text-brand-700" />
            {school.logo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={school.logo_url} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
            )}
            <span className="truncate text-sm font-medium text-ink-700 group-hover:text-brand-800">
              {school.name || "Saraswati Portal"}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            {students.length > 1 && (
              <button
                onClick={() => setStep("children")}
                className="text-sm text-brand-700 transition-colors hover:text-brand-900 hover:underline"
              >
                पाल्य बदला
              </button>
            )}
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 text-sm text-brand-700 transition-colors hover:text-brand-900 hover:underline"
            >
              <Search className="h-3.5 w-3.5" />
              नवीन शोध
            </button>
          </div>
        </div>

        {/* Student details */}
        <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-ink-100 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white shadow-sm">
              {picked?.student_name.trim().charAt(0) ?? ""}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                {picked?.student_name}
              </h1>
              <p className="mt-0.5 text-xs text-ink-500">
                {picked?.class_name}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <div className="rounded-lg bg-brand-50/50 p-2.5 ring-1 ring-brand-100/60">
              <dt className="text-[11px] text-ink-500">वर्ग · Standard</dt>
              <dd className="mt-0.5 text-sm font-medium text-ink-900">{picked?.standard_name || "—"}</dd>
            </div>
            <div className="rounded-lg bg-brand-50/50 p-2.5 ring-1 ring-brand-100/60">
              <dt className="text-[11px] text-ink-500">तुकडी · Division</dt>
              <dd className="mt-0.5 text-sm font-medium text-ink-900">{picked?.division_name || "—"}</dd>
            </div>
            <div className="rounded-lg bg-brand-50/50 p-2.5 ring-1 ring-brand-100/60">
              <dt className="text-[11px] text-ink-500">हजेरी क्र. · Roll no.</dt>
              <dd className="mt-0.5 text-sm font-medium text-ink-900 tabular-nums">{picked?.roll_no}</dd>
            </div>
            <div className="rounded-lg bg-brand-50/50 p-2.5 ring-1 ring-brand-100/60">
              <dt className="text-[11px] text-ink-500">शैक्षणिक वर्ष · Year</dt>
              <dd className="mt-0.5 text-sm font-medium text-ink-900">{picked?.academic_year || "—"}</dd>
            </div>
          </dl>
        </div>

        {/* Results */}
        <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-500">
          निकाल · Results {exams && exams.length > 0 && <span className="font-normal">({exams.length})</span>}
        </h2>

        {!exams ? (
          <div className="rounded-xl bg-white p-6 text-sm text-ink-500 shadow-sm">
            निकाल लोड होत आहेत…
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-ink-900">अद्याप निकाल उपलब्ध नाही</p>
            <p className="mt-1 text-sm text-ink-500">No results have been uploaded for this student yet.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {exams.map((e, i) => (
              <li
                key={e.id}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
              >
                <Link
                  href={`/lookup/${e.id}/${picked!.id}`}
                  className="group flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink-900 group-hover:text-brand-800">
                      {e.test_type}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-500">
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
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset tabular-nums ${percentTone(e.percent)}`}
                        >
                          {e.percent}%
                        </div>
                        <div className="mt-0.5 text-xs text-ink-500 tabular-nums">
                          {e.obtained} / {e.total}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-400">श्रेणी</span>
                    )}
                    <span
                      aria-hidden
                      className="text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500"
                    >
                      ›
                    </span>
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
