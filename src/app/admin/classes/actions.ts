"use server";

import { toResult } from "@/lib/actionResult";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { normalizeDivision, normalizeStandard } from "@/lib/i18n/normalize";

// ------------------------------------------------------------
// Standards
// ------------------------------------------------------------
const StandardSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  academic_year: z.string().min(1).max(20),
  display_order: z.number().int().default(0),
});

async function saveStandard__impl(input: z.infer<typeof StandardSchema>) {
  const parsed = StandardSchema.parse(input);
  // Canonicalize standard name: 10 / 10th / १० वी → "१० वी"
  const canonicalName = normalizeStandard(parsed.name) ?? parsed.name.trim();
  const supabase = await createSupabaseServer();
  if (parsed.id) {
    const { error } = await supabase.from("standards")
      .update({ name: canonicalName, academic_year: parsed.academic_year, display_order: parsed.display_order })
      .eq("id", parsed.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("standards")
      .insert({ name: canonicalName, academic_year: parsed.academic_year, display_order: parsed.display_order });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/classes");
  revalidatePath("/admin");
}

async function deleteStandard__impl(id: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("standards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/classes");
  revalidatePath("/admin");
}

// ------------------------------------------------------------
// Divisions
// ------------------------------------------------------------
const DivisionSchema = z.object({
  id: z.string().uuid().optional(),
  standard_id: z.string().uuid(),
  name: z.string().min(1).max(50),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
});

async function saveDivision__impl(input: z.infer<typeof DivisionSchema>) {
  const parsed = DivisionSchema.parse(input);
  // Canonicalize division name: A/1/अ → "अ"
  const canonicalName = normalizeDivision(parsed.name) ?? parsed.name.trim();
  const supabase = await createSupabaseServer();
  if (parsed.id) {
    const { error } = await supabase.from("divisions").update({
      standard_id: parsed.standard_id,
      name: canonicalName,
      is_active: parsed.is_active,
      display_order: parsed.display_order,
    }).eq("id", parsed.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("divisions").insert({
      standard_id: parsed.standard_id,
      name: canonicalName,
      is_active: parsed.is_active,
      display_order: parsed.display_order,
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/classes");
  revalidatePath("/admin");
}

async function deleteDivision__impl(id: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("divisions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/classes");
  revalidatePath("/admin");
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function saveStandard(...args: Parameters<typeof saveStandard__impl>) { return toResult(() => saveStandard__impl(...args)); }
export async function deleteStandard(...args: Parameters<typeof deleteStandard__impl>) { return toResult(() => deleteStandard__impl(...args)); }
export async function saveDivision(...args: Parameters<typeof saveDivision__impl>) { return toResult(() => saveDivision__impl(...args)); }
export async function deleteDivision(...args: Parameters<typeof deleteDivision__impl>) { return toResult(() => deleteDivision__impl(...args)); }
