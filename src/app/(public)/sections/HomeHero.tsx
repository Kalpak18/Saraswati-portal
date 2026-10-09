"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { DEFAULT_HERO_EFFECT, DEFAULT_SLIDE_SECONDS, slideDurationMs, type HeroEffect, type HeroHeight, type HeroSlide } from "@/lib/hero";
import { cn } from "@/lib/utils";
import { useScrollProgress } from "../components/motion";
import { schoolNameFor } from "@/lib/schoolName";
import { lineFor, type Branding } from "@/lib/branding";

/**
 * Opening shot of the home page: the school, full screen, as a slideshow of
 * the photos and videos the admin added (any mix, any number, or none).
 *
 * Photos hold for a few seconds with a slow push-in; videos play to their
 * end; slides cross-fade. As the visitor scrolls away the whole frame
 * pushes in and darkens while the title drifts up — the "camera" leaving
 * the opening shot for the story below.
 */
export default function HomeHero({
  data,
}: {
  data: {
    title: string;
    school: { name: string | null; name_mr: string | null };
    slides: HeroSlide[];
    /** Default seconds per slide (each slide may override). */
    slideSeconds?: number;
    /** Default camera move for photo slides (each slide may override). */
    slideEffect?: HeroEffect;
    /** How tall the hero is; "original" follows the first slide's shape. */
    height?: HeroHeight;
    logo_url?: string | null;
    branding?: Branding;
  };
}) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref, "leave");

  // Data-saver / reduced-motion visitors get no video. Camera moves stay
  // (a softer version under reduced motion — see globals.css), slides still
  // change on their own, and the pause button is always there.
  // Starts optimistic so the server-rendered page already has the video
  // (no flash of the empty background); corrected after mount if needed.
  const [env, setEnv] = useState({ allowVideo: true, reduced: false, ready: false });
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = requestAnimationFrame(() => setEnv({ allowVideo: !conn?.saveData && !reduced, reduced, ready: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  // A video that can't play here shows its preview frame instead, or is skipped.
  const slides = useMemo(() => data.slides.flatMap((s): HeroSlide[] => {
    if (s.type === "photo" || env.allowVideo) return [s];
    return s.poster_url ? [{ id: s.id, type: "photo", url: s.poster_url }] : [];
  }), [data.slides, env.allowVideo]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const current = slides.length ? index % slides.length : 0;
  const multi = slides.length > 1;
  const running = multi && !paused && inView;
  const seconds = data.slideSeconds ?? DEFAULT_SLIDE_SECONDS;
  const currentMs = slides[current] ? slideDurationMs(slides[current], seconds) : null;
  const defaultEffect = data.slideEffect ?? DEFAULT_HERO_EFFECT;

  // Photos use the slideshow's camera move; videos move only if the admin
  // chose one for that slide (the footage usually moves already).
  const effectClass = (sl: HeroSlide) => {
    const fx = sl.effect ?? (sl.type === "photo" ? defaultEffect : "none");
    return fx === "none" ? undefined : `fx-${fx}`;
  };
  // The move lasts the slide's time plus the cross-fade, so it never stops early.
  const effectMs = (sl: HeroSlide) => (slideDurationMs(sl, seconds) ?? 12000) + 1500;

  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(1, slides.length)), [slides.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % Math.max(1, slides.length)), [slides.length]);
  // Manual moves go through `goTo` so they always count as a change —
  // clicking a dot restarts that slide's timer and camera move.
  const goTo = (i: number) => setIndex((cur) => (i === cur % Math.max(1, slides.length) ? cur + slides.length : i));
  const touchX = useRef<number | null>(null);

  // Each slide advances after its time; a video with no time set advances
  // when it ends (onEnded below).
  useEffect(() => {
    if (!running || currentMs == null) return;
    const id = window.setTimeout(next, currentMs);
    return () => window.clearTimeout(id);
    // `index` (not just `current`) so re-clicking the showing slide's dot restarts its time.
  }, [running, index, currentMs, next]);

  // Only the visible video plays; the rest wait at their first frame.
  const videos = useRef(new Map<string, HTMLVideoElement>());
  useEffect(() => {
    videos.current.forEach((v, id) => {
      const active = slides[current]?.id === id;
      if (active && inView && !paused) {
        v.play().catch(() => { /* autoplay refused: the poster stays up, the timer below moves on */ });
      } else {
        v.pause();
        if (!active) v.currentTime = 0;
      }
    });
  }, [current, slides, inView, paused]);

  // A video that never starts (blocked, broken) shouldn't stall the show.
  useEffect(() => {
    const s = slides[current];
    if (!running || s?.type !== "video" || currentMs != null) return;
    const id = window.setTimeout(() => {
      const v = videos.current.get(s.id);
      if (!v || v.paused) next();
    }, 8000);
    return () => window.clearTimeout(id);
  }, [running, current, slides, currentMs, next]);

  // Stop everything while the hero is off screen or the tab is hidden.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && !document.hidden), { threshold: 0.05 });
    io.observe(el);
    const onVis = () => setInView(!document.hidden && el.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const title = data.title.trim() || schoolNameFor(data.school, lang);
  const height = data.height ?? "full";
  // "Original shape": the hero takes the first slide's own proportions,
  // measured when it loads (16:9 until then).
  const [ratio, setRatio] = useState(16 / 9);
  const measure = (w: number, h: number, i: number) => { if (i === 0 && w > 0 && h > 0) setRatio(w / h); };
  const HEIGHT_CLASS: Record<HeroHeight, string> = {
    full: "h-svh min-h-140",
    tall: "h-[80svh] min-h-120",
    medium: "h-[60svh] min-h-100",
    short: "h-[45svh] min-h-80",
    original: "max-h-svh min-h-80",
  };
  const compact = height !== "full" && height !== "tall";

  return (
    <section
      ref={ref}
      aria-roledescription={multi ? "carousel" : undefined}
      aria-label={t("शाळेची झलक", "School in pictures")}
      // Pull up under the sticky header so the photo runs edge to edge.
      data-hero
      className={cn("group/hero relative isolate -mt-16 w-full overflow-hidden bg-ink-900 outline-none sm:-mt-18 lg:-mt-20", HEIGHT_CLASS[height])}
      style={height === "original" ? { aspectRatio: String(ratio) } : undefined}
      tabIndex={multi ? 0 : undefined}
      onKeyDown={(e) => {
        if (!multi) return;
        if (e.key === "ArrowRight") { e.preventDefault(); next(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      }}
      // Swipe on phones.
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (!multi || touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) { if (dx < 0) next(); else prev(); }
      }}
    >
      {/* Slides, pushed in together as --p grows */}
      <div className="absolute inset-0 will-change-transform" style={{ transform: "scale(calc(1.02 + var(--p, 0) * 0.18))" }}>
        {slides.length === 0 ? (
          // No slides yet: a calm brand gradient instead of an empty box.
          <div className="h-full w-full bg-linear-to-br from-brand-800 via-brand-900 to-ink-900">
            <div className="absolute -right-32 -top-32 h-112 w-md rounded-full bg-accent-500/20 blur-3xl" />
            <div className="absolute -bottom-40 -left-20 h-112 w-md rounded-full bg-brand-500/30 blur-3xl" />
          </div>
        ) : (
          slides.map((s, i) => {
            const active = i === current;
            const near = active || i === (current + 1) % slides.length;
            return (
              <div
                key={s.id}
                aria-hidden={!active}
                className={cn(
                  "absolute inset-0 transition-opacity duration-1200 ease-in-out",
                  active ? "opacity-100" : "opacity-0",
                )}
              >
                {/* Camera move wrapper — re-keyed on each visit so the move restarts. */}
                <div
                  key={active ? `${s.id}-on-${index}` : `${s.id}-off`}
                  className={cn("relative h-full w-full", active && env.ready && effectClass(s))}
                  style={active ? { animationDuration: `${effectMs(s)}ms` } : undefined}
                >
                  {s.fit === "contain" && (
                    // "Show whole photo": a soft, blurred copy fills the sides.
                    /* eslint-disable-next-line @next/next/no-img-element */
                    (s.type === "photo" || s.poster_url) ? <img src={s.type === "photo" ? s.url : s.poster_url!} alt="" aria-hidden="true"
                      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl brightness-75" /> : null
                  )}
                  {s.type === "video" ? (
                    <video
                      ref={(v) => { if (v) videos.current.set(s.id, v); else videos.current.delete(s.id); }}
                      src={s.url}
                      poster={s.poster_url ?? undefined}
                      muted
                      playsInline
                      loop={!multi}
                      preload={near ? "auto" : "none"}
                      onLoadedMetadata={(e) => measure(e.currentTarget.videoWidth, e.currentTarget.videoHeight, i)}
                      onEnded={() => { if (running) next(); else videos.current.get(s.id)?.play().catch(() => {}); }}
                      onError={() => { if (active && multi) next(); }}
                      className={cn("relative h-full w-full", s.fit === "contain" ? "object-contain" : "object-cover")}
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={s.url}
                      alt=""
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      onLoad={(e) => measure(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight, i)}
                      className={cn("relative h-full w-full", s.fit === "contain" ? "object-contain" : "object-cover")}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legibility: soft top shade for the header, deeper at the bottom for the title */}
      <div className="absolute inset-0 bg-linear-to-b from-ink-900/55 via-transparent to-ink-900/75" />
      {/* Darkens as we leave the shot */}
      <div className="absolute inset-0 bg-ink-900" style={{ opacity: "calc(var(--p, 0) * 0.7)" }} />

      <div
        className={cn("relative flex h-full flex-col justify-end px-4 sm:px-6 lg:px-8", compact ? "pb-16 sm:pb-20" : "pb-24 sm:pb-28")}
        style={{ transform: "translate3d(0, calc(var(--p, 0) * -120px), 0)", opacity: "calc(1 - var(--p, 0) * 1.6)" }}
      >
        <div className="mx-auto w-full max-w-7xl text-white">
          {data.branding?.hero.show_logo && data.logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={data.logo_url} alt="" className="animate-in fade-in mb-5 h-16 w-16 rounded-2xl bg-white/95 object-contain p-1.5 shadow-lg sm:h-20 sm:w-20" />
          )}
          <div className="animate-in slide-up-fade duration-500 text-[11px] font-semibold uppercase tracking-[0.3em] text-accent-300">
            {/* The line above the name (e.g. the trust) replaces "Welcome to" when set. */}
            {(data.branding?.hero.show_top && data.branding && lineFor(data.branding.top, lang)) || t("स्वागत आहे", "Welcome to")}
          </div>
          <h1
            className={cn(
              "animate-in slide-up-fade mt-4 max-w-5xl font-display font-semibold leading-[1.02] tracking-tight [animation-delay:120ms]",
              compact ? "text-3xl sm:text-5xl lg:text-6xl" : "text-5xl sm:text-7xl lg:text-8xl",
            )}
            style={{ animationDuration: "900ms" }}
          >
            {title}
          </h1>
          {data.branding?.hero.show_bottom && lineFor(data.branding.bottom, lang) && (
            <div className="animate-in slide-up-fade mt-4 max-w-3xl text-sm font-medium text-white/85 [animation-delay:240ms] sm:text-base">
              {lineFor(data.branding.bottom, lang)}
            </div>
          )}
        </div>
      </div>

      {/* Side arrows: always faint on touch screens, fade in on hover elsewhere. */}
      {multi && (["prev", "next"] as const).map((dir) => (
        <button
          key={dir}
          type="button"
          onClick={dir === "prev" ? prev : next}
          aria-label={dir === "prev" ? t("मागील स्लाइड", "Previous slide") : t("पुढील स्लाइड", "Next slide")}
          className={cn(
            "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink-900/30 text-white backdrop-blur-sm transition-all",
            "hover:scale-105 hover:bg-ink-900/55 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
            "opacity-60 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/hero:opacity-100",
            dir === "prev" ? "left-3 sm:left-5" : "right-3 sm:right-5",
          )}
        >
          {dir === "prev" ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
        </button>
      ))}

      {/* Slide controls */}
      {multi && (
        <div className="absolute bottom-6 right-4 z-10 flex items-center gap-2 sm:right-6 lg:right-8"
          style={{ opacity: "calc(1 - var(--p, 0) * 3)" }}>
          <button type="button" onClick={prev} aria-label={t("मागील स्लाइड", "Previous slide")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-0.5" role="group" aria-label={t("स्लाइड निवडा", "Choose slide")}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t(`स्लाइड ${i + 1}`, `Slide ${i + 1}`)}
                aria-current={i === current}
                // A tall, padded hit area around a thin bar — easy to tap.
                className="group/dot flex h-8 items-center px-1 focus-visible:outline-none"
              >
                <span className={cn(
                  "relative block h-1.5 overflow-hidden rounded-full transition-all duration-500 group-focus-visible/dot:ring-2 group-focus-visible/dot:ring-white",
                  i === current ? "w-10 bg-white/35" : "w-3 bg-white/40 group-hover/dot:bg-white/80",
                )}>
                  {/* Active dot fills up over the slide's time. */}
                  {i === current && (
                    <span
                      key={`${current}-${index}-${running}`}
                      className={cn("absolute inset-y-0 left-0 rounded-full bg-white", running && currentMs != null ? "slide-progress" : "w-full")}
                      style={running && currentMs != null ? { animationDuration: `${currentMs}ms` } : undefined}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <button type="button" onClick={next} aria-label={t("पुढील स्लाइड", "Next slide")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? t("चालू करा", "Play slideshow") : t("थांबवा", "Pause slideshow")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {paused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
          </button>
        </div>
      )}

      {/* Scroll cue */}
      {/* pointer-events-none: this full-width strip sits over the dots and used to swallow their clicks. */}
      <div className={cn("pointer-events-none absolute inset-x-0 bottom-6 justify-center",
        // On phones the slide controls take the bottom row; the hint would collide.
        compact ? "hidden" : multi ? "hidden sm:flex" : "flex")} style={{ opacity: "calc(1 - var(--p, 0) * 4)" }} aria-hidden="true">
        <div className="flex flex-col items-center gap-1 text-[10px] font-medium uppercase tracking-[0.3em] text-white/70">
          {t("खाली सरकवा", "Scroll")}
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
