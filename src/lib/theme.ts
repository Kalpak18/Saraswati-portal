// Site-wide appearance (Admin → Settings → Appearance).
//
// The whole UI is styled with Tailwind's brand-*/accent-* colours, the
// display font and the radius scale — all CSS variables. A saved theme
// simply redefines those variables at :root, so one choice recolours every
// button, link, heading and card at once. Safe for client and server.

type Scale = Record<"50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "950", string>;

export const BRAND_PRESETS: { key: string; label: string; scale: Scale }[] = [
  { key: "teal", label: "Teal (default)", scale: {
    50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6",
    600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" } },
  { key: "blue", label: "Royal blue", scale: {
    50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6",
    600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554" } },
  { key: "indigo", label: "Indigo", scale: {
    50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1",
    600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b" } },
  { key: "maroon", label: "Maroon", scale: {
    50: "#fdf2f4", 100: "#fce7eb", 200: "#f9d0da", 300: "#f4a9bb", 400: "#ec7896", 500: "#df4d74",
    600: "#c92d5b", 700: "#a91f4a", 800: "#8d1c42", 900: "#771b3d", 950: "#42091e" } },
  { key: "green", label: "Green", scale: {
    50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981",
    600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#022c22" } },
  { key: "saffron", label: "Saffron", scale: {
    50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316",
    600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407" } },
  { key: "purple", label: "Purple", scale: {
    50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6",
    600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065" } },
  { key: "navy", label: "Navy", scale: {
    50: "#f0f5fb", 100: "#dde8f5", 200: "#c2d6ed", 300: "#98bbe1", 400: "#6898d1", 500: "#467bc4",
    600: "#3462a8", 700: "#2c4f89", 800: "#284472", 900: "#253b5f", 950: "#18253e" } },
];

export const ACCENT_PRESETS: { key: string; label: string; scale: Partial<Scale> }[] = [
  { key: "amber", label: "Amber (default)", scale: {
    50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309" } },
  { key: "orange", label: "Orange", scale: {
    50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c" } },
  { key: "gold", label: "Gold", scale: {
    50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207" } },
  { key: "rose", label: "Rose", scale: {
    50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c" } },
  { key: "sky", label: "Sky", scale: {
    50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1" } },
];

export const HEADING_FONTS: { key: string; label: string; hint: string; css: string }[] = [
  { key: "fraunces", label: "Elegant serif", hint: "Warm, classic school feel (default)", css: "var(--font-fraunces), Georgia, serif" },
  { key: "playfair", label: "Classic serif", hint: "Formal, traditional", css: "var(--font-playfair), Georgia, serif" },
  { key: "poppins", label: "Modern sans", hint: "Clean and friendly", css: "var(--font-poppins), var(--font-inter), sans-serif" },
  { key: "inter", label: "Simple sans", hint: "Plain and neutral", css: "var(--font-inter), sans-serif" },
];

export const CORNER_STYLES: { key: string; label: string; radius: Record<string, string> }[] = [
  { key: "sharp", label: "Sharp", radius: { md: "0.25rem", lg: "0.25rem", xl: "0.375rem", "2xl": "0.5rem", "3xl": "0.625rem" } },
  // Tailwind's own scale — only written out for the settings preview.
  { key: "soft", label: "Soft (default)", radius: { md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem" } },
  { key: "round", label: "Round", radius: { md: "0.5rem", lg: "0.75rem", xl: "1rem", "2xl": "1.5rem", "3xl": "2.25rem" } },
];

export type Theme = { brand?: string; accent?: string; heading_font?: string; corners?: string };

/**
 * CSS that applies a theme by redefining the design-token variables at :root.
 * Defaults are skipped (the stylesheet already has them) unless `full` —
 * the settings preview needs every value so it can show the default too.
 */
export function themeCss(t: Theme | null | undefined, full = false): string {
  if (!t) return "";
  const vars: string[] = [];
  const brand = BRAND_PRESETS.find((b) => b.key === (t.brand ?? (full ? "teal" : "")) && (full || b.key !== "teal"));
  if (brand) for (const [k, v] of Object.entries(brand.scale)) vars.push(`--color-brand-${k}:${v}`);
  const accent = ACCENT_PRESETS.find((a) => a.key === (t.accent ?? (full ? "amber" : "")) && (full || a.key !== "amber"));
  if (accent) for (const [k, v] of Object.entries(accent.scale)) vars.push(`--color-accent-${k}:${v}`);
  const font = HEADING_FONTS.find((f) => f.key === (t.heading_font ?? (full ? "fraunces" : "")) && (full || f.key !== "fraunces"));
  if (font) vars.push(`--font-display:${font.css}`);
  const corners = CORNER_STYLES.find((c) => c.key === (t.corners ?? (full ? "soft" : "")) && (full || c.key !== "soft"));
  if (corners) for (const [k, v] of Object.entries(corners.radius)) vars.push(`--radius-${k}:${v}`);
  return vars.length ? `:root{${vars.join(";")}}` : "";
}

export function themeFromRow(row: { theme?: unknown } | null | undefined): Theme {
  const t = row?.theme;
  return t && typeof t === "object" ? (t as Theme) : {};
}
