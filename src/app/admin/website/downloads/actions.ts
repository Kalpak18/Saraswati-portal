"use server";

import { toResult } from "@/lib/actionResult";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSignedDownloadUpload, deletePublicImage } from "@/lib/storage";
import { DOWNLOAD_CATEGORIES } from "@/lib/downloads";

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return supabase;
}

function revalidate() {
  revalidatePath("/academics/downloads");
  revalidatePath("/admin/website/downloads");
}

const DownloadSchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(1, "Enter a title").max(200),
  title_mr: z.string().trim().max(200).transform((v) => v || null).nullable(),
  description: z.string().max(1000).default(""),
  category: z.enum(DOWNLOAD_CATEGORIES.map((c) => c.key) as [string, ...string[]]),
  file_url: z.string().url("Upload the file first").max(500),
  file_name: z.string().max(200).nullable(),
  file_size: z.number().int().nonnegative().nullable(),
  is_published: z.boolean(),
});

async function saveDownload__impl(input: unknown) {
  const { id, ...row } = DownloadSchema.parse(input);
  const supabase = await requireUser();
  if (id) {
    const { data: before } = await supabase.from("downloads").select("file_url").eq("id", id).maybeSingle();
    const { error } = await supabase.from("downloads").update(row).eq("id", id);
    if (error) throw new Error(friendly(error.message));
    if (before?.file_url && before.file_url !== row.file_url) await deletePublicImage(before.file_url);
  } else {
    const { data: last } = await supabase.from("downloads").select("display_order")
      .order("display_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("downloads").insert({ ...row, display_order: (last?.display_order ?? -1) + 1 });
    if (error) throw new Error(friendly(error.message));
  }
  revalidate();
}

async function deleteDownload__impl(id: string) {
  const did = z.string().uuid().parse(id);
  const supabase = await requireUser();
  const { data: row } = await supabase.from("downloads").select("file_url").eq("id", did).maybeSingle();
  const { error } = await supabase.from("downloads").delete().eq("id", did);
  if (error) throw new Error(error.message);
  if (row?.file_url) await deletePublicImage(row.file_url);
  revalidate();
}

async function setDownloadPublished__impl(id: string, published: boolean) {
  const did = z.string().uuid().parse(id);
  const supabase = await requireUser();
  const { error } = await supabase.from("downloads").update({ is_published: !!published }).eq("id", did);
  if (error) throw new Error(error.message);
  revalidate();
}

/** One-time URL for the browser to upload a document directly. */
async function startDownloadUpload__impl(fileName: string) {
  await requireUser();
  return createSignedDownloadUpload(z.string().min(1).max(200).parse(fileName));
}

function friendly(msg: string) {
  return /downloads/.test(msg) && /exist|schema cache/.test(msg)
    ? "Run supabase/launch.sql in Supabase to enable Downloads."
    : msg;
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function saveDownload(...args: Parameters<typeof saveDownload__impl>) { return toResult(() => saveDownload__impl(...args)); }
export async function deleteDownload(...args: Parameters<typeof deleteDownload__impl>) { return toResult(() => deleteDownload__impl(...args)); }
export async function setDownloadPublished(...args: Parameters<typeof setDownloadPublished__impl>) { return toResult(() => setDownloadPublished__impl(...args)); }
export async function startDownloadUpload(...args: Parameters<typeof startDownloadUpload__impl>) { return toResult(() => startDownloadUpload__impl(...args)); }
