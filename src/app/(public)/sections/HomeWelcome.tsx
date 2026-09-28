"use client";

import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { EyebrowLabel } from "../components/EyebrowLabel";

export default function HomeWelcome() {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Left — headline + copy */}
          <div className="lg:col-span-7">
            <EyebrowLabel>{t("आमच्याबद्दल", "About the school")}</EyebrowLabel>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">
              {t(
                "एक परिवार, जिथे प्रत्येक मूल विकसित होते.",
                "A family where every child is seen, heard and helped to grow.",
              )}
            </h2>

            <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-600">
              <p>
                {t(
                  "अनेक वर्षांच्या शैक्षणिक परंपरेतून घडलेली आमची शाळा केवळ पाठ्यपुस्तकांपुरती मर्यादित नाही. आम्ही प्रत्येक विद्यार्थ्याच्या नैसर्गिक क्षमतांना ओळखून त्या फुलवण्यावर लक्ष केंद्रित करतो.",
                  "Rooted in a long tradition of quality schooling, we go beyond the textbook. We spot each student's natural gifts and give them the room to grow into confident, curious young adults.",
                )}
              </p>
              <p>
                {t(
                  "मराठी आणि इंग्रजी दोन्ही माध्यमांतून, सुसज्ज प्रयोगशाळा, समृद्ध ग्रंथालय आणि क्रीडांगणासह — आमच्या शाळेत शिक्षण अधिक जिवंत आहे.",
                  "Across our Marathi and English streams — with well-equipped labs, a rich library, sports facilities and warm-hearted faculty — learning here feels alive, not rehearsed.",
                )}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
              >
                {t("अधिक जाणून घ्या", "Read our story")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/contact"
                className="text-sm font-semibold text-brand-700 hover:text-brand-900"
              >
                {t("भेटीसाठी संपर्क साधा →", "Book a visit →")}
              </Link>
            </div>
          </div>

          {/* Right — leader quote card */}
          <div className="relative lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-50 via-white to-accent-50 p-8 shadow-lg shadow-brand-950/5 ring-1 ring-brand-100">
              <Quote className="absolute -right-4 -top-4 h-32 w-32 text-brand-100" strokeWidth={1} />
              <div className="relative">
                <p className="font-display text-xl leading-relaxed text-ink-800 sm:text-2xl">
                  {t(
                    "\"शिक्षण म्हणजे केवळ पदवी नाही — ती जीवनासाठीची तयारी आहे. आम्ही आमच्या मुलांना विचार करायला, स्वप्नं पाहायला आणि प्रयत्न करायला शिकवतो.\"",
                    "\"Education is not a certificate — it is preparation for life. We teach our children to think, to dream, and to try.\"",
                  )}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-lg font-semibold text-white ring-4 ring-white">
                    P
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink-900">
                      {t("मुख्याध्यापक", "The Principal")}
                    </div>
                    <div className="text-xs text-ink-500">
                      {t("संदेश", "A note to parents")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
