"use server";

import { toResult } from "@/lib/actionResult";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { uploadPublicImage } from "@/lib/storage";
import { KINDS, PAGES, defaultSections, newSection, type SectionKind, type SitePage } from "@/lib/homeSections";

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return supabase;
}

const PageEnum = z.enum(PAGES.map((p) => p.page) as [SitePage, ...SitePage[]]);

function revalidate() {
  for (const p of PAGES) {
    revalidatePath(p.href);
    revalidatePath(p.admin);
  }
}

// ============================================================
// Validation
// ============================================================
const Bi = z.object({ en: z.string().max(2000).default(""), mr: z.string().max(2000).default("") });
// Internal paths or web links only — never javascript: URLs.
const Href = z.string().trim().max(500)
  .refine((v) => v === "" || /^(\/|https?:\/\/|#)/.test(v), "Links must start with /, # or https://");

const Item = z.object({
  id: z.string().min(1).max(64),
  image_url: z.string().max(500).nullable().optional(),
  link_href: Href.nullable().optional(),
  icon: z.string().max(40).optional(),
  title: Bi.optional(),
  caption: Bi.optional(),
  body: Bi.optional(),
  quote: Bi.optional(),
  name: Bi.optional(),
  role: Bi.optional(),
});

const Section = z.object({
  id: z.string().uuid(),
  kind: z.enum(KINDS.map((k) => k.kind) as [SectionKind, ...SectionKind[]]),
  is_visible: z.boolean(),
  content: z.object({
    eyebrow: Bi.optional(),
    title: Bi.optional(),
    subtitle: Bi.optional(),
    body: Bi.optional(),
    button_label: Bi.optional(),
    button_href: Href.nullable().optional(),
    image_url: z.string().max(500).nullable().optional(),
    photos: z.array(Item).max(60).optional(),
  }),
  config: z.object({
    limit: z.number().int().min(1).max(24).optional(),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
    layout: z.enum(["auto", "grid", "masonry", "carousel", "split", "stacked"]).optional(),
    caption_style: z.enum(["overlay", "center", "below", "hidden"]).optional(),
    text_align: z.enum(["left", "center"]).optional(),
    split_side: z.enum(["left", "right", "alternate"]).optional(),
    split_size: z.enum(["half", "large", "small"]).optional(),
    image_side: z.enum(["left", "right"]).optional(),
    space_top: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
    space_bottom: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
    width: z.enum(["full", "wide", "medium", "narrow"]).optional(),
    gap: z.enum(["tight", "normal", "relaxed"]).optional(),
    photos_layout: z.enum(["grid", "masonry", "carousel", "split", "stacked"]).optional(),
    photos_columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
    photo_shape: z.enum(["original", "4:3", "16:9", "1:1", "3:4"]).optional(),
    photo_fit: z.enum(["fill", "contain"]).optional(),
    background: z.enum(["default", "white", "soft", "brand-soft", "warm", "ink", "brand", "deep", "image"]).optional(),
    bg_image: z.string().url().max(500).nullable().optional(),
    bg_overlay: z.number().int().min(0).max(90).optional(),
    heading_align: z.enum(["left", "center"]).optional(),
    heading_size: z.enum(["sm", "md", "lg"]).optional(),
    animation: z.enum(["fade-up", "fade", "zoom", "slide", "none"]).optional(),
    show_on: z.enum(["all", "desktop", "mobile"]).optional(),
    card_style: z.enum(["icon", "photo", "overlay"]).optional(),
    display: z.enum(["cards", "banners", "both"]).optional(),
    category: z.string().max(40).optional(),
    exam: z.string().max(200).optional(),
    min_level: z.string().max(40).optional(),
    align: z.enum(["left", "center"]).optional(),
  }),
  items: z.array(Item).max(120),
});

// ============================================================
// First open: save the default layout so it can be edited
// ============================================================
async function initPageLayout__impl(pageInput: SitePage) {
  const page = PageEnum.parse(pageInput);
  const supabase = await requireUser();
  const { count, error } = await supabase
    .from("home_sections").select("id", { count: "exact", head: true }).eq("page", page);
  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;

  const sections = defaultSections(page);

  // Carry banners uploaded on the old Banners page into the banner strip.
  const { data: banners } = await supabase
    .from("home_banners")
    .select("id, image_url, title, caption, link_href")
    .eq("is_published", true)
    .order("display_order");
  const strip = page === "home" ? sections.find((s) => s.kind === "banners") : undefined;
  if (strip && banners?.length) {
    strip.items = banners.map((b) => ({
      id: b.id,
      image_url: b.image_url,
      link_href: b.link_href,
      title: { en: b.title ?? "", mr: "" },
      caption: { en: b.caption ?? "", mr: "" },
    }));
  }

  const { error: insErr } = await supabase.from("home_sections").insert(
    sections.map(({ kind, display_order, is_visible, content, config, items }) =>
      ({ page, kind, display_order, is_visible, content, config, items })),
  );
  if (insErr) throw new Error(insErr.message);
  revalidate();
}

// ============================================================
// CRUD
// ============================================================
async function addSection__impl(kind: SectionKind, pageInput: SitePage) {
  const k = z.enum(KINDS.map((x) => x.kind) as [SectionKind, ...SectionKind[]]).parse(kind);
  const page = PageEnum.parse(pageInput);
  const supabase = await requireUser();
  const { data: last } = await supabase
    .from("home_sections").select("display_order").eq("page", page)
    .order("display_order", { ascending: false }).limit(1).maybeSingle();
  const s = newSection(k, (last?.display_order ?? -1) + 1, "");
  const { data, error } = await supabase.from("home_sections")
    .insert({ page, kind: s.kind, display_order: s.display_order, is_visible: true, content: s.content, config: s.config, items: s.items })
    .select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Could not add section");
  revalidate();
  return { id: data.id as string };
}

async function saveSection__impl(input: unknown) {
  const { id, kind: _kind, ...row } = Section.parse(input);
  void _kind; // a section's kind never changes
  const supabase = await requireUser();
  const { error } = await supabase.from("home_sections").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}

async function deleteSection__impl(id: string) {
  const sid = z.string().uuid().parse(id);
  const supabase = await requireUser();
  const { error } = await supabase.from("home_sections").delete().eq("id", sid);
  if (error) throw new Error(error.message);
  revalidate();
}

async function setSectionVisible__impl(id: string, visible: boolean) {
  const sid = z.string().uuid().parse(id);
  const supabase = await requireUser();
  const { error } = await supabase.from("home_sections").update({ is_visible: !!visible }).eq("id", sid);
  if (error) throw new Error(error.message);
  revalidate();
}

async function reorderSections__impl(ids: string[]) {
  const list = z.array(z.string().uuid()).max(100).parse(ids);
  const supabase = await requireUser();
  for (let i = 0; i < list.length; i++) {
    const { error } = await supabase.from("home_sections").update({ display_order: i }).eq("id", list[i]);
    if (error) throw new Error(error.message);
  }
  revalidate();
}

/** Copy a section (all its content and settings) right below the original. */
async function duplicateSection__impl(id: string) {
  const sid = z.string().uuid().parse(id);
  const supabase = await requireUser();
  const { data: src, error } = await supabase
    .from("home_sections").select("page, kind, display_order, is_visible, content, config, items").eq("id", sid).single();
  if (error || !src) throw new Error(error?.message ?? "Section not found");

  // Make room directly below the original.
  const { data: after } = await supabase
    .from("home_sections").select("id, display_order").eq("page", src.page).gt("display_order", src.display_order);
  for (const r of after ?? []) {
    await supabase.from("home_sections").update({ display_order: r.display_order + 1 }).eq("id", r.id);
  }
  const { data: copy, error: insErr } = await supabase.from("home_sections").insert({
    page: src.page, kind: src.kind, display_order: src.display_order + 1, is_visible: src.is_visible,
    content: src.content, config: src.config, items: src.items,
  }).select("id").single();
  if (insErr || !copy) throw new Error(insErr?.message ?? "Could not duplicate");
  revalidate();
  return { id: copy.id as string };
}

async function uploadSectionImage__impl(fd: FormData): Promise<{ url: string }> {
  await requireUser();
  const file = fd.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  return uploadPublicImage("banners", file);
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function initPageLayout(...args: Parameters<typeof initPageLayout__impl>) { return toResult(() => initPageLayout__impl(...args)); }
export async function addSection(...args: Parameters<typeof addSection__impl>) { return toResult(() => addSection__impl(...args)); }
export async function saveSection(...args: Parameters<typeof saveSection__impl>) { return toResult(() => saveSection__impl(...args)); }
export async function deleteSection(...args: Parameters<typeof deleteSection__impl>) { return toResult(() => deleteSection__impl(...args)); }
export async function setSectionVisible(...args: Parameters<typeof setSectionVisible__impl>) { return toResult(() => setSectionVisible__impl(...args)); }
export async function reorderSections(...args: Parameters<typeof reorderSections__impl>) { return toResult(() => reorderSections__impl(...args)); }
export async function duplicateSection(...args: Parameters<typeof duplicateSection__impl>) { return toResult(() => duplicateSection__impl(...args)); }
export async function uploadSectionImage(...args: Parameters<typeof uploadSectionImage__impl>) { return toResult(() => uploadSectionImage__impl(...args)); }
