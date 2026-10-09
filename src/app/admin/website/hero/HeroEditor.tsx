"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, Film, ImageIcon, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { VideoUpload } from "@/components/ui/VideoUpload";
import { HERO_EFFECTS, HERO_HEIGHTS, SLIDE_SECONDS_CHOICES, type HeroEffect, type HeroHeight, type HeroSlide } from "@/lib/hero";
import { saveHero, uploadHeroImage, startHeroVideoUpload } from "./actions";
import { cn } from "@/lib/utils";

// A slide being edited may not have its file uploaded yet.
type DraftSlide = Omit<HeroSlide, "url"> & { url: string | null };

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

export default function HeroEditor({
  initial, schoolName,
}: { initial: { title: string; slides: HeroSlide[]; slide_seconds: number; slide_effect: HeroEffect; hero_height: HeroHeight }; schoolName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initial.title);
  const [slides, setSlides] = useState<DraftSlide[]>(initial.slides);
  const [seconds, setSeconds] = useState(initial.slide_seconds);
  const [effect, setEffect] = useState<HeroEffect>(initial.slide_effect);
  const [height, setHeight] = useState<HeroHeight>(initial.hero_height);

  // Plays the slide's camera move right on its own photo / video box, looping
  // at the slide's real speed, so picking a move shows it immediately.
  const moveOn = (s: DraftSlide) => {
    const fx = s.effect ?? (s.type === "photo" ? effect : "none");
    const fit = s.fit === "contain" ? "object-contain bg-ink-900" : undefined;
    if (fx === "none" || !s.url) return fit ? { mediaClassName: fit } : {};
    const ms = (s.duration ?? (s.type === "photo" ? seconds : 12)) * 1000 + 1500;
    return {
      mediaClassName: cn(`fx-${fx}`, fit),
      mediaStyle: { animationDuration: `${ms}ms`, animationIterationCount: "infinite", animationDirection: "alternate" } as React.CSSProperties,
    };
  };

  const add = (type: "photo" | "video") =>
    setSlides((s) => [...s, { id: newId(), type, url: null, poster_url: null }]);
  const patch = (id: string, p: Partial<DraftSlide>) =>
    setSlides((s) => s.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const move = (i: number, d: -1 | 1) =>
    setSlides((s) => { const n = [...s]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const remove = (id: string) => setSlides((s) => s.filter((x) => x.id !== id));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Slides whose upload never finished are simply left out.
    const ready = slides.filter((s): s is HeroSlide => !!s.url);
    const skipped = slides.length - ready.length;
    startTransition(async () => {
      try {
        const res = await saveHero({ title, slides: ready, slide_seconds: seconds, slide_effect: effect, hero_height: height });
        setSlides(ready);
        if (res?.warning) toast.warning(res.warning);
        else toast.success(skipped ? `Saved — ${skipped} empty slide${skipped === 1 ? "" : "s"} left out` : "Home hero saved");
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumbs={[{ label: "Website", href: "/admin/website" }, { label: "Home hero" }]}
        title="Home hero"
        description="The full-screen opening of the home page. Add photos, videos or both — they play as a slideshow. Nothing is required."
        actions={
          <Link href="/" target="_blank"
            className="inline-flex items-center gap-1 rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-700 shadow-sm hover:bg-ink-50">
            <ExternalLink className="h-4 w-4" /> View live
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink-900">Slides</h2>
              <p className="mt-1 text-xs text-ink-500">
                Slides change on their own and fade into each other. Videos play to the end unless you set a time.
                A single video loops. With no slides, a calm school-colour background is shown.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" leftIcon={<ImageIcon className="h-4 w-4" />} onClick={() => add("photo")}>
                Add photo
              </Button>
              <Button type="button" size="sm" variant="secondary" leftIcon={<Film className="h-4 w-4" />} onClick={() => add("video")}>
                Add video
              </Button>

            </div>
          </div>

          {slides.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 text-sm font-medium text-ink-800">
                Camera move <span className="font-normal text-ink-500">— for photos; each slide can choose its own below</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {HERO_EFFECTS.map((fx) => (
                  <button key={fx.key} type="button" onClick={() => setEffect(fx.key)} aria-pressed={effect === fx.key}
                    title={fx.hint}
                    className={cn(
                      "group overflow-hidden rounded-lg border text-left text-xs transition-colors",
                      effect === fx.key ? "border-brand-500 ring-2 ring-brand-100" : "border-ink-200 hover:border-ink-300",
                    )}>
                    <EffectPreview effect={fx.key} src={slides.find((x) => x.type === "photo" && x.url)?.url ?? null} />
                    <div className="px-2 py-1.5">
                      <div className="font-medium text-ink-900">{fx.label}</div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-500">{HERO_EFFECTS.find((x) => x.key === effect)?.hint}. It plays on each slide&apos;s photo below.</p>
            </div>
          )}

          {slides.length > 1 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-brand-50/60 px-3 py-2.5 ring-1 ring-brand-100">
              <span className="text-sm font-medium text-ink-800">Time per slide</span>
              <div className="flex flex-wrap gap-1">
                {SLIDE_SECONDS_CHOICES.map((n) => (
                  <button key={n} type="button" onClick={() => setSeconds(n)} aria-pressed={seconds === n}
                    className={cn(
                      "h-8 min-w-10 rounded-md px-2 text-sm font-medium tabular-nums transition-colors",
                      seconds === n ? "bg-brand-700 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50",
                    )}>
                    {n}s
                  </button>
                ))}
              </div>
              <span className="text-xs text-ink-500">Each slide can override this below.</span>
            </div>
          )}

          {slides.length === 0 ? (
            <div className="mt-5 rounded-lg border-2 border-dashed border-ink-200 px-6 py-10 text-center text-sm text-ink-500">
              No slides yet — add a photo or a video of the school.
            </div>
          ) : (
            <ol className="mt-5 space-y-4">
              {slides.map((s, i) => (
                <li key={s.id} className="rounded-xl border border-ink-200 bg-ink-50/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
                      {s.type === "video" ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                      Slide {i + 1} · {s.type === "video" ? "Video" : "Photo"}
                    </span>
                    <div className="flex items-center gap-1">
                      <select
                        aria-label={`Fit for slide ${i + 1}`}
                        value={s.fit ?? "fill"}
                        onChange={(e) => patch(s.id, { fit: e.target.value === "contain" ? "contain" : null })}
                        className="h-8 rounded-md border border-ink-200 bg-white px-2 text-xs text-ink-700 focus:border-brand-500 focus:outline-none"
                      >
                        <option value="fill">Fill (crop edges)</option>
                        <option value="contain">Show whole {s.type === "video" ? "video" : "photo"}</option>
                      </select>
                      <select
                        aria-label={`Camera move for slide ${i + 1}`}
                        value={s.effect ?? ""}
                        onChange={(e) => patch(s.id, { effect: (e.target.value || null) as HeroEffect | null })}
                        className="h-8 rounded-md border border-ink-200 bg-white px-2 text-xs text-ink-700 focus:border-brand-500 focus:outline-none"
                      >
                        <option value="">
                          {s.type === "video" ? "No camera move" : `Default (${HERO_EFFECTS.find((x) => x.key === effect)?.label})`}
                        </option>
                        {HERO_EFFECTS.filter((x) => x.key !== "none" || s.type === "photo").map((x) => (
                          <option key={x.key} value={x.key}>{x.label}</option>
                        ))}
                      </select>
                      {slides.length > 1 && (
                        <select
                          aria-label={`Time for slide ${i + 1}`}
                          value={s.duration ?? ""}
                          onChange={(e) => patch(s.id, { duration: e.target.value ? Number(e.target.value) : null })}
                          className="mr-1 h-8 rounded-md border border-ink-200 bg-white px-2 text-xs text-ink-700 focus:border-brand-500 focus:outline-none"
                        >
                          <option value="">{s.type === "video" ? "Play whole video" : `Default (${seconds}s)`}</option>
                          {SLIDE_SECONDS_CHOICES.map((n) => <option key={n} value={n}>{s.type === "video" ? `Cut after ${n}s` : `${n} seconds`}</option>)}
                        </select>
                      )}
                      <IconButton label="Move up" size="sm" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></IconButton>
                      <IconButton label="Move down" size="sm" disabled={i === slides.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></IconButton>
                      <IconButton label="Remove slide" size="sm" tone="danger" onClick={() => remove(s.id)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                    </div>
                  </div>

                  {s.type === "photo" ? (
                    <div className="max-w-xl">
                      <ImageUpload
                        aspect="wide"
                        value={s.url}
                        onChange={(url) => patch(s.id, { url })}
                        onUpload={uploadHeroImage}
                        maxDimension={2400}
                        hint="Landscape photo of the building, assembly, campus or classrooms."
                        {...moveOn(s)}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                      <VideoUpload
                        value={s.url}
                        poster={s.poster_url}
                        onChange={(url) => patch(s.id, { url })}
                        onStart={startHeroVideoUpload}
                        hint="MP4, landscape, up to 50 MB. Plays muted."
                        {...moveOn(s)}
                      />
                      <div>
                        <div className="mb-1.5 text-sm font-medium text-ink-700">Preview frame <span className="font-normal text-ink-400">(optional)</span></div>
                        <ImageUpload
                          aspect="wide"
                          value={s.poster_url ?? null}
                          onChange={(url) => patch(s.id, { poster_url: url })}
                          onUpload={uploadHeroImage}
                          maxDimension={2400}
                          hint="Shown for a moment while the video loads, and instead of the video on phones saving data."
                        />
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="mb-1.5 text-sm font-medium text-ink-800">Hero height</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Hero height">
            {HERO_HEIGHTS.map((h) => (
              <button key={h.key} type="button" role="radio" aria-checked={height === h.key} onClick={() => setHeight(h.key)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-xs transition-colors",
                  height === h.key ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200 hover:bg-ink-50",
                )}>
                <HeightThumb h={h.key} />
                <span className="font-medium text-ink-900">{h.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-500">{HERO_HEIGHTS.find((x) => x.key === height)?.hint}.</p>
        </section>

        <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
          <Input
            label="Headline (optional)"
            placeholder={schoolName}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            hint="Large text over the slides. Leave blank to show the school name (in Marathi too)."
          />
        </section>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={pending} leftIcon={pending ? undefined : <Save className="h-4 w-4" />}>
            Save changes
          </Button>
        </div>
      </form>

    </div>
  );
}

/** Tile that previews a camera move on hover, using the first slide photo. */
function EffectPreview({ effect, src }: { effect: HeroEffect; src: string | null }) {
  return (
    <div className="relative aspect-video overflow-hidden bg-linear-to-br from-brand-300 via-brand-500 to-brand-800">
      {/* Plays on hover / keyboard focus via the .fx-prev rules in globals.css. */}
      <div className="fx-prev h-full w-full" data-fx={effect}>
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-end p-2">
            <div className="h-6 w-10 rounded-sm bg-white/70" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Sketch of the hero height against a browser window. */
function HeightThumb({ h }: { h: HeroHeight }) {
  const pct: Record<HeroHeight, string> = { full: "100%", tall: "80%", medium: "60%", short: "45%", original: "56%" };
  return (
    <span className="relative block h-12 w-16 overflow-hidden rounded border border-ink-300 bg-white" aria-hidden="true">
      <span className={cn("absolute inset-x-0 top-0 bg-linear-to-br from-brand-400 to-brand-700", h === "original" && "border-b-2 border-dashed border-white")}
        style={{ height: pct[h] }} />
    </span>
  );
}
