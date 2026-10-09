"use client";

import { useLang } from "@/lib/i18n/LangContext";
import { pick, type HomeSection } from "@/lib/homeSections";
import { PhotoCollection } from "./PhotoCollection";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./motion";

/**
 * Photos the admin attached to any section, shown right after it with the
 * section's own layout / caption / spacing settings. When the section itself
 * has nothing to show yet (no notices, no events…), its heading comes along
 * so the photos still read as that section.
 */
export function SectionPhotos({ s, withHeading }: { s: HomeSection; withHeading: boolean }) {
  const { lang } = useLang();
  const photos = s.content.photos ?? [];
  if (!photos.some((p) => p.image_url)) return null;
  const title = pick(s.content.title, lang);
  const eyebrow = pick(s.content.eyebrow, lang);

  return (
    // Full-width <section> so a section background spans the page; the
    // inner .sec-wrap keeps the content at the chosen width.
    <section
      style={{
        paddingTop: withHeading ? "var(--sec-pt, clamp(5rem, 8vw, 7rem))" : "clamp(1.5rem, 3vw, 2.5rem)",
        paddingBottom: "var(--sec-pb, clamp(3rem, 6vw, 5rem))",
      }}
    >
      <div className="sec-wrap">
      {withHeading && (title || eyebrow) && (
        <Reveal className="mb-10">
          <SectionHeader eyebrow={eyebrow} title={title} subtitle={pick(s.content.subtitle, lang) || undefined} />
        </Reveal>
      )}
      <PhotoCollection items={photos} layout={s.config.photos_layout ?? "grid"} columns={s.config.photos_columns} config={s.config} />
      </div>
    </section>
  );
}
