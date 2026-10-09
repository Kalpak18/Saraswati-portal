"use client";

import { useLang } from "@/lib/i18n/LangContext";
import { layoutOf, pick, type HomeSection, type PhotoLayout } from "@/lib/homeSections";
import { SectionHeader } from "../components/SectionHeader";
import { PhotoCollection } from "../components/PhotoCollection";
import { Reveal } from "../components/motion";

/**
 * Admin's own photos with captions and descriptions — as tiles, or one per
 * row with the text beside or below each photo (see PhotoCollection).
 */
export default function HomeGallery({ s }: { s: HomeSection }) {
  const { lang } = useLang();
  if (!s.items.some((it) => it.image_url)) return null;
  const heading = pick(s.content.title, lang) || pick(s.content.eyebrow, lang);

  return (
    <section className="sec">
      <div className="sec-wrap">
        {heading && (
          <Reveal className="mb-12">
            <SectionHeader
              eyebrow={pick(s.content.eyebrow, lang)}
              title={pick(s.content.title, lang)}
              subtitle={pick(s.content.subtitle, lang) || undefined}
            />
          </Reveal>
        )}
        <PhotoCollection items={s.items} layout={layoutOf(s) as PhotoLayout} columns={s.config.columns} config={s.config} />
      </div>
    </section>
  );
}
