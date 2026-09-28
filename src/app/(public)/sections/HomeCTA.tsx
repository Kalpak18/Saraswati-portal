"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";

/**
 * Final band: a warm call-to-action anchored above the footer. Combines the
 * primary parent action (Check Result) with a secondary "Visit us" thread.
 */
export default function HomeCTA() {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  return (
    <section className="relative overflow-hidden py-24">
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-brand-800 via-brand-900 to-ink-900" />
      <div className="absolute inset-0 -z-10 opacity-30"
           style={{
             backgroundImage:
               "radial-gradient(circle at 20% 30%, rgba(251,191,36,0.3), transparent 40%), radial-gradient(circle at 80% 70%, rgba(20,184,166,0.3), transparent 40%)",
           }}
      />

      <div className="mx-auto max-w-5xl px-4 text-center text-white sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
          {t("पालकांसाठी", "For parents")}
        </div>

        <h2 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {t(
            "आपल्या मुलाचा निकाल — काही सेकंदांत.",
            "Your child's result — in seconds.",
          )}
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
          {t(
            "नोंदणीकृत मोबाईल नंबर आणि जन्मतारीख द्या. साइनअप नाही, पासवर्ड नाही — फक्त निकाल.",
            "Enter the registered mobile number and date of birth. No signup, no passwords — just the report card.",
          )}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/lookup"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-brand-800 shadow-lg shadow-brand-950/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            {t("परिणाम पहा", "Check Result")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            {t("भेटीसाठी ठरवा", "Schedule a visit")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Secondary contact micro-strip */}
        <div className="mx-auto mt-14 flex max-w-2xl flex-col items-center justify-center gap-4 border-t border-white/10 pt-8 text-xs text-white/70 sm:flex-row sm:gap-8">
          <div className="inline-flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-accent-400" />
            <span>{t("शाळेच्या भेटीसाठी सोमवार ते शनिवार", "Visit Mon–Sat")}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-accent-400" />
            <span>{t("प्रवेशासाठी संपर्क साधा", "Call for admissions")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
