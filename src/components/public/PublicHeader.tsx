"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { cn } from "@/lib/utils";

/**
 * Top nav for the school website. Sticky, condenses on scroll, slides a
 * drawer on mobile. Deliberately independent of the admin AdminShell —
 * conflating them would leak admin styling into public pages.
 */
export function PublicHeader({
  school,
}: {
  school: { name: string | null; logo_url: string | null };
}) {
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer whenever the user navigates.
  useEffect(() => setDrawer(false), [pathname]);

  const nav: { href: string; label: string }[] = [
    { href: "/",             label: lang === "mr" ? "मुख्यपृष्ठ"     : "Home" },
    { href: "/about",        label: lang === "mr" ? "आमच्याबद्दल"   : "About" },
    { href: "/events",       label: lang === "mr" ? "कार्यक्रम"     : "Events" },
    { href: "/achievements", label: lang === "mr" ? "यश"           : "Achievements" },
    { href: "/team",         label: lang === "mr" ? "आमची टीम"      : "Team" },
    { href: "/gallery",      label: lang === "mr" ? "गॅलरी"        : "Gallery" },
    { href: "/contact",      label: lang === "mr" ? "संपर्क"       : "Contact" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const name = school.name || "Saraswati School";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-all",
        scrolled
          ? "border-gray-200 bg-white/95 shadow-sm backdrop-blur"
          : "border-transparent bg-white",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo + name */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {school.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={school.logo_url}
              alt=""
              className="h-9 w-9 flex-none rounded-md object-contain ring-1 ring-gray-100"
            />
          ) : (
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
              {name.trim().charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate text-sm font-semibold text-gray-900 sm:text-base">
            {name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* Lang toggle */}
          <div className="hidden overflow-hidden rounded-md border border-gray-300 text-xs sm:flex">
            <button
              onClick={() => setLang("mr")}
              aria-pressed={lang === "mr"}
              className={cn(
                "px-2.5 py-1 font-medium transition-colors",
                lang === "mr"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50",
              )}
            >
              मराठी
            </button>
            <button
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={cn(
                "border-l border-gray-300 px-2.5 py-1 font-medium transition-colors",
                lang === "en"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50",
              )}
            >
              English
            </button>
          </div>

          {/* CTA */}
          <Link
            href="/lookup"
            className="hidden rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 sm:inline-block"
          >
            {lang === "mr" ? "परिणाम पहा" : "Check Result"}
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden"
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
          <div className="border-t border-gray-200 bg-white">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {nav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/lookup"
                className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white"
              >
                {lang === "mr" ? "परिणाम पहा" : "Check Result"}
              </Link>
              <div className="mt-2 flex justify-center gap-2 text-xs">
                <button
                  onClick={() => setLang("mr")}
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    lang === "mr" ? "font-semibold text-indigo-600" : "text-gray-500",
                  )}
                >
                  मराठी
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setLang("en")}
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    lang === "en" ? "font-semibold text-indigo-600" : "text-gray-500",
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
