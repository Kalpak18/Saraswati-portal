"use client";

import { clientAction } from "@/lib/clientAction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Eye, EyeOff, RefreshCw, Sparkles, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { generateToppers as generateToppersAction, clearToppers as clearToppersAction, updateTopper as updateTopperAction } from "./actions";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const generateToppers = clientAction(generateToppersAction);
const clearToppers = clientAction(clearToppersAction);
const updateTopper = clientAction(updateTopperAction);

type Topper = {
  id: string;
  exam_id: string;
  rank: number;
  student_name: string | null;
  percentage: number | null;
  total: number | null;
  max_total: number | null;
  is_featured: boolean;
  photo_url: string | null;
  note: string | null;
};

export type ExamGroup = {
  key: string;
  standard: string;
  standard_order: number;
  test_type: string;
  academic_year: string;
  exam_start_date: string;
  exam_ids: string[];
  divisions: string[];
  toppers: Topper[];
};

export default function ToppersClient({ groups }: { groups: ExamGroup[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [topN, setTopN] = useState<Record<string, number>>({});
  const [year, setYear] = useState("");
  const [confirmClear, setConfirmClear] = useState<ExamGroup | null>(null);

  const years = useMemo(() => Array.from(new Set(groups.map((g) => g.academic_year))).sort().reverse(), [groups]);
  const activeYear = year || years[0] || "";
  const visible = groups
    .filter((g) => !activeYear || g.academic_year === activeYear)
    .sort((a, b) => a.standard_order - b.standard_order || b.exam_start_date.localeCompare(a.exam_start_date));

  function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusyKey(key);
    startTransition(async () => {
      try {
        await fn();
        toast.success(ok);
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setBusyKey(null);
      }
    });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumbs={[{ label: "Website", href: "/admin/website" }, { label: "Toppers" }]}
        title="Toppers"
        description="Rank students from uploaded marks and choose who appears on the website."
        actions={
          <>
            {years.length > 1 && (
              <div className="w-36">
                <Select value={activeYear} onChange={(e) => setYear(e.target.value)} aria-label="Academic year">
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
            )}
            <Link href="/academics/toppers" target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 text-sm text-ink-700 shadow-sm hover:bg-ink-50">
              <ExternalLink className="h-4 w-4" /> View live
            </Link>
          </>
        }
      />

      {visible.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm">
          <EmptyState
            icon={<Trophy className="h-6 w-6" />}
            title="No exams uploaded yet"
            description="Upload a result sheet first — toppers are calculated from its marks."
            action={<Link href="/admin/results/upload"><Button>Upload results</Button></Link>}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((g) => {
            const n = topN[g.key] ?? 3;
            const busy = pending && busyKey === g.key;
            return (
              <section key={g.key} className="rounded-xl border border-ink-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-ink-900">{g.standard}</h2>
                      <span className="text-ink-300">·</span>
                      <span className="font-medium text-ink-800">{g.test_type}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-ink-500">
                      {g.exam_start_date} · {g.academic_year} · Divisions {g.divisions.join(", ") || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-28">
                      <Select value={n} onChange={(e) => setTopN({ ...topN, [g.key]: Number(e.target.value) })}
                        aria-label="How many toppers" className="py-1.5">
                        {[3, 5, 10].map((v) => <option key={v} value={v}>Top {v}</option>)}
                      </Select>
                    </div>
                    <Button size="sm" loading={busy}
                      leftIcon={g.toppers.length ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      onClick={() => run(g.key, () => generateToppers({ exam_ids: g.exam_ids, top_n: n }),
                        g.toppers.length ? "Toppers recalculated" : "Toppers published")}>
                      {g.toppers.length ? "Recalculate" : "Find toppers"}
                    </Button>
                    {g.toppers.length > 0 && (
                      <IconButton label="Remove toppers" tone="danger" onClick={() => setConfirmClear(g)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    )}
                  </div>
                </div>

                {g.toppers.length > 0 ? (
                  <ul className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.toppers.map((t) => (
                      <li key={t.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3",
                          t.is_featured ? "border-ink-200" : "border-dashed border-ink-200 opacity-60",
                        )}>
                        <RankChip rank={t.rank} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-ink-900">{t.student_name || "—"}</div>
                          <div className="text-xs tabular-nums text-ink-500">
                            {t.percentage != null ? `${t.percentage}%` : ""}
                            {t.total != null ? ` · ${t.total}${t.max_total != null ? `/${t.max_total}` : ""}` : ""}
                          </div>
                        </div>
                        <IconButton label={t.is_featured ? "Hide from website" : "Show on website"} tone="brand"
                          disabled={busy}
                          onClick={() => run(g.key, () => updateTopper({ id: t.id, is_featured: !t.is_featured }),
                            t.is_featured ? "Hidden" : "Shown on website")}>
                          {t.is_featured ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </IconButton>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-sm text-ink-500">No toppers yet. Pick how many and press “Find toppers”.</p>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-ink-500">
        Ranking uses the percentage across all subjects with marks entered; students with the same score share a rank.
        Only the name, class, test and score are copied to the public website.
      </p>

      <ConfirmDialog
        open={!!confirmClear}
        onClose={() => setConfirmClear(null)}
        title="Remove these toppers from the website?"
        description="Marks are not affected. You can find toppers again at any time."
        confirmLabel="Remove"
        onConfirm={() => {
          const g = confirmClear!;
          setConfirmClear(null);
          run(g.key, () => clearToppers(g.exam_ids), "Toppers removed");
        }}
      />
    </div>
  );
}

function RankChip({ rank }: { rank: number }) {
  const tone =
    rank === 1 ? "bg-amber-400 text-amber-950"
    : rank === 2 ? "bg-slate-300 text-slate-800"
    : rank === 3 ? "bg-orange-300 text-orange-950"
    : "bg-brand-50 text-brand-800 ring-1 ring-brand-100";
  return (
    <div className={cn("flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold", tone)}>
      {rank}
    </div>
  );
}

