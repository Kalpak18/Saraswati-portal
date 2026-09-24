"use client";

import Link from "next/link";
import { GraduationCap, Users, FileSpreadsheet, Upload, ArrowRight, Download, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { dict, t } from "@/lib/i18n/dict";
import { PageHeader } from "@/components/ui/PageHeader";

export default function DashboardClient({
  classesCount, studentsCount, examsCount, schoolName,
}: { classesCount: number; studentsCount: number; examsCount: number; schoolName?: string }) {
  const { lang } = useLang();

  const cards: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    tone: "indigo" | "green" | "purple";
    ctaLabel: string;
  }[] = [
    {
      label: t(dict.dashboard.classesCount, lang),
      value: classesCount,
      icon: GraduationCap,
      href: "/admin/classes",
      tone: "indigo",
      ctaLabel: lang === "mr" ? "व्यवस्थापित करा" : "Manage",
    },
    {
      label: t(dict.dashboard.studentsCount, lang),
      value: studentsCount,
      icon: Users,
      href: "/admin/students",
      tone: "green",
      ctaLabel: lang === "mr" ? "पहा" : "View",
    },
    {
      label: t(dict.dashboard.examsCount, lang),
      value: examsCount,
      icon: FileSpreadsheet,
      href: "/admin/results",
      tone: "purple",
      ctaLabel: lang === "mr" ? "अहवाल कार्ड" : "Report cards",
    },
  ];

  const toneClasses: Record<"indigo" | "green" | "purple", { bg: string; text: string; ring: string }> = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "hover:ring-indigo-200" },
    green:  { bg: "bg-green-50",  text: "text-green-600",  ring: "hover:ring-green-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "hover:ring-purple-200" },
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={lang === "mr" ? "डॅशबोर्ड" : "Dashboard"}
        description={
          schoolName
            ? (lang === "mr" ? `${schoolName} — निकाल प्रणाली` : `${schoolName} — result system`)
            : (lang === "mr" ? "शाळेच्या निकालांचा एकत्रित दृष्टिकोन" : "Overview of school results")
        }
      />

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const tc = toneClasses[c.tone];
          return (
            <Link
              key={c.label}
              href={c.href}
              className={`group flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm ring-2 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md ${tc.ring}`}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tc.bg} ${tc.text}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
              </div>
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-3xl font-semibold tracking-tight text-gray-900">{c.value}</div>
                  <div className="text-xs text-gray-400">{c.ctaLabel} →</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Primary CTA — the action they came here to do */}
      <Link
        href="/admin/results/upload"
        className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-6 text-white shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-semibold sm:text-lg">
              {t(dict.dashboard.uploadCta, lang)}
            </div>
            <div className="mt-0.5 text-xs text-indigo-100 sm:text-sm">
              {lang === "mr"
                ? "Excel फाईल अपलोड करा — विद्यार्थी आपोआप जोडले जातील"
                : "Upload an Excel file — students are matched automatically"}
            </div>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 flex-none transition-transform group-hover:translate-x-1" />

        {/* Decorative sparkle in the corner */}
        <Sparkles className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 text-white/10" aria-hidden="true" />
      </Link>

      {/* Secondary quick actions */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/admin/templates"
          className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
        >
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-white group-hover:text-indigo-600">
            <Download className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {lang === "mr" ? "टेम्पलेट्स डाउनलोड करा" : "Download templates"}
            </div>
            <div className="mt-0.5 text-xs text-gray-500">
              {lang === "mr" ? "विद्यार्थी + निकाल Excel टेम्पलेट्स" : "Student + result Excel templates"}
            </div>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
        >
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-white group-hover:text-indigo-600">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {lang === "mr" ? "शाळेची माहिती" : "School settings"}
            </div>
            <div className="mt-0.5 text-xs text-gray-500">
              {lang === "mr" ? "नाव, पत्ता, लोगो" : "Name, address, logo"}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
