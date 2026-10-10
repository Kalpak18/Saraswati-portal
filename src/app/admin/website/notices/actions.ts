"use server";

import { toResult } from "@/lib/actionResult";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSignedNoticeUpload, deletePublicImage } from "@/lib/storage";
import { NOTICE_CATEGORIES } from "@/lib/notices";

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return supabase;
}

function revalidate() {
  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/admin/website/notices");
}

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const NoticeSchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(1).max(200),
  body: z.string().max(5000).default(""),
  category: z.enum(NOTICE_CATEGORIES.map((c) => c.key) as [string, ...string[]]),
  // Internal paths or web links only — never javascript: URLs.
  link_href: z.string().trim().max(500).regex(/^(\/|https?:\/\/)/, "Link must start with / or https://").nullable(),
  attachment_url: z.string().max(500).nullable(),
  attachment_name: z.string().max(200).nullable(),
  is_pinned: z.boolean(),
  is_published: z.boolean(),
  publish_on: IsoDate,
  expires_on: IsoDate.nullable(),
}).refine((n) => !n.expires_on || n.expires_on >= n.publish_on, {
  message: "Expiry date must be on or after the publish date",
  path: ["expires_on"],
});

async function saveNotice__impl(input: unknown) {
  const { id, ...row } = NoticeSchema.parse(input);
  const supabase = await requireUser();
  if (id) {
    const { data: before } = await supabase.from("notices").select("attachment_url").eq("id", id).maybeSingle();
    const { error } = await supabase.from("notices").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    if (before?.attachment_url && before.attachment_url !== row.attachment_url) {
      await deletePublicImage(before.attachment_url);
    }
  } else {
    const { error } = await supabase.from("notices").insert(row);
    if (error) throw new Error(error.message);
  }
  revalidate();
}

async function deleteNotice__impl(id: string) {
  const nid = z.string().uuid().parse(id);
  const supabase = await requireUser();
  const { data: row } = await supabase.from("notices").select("attachment_url").eq("id", nid).maybeSingle();
  const { error } = await supabase.from("notices").delete().eq("id", nid);
  if (error) throw new Error(error.message);
  if (row?.attachment_url) await deletePublicImage(row.attachment_url);
  revalidate();
}

async function setNoticeFlags__impl(id: string, flags: { is_pinned?: boolean; is_published?: boolean }) {
  const nid = z.string().uuid().parse(id);
  const patch = z.object({ is_pinned: z.boolean().optional(), is_published: z.boolean().optional() }).parse(flags);
  const supabase = await requireUser();
  const { error } = await supabase.from("notices").update(patch).eq("id", nid);
  if (error) throw new Error(error.message);
  revalidate();
}

/** One-time URL for the browser to upload a PDF / image notice directly. */
async function startNoticeUpload__impl(fileName: string) {
  await requireUser();
  return createSignedNoticeUpload(z.string().min(1).max(200).parse(fileName));
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function saveNotice(...args: Parameters<typeof saveNotice__impl>) { return toResult(() => saveNotice__impl(...args)); }
export async function deleteNotice(...args: Parameters<typeof deleteNotice__impl>) { return toResult(() => deleteNotice__impl(...args)); }
export async function setNoticeFlags(...args: Parameters<typeof setNoticeFlags__impl>) { return toResult(() => setNoticeFlags__impl(...args)); }
export async function startNoticeUpload(...args: Parameters<typeof startNoticeUpload__impl>) { return toResult(() => startNoticeUpload__impl(...args)); }
