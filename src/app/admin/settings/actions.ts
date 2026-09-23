"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const SettingsSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).default(""),
});

export async function saveSettings(input: z.infer<typeof SettingsSchema>) {
  const parsed = SettingsSchema.parse(input);
  const supabase = await createSupabaseServer();
  const { data: existing } = await supabase.from("school_settings").select("id").limit(1).single();
  if (existing?.id) {
    const { error } = await supabase.from("school_settings").update(parsed).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("school_settings").insert(parsed);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/", "layout");
}

export async function uploadLogo(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file");
  if (file.size > 2 * 1024 * 1024) throw new Error("Max 2 MB");

  const admin = createSupabaseAdmin();
  const bucket = "public-assets";
  // Ensure bucket exists (idempotent-ish)
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.find((b) => b.name === bucket)) {
    await admin.storage.createBucket(bucket, { public: true });
  }

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `logo/logo-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || "image/png", upsert: true,
  });
  if (upErr) throw new Error(upErr.message);

  const { data: pub } = admin.storage.from(bucket).getPublicUrl(path);
  const url = pub.publicUrl;

  const supabase = await createSupabaseServer();
  const { data: existing } = await supabase.from("school_settings").select("id").limit(1).single();
  if (existing?.id) {
    await supabase.from("school_settings").update({ logo_url: url }).eq("id", existing.id);
  } else {
    await supabase.from("school_settings").insert({ name: "Saraswati School", logo_url: url });
  }
  revalidatePath("/", "layout");
  return { url };
}

export async function removeLogo() {
  const supabase = await createSupabaseServer();
  const { data: existing } = await supabase.from("school_settings").select("id").limit(1).single();
  if (existing?.id) {
    await supabase.from("school_settings").update({ logo_url: null }).eq("id", existing.id);
  }
  revalidatePath("/", "layout");
}
