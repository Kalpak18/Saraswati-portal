"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { cn } from "@/lib/utils";
import { schoolNameFor } from "@/lib/schoolName";

/**
 * Top-of-page navigation for the school website. Slim by design: only four
 * primary items on desktop plus a Check Result CTA. Related destinations
 * (Faculty, Toppers, Results) live inside the Academics dropdown so the
 * bar never grows past what fits at 1024px without cramping.
 *
 * Sticky with a colour swap on scroll: crisp white against a photo hero on
 * top, tinted with backdrop-blur once the user has scrolled into content —
 * echoes the pattern used on modern institutional sites.
 */
export function PublicHeader({
  school,
}: {
  school: { name: string | null; name_mr: string | null; logo_url: string | null };
}) {
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [academicsOpen, setAcademicsOpen] = useState(false);
  const academicsRef = useRef<HTMLDivElement | null>(null);

  const isHome = pathname === "/";
  useEffect(() => {
    // On the home page the header floats over the full-screen hero until
    // the hero has scrolled away; elsewhere it turns solid almost at once.
    const onScroll = () => {
      // Over the hero (whatever height the admin chose) the header stays clear.
      const hero = isHome ? document.querySelector<HTMLElement>("[data-hero]") : null;
      const until = hero ? hero.offsetHeight - 96 : 12;
      setScrolled(window.scrollY > Math.max(12, until));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHome]);

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => setAcademicsOpen(false), [pathname]);

  // Click-outside for academics dropdown.
  useEffect(() => {
    if (!academicsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (academicsRef.current && !academicsRef.current.contains(e.target as Node)) {
        setAcademicsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [academicsOpen]);

  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);
  const overlay = isHome && !scrolled && !drawer;

  const name = schoolNameFor(school, lang);

  const academicsItems = [
    { href: "/lookup",              label: t("परिणाम पहा", "Check Result") },
    { href: "/academics/toppers",   label: t("गुणवंत विद्यार्थी", "Toppers") },
    { href: "/achievements",        label: t("यशोगाथा", "Achievements") },
    { href: "/academics/faculty",   label: t("शिक्षक वर्ग", "Faculty") },
    { href: "/academics/downloads", label: t("डाउनलोड", "Downloads") },
  ];

  const primary = [
    { href: "/",         label: t("मुख्यपृष्ठ", "Home") },
    { href: "/notices",  label: t("सूचना", "Notices") },
    { href: "/life",     label: t("शालेय जीवन", "Life") },
    { href: "/about",    label: t("आमच्याबद्दल", "About") },
    { href: "/contact",  label: t("संपर्क", "Contact") },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const isAcademicsActive =
    pathname.startsWith("/academics") || pathname === "/lookup" || pathname === "/achievements";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        overlay
          ? "border-b border-transparent bg-transparent"
          : scrolled
            ? "border-b border-ink-200/70 bg-white/85 backdrop-blur-md shadow-xs"
            : "border-b border-transparent bg-white",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:h-18 sm:px-6 lg:h-20 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
        >
          {school.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={school.logo_url}
              alt=""
              className="h-10 w-10 flex-none rounded-lg object-contain ring-1 ring-ink-100"
            />
          ) : (
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-linear-to-br from-brand-700 to-brand-900 text-base font-bold text-white shadow-sm">
              {name.trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className={cn("truncate font-display text-base font-semibold leading-tight sm:text-lg", overlay ? "text-white" : "text-ink-900")}>
              {name}
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {primary.slice(0, 1).map((item) => (
            <NavLink key={item.href} href={item.href} active={isActive(item.href)} overlay={overlay}>
              {item.label}
            </NavLink>
          ))}

          {/* Academics dropdown */}
          <div className="relative" ref={academicsRef}>
            <button
              type="button"
              onClick={() => setAcademicsOpen((v) => !v)}
              aria-expanded={academicsOpen}
              aria-haspopup="menu"
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                overlay
                  ? "text-white/90 hover:bg-white/10 hover:text-white"
                  : isAcademicsActive
                    ? "bg-brand-50 text-brand-800"
                    : "text-ink-700 hover:bg-ink-50 hover:text-ink-900",
              )}
            >
              {t("शैक्षणिक", "Academics")}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", academicsOpen && "rotate-180")} />
            </button>
            {academicsOpen && (
              <div
                role="menu"
                className="animate-in slide-down-fade absolute left-0 mt-2 w-56 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-lg ring-1 ring-black/5"
              >
                {academicsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className="block px-4 py-2.5 text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-800"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {primary.slice(1).map((item) => (
            <NavLink key={item.href} href={item.href} active={isActive(item.href)} overlay={overlay}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* Language toggle */}
          <div className={cn("hidden overflow-hidden rounded-full border text-[11px] font-medium sm:flex", overlay ? "border-white/30" : "border-ink-200")}>
            <button
              onClick={() => setLang("mr")}
              aria-pressed={lang === "mr"}
              className={cn(
                "px-2.5 py-1 transition-colors",
                lang === "mr" ? "bg-ink-900 text-white"
                  : overlay ? "bg-transparent text-white/80 hover:bg-white/10" : "bg-white text-ink-600 hover:bg-ink-50",
              )}
            >
              मराठी
            </button>
            <button
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={cn(
                "border-l px-2.5 py-1 transition-colors",
                overlay ? "border-white/30" : "border-ink-200",
                lang === "en" ? "bg-ink-900 text-white"
                  : overlay ? "bg-transparent text-white/80 hover:bg-white/10" : "bg-white text-ink-600 hover:bg-ink-50",
              )}
            >
              EN
            </button>
          </div>

          {/* CTA */}
          <Link
            href="/lookup"
            className="group hidden items-center gap-1.5 rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-md sm:inline-flex"
          >
            {t("परिणाम पहा", "Check Result")}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Mobile menu */}
          <button
            type="button"
            className={cn(
              "rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 lg:hidden",
              overlay ? "text-white hover:bg-white/10" : "text-ink-700 hover:bg-ink-50",
            )}
            onClick={() => setDrawer((v) => !v)}
            aria-label={drawer ? "Close menu" : "Open menu"}
            aria-expanded={drawer}
          >
            {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="lg:hidden">
          <div className="border-t border-ink-200 bg-white">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
              {primary.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium",
                    isActive(item.href) ? "bg-brand-50 text-brand-800" : "text-ink-700 hover:bg-ink-50",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-ink-100 pt-2">
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  {t("शैक्षणिक", "Academics")}
                </div>
                {academicsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <Link
                href="/lookup"
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {t("परिणाम पहा", "Check Result")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="mt-2 flex justify-center gap-2 text-xs">
                <button
                  onClick={() => setLang("mr")}
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    lang === "mr" ? "font-semibold text-brand-700" : "text-ink-500",
                  )}
                >
                  मराठी
                </button>
                <span className="text-ink-300">|</span>
                <button
                  onClick={() => setLang("en")}
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    lang === "en" ? "font-semibold text-brand-700" : "text-ink-500",
                  )}
                >
                  English
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href, active, overlay, children,
}: {
  href: string;
  active: boolean;
  overlay: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        overlay
          ? active ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"
          : active ? "bg-brand-50 text-brand-800" : "text-ink-700 hover:bg-ink-50 hover:text-ink-900",
      )}
    >
      {children}
    </Link>
  );
}
