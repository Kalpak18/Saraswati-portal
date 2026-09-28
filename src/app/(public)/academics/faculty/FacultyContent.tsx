"use client";

import { Users, Mail, Phone } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { PageIntro } from "../../components/PageIntro";

const CATEGORY_ORDER = ["leadership", "management", "faculty"] as const;

type Member = {
  id: string;
  name: string;
  designation: string;
  bio: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  category: string;
  display_order: number;
};

export default function FacultyContent({ members }: { members: Member[] }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  const CATEGORY_LABEL: Record<string, string> = {
    leadership: t("नेतृत्व", "Leadership"),
    management: t("व्यवस्थापन", "Management"),
    faculty:    t("शिक्षक वर्ग", "Faculty"),
  };

  const grouped = new Map<string, Member[]>();
  for (const m of members) {
    const arr = grouped.get(m.category) ?? [];
    arr.push(m);
    grouped.set(m.category, arr);
  }
  const groups = [
    ...CATEGORY_ORDER.filter((c) => grouped.has(c)).map((c) => [c as string, grouped.get(c)!] as const),
    ...Array.from(grouped.entries()).filter(([c]) => !CATEGORY_ORDER.includes(c as never)),
  ];

  return (
    <>
      <PageIntro
        eyebrow={t("शैक्षणिक", "Academics")}
        title={t("आमची टीम", "Meet our team")}
        subtitle={t(
          "अनुभवी नेतृत्व, संवेदनशील शिक्षक — मुलांच्या पाठीशी उभी असलेली माणसं.",
          "Experienced leaders, thoughtful teachers — the people who stand beside every child.",
        )}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {members.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <Users className="mx-auto h-12 w-12 text-ink-300" />
            <p className="mt-4 font-display text-xl font-semibold text-ink-900">
              {t("टीमची माहिती लवकरच", "Faculty profiles coming soon")}
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {groups.map(([cat, arr]) => (
              <section key={cat}>
                <h2 className="mb-8 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                  {CATEGORY_LABEL[cat] ?? cat}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {arr.map((m) => (
                    <article
                      key={m.id}
                      className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-ink-100">
                        {m.photo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={m.photo_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-100 to-accent-100 font-display text-6xl font-semibold text-brand-700">
                            {m.name.trim().charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="line-clamp-1 font-display text-lg font-semibold text-ink-900">{m.name}</h3>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-700">
                          {m.designation}
                        </p>
                        {m.bio && (
                          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink-600">{m.bio}</p>
                        )}
                        {(m.email || m.phone) && (
                          <div className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-xs">
                            {m.email && (
                              <div className="flex items-center gap-2 text-ink-600">
                                <Mail className="h-3.5 w-3.5 text-ink-400" />
                                <a href={`mailto:${m.email}`} className="hover:text-brand-700 hover:underline">
                                  {m.email}
                                </a>
                              </div>
                            )}
                            {m.phone && (
                              <div className="flex items-center gap-2 text-ink-600">
                                <Phone className="h-3.5 w-3.5 text-ink-400" />
                                <a href={`tel:${m.phone}`} className="tabular-nums hover:text-brand-700 hover:underline">
                                  {m.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
