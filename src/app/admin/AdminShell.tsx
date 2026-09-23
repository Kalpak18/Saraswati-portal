"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
  LayoutDashboard, Users, GraduationCap, FileSpreadsheet, Settings, LogOut, Menu, X, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useLang } from "@/lib/i18n/LangContext";
import { dict, t } from "@/lib/i18n/dict";

export default function AdminShell({
  children, userEmail, schoolName, logoUrl,
}: { children: ReactNode; userEmail: string; schoolName: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { href: "/admin",           label: t(dict.nav.dashboard, lang), icon: LayoutDashboard, exact: true },
    { href: "/admin/classes",   label: t(dict.nav.classes, lang),   icon: GraduationCap },
    { href: "/admin/students",  label: t(dict.nav.students, lang),  icon: Users },
    { href: "/admin/results",   label: t(dict.nav.results, lang),   icon: FileSpreadsheet },
    { href: "/admin/templates", label: t(dict.nav.templates, lang), icon: Download },
    { href: "/admin/settings",  label: t(dict.nav.settings, lang),  icon: Settings },
  ];

  async function logout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full transform border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0",
          mobileOpen && "translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4">
          {logoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logoUrl} alt="" className="h-8 w-8 rounded object-contain" />
          )}
          <div className="truncate text-sm font-semibold">{schoolName}</div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
          <button
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden text-sm text-gray-500 lg:block">{schoolName}</div>
          <div className="flex items-center gap-3">
            <div className="flex text-xs">
              <button
                onClick={() => setLang("mr")}
                className={cn("rounded-l-md border border-gray-300 px-2 py-1",
                  lang === "mr" ? "bg-indigo-600 text-white" : "bg-white text-gray-700")}>मराठी</button>
              <button
                onClick={() => setLang("en")}
                className={cn("rounded-r-md border border-l-0 border-gray-300 px-2 py-1",
                  lang === "en" ? "bg-indigo-600 text-white" : "bg-white text-gray-700")}>English</button>
            </div>
            <span className="hidden text-xs text-gray-500 sm:inline">{userEmail}</span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t(dict.common.logout, lang)}</span>
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
