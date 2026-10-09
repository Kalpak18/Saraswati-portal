import { cache } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { DEFAULT_NAME_MR } from "@/lib/schoolName";
import { themeFromRow, type Theme } from "@/lib/theme";
import { brandingFromRow, type Branding } from "@/lib/branding";

// Used until the admin sets their own values in Settings.
export const DEFAULT_ADDRESS = "Saraswati Vidyalaya, Savarkar Nagar, Ward No 3, Vasind, Maharashtra 421601";
export const DEFAULT_MAP_URL = "https://maps.app.goo.gl/YTZigfPcgZAeXGnV6";

export type SchoolInfo = {
  name: string | null;
  name_mr: string;
  address: string;
  map_url: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  office_hours: string | null;
  office_hours_mr: string | null;
  theme: Theme;
  branding: Branding;
};

// cache(): the layout and the page both ask; one query per request.
export const getSchoolInfo = cache(async (): Promise<SchoolInfo> => {
  const supabase = await createSupabaseServer();
  // select("*") so this keeps working whichever migrations have run —
  // columns that don't exist yet simply come back undefined.
  const { data } = await supabase.from("school_settings").select("*").limit(1).maybeSingle();
  const row = (data ?? {}) as Record<string, string | null | undefined>;
  const text = (k: string) => row[k]?.trim() || null;
  return {
    name: text("name"),
    name_mr: text("name_mr") || DEFAULT_NAME_MR,
    address: text("address") || DEFAULT_ADDRESS,
    map_url: text("map_url") || DEFAULT_MAP_URL,
    logo_url: text("logo_url"),
    phone: text("phone"),
    email: text("email"),
    office_hours: text("office_hours"),
    office_hours_mr: text("office_hours_mr"),
    theme: themeFromRow(data as { theme?: unknown } | null),
    branding: brandingFromRow(data as { branding?: unknown } | null),
  };
});

// Embeddable map for the address — no API key needed for this form.
export function mapEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

