"use client";

import Link from "next/link";
import { GraduationCap, Users, FileSpreadsheet, Upload } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { dict, t } from "@/lib/i18n/dict";

export default function DashboardClient({
  classesCount, studentsCount, examsCount,
}: { classesCount: number; studentsCount: number; examsCount: number }) {
  const { lang } = useLang();

  const cards = [
    { label: t(dict.dashboard.classesCount, lang),  value: classesCount,  icon: GraduationCap,   href: "/admin/classes" },
    { label: t(dict.dashboard.studentsCount, lang), value: studentsCount, icon: Users,           href: "/admin/students" },
    { label: t(dict.dashboard.examsCount, lang),    value: examsCount,    icon: FileSpreadsheet, href: "/admin/results" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm text-gray-500">{c.label}</div>
                <div className="text-2xl font-semibold text-gray-900">{c.value}</div>
              </div>
            </Link>
          );
        })}
      </div>

      <Link href="/admin/results/upload"
        className="flex items-center justify-center gap-3 rounded-lg bg-indigo-600 px-6 py-8 text-lg font-semibold text-white shadow-sm hover:bg-indigo-700">
        <Upload className="h-6 w-6" />
        {t(dict.dashboard.uploadCta, lang)}
      </Link>
    </div>
  );
}
