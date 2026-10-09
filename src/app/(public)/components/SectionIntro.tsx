"use client";

import { useLang } from "@/lib/i18n/LangContext";
import { pick, type HomeSection } from "@/lib/homeSections";
import { PageIntro } from "./PageIntro";

/** "Page heading" section — the large intro block of an inner page. */
export function SectionIntro({ s }: { s: HomeSection }) {
  const { lang } = useLang();
  const title = pick(s.content.title, lang);
  if (!title) return null;
  return (
    <PageIntro
      eyebrow={pick(s.content.eyebrow, lang) || undefined}
      title={title}
      subtitle={pick(s.content.subtitle, lang) || undefined}
    />
  );
}
