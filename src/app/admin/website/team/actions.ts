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

function revalidate() {
  revalidatePath("/academics/faculty");
  revalidatePath("/admin/website/team");
}

const opt = (max: number) => z.string().trim().max(max).transform((v) => v || null).nullable();

const MemberSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(1, "Enter the name").max(200),
  designation: z.string().trim().min(1, "Enter the role, e.g. Principal or Maths teacher").max(200),
  designation_mr: opt(200),
  qualification: opt(200),
  subjects: opt(300),
  bio: z.string().max(2000).default(""),
  photo_url: z.string().max(500).nullable(),
  email: z.string().trim().max(200).refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email")
    .transform((v) => v || null).nullable(),
  phone: opt(40),
  show_contact: z.boolean(),
  category: z.enum(["leadership", "management", "faculty", "staff"]),
  is_active: z.boolean(),
});

async function saveMember__impl(input: unknown) {
  const { id, ...row } = MemberSchema.parse(input);
  const supabase = await requireUser();
  if (id) {
    const { data: before } = await supabase.from("team_members").select("photo_url").eq("id", id).maybeSingle();
    const { error } = await supabase.from("team_members").update(row).eq("id", id);
    if (error) throw new Error(friendly(error.message));
    if (before?.photo_url && before.photo_url !== row.photo_url) await deletePublicImage(before.photo_url);
  } else {
    const { data: last } = await supabase.from("team_members").select("display_order")
      .order("display_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("team_members").insert({ ...row, display_order: (last?.display_order ?? -1) + 1 });
    if (error) throw new Error(friendly(error.message));
  }
  revalidate();
}

async function deleteMember__impl(id: string) {
  const mid = z.string().uuid().parse(id);
  const supabase = await requireUser();
  const { data: row } = await supabase.from("team_members").select("photo_url").eq("id", mid).maybeSingle();
  const { error } = await supabase.from("team_members").delete().eq("id", mid);
  if (error) throw new Error(error.message);
  if (row?.photo_url) await deletePublicImage(row.photo_url);
  revalidate();
}

async function reorderMembers__impl(ids: string[]) {
  const list = z.array(z.string().uuid()).max(500).parse(ids);
  const supabase = await requireUser();
  for (let i = 0; i < list.length; i++) {
    const { error } = await supabase.from("team_members").update({ display_order: i }).eq("id", list[i]);
    if (error) throw new Error(error.message);
  }
  revalidate();
}

async function uploadMemberPhoto__impl(fd: FormData): Promise<{ url: string }> {
  await requireUser();
  const file = fd.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  return uploadPublicImage("team", file);
}

function friendly(msg: string) {
  return /designation_mr|qualification|subjects|show_contact/.test(msg)
    ? "Run supabase/launch.sql in Supabase to enable the new team fields."
    : msg;
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function saveMember(...args: Parameters<typeof saveMember__impl>) { return toResult(() => saveMember__impl(...args)); }
export async function deleteMember(...args: Parameters<typeof deleteMember__impl>) { return toResult(() => deleteMember__impl(...args)); }
export async function reorderMembers(...args: Parameters<typeof reorderMembers__impl>) { return toResult(() => reorderMembers__impl(...args)); }
export async function uploadMemberPhoto(...args: Parameters<typeof uploadMemberPhoto__impl>) { return toResult(() => uploadMemberPhoto__impl(...args)); }
