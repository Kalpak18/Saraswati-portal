"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState, useEffect } from "react";
import {
  LayoutDashboard, Users, GraduationCap, FileSpreadsheet,
  Settings, LogOut, Menu, X, Download, ChevronDown,
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close mobile sidebar on route change.
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  // Close user menu on any click outside.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onDoc = () => setUserMenuOpen(false);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [userMenuOpen]);

  const nav = [
    { href: "/admin",           label: t(dict.nav.dashboard, lang), icon: LayoutDashboard, exact: true },
    { href: "/admin/classes",   label: t(dict.nav.classes, lang),   icon: GraduationCap },
    { href: "/admin/students",  label: t(dict.nav.students, lang),  icon: Users },
    { href: "/admin/results",   label: t(dict.nav.results, lang),   icon: FileSpreadsheet },
    { href: "/admin/templates", label: t(dict.nav.templates, lang), icon: Download },
    { href: "/admin/settings",  label: t(dict.nav.settings, lang),  icon: Settings },
  ];

  async function logout() {
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-9 w-9 flex-none rounded-md object-contain ring-1 ring-gray-100" />
          ) : (
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
              {(schoolName || "S").trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 truncate text-sm font-semibold text-gray-900">{schoolName}</div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                )}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <span className="absolute inset-y-1 left-0 w-1 rounded-r bg-indigo-600" aria-hidden="true" />
                )}
                <Icon className={cn("h-4 w-4 flex-none", active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 p-3 text-[11px] text-gray-400">
          Saraswati Portal
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-[1px] animate-in fade-in duration-150 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur">
          <button
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden truncate text-sm text-gray-500 lg:block">
            {schoolName}
          </div>

          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <div className="flex overflow-hidden rounded-md border border-gray-300 text-xs">
              <button
                onClick={() => setLang("mr")}
                aria-pressed={lang === "mr"}
                className={cn(
                  "px-2.5 py-1 font-medium transition-colors",
                  lang === "mr" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50",
                )}
              >
                मराठी
              </button>
              <button
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
                className={cn(
                  "border-l border-gray-300 px-2.5 py-1 font-medium transition-colors",
                  lang === "en" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50",
                )}
              >
                English
              </button>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setUserMenuOpen((v) => !v); }}
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {(userEmail || "?").trim().charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[180px] truncate text-xs sm:inline">{userEmail}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="animate-in slide-down-fade absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                >
                  <div className="border-b border-gray-100 px-3 py-2 text-[11px] text-gray-500">Signed in as</div>
                  <div className="border-b border-gray-100 px-3 pb-2 pt-1 text-xs font-medium text-gray-800 break-all">{userEmail}</div>
                  <button
                    onClick={logout}
                    disabled={signingOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4 text-gray-500" />
                    {signingOut ? "Signing out…" : t(dict.common.logout, lang)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
