"use server";

import { toResult } from "@/lib/actionResult";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/lib/storage";

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return supabase;
}

// Keeps Devanagari: "वार्षिक स्नेहसंमेलन 2026" → "वार्षिक-स्नेहसंमेलन-2026".
function slugify(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "event";
}

const EventSchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(1).max(200),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  description: z.string().max(5000).default(""),
  cover_photo_url: z.string().max(500).nullable(),
  is_published: z.boolean(),
  photos: z.array(z.object({
    photo_url: z.string().min(1).max(500),
    caption: z.string().max(300).nullable(),
  })).max(200),
});

async function saveEvent__impl(input: unknown): Promise<{ id: string; slug: string }> {
  const p = EventSchema.parse(input);
  const supabase = await requireUser();

  // Cover falls back to the first gallery photo so every event has a face.
  const cover = p.cover_photo_url ?? p.photos[0]?.photo_url ?? null;
  const row = {
    title: p.title,
    event_date: p.event_date,
    description: p.description,
    cover_photo_url: cover,
    is_published: p.is_published,
  };

  let id = p.id;
  let slug: string;
  let removedUrls: string[] = [];

  if (id) {
    const [{ data: before }, { data: oldPhotos }] = await Promise.all([
      supabase.from("events").select("slug, cover_photo_url").eq("id", id).maybeSingle(),
      supabase.from("event_photos").select("photo_url").eq("event_id", id),
    ]);
    if (!before) throw new Error("Event not found");
    slug = before.slug;
    const { error } = await supabase.from("events").update(row).eq("id", id);
    if (error) throw new Error(error.message);

    const keep = new Set([cover, ...p.photos.map((x) => x.photo_url)]);
    removedUrls = [before.cover_photo_url, ...(oldPhotos ?? []).map((x) => x.photo_url)]
      .filter((u): u is string => !!u && !keep.has(u));
  } else {
    const base = slugify(`${p.title}${p.event_date ? "-" + p.event_date.slice(0, 4) : ""}`);
    const { data: clash } = await supabase.from("events").select("slug").like("slug", `${base}%`);
    const taken = new Set((clash ?? []).map((c) => c.slug));
    slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    const { data, error } = await supabase.from("events").insert({ ...row, slug }).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "Could not create event");
    id = data.id;
  }

  // Replace the gallery in its new order.
  const { error: delErr } = await supabase.from("event_photos").delete().eq("event_id", id);
  if (delErr) throw new Error(delErr.message);
  if (p.photos.length > 0) {
    const { error: insErr } = await supabase.from("event_photos").insert(
      p.photos.map((x, i) => ({ event_id: id, photo_url: x.photo_url, caption: x.caption, display_order: i })),
    );
    if (insErr) throw new Error(insErr.message);
  }
  for (const u of new Set(removedUrls)) await deletePublicImage(u);

  revalidatePath("/");
  revalidatePath("/life");
  revalidatePath(`/life/${slug}`);
  revalidatePath("/admin/website/events");
  return { id: id!, slug };
}

async function deleteEvent__impl(id: string) {
  const eid = z.string().uuid().parse(id);
  const supabase = await requireUser();
  const [{ data: ev }, { data: photos }] = await Promise.all([
    supabase.from("events").select("cover_photo_url").eq("id", eid).maybeSingle(),
    supabase.from("event_photos").select("photo_url").eq("event_id", eid),
  ]);
  const { error } = await supabase.from("events").delete().eq("id", eid);
  if (error) throw new Error(error.message);
  const urls = new Set([ev?.cover_photo_url, ...(photos ?? []).map((x) => x.photo_url)].filter(Boolean) as string[]);
  for (const u of urls) await deletePublicImage(u);
  revalidatePath("/");
  revalidatePath("/life");
  revalidatePath("/admin/website/events");
}

async function uploadEventImage__impl(fd: FormData): Promise<{ url: string }> {
  await requireUser();
  const file = fd.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  return uploadPublicImage("events", file);
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function saveEvent(...args: Parameters<typeof saveEvent__impl>) { return toResult(() => saveEvent__impl(...args)); }
export async function deleteEvent(...args: Parameters<typeof deleteEvent__impl>) { return toResult(() => deleteEvent__impl(...args)); }
export async function uploadEventImage(...args: Parameters<typeof uploadEventImage__impl>) { return toResult(() => uploadEventImage__impl(...args)); }
