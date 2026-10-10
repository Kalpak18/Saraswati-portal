"use server";

import { toResult } from "@/lib/actionResult";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { uploadPublicImage, deletePublicImage, createSignedVideoUpload } from "@/lib/storage";
import { slidesFromRow } from "@/lib/hero";

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return supabase;
}

const Slide = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(["photo", "video"]),
  url: z.string().url().max(500),
  poster_url: z.string().url().max(500).nullable().optional(),
  duration: z.number().int().min(2).max(60).nullable().optional(),
  effect: z.enum(["zoom-in", "zoom-out", "drone", "drone-rise", "pan-left", "pan-right", "none"]).nullable().optional(),
  fit: z.enum(["fill", "contain"]).nullable().optional(),
});

// Nothing is required: no slides = the calm brand-colour background.
const HeroSchema = z.object({
  title: z.string().max(200).default(""),
  slides: z.array(Slide).max(12),
  slide_seconds: z.number().int().min(2).max(60).default(6),
  slide_effect: z.enum(["zoom-in", "zoom-out", "drone", "drone-rise", "pan-left", "pan-right", "none"]).default("zoom-in"),
  hero_height: z.enum(["full", "tall", "medium", "short", "original"]).default("full"),
});

const urlsOf = (slides: z.infer<typeof Slide>[]) =>
  new Set(slides.flatMap((s) => [s.url, s.poster_url ?? null]).filter((u): u is string => !!u));

async function saveHero__impl(input: unknown): Promise<{ warning?: string }> {
  const p = HeroSchema.parse(input);
  const supabase = await requireUser();

  const { data: existing } = await supabase
    .from("hero_content")
    .select("id, slides, cover_photo_url, cover_video_url")
    .limit(1)
    .maybeSingle();

  // Keep the old single-slot columns in step with the first slide, so
  // anything still reading them shows something sensible.
  const first = p.slides[0];
  const payload: Record<string, unknown> = {
    title: p.title,
    slides: p.slides,
    slide_seconds: p.slide_seconds,
    slide_effect: p.slide_effect,
    hero_height: p.hero_height,
    media_type: first?.type ?? "photo",
    cover_photo_url: first ? (first.type === "photo" ? first.url : first.poster_url ?? null) : null,
    cover_video_url: first?.type === "video" ? first.url : null,
  };

  let warning: string | undefined;
  if (existing?.id) {
    let { error } = await supabase.from("hero_content").update(payload).eq("id", existing.id);
    if (error && /slide_seconds|slide_effect|hero_height/.test(error.message)) {
      // Columns not added yet: save everything else, per-slide settings included.
      delete payload.slide_seconds;
      delete payload.slide_effect;
      delete payload.hero_height;
      ({ error } = await supabase.from("hero_content").update(payload).eq("id", existing.id));
      warning = "Saved. Run the latest supabase/home_story.sql to store the hero height (full screen is used until then).";
    }
    if (error) {
      if (/slides/.test(error.message)) throw new Error("Run the latest supabase/home_story.sql to enable the hero slideshow.");
      throw new Error(error.message);
    }
    // Delete files no longer used by any slide.
    const keep = urlsOf(p.slides);
    const before = urlsOf(slidesFromRow(existing));
    for (const u of [existing.cover_photo_url, existing.cover_video_url]) if (u) before.add(u);
    for (const u of before) if (!keep.has(u)) await deletePublicImage(u);
  } else {
    const { error } = await supabase.from("hero_content").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/website/hero");
  return { warning };
}

async function uploadHeroImage__impl(fd: FormData): Promise<{ url: string }> {
  await requireUser();
  const file = fd.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  return uploadPublicImage("hero", file);
}

/** Hands the browser a one-time URL to upload a hero video directly. */
async function startHeroVideoUpload__impl(fileName: string) {
  await requireUser();
  return createSignedVideoUpload(z.string().min(1).max(200).parse(fileName));
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function saveHero(...args: Parameters<typeof saveHero__impl>) { return toResult(() => saveHero__impl(...args)); }
export async function uploadHeroImage(...args: Parameters<typeof uploadHeroImage__impl>) { return toResult(() => uploadHeroImage__impl(...args)); }
export async function startHeroVideoUpload(...args: Parameters<typeof startHeroVideoUpload__impl>) { return toResult(() => startHeroVideoUpload__impl(...args)); }
