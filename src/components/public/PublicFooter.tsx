"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";

export function PublicFooter({
  school,
}: {
  school: { name: string | null; address: string | null };
}) {
  const { lang } = useLang();
  const name = school.name || "Saraswati School";
  const year = new Date().getFullYear();

  const nav: { href: string; label: string }[] = [
    { href: "/",             label: lang === "mr" ? "मुख्यपृष्ठ"    : "Home" },
    { href: "/about",        label: lang === "mr" ? "आमच्याबद्दल"   : "About" },
    { href: "/events",       label: lang === "mr" ? "कार्यक्रम"     : "Events" },
    { href: "/achievements", label: lang === "mr" ? "यश"           : "Achievements" },
    { href: "/team",         label: lang === "mr" ? "आमची टीम"      : "Team" },
    { href: "/lookup",       label: lang === "mr" ? "परिणाम पहा"    : "Check Result" },
  ];

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {lang === "mr"
                ? "आपल्या मुलांच्या भविष्यासाठी उत्तम शिक्षण."
                : "Nurturing tomorrow's leaders through excellence in education."}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {lang === "mr" ? "बाजू" : "Explore"}
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="text-gray-600 hover:text-indigo-600 hover:underline"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {lang === "mr" ? "संपर्क" : "Contact"}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {school.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-none text-gray-400" />
                  <span>{school.address}</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 flex-none text-gray-400" />
                <span className="tabular-nums">
                  {lang === "mr" ? "फोन: उपलब्ध लवकरच" : "Phone: coming soon"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 flex-none text-gray-400" />
                <Link href="/contact" className="hover:text-indigo-600 hover:underline">
                  {lang === "mr" ? "आम्हाला ईमेल पाठवा" : "Send us a message"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-gray-100 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center">
          <p>© {year} {name}. All rights reserved.</p>
          <p>
            {lang === "mr" ? "प्रशासकीय प्रवेश" : "Admin"}:{" "}
            <Link
              href="/login"
              className="text-indigo-600 hover:underline"
            >
              {lang === "mr" ? "लॉगिन" : "Login"}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
