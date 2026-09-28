"use client";

import { BookOpen, Microscope, Trophy, Bus, HeartHandshake, Palette } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { SectionHeader } from "../components/SectionHeader";

/**
 * Static "why us" grid — the intangibles that make the school what it is.
 * Editable in a future session by moving to a CMS table; for now it's hand
 * copy so the page ships polished on day one.
 */
export default function HomeFacilities() {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  const items = [
    {
      icon: BookOpen,
      title: t("समृद्ध ग्रंथालय", "Rich library"),
      body: t(
        "मराठी आणि इंग्रजी दोन्ही भाषांतील पुस्तके, संदर्भ ग्रंथ आणि नियमित मासिकं.",
        "Thousands of titles across Marathi and English, plus reference works and periodicals.",
      ),
    },
    {
      icon: Microscope,
      title: t("सुसज्ज प्रयोगशाळा", "Well-equipped labs"),
      body: t(
        "विज्ञान, संगणक आणि भाषा प्रयोगशाळांमध्ये प्रत्यक्ष अनुभवातून शिक्षण.",
        "Hands-on science, computer and language labs — where learning is done, not just read.",
      ),
    },
    {
      icon: Trophy,
      title: t("क्रीडा आणि खेळ", "Sports & athletics"),
      body: t(
        "मैदानी खेळांपासून योगापर्यंत — प्रत्येक विद्यार्थ्यासाठी योग्य ती जागा.",
        "From outdoor sports to yoga — every student finds a place that fits.",
      ),
    },
    {
      icon: Palette,
      title: t("कला आणि सांस्कृतिक", "Arts & culture"),
      body: t(
        "संगीत, नृत्य, चित्रकला — मुलांच्या सर्जनशीलतेला वाव देणारे उपक्रम.",
        "Music, dance, drama and visual arts — creativity gets real time and space.",
      ),
    },
    {
      icon: Bus,
      title: t("वाहतूक सेवा", "School transport"),
      body: t(
        "सुरक्षित आणि विश्वसनीय शालेय वाहतूक — पालकांच्या मनःशांतीसाठी.",
        "A safe, reliable school-transport network so parents rest easy.",
      ),
    },
    {
      icon: HeartHandshake,
      title: t("पालक-शिक्षक सहभाग", "Parent partnership"),
      body: t(
        "नियमित संवाद, खुले वर्ग आणि सामायिक निर्णय — कारण मुलांचा प्रगती दोघांची जबाबदारी.",
        "Regular touchpoints, open classrooms and shared decisions — growth is a shared responsibility.",
      ),
    },
  ];

  return (
    <section className="border-y border-ink-100 bg-ink-50/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("आमचं वेगळेपण", "Why families choose us")}
          title={t("शिक्षणासाठी लागणारं सगळं, एका छताखाली", "Everything a growing student needs")}
          subtitle={t(
            "फक्त वर्ग नाही — मुलांच्या पूर्ण विकासाला हातभार लावणारी सुविधा आणि सेवा.",
            "Not just classrooms — the facilities, support and community that help children thrive.",
          )}
          align="center"
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.title}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand-50 to-accent-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:from-brand-100 group-hover:to-accent-100">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink-900">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{it.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
