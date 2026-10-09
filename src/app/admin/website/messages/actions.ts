"use server";

import { toResult } from "@/lib/actionResult";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return supabase;
}

const Status = z.enum(["new", "read", "replied", "archived"]);

async function setMessageStatus__impl(id: string, status: string) {
  const mid = z.string().uuid().parse(id);
  const st = Status.parse(status);
  const supabase = await requireUser();
  const { error } = await supabase.from("contact_messages").update({ status: st }).eq("id", mid);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/website/messages");
  revalidatePath("/admin/website");
}

async function deleteMessage__impl(id: string) {
  const mid = z.string().uuid().parse(id);
  const supabase = await requireUser();
  const { error } = await supabase.from("contact_messages").delete().eq("id", mid);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/website/messages");
  revalidatePath("/admin/website");
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function setMessageStatus(...args: Parameters<typeof setMessageStatus__impl>) { return toResult(() => setMessageStatus__impl(...args)); }
export async function deleteMessage(...args: Parameters<typeof deleteMessage__impl>) { return toResult(() => deleteMessage__impl(...args)); }
