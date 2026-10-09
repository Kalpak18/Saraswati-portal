// Home hero slideshow — shared by the editor and the public page.

export type HeroSlide = {
  id: string;
  type: "photo" | "video";
  url: string;
  /** Video only: frame shown while it loads / on data-saver phones. Optional. */
  poster_url?: string | null;
  /**
   * Seconds this slide stays up, overriding the slideshow default.
   * For a video, null/undefined = play to the end.
   */
  duration?: number | null;
  /** Camera move for this slide, overriding the slideshow default. */
  effect?: HeroEffect | null;
  /** "fill" crops to fill the hero (default); "contain" shows the whole photo. */
  fit?: HeroFit | null;
};

export type HeroFit = "fill" | "contain";

/** How tall the hero is. "original" takes the first slide's own shape. */
export type HeroHeight = "full" | "tall" | "medium" | "short" | "original";
export const HERO_HEIGHTS: { key: HeroHeight; label: string; hint: string }[] = [
  { key: "full", label: "Full screen", hint: "Fills the whole window" },
  { key: "tall", label: "Tall", hint: "80% of the window" },
  { key: "medium", label: "Medium", hint: "60% of the window" },
  { key: "short", label: "Short", hint: "45% of the window" },
  { key: "original", label: "Original shape", hint: "Exactly the photo's own shape — nothing cut" },
];
export function heroHeightFromRow(row: { hero_height?: string | null } | null | undefined): HeroHeight {
  const v = row?.hero_height;
  return HERO_HEIGHTS.some((h) => h.key === v) ? (v as HeroHeight) : "full";
}

/** Camera moves for hero slides — each runs for exactly the slide's time. */
export type HeroEffect = "zoom-in" | "zoom-out" | "drone" | "drone-rise" | "pan-left" | "pan-right" | "none";
export const HERO_EFFECTS: { key: HeroEffect; label: string; hint: string }[] = [
  { key: "zoom-in", label: "Zoom in", hint: "Slow push towards the subject" },
  { key: "zoom-out", label: "Zoom out", hint: "Starts close, reveals the scene" },
  { key: "drone", label: "Drone orbit", hint: "Glides round the building as if circling it" },
  { key: "drone-rise", label: "Drone rise", hint: "Lifts up and pulls back over the campus" },
  { key: "pan-left", label: "Pan left", hint: "Slow glide across a wide photo" },
  { key: "pan-right", label: "Pan right", hint: "Slow glide the other way" },
  { key: "none", label: "Still", hint: "No movement" },
];
export const DEFAULT_HERO_EFFECT: HeroEffect = "zoom-in";

export function heroEffectOf(v: unknown): HeroEffect {
  return HERO_EFFECTS.some((e) => e.key === v) ? (v as HeroEffect) : DEFAULT_HERO_EFFECT;
}

type HeroRow = {
  slides?: unknown;
  slide_seconds?: number | null;
  slide_effect?: string | null;
  cover_photo_url?: string | null;
  cover_video_url?: string | null;
};

/** Slides from a hero_content row, falling back to the old single-slot fields. */
export function slidesFromRow(row: HeroRow | null | undefined): HeroSlide[] {
  if (!row) return [];
  if (Array.isArray(row.slides) && row.slides.length > 0) {
    return (row.slides as HeroSlide[]).filter(
      (s) => s && (s.type === "photo" || s.type === "video") && typeof s.url === "string" && s.url,
    );
  }
  if (row.cover_video_url) {
    return [{ id: "legacy-video", type: "video", url: row.cover_video_url, poster_url: row.cover_photo_url ?? null }];
  }
  if (row.cover_photo_url) return [{ id: "legacy-photo", type: "photo", url: row.cover_photo_url }];
  return [];
}

/** Default seconds per slide, and the range the editor offers. */
export const DEFAULT_SLIDE_SECONDS = 6;
export const SLIDE_SECONDS_CHOICES = [3, 4, 5, 6, 8, 10, 12, 15, 20] as const;

/** The slideshow's default seconds per slide from a hero_content row. */
export function slideSecondsFromRow(row: HeroRow | null | undefined): number {
  const n = Number(row?.slide_seconds);
  return Number.isFinite(n) && n >= 2 && n <= 60 ? n : DEFAULT_SLIDE_SECONDS;
}

/**
 * How long slide `s` stays up, in ms, or null to wait for a video to end.
 * Photos always get a time; videos only when the admin set one.
 */
export function slideDurationMs(s: HeroSlide, defaultSeconds: number): number | null {
  if (s.duration && s.duration > 0) return s.duration * 1000;
  return s.type === "photo" ? defaultSeconds * 1000 : null;
}

/** The slideshow's default camera move from a hero_content row. */
export function slideEffectFromRow(row: HeroRow | null | undefined): HeroEffect {
  return heroEffectOf(row?.slide_effect);
}
