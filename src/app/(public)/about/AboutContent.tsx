"use client";

import { useLang } from "@/lib/i18n/LangContext";
import { Eye, Target, Heart, Landmark } from "lucide-react";
import { PageIntro } from "../components/PageIntro";
import { EyebrowLabel } from "../components/EyebrowLabel";

type Section = { key: string; heading: string; body_html: string; display_order: number };

export default function AboutContent({ sections }: { sections: Section[] }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  // Default "pillar" content that ships out of the box — admin can override
  // each pillar later by inserting rows into about_sections with the matching
  // key (e.g. { key: "vision", heading: "…", body_html: "…" }).
  const pillars = [
    {
      key: "vision",
      icon: Eye,
      heading: t("आमचं स्वप्न", "Our vision"),
      body: t(
        "प्रत्येक विद्यार्थी आत्मविश्वासाने, सर्जनशीलतेने आणि करुणेने जगू शकेल — असं शिक्षण देणं.",
        "To help every student step into the world with confidence, creativity and care.",
      ),
    },
    {
      key: "mission",
      icon: Target,
      heading: t("आमचं ध्येय", "Our mission"),
      body: t(
        "गुणवत्तापूर्ण शैक्षणिक अनुभव, नैतिक मूल्यसंस्कार आणि सर्वांगीण विकासाच्या संधी उपलब्ध करून देणे.",
        "To offer rigorous academics, strong values and rich opportunities for the whole child to grow.",
      ),
    },
    {
      key: "values",
      icon: Heart,
      heading: t("आमची मूल्यं", "Our values"),
      body: t(
        "सन्मान, प्रामाणिकपणा, जिज्ञासा आणि सेवा — शिक्षण फक्त पुस्तकांतून नाही, तर मूल्यांतून घडतं.",
        "Respect, honesty, curiosity and service — learning is shaped by values, not just books.",
      ),
    },
    {
      key: "history",
      icon: Landmark,
      heading: t("आमची पार्श्वभूमी", "Our story"),
      body: t(
        "अनेक दशकांची शैक्षणिक परंपरा — हजारो विद्यार्थ्यांच्या यशोगाथांच्या रूपात जिवंत आहे.",
        "Decades of quality schooling — kept alive in the success stories of thousands of alumni.",
      ),
    },
  ];

  return (
    <>
      <PageIntro
        eyebrow={t("आमच्याबद्दल", "About us")}
        title={t("शिक्षण, संस्कार आणि समुदाय.", "Education, values and community.")}
        subtitle={t(
          "आमची शाळा म्हणजे एक परिवार — जिथे प्रत्येक विद्यार्थी बघितला जातो, ऐकला जातो आणि पुढे नेला जातो.",
          "Our school is a family where every student is seen, heard and helped to move forward.",
        )}
      />

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {pillars.map((p) => {
            const Icon = p.icon;
            const override = sections.find((s) => s.key === p.key);
            return (
              <article
                key={p.key}
                className="group relative overflow-hidden rounded-3xl border border-ink-100 bg-linear-to-br from-white via-white to-brand-50/60 p-8 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-800 ring-1 ring-brand-200">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-ink-900">
                  {override?.heading || p.heading}
                </h2>
                {override?.body_html ? (
                  <div className="prose-brand mt-3" dangerouslySetInnerHTML={{ __html: override.body_html }} />
                ) : (
                  <p className="mt-3 text-base leading-relaxed text-ink-600">{p.body}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Long-form CMS body (if any extra rows) */}
      {sections.filter((s) => !pillars.find((p) => p.key === s.key)).length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
          <EyebrowLabel>{t("अधिक", "More")}</EyebrowLabel>
          <div className="mt-4 space-y-10">
            {sections
              .filter((s) => !pillars.find((p) => p.key === s.key))
              .map((s) => (
                <article key={s.key} className="prose-brand">
                  <h2>{s.heading}</h2>
                  <div dangerouslySetInnerHTML={{ __html: s.body_html }} />
                </article>
              ))}
          </div>
        </section>
      )}
    </>
  );
}
