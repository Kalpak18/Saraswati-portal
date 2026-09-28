"use client";

import { Quote } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { SectionHeader } from "../components/SectionHeader";

export default function HomeVoices() {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  const voices = [
    {
      quote: t(
        "\"आमच्या मुलीचा आत्मविश्वास शाळेत आल्यापासून खूप वाढला. शिक्षक फक्त शिकवत नाहीत — ते मुलांना समजून घेतात.\"",
        "\"Our daughter's confidence has grown so much. Her teachers don't just teach — they truly know her.\"",
      ),
      name: t("पालक", "A parent"),
      role: t("इयत्ता ८ वी", "Class 8 parent"),
      accent: "brand",
    },
    {
      quote: t(
        "\"शाळेतले क्रीडा शिक्षक आणि सांस्कृतिक कार्यक्रम — हे सगळं मला माझ्या आवडीचे क्षेत्र शोधायला मदत करते.\"",
        "\"The sports coaches and cultural programs helped me find what I actually love doing.\"",
      ),
      name: t("प्रगती", "A student"),
      role: t("माजी विद्यार्थी", "Alumni"),
      accent: "accent",
    },
    {
      quote: t(
        "\"पालक-शिक्षक सभेत आमचं मत ऐकलं जातं. निर्णय मुलांच्या भल्यासाठीच घेतले जातात — हे विश्वासाचं कारण.\"",
        "\"At PTA meetings, our voice actually counts. Decisions are made with the kids in mind — that builds trust.\"",
      ),
      name: t("पालक", "A parent"),
      role: t("व्यवस्थापन समिती", "PTA member"),
      accent: "brand",
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("आवाज", "In their words")}
          title={t("पालक आणि विद्यार्थ्यांचा विश्वास", "What our community says")}
          align="center"
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {voices.map((v, i) => {
            const isAccent = v.accent === "accent";
            return (
              <figure
                key={i}
                className={`relative overflow-hidden rounded-3xl p-8 ${
                  isAccent
                    ? "bg-linear-to-br from-accent-50 via-white to-accent-100 ring-1 ring-accent-200"
                    : "bg-linear-to-br from-brand-50 via-white to-brand-100 ring-1 ring-brand-200"
                }`}
              >
                <Quote
                  className={`absolute -right-3 -top-3 h-24 w-24 ${isAccent ? "text-accent-200" : "text-brand-200"}`}
                  strokeWidth={1}
                />
                <blockquote className="relative">
                  <p className="font-display text-base leading-relaxed text-ink-800 sm:text-lg">
                    {v.quote}
                  </p>
                </blockquote>
                <figcaption className="relative mt-6 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${
                      isAccent ? "bg-accent-600" : "bg-brand-700"
                    }`}
                  >
                    {v.name.trim().charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink-900">{v.name}</div>
                    <div className="text-xs text-ink-500">{v.role}</div>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
