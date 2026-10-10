import { createSupabaseServer } from "@/lib/supabase/server";
import { defaultSections, kindSpec, type HomeSection, type SitePage } from "@/lib/homeSections";

/**
 * A page's sections in order, hidden ones included (callers filter).
 * Until the admin has saved a layout (or before home_sections.sql has run)
 * this is the built-in default, so the site never renders empty.
 */
export async function loadHomeSections(page: SitePage = "home"): Promise<{ sections: HomeSection[]; saved: boolean }> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("home_sections")
    .select("id, page, kind, display_order, is_visible, content, config, items")
    .eq("page", page)
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) return { sections: defaultSections(page), saved: false };

  const sections = data
    .filter((r) => kindSpec(r.kind)) // ignore kinds this build doesn't know
    .map((r) => ({
      id: r.id,
      page,
      kind: r.kind,
      display_order: r.display_order,
      is_visible: r.is_visible,
      content: (r.content ?? {}) as HomeSection["content"],
      config: (r.config ?? {}) as HomeSection["config"],
      items: (Array.isArray(r.items) ? r.items : []) as HomeSection["items"],
    })) as HomeSection[];
  return { sections, saved: true };
}

