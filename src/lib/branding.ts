// School identity / letterhead: the lines above and below the school name,
// and where they (and the logo) appear. Safe for client and server.

export type BiText = { en: string; mr: string };

export type Branding = {
  /** Line above the name — e.g. the trust / society that runs the school. */
  top: BiText;
  /** Line below the name — e.g. board affiliation, UDISE / index number. */
  bottom: BiText;
  header: { show_top: boolean; show_bottom: boolean };
  footer: { show_top: boolean; show_bottom: boolean };
  hero: { show_logo: boolean; show_top: boolean; show_bottom: boolean };
  report: {
    show_top: boolean;
    show_bottom: boolean;
    show_address: boolean;
    align: "center" | "left";
    logo_position: "left" | "top" | "both" | "none";
    logo_size: "sm" | "md" | "lg";
    /** Which name(s) the printed report card uses. */
    name_lang: "en" | "mr" | "both";
  };
};

export const DEFAULT_BRANDING: Branding = {
  top: { en: "", mr: "" },
  bottom: { en: "", mr: "" },
  header: { show_top: true, show_bottom: false },
  footer: { show_top: true, show_bottom: true },
  hero: { show_logo: false, show_top: true, show_bottom: true },
  report: {
    show_top: true, show_bottom: true, show_address: true,
    align: "center", logo_position: "left", logo_size: "md", name_lang: "en",
  },
};

/** Saved branding merged over the defaults (missing keys = default). */
export function brandingFromRow(row: { branding?: unknown } | null | undefined): Branding {
  const b = (row?.branding && typeof row.branding === "object" ? row.branding : {}) as Partial<Branding>;
  const d = DEFAULT_BRANDING;
  return {
    top: { ...d.top, ...(b.top ?? {}) },
    bottom: { ...d.bottom, ...(b.bottom ?? {}) },
    header: { ...d.header, ...(b.header ?? {}) },
    footer: { ...d.footer, ...(b.footer ?? {}) },
    hero: { ...d.hero, ...(b.hero ?? {}) },
    report: { ...d.report, ...(b.report ?? {}) },
  };
}

/** Text in the visitor's language, falling back to the other. */
export function lineFor(t: BiText, lang: "mr" | "en"): string {
  return ((lang === "mr" ? t.mr || t.en : t.en || t.mr) ?? "").trim();
}
