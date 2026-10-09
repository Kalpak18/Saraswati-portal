"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/lib/storage";
import { ACCENT_PRESETS, BRAND_PRESETS, CORNER_STYLES, HEADING_FONTS } from "@/lib/theme";

const SettingsSchema = z.object({
  name: z.string().min(1).max(200),
  name_mr: z.string().trim().max(200).transform((v) => v || null).optional(),
  phone: z.string().trim().max(40)
    .refine((v) => v === "" || /^[+\d][\d\s\-()]{5,}$/.test(v), "Enter a valid phone number")
    .transform((v) => v || null).optional(),
  email: z.string().trim().max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email")
    .transform((v) => v || null).optional(),
  office_hours: z.string().trim().max(120).transform((v) => v || null).optional(),
  office_hours_mr: z.string().trim().max(120).transform((v) => v || null).optional(),
  address: z.string().max(500).default(""),
  // Only real web links — this ends up in an <a href> on the public site.
  map_url: z.string().trim().max(500)
    .refine((v) => v === "" || /^https:\/\//.test(v), "Map link must start with https://")
    .transform((v) => v || null)
    .optional(),
});

export async function saveSettings(input: z.input<typeof SettingsSchema>) {
  const parsed = SettingsSchema.parse(input);
  const supabase = await createSupabaseServer();
  const { data: existing } = await supabase.from("school_settings").select("id").limit(1).single();

  const write = (row: Record<string, unknown>) =>
    existing?.id
      ? supabase.from("school_settings").update(row).eq("id", existing.id)
      : supabase.from("school_settings").insert(row);

  let { error } = await write(parsed);
  // Before supabase/home_story.sql adds map_url / name_mr, still save the rest.
  if (error && /map_url|name_mr|phone|email|office_hours/.test(error.message)) {
    const { name, address } = parsed;
    ({ error } = await write({ name, address }));
    if (!error) throw new Error("Saved name and address only. Run supabase/home_story.sql and supabase/home_sections.sql to store the rest.");
  }
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return supabase;
}

// Raster images only: an SVG can carry script, and anything else isn't a logo.
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function uploadLogo(formData: FormData) {
  // Uploads go through the full-access storage key, so the caller must be
  // a signed-in admin — RLS can't protect this path.
  const supabase = await requireUser();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file");
  if (file.size > 2 * 1024 * 1024) throw new Error("Max 2 MB");
  if (!LOGO_TYPES.includes(file.type)) throw new Error("Logo must be a PNG, JPG, WebP or GIF image");

  const { url } = await uploadPublicImage("logo", file);

  const { data: existing } = await supabase.from("school_settings").select("id, logo_url").limit(1).single();
  if (existing?.id) {
    await supabase.from("school_settings").update({ logo_url: url }).eq("id", existing.id);
    if (existing.logo_url && existing.logo_url !== url) await deletePublicImage(existing.logo_url);
  } else {
    await supabase.from("school_settings").insert({ name: "Saraswati Vidyalaya, Vasind", logo_url: url });
  }
  revalidatePath("/", "layout");
  return { url };
}
export async function removeLogo() {
  const supabase = await requireUser();
  const { data: existing } = await supabase.from("school_settings").select("id, logo_url").limit(1).single();
  if (existing?.id) {
    await supabase.from("school_settings").update({ logo_url: null }).eq("id", existing.id);
    if (existing.logo_url) await deletePublicImage(existing.logo_url);
  }
  revalidatePath("/", "layout");
}

// ============================================================
// Appearance (site-wide theme)
// ============================================================
const ThemeSchema = z.object({
  brand: z.enum(BRAND_PRESETS.map((b) => b.key) as [string, ...string[]]),
  accent: z.enum(ACCENT_PRESETS.map((a) => a.key) as [string, ...string[]]),
  heading_font: z.enum(HEADING_FONTS.map((f) => f.key) as [string, ...string[]]),
  corners: z.enum(CORNER_STYLES.map((c) => c.key) as [string, ...string[]]),
});

export async function saveTheme(input: unknown) {
  const theme = ThemeSchema.parse(input);
  const supabase = await createSupabaseServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not signed in");
  const { data: existing } = await supabase.from("school_settings").select("id").limit(1).single();
  if (!existing?.id) throw new Error("Save the school name first");
  const { error } = await supabase.from("school_settings").update({ theme }).eq("id", existing.id);
  if (error) {
    if (/theme/.test(error.message)) throw new Error("Run the latest supabase/home_sections.sql to enable Appearance.");
    throw new Error(error.message);
  }
  // Every page reads the theme from the root layout.
  revalidatePath("/", "layout");
}
