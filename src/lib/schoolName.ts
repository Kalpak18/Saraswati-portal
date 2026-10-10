// Safe for client components (no server imports).

export const DEFAULT_NAME = "Saraswati Vidyalaya, Vasind";
export const DEFAULT_NAME_MR = "सरस्वती विद्यालय, वासिंद";

export const ESTABLISHED_YEAR = 1961;

/** "Since 1961" / "स्थापना १९६१" */
export function establishedLabel(lang: "mr" | "en"): string {
  return lang === "mr"
    ? `स्थापना ${String(ESTABLISHED_YEAR).replace(/\d/g, (d) => "०१२३४५६७८९"[Number(d)])}`
    : `Since ${ESTABLISHED_YEAR}`;
}

/** The school's name in the visitor's language (English when no Marathi name is set). */
export function schoolNameFor(
  school: { name: string | null; name_mr?: string | null },
  lang: "mr" | "en",
  fallback = DEFAULT_NAME,
): string {
  if (lang === "mr" && school.name_mr?.trim()) return school.name_mr.trim();
  return school.name?.trim() || fallback;
}
