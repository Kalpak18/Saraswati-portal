"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { layoutOf, pick, type HomeSection } from "@/lib/homeSections";
import { EyebrowLabel } from "../components/EyebrowLabel";
import { BannerCard, BannerGallery } from "../components/BannerGallery";
import { Reveal, useScrollProgress } from "../components/motion";
import { ItemLayout } from "../components/ItemLayout";
import { useSectionDesign } from "../components/SectionDesign";
import { TITLE_SIZE } from "../components/SectionHeader";
import { cn } from "@/lib/utils";

/**
 * Admin's ready-made banners. With three or more on a large screen the
 * section pins and the strip slides sideways as the visitor scrolls down
 * (a film strip); with one or two — or on phones — they sit in a normal
 * layout, since a pinned slide with nothing to slide is just dead scroll.
 */
export default function HomeBanners({ s }: { s: HomeSection }) {
  const { lang } = useLang();
  const design = useSectionDesign();
  const items = s.items.filter((i) => i.image_url);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const layout = layoutOf(s);
  const filmStrip = layout === "auto" && items.length >= 3;
  useScrollProgress(sectionRef, "pinned");

  useEffect(() => {
    const section = sectionRef.current, track = trackRef.current;
    if (!filmStrip || !section || !track) return;
    const measure = () =>
      section.style.setProperty("--dist", `${Math.max(0, track.scrollWidth - window.innerWidth)}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [filmStrip, items.length]);

  if (items.length === 0) return null;

  const eyebrow = pick(s.content.eyebrow, lang);
  const title = pick(s.content.title, lang);
  const subtitle = pick(s.content.subtitle, lang);
  const intro = (eyebrow || title || subtitle) && (
    <div className={cn("max-w-xl", design.headingAlign === "center" && !filmStrip && "mx-auto text-center")}>
      {eyebrow && <EyebrowLabel tone="accent">{eyebrow}</EyebrowLabel>}
      {title && (
        <h2 className={cn("mt-4 font-display font-semibold leading-tight tracking-tight text-white", TITLE_SIZE[design.headingSize ?? "lg"])}>{title}</h2>
      )}
      {subtitle && <p className="mt-4 max-w-md text-base text-ink-300">{subtitle}</p>}
    </div>
  );

  if (!filmStrip) {
    return (
      <section className="bg-ink-900 sec">
        <div className="sec-wrap">
          {intro && <Reveal className="mb-12">{intro}</Reveal>}
          {layout === "auto" ? (
            <BannerGallery items={items} frame={{ shape: s.config.photo_shape, fit: s.config.photo_fit }} tone="dark" />
          ) : (
            <ItemLayout layout={layout as "grid" | "carousel"} columns={s.config.columns ?? 2} gap="1.25rem" stretch={false}>
              {items.map((b, i) => <BannerCard key={b.id} item={b} frame={{ shape: s.config.photo_shape, fit: s.config.photo_fit }} priority={i === 0} className="w-full" />)}
            </ItemLayout>
          )}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative bg-ink-900 lg:h-[calc(100svh+var(--dist,0px))] motion-reduce:lg:h-auto">
      {/* Desktop: pinned stage, strip moves with --p */}
      <div className="sticky top-0 hidden h-svh items-center overflow-hidden lg:flex motion-reduce:lg:hidden">
        <div ref={trackRef} className="flex items-center gap-8 px-[8vw] will-change-transform"
          style={{ transform: "translate3d(calc(var(--p, 0) * -1 * var(--dist, 0px)), 0, 0)" }}>
          {intro && <div className="w-[34vw] flex-none pr-12">{intro}</div>}
          {items.map((b, i) => (
            <BannerCard key={b.id} item={b} frame={{ shape: s.config.photo_shape, fit: s.config.photo_fit }} priority={i === 0} className="w-[62vw] max-w-275" />
          ))}
        </div>
      </div>

      {/* Phones / tablets / reduced motion: swipe */}
      <div className="sec lg:hidden motion-reduce:lg:block">
        <div className="sec-wrap">
          {intro && <div className="mb-10">{intro}</div>}
          <BannerGallery items={items} frame={{ shape: s.config.photo_shape, fit: s.config.photo_fit }} tone="dark" />
        </div>
      </div>
    </section>
  );
}
