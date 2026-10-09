"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { pick, shapeClass, type HomeSection } from "@/lib/homeSections";
import { FramedImage } from "../components/FramedImage";
import { cn } from "@/lib/utils";
import { EyebrowLabel } from "../components/EyebrowLabel";
import { Parallax, Reveal } from "../components/motion";
import { useSectionDesign } from "../components/SectionDesign";
import { TITLE_SIZE } from "../components/SectionHeader";

/** Admin's own section: heading, text, optional photo and button. */
export default function HomeText({ s }: { s: HomeSection }) {
  const { lang } = useLang();
  const eyebrow = pick(s.content.eyebrow, lang);
  const title = pick(s.content.title, lang);
  const body = pick(s.content.body, lang);
  const label = pick(s.content.button_label, lang);
  const href = s.content.button_href || null;
  const image = s.content.image_url || null;
  const design = useSectionDesign();
  const center = (design.headingAlign ?? s.config.align) === "center" && !image;
  // Drifting parallax only when the photo is cropped to a fixed shape;
  // "Original" / "Show whole photo" have no spare edge to drift into.
  const frameShape = shapeClass(s.config.photo_shape, "4:3");
  const parallax = !!frameShape && (s.config.photo_fit ?? "fill") === "fill";
  if (!title && !body && !image) return null;

  const text = (
    <Reveal className={cn(center && "mx-auto max-w-3xl text-center")}>
      {eyebrow && <EyebrowLabel>{eyebrow}</EyebrowLabel>}
      {title && (
        <h2 className={cn("mt-3 font-display font-semibold leading-tight tracking-tight text-ink-900", TITLE_SIZE[design.headingSize ?? "md"])}>{title}</h2>
      )}
      {body && <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-ink-600 sm:text-lg">{body}</p>}
      {label && href && (
        <Link href={href}
          {...(/^https?:\/\//.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800">
          {label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </Reveal>
  );

  return (
    <section className="sec">
      <div className="sec-wrap">
        {image ? (
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {text}
            <Reveal from="scale" className={cn("overflow-hidden rounded-3xl shadow-xl", s.config.image_side === "left" && "lg:order-first")}>
              {parallax ? (
                <div className={cn(frameShape, "overflow-hidden")}>
                  <Parallax speed={-70} className="h-[112%] translate-y-[-6%]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </Parallax>
                </div>
              ) : (
                <FramedImage src={image} shape={s.config.photo_shape} fallback="4:3" fit={s.config.photo_fit} />
              )}
            </Reveal>
          </div>
        ) : text}
      </div>
    </section>
  );
}
