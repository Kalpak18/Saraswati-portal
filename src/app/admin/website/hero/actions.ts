"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/lib/storage";

const HeroSchema = z.object({
  title: z.string().max(200).default(""),
  tagline: z.string().max(500).default(""),
  meta_line: z.string().max(200).nullable().or(z.literal("").transform(() => null)),
  primary_cta_label: z.string().min(1).max(80),
  primary_cta_href: z.string().min(1).max(200),
  secondary_cta_label: z.string().max(80).nullable().or(z.literal("").transform(() => null)),
  secondary_cta_href: z.string().max(200).nullable().or(z.literal("").transform(() => null)),
  cover_photo_url: z.string().max(500).nullable().or(z.literal("").transform(() => null)),
});

export async function saveHero(input: unknown) {
  const p = HeroSchema.parse(input);
  const supabase = await createSupabaseServer();

  // Fetch existing so we can delete an orphaned old cover after the row updates.
  const { data: existing } = await supabase
    .from("hero_content")
    .select("id, cover_photo_url")
    .limit(1)
    .maybeSingle();

  const payload = {
    title: p.title,
    tagline: p.tagline,
    meta_line: p.meta_line,
    primary_cta_label: p.primary_cta_label,
    primary_cta_href: p.primary_cta_href,
    secondary_cta_label: p.secondary_cta_label,
    secondary_cta_href: p.secondary_cta_href,
    cover_photo_url: p.cover_photo_url,
  };

  if (existing?.id) {
    const { error } = await supabase.from("hero_content").update(payload).eq("id", existing.id);
    if (error) throw new Error(error.message);
    // If the cover changed to a different value (including null), remove the old file.
    if (existing.cover_photo_url && existing.cover_photo_url !== p.cover_photo_url) {
      await deletePublicImage(existing.cover_photo_url);
    }
  } else {
    const { error } = await supabase.from("hero_content").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/website/hero");
}

/** Server action wired to the ImageUpload primitive on the Hero editor. */
export async function uploadHeroImage(fd: FormData): Promise<{ url: string }> {
  const file = fd.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  const { url } = await uploadPublicImage("hero", file);
  return { url };
}
