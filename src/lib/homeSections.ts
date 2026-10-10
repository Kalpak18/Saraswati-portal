// Home page builder — the section catalogue.
//
// The home page is an ordered list of sections. Each has a `kind` (what it
// shows), bilingual headings the admin can rename, kind-specific `config`
// (filters, limits, display mode) and, for hand-made content, `items`
// (banner images, facility cards, testimonials).
//
// Safe for client components: no server imports here.

import { ESTABLISHED_YEAR } from "@/lib/schoolName";

export type Lang = "mr" | "en";
export type Bi = { en: string; mr: string };
export const bi = (en = "", mr = ""): Bi => ({ en, mr });

/** Pages built from sections. */
export type SitePage = "home" | "about";
export const PAGES: { page: SitePage; label: string; href: string; admin: string }[] = [
  { page: "home", label: "Home page", href: "/", admin: "/admin/website/home" },
  { page: "about", label: "About page", href: "/about", admin: "/admin/website/about" },
];

const MR_DIGITS = "०१२३४५६७८९";
const mrNum = (n: number) => String(n).replace(/\d/g, (d) => MR_DIGITS[Number(d)]);

/**
 * Text in the visitor's language, falling back to the other one.
 * `{years}` and `{since}` fill in live, so "65 years" never goes stale.
 */
export function pick(v: Bi | undefined | null, lang: Lang): string {
  if (!v) return "";
  const raw = (lang === "mr" ? v.mr || v.en : v.en || v.mr) ?? "";
  if (!raw.includes("{")) return raw;
  const years = new Date().getFullYear() - ESTABLISHED_YEAR;
  return raw
    .replaceAll("{years}", lang === "mr" ? mrNum(years) : String(years))
    .replaceAll("{since}", lang === "mr" ? mrNum(ESTABLISHED_YEAR) : String(ESTABLISHED_YEAR));
}

export type SectionKind =
  | "intro" | "ticker" | "statement" | "notices" | "banners" | "toppers" | "achievements"
  | "events" | "facilities" | "gallery" | "testimonials" | "text" | "cta";

export type ItemKind = "banner" | "facility" | "testimonial" | "photo";

export type SectionItem = {
  id: string;
  image_url?: string | null;
  link_href?: string | null;
  icon?: string;
  title?: Bi;
  caption?: Bi;
  body?: Bi;
  quote?: Bi;
  name?: Bi;
  role?: Bi;
};

export type SectionContent = {
  eyebrow?: Bi;
  title?: Bi;
  subtitle?: Bi;
  body?: Bi;
  button_label?: Bi;
  button_href?: string | null;
  image_url?: string | null;
  /** Extra photos shown with any section (with captions). */
  photos?: SectionItem[];
};

/** How data sections present themselves. */
export type DisplayMode = "cards" | "banners" | "both";

export type SectionConfig = {
  limit?: number;
  display?: DisplayMode;          // achievements / events
  category?: string;              // achievements: competitive | sports | …
  exam?: string;                  // achievements: one exam only
  min_level?: string;             // achievements: e.g. "district" and above
  align?: "left" | "center";      // text
  columns?: Columns;              // items per row on large screens (default: fit the count)
  layout?: Layout;                // how the items are arranged
  card_style?: CardStyle;         // feature cards: how each card looks
  image_side?: "left" | "right";  // text block: which side the photo sits on
  // Spacing (any section)
  space_top?: Space;
  space_bottom?: Space;
  width?: Width;
  gap?: Gap;
  // Extra photos (any section)
  photos_layout?: PhotoLayout;
  photos_columns?: Columns;
  // How this section's photos are framed (gallery, extra photos, cards,
  // banners, text-block photo, event covers)
  photo_shape?: PhotoShape;
  photo_fit?: PhotoFit;
  // How captions / descriptions sit with photos (gallery + extra photos)
  caption_style?: CaptionStyle;
  text_align?: "left" | "center";
  split_side?: "left" | "right" | "alternate";
  split_size?: "half" | "large" | "small";
  // Design (any section)
  background?: SectionBg;
  bg_image?: string | null;       // background photo (background = "image")
  bg_overlay?: number;            // 0–90: how strongly the photo is tinted for legibility
  heading_align?: "left" | "center";
  heading_size?: "sm" | "md" | "lg";
  animation?: Animation;
  show_on?: "all" | "desktop" | "mobile";
};

/**
 * Section backgrounds. Each section is designed for light or dark text
 * (its "tone"), so it is offered the backgrounds that keep that text
 * readable; a background photo gets a matching tint.
 */
export type SectionBg =
  | "default" | "white" | "soft" | "brand-soft" | "warm"   // light
  | "ink" | "brand" | "deep"                              // dark
  | "image";
export const LIGHT_BGS: { key: SectionBg; label: string; swatch: string }[] = [
  { key: "white", label: "White", swatch: "#ffffff" },
  { key: "soft", label: "Soft grey", swatch: "var(--color-ink-100)" },
  { key: "brand-soft", label: "Soft brand", swatch: "var(--color-brand-50)" },
  { key: "warm", label: "Warm", swatch: "var(--color-accent-50)" },
];
export const DARK_BGS: { key: SectionBg; label: string; swatch: string }[] = [
  { key: "ink", label: "Dark", swatch: "var(--color-ink-900)" },
  { key: "brand", label: "Brand", swatch: "var(--color-brand-800)" },
  { key: "deep", label: "Deep brand", swatch: "var(--color-brand-950)" },
];
/** Kinds whose text is white on a dark band. Everything else is dark-on-light. */
const DARK_KINDS: SectionKind[] = ["achievements", "banners", "cta"];
export const toneOf = (kind: SectionKind): "light" | "dark" => (DARK_KINDS.includes(kind) ? "dark" : "light");

export type Animation = "fade-up" | "fade" | "zoom" | "slide" | "none";
export const ANIMATIONS: { key: Animation; label: string }[] = [
  { key: "fade-up", label: "Fade up" },
  { key: "fade", label: "Fade" },
  { key: "zoom", label: "Zoom" },
  { key: "slide", label: "Slide in" },
  { key: "none", label: "None" },
];

/** Section-wide design choices that components read through context. */
export type SectionDesign = {
  headingAlign?: "left" | "center";
  headingSize?: "sm" | "md" | "lg";
  animation?: Animation;
};

/** Photo arrangements: the shared three plus one-per-row ones with room for text. */
export type PhotoLayout = "grid" | "masonry" | "carousel" | "split" | "stacked";
export const PHOTO_LAYOUTS: { key: PhotoLayout; label: string; hint: string }[] = [
  { key: "grid", label: "Grid", hint: "Even rows" },
  { key: "masonry", label: "Masonry", hint: "Staggered, keeps photo shapes" },
  { key: "carousel", label: "Carousel", hint: "Swipeable row" },
  { key: "split", label: "Photo + text", hint: "One per row, text beside the photo" },
  { key: "stacked", label: "Stacked", hint: "One per row, text below the photo" },
];

export type CaptionStyle = "overlay" | "center" | "below" | "hidden";
export const CAPTION_STYLES: { key: CaptionStyle; label: string }[] = [
  { key: "overlay", label: "On photo, bottom" },
  { key: "center", label: "On photo, middle" },
  { key: "below", label: "Below photo" },
  { key: "hidden", label: "Hidden" },
];

/** Site pages a link can point to — used to warn about typos like "/link". */
export const SITE_PATHS = [
  "/", "/about", "/achievements", "/notices", "/life", "/contact", "/lookup",
  "/academics/toppers", "/academics/faculty", "/academics/downloads",
];
export function isKnownLink(href: string): boolean {
  const h = href.trim();
  if (!h || /^https?:\/\//.test(h) || h.startsWith("#") || h.startsWith("mailto:") || h.startsWith("tel:")) return true;
  const path = h.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  return SITE_PATHS.includes(path) || path.startsWith("/life/");
}

/** "fill" crops to the shape; "contain" shows the whole photo inside it. */
export type PhotoFit = "fill" | "contain";

export type PhotoShape = "original" | "4:3" | "16:9" | "1:1" | "3:4";
export const PHOTO_SHAPES: { key: PhotoShape; label: string }[] = [
  { key: "original", label: "Original (no crop)" },
  { key: "4:3", label: "Landscape 4:3" },
  { key: "16:9", label: "Wide 16:9" },
  { key: "1:1", label: "Square" },
  { key: "3:4", label: "Portrait 3:4" },
];
const SHAPE_CLASS: Record<Exclude<PhotoShape, "original">, string> = {
  "4:3": "aspect-4/3", "16:9": "aspect-16/9", "1:1": "aspect-square", "3:4": "aspect-3/4",
};
/**
 * Aspect-ratio class for a photo frame, or "" for "original" (the photo
 * keeps its own shape, nothing cropped). `fallback` is the section's usual shape.
 */
export function shapeClass(shape: PhotoShape | undefined, fallback: Exclude<PhotoShape, "original"> | "original"): string {
  const s = shape ?? fallback;
  return s === "original" ? "" : SHAPE_CLASS[s];
}

export type Space = "none" | "sm" | "md" | "lg" | "xl";
export type Width = "full" | "wide" | "medium" | "narrow";
export type Gap = "tight" | "normal" | "relaxed";

export const SPACE_OPTIONS: { key: Space; label: string; css: string }[] = [
  { key: "none", label: "None", css: "0px" },
  { key: "sm", label: "Small", css: "clamp(2rem, 4vw, 3rem)" },
  { key: "md", label: "Medium", css: "clamp(5rem, 8vw, 7rem)" },
  { key: "lg", label: "Large", css: "clamp(6rem, 11vw, 9rem)" },
  { key: "xl", label: "Extra large", css: "clamp(8rem, 14vw, 12rem)" },
];
export const WIDTH_OPTIONS: { key: Width; label: string; hint: string; maxw: string; px?: string }[] = [
  { key: "full", label: "Full width", hint: "Edge to edge", maxw: "none", px: "clamp(0.75rem, 2vw, 1.5rem)" },
  { key: "wide", label: "Wide", hint: "Standard", maxw: "80rem" },
  { key: "medium", label: "Medium", hint: "More side margin", maxw: "64rem" },
  { key: "narrow", label: "Narrow", hint: "Reading width", maxw: "48rem" },
];
export const GAP_OPTIONS: { key: Gap; label: string; css: string }[] = [
  { key: "tight", label: "Tight", css: "0.75rem" },
  { key: "normal", label: "Normal", css: "1.5rem" },
  { key: "relaxed", label: "Relaxed", css: "2.5rem" },
];

/** CSS variables for a section's spacing settings (unset = site default). */
export function spacingVars(c: SectionConfig): Record<string, string> {
  const v: Record<string, string> = {};
  if (c.background === "image" && c.bg_image) {
    v["--sec-bg-image"] = `url("${c.bg_image.replace(/"/g, "%22")}")`;
    v["--sec-bg-a"] = String(Math.min(0.95, Math.max(0, (c.bg_overlay ?? 60) / 100)));
  }
  const top = SPACE_OPTIONS.find((o) => o.key === c.space_top);
  const bottom = SPACE_OPTIONS.find((o) => o.key === c.space_bottom);
  const width = WIDTH_OPTIONS.find((o) => o.key === c.width);
  const gap = GAP_OPTIONS.find((o) => o.key === c.gap);
  if (top) v["--sec-pt"] = top.css;
  if (bottom) v["--sec-pb"] = bottom.css;
  if (width) { v["--sec-maxw"] = width.maxw; if (width.px) v["--sec-px"] = width.px; }
  if (gap) v["--sec-gap"] = gap.css;
  return v;
}

export type Columns = 1 | 2 | 3 | 4 | 5;

/**
 * Item arrangements. "auto" is each section's own smart layout (e.g. the
 * banner film strip, event chapters); the rest are shared.
 */
export type Layout = "auto" | "grid" | "masonry" | "carousel" | "split" | "stacked";
export const LAYOUT_INFO: Record<Layout, { label: string; hint: string }> = {
  auto: { label: "Automatic", hint: "Best layout for the number of items" },
  grid: { label: "Grid", hint: "Even rows" },
  masonry: { label: "Masonry", hint: "Staggered, keeps photo shapes" },
  carousel: { label: "Carousel", hint: "One swipeable row with arrows" },
  split: { label: "Photo + text", hint: "One per row, text beside the photo" },
  stacked: { label: "Stacked", hint: "One per row, text below the photo" },
};

/** Which layouts each kind offers (first = default). Kinds not listed have no layout choice. */
export const KIND_LAYOUTS: Partial<Record<SectionKind, Layout[]>> = {
  facilities: ["grid", "carousel"],
  gallery: ["masonry", "grid", "carousel", "split", "stacked"],
  banners: ["auto", "grid", "carousel"],
  testimonials: ["auto", "grid", "carousel"],
  achievements: ["grid", "carousel"],
  events: ["auto", "grid", "carousel"],
};

export function layoutOf(s: HomeSection): Layout {
  const options = KIND_LAYOUTS[s.kind];
  if (!options) return "auto";
  return s.config.layout && options.includes(s.config.layout) ? s.config.layout : options[0];
}

/** Feature-card looks. Cards without a photo fall back to their icon. */
export type CardStyle = "icon" | "photo" | "overlay";
export const CARD_STYLES: { key: CardStyle; label: string; hint: string }[] = [
  { key: "icon", label: "Icon", hint: "Icon, title and text" },
  { key: "photo", label: "Photo on top", hint: "Cover photo above the caption" },
  { key: "overlay", label: "Caption on photo", hint: "Full photo, caption over it" },
];

export type HomeSection = {
  id: string;
  page?: SitePage;
  kind: SectionKind;
  display_order: number;
  is_visible: boolean;
  content: SectionContent;
  config: SectionConfig;
  items: SectionItem[];
};

// ============================================================
// Catalogue
// ============================================================
export type KindSpec = {
  kind: SectionKind;
  label: string;
  description: string;
  /** Pulls its cards from site data (events, achievements…). */
  dataDriven: boolean;
  /** Admin-made items this section holds, if any. */
  items: ItemKind | null;
  /** Data sections that may also / instead show uploaded banners. */
  supportsBanners: boolean;
  /** Which heading fields the editor shows. */
  fields: Exclude<keyof SectionContent, "photos">[];
  /** Pages this kind can be added to (default: all). */
  pages?: SitePage[];
  defaults: Omit<HomeSection, "id" | "display_order" | "is_visible" | "kind">;
};

const FACILITY_DEFAULTS: SectionItem[] = [
  { id: "f1", icon: "BookOpen", title: bi("Rich library", "समृद्ध ग्रंथालय"),
    body: bi("Thousands of titles across Marathi and English, plus reference works and periodicals.", "मराठी आणि इंग्रजी दोन्ही भाषांतील पुस्तके, संदर्भ ग्रंथ आणि नियमित मासिकं.") },
  { id: "f2", icon: "Microscope", title: bi("Well-equipped labs", "सुसज्ज प्रयोगशाळा"),
    body: bi("Hands-on science, computer and language labs — where learning is done, not just read.", "विज्ञान, संगणक आणि भाषा प्रयोगशाळांमध्ये प्रत्यक्ष अनुभवातून शिक्षण.") },
  { id: "f3", icon: "Trophy", title: bi("Sports & athletics", "क्रीडा आणि खेळ"),
    body: bi("From outdoor sports to yoga — every student finds a place that fits.", "मैदानी खेळांपासून योगापर्यंत — प्रत्येक विद्यार्थ्यासाठी योग्य ती जागा.") },
  { id: "f4", icon: "Palette", title: bi("Arts & culture", "कला आणि सांस्कृतिक"),
    body: bi("Music, dance, drama and visual arts — creativity gets real time and space.", "संगीत, नृत्य, चित्रकला — मुलांच्या सर्जनशीलतेला वाव देणारे उपक्रम.") },
  { id: "f5", icon: "Bus", title: bi("School transport", "वाहतूक सेवा"),
    body: bi("A safe, reliable school-transport network so parents rest easy.", "सुरक्षित आणि विश्वसनीय शालेय वाहतूक — पालकांच्या मनःशांतीसाठी.") },
  { id: "f6", icon: "HeartHandshake", title: bi("Parent partnership", "पालक-शिक्षक सहभाग"),
    body: bi("Regular touchpoints, open classrooms and shared decisions — growth is a shared responsibility.", "नियमित संवाद, खुले वर्ग आणि सामायिक निर्णय — कारण मुलांची प्रगती दोघांची जबाबदारी.") },
];

// Sample wording only — the section starts hidden until real quotes are added.
const TESTIMONIAL_SAMPLES: SectionItem[] = [
  { id: "t1", quote: bi("Our daughter's confidence has grown so much. Her teachers don't just teach — they truly know her.", "आमच्या मुलीचा आत्मविश्वास शाळेत आल्यापासून खूप वाढला. शिक्षक फक्त शिकवत नाहीत — ते मुलांना समजून घेतात."),
    name: bi("A parent", "पालक"), role: bi("Class 8 parent", "इयत्ता ८ वी") },
  { id: "t2", quote: bi("The sports coaches and cultural programs helped me find what I actually love doing.", "शाळेतले क्रीडा शिक्षक आणि सांस्कृतिक कार्यक्रम — यांनी मला माझ्या आवडीचे क्षेत्र शोधायला मदत केली."),
    name: bi("A student", "विद्यार्थी"), role: bi("Alumni", "माजी विद्यार्थी") },
];

export const KINDS: KindSpec[] = [
  {
    kind: "intro", label: "Page heading",
    description: "The large heading block at the top of an inner page.",
    dataDriven: false, items: null, supportsBanners: false, fields: ["eyebrow", "title", "subtitle"],
    pages: ["about"],
    defaults: {
      content: {
        eyebrow: bi("About us", "आमच्याबद्दल"),
        title: bi("Education, values and community.", "शिक्षण, संस्कार आणि समुदाय."),
        subtitle: bi("Our school is a family where every student is seen, heard and helped to move forward.",
          "आमची शाळा म्हणजे एक परिवार — जिथे प्रत्येक विद्यार्थी बघितला जातो, ऐकला जातो आणि पुढे नेला जातो."),
      },
      config: {}, items: [],
    },
  },
  {
    kind: "ticker", label: "Latest updates bar",
    description: "Scrolling strip of pinned notices. Best right under the hero.",
    dataDriven: true, items: null, supportsBanners: false, fields: ["title"],
    defaults: { content: { title: bi("Latest updates", "ताज्या सूचना") }, config: { limit: 5 }, items: [] },
  },
  {
    kind: "statement", label: "Statement",
    description: "A big sentence that lights up word by word as visitors scroll.",
    dataDriven: false, items: null, supportsBanners: false, fields: ["eyebrow", "body", "button_label", "button_href"],
    defaults: {
      content: {
        eyebrow: bi("Our promise", "आमच्याबद्दल"),
        body: bi("A family where every child is seen, heard, and helped to grow into who they are meant to be.",
          "एक परिवार, जिथे प्रत्येक मूल दिसतं, ऐकलं जातं आणि मोठं होण्यासाठी मदत मिळते."),
        button_label: bi("Read our story", "आमची कथा वाचा"), button_href: "/about",
      },
      config: {}, items: [],
    },
  },
  {
    kind: "notices", label: "Notice board",
    description: "Latest admission, result and exam notices.",
    dataDriven: true, items: null, supportsBanners: false, fields: ["eyebrow", "title", "subtitle"],
    defaults: {
      content: {
        eyebrow: bi("Notice board", "सूचना फलक"),
        title: bi("Admissions, results & what's coming up", "प्रवेश, निकाल आणि महत्त्वाच्या सूचना"),
        subtitle: bi("Every official update from the school for parents and students, in one place.",
          "शाळेकडून पालक आणि विद्यार्थ्यांसाठी सर्व अधिकृत सूचना येथे मिळतील."),
      },
      config: { limit: 5 }, items: [],
    },
  },
  {
    kind: "banners", label: "Banner strip",
    description: "Your own ready-made banners and posters. 1 shows full width, 2 side by side, 3+ slide as you scroll.",
    dataDriven: false, items: "banner", supportsBanners: false, fields: ["eyebrow", "title", "subtitle"],
    defaults: {
      content: {
        eyebrow: bi("Moments of pride", "अभिमानाचे क्षण"),
        title: bi("Results worth shouting about.", "यश, जे सांगायलाच हवं."),
        subtitle: bi("Competitive exams, scholarships, sports and more — what our students pulled off this year.",
          "स्पर्धा परीक्षा, शिष्यवृत्ती, क्रीडा आणि बरंच काही — आमच्या विद्यार्थ्यांची कमाल."),
      },
      config: {}, items: [],
    },
  },
  {
    kind: "toppers", label: "Toppers",
    description: "Podium of each class's top scorers, from uploaded marks.",
    dataDriven: true, items: null, supportsBanners: false, fields: ["eyebrow", "title", "subtitle"],
    defaults: {
      content: {
        eyebrow: bi("Our pride", "आमचा अभिमान"),
        title: bi("Our shining stars", "गुणवंत विद्यार्थी"),
        subtitle: bi("The highest scorers of every class — their hard work, our pride.",
          "प्रत्येक इयत्तेतील सर्वोच्च गुण मिळवणारे विद्यार्थी — त्यांची मेहनत, आमचा अभिमान."),
      },
      config: {}, items: [],
    },
  },
  {
    kind: "achievements", label: "Competitive exam results",
    description: "Cards made automatically from imported results — filter by exam, category or level. Or show your own banners.",
    dataDriven: true, items: "banner", supportsBanners: true, fields: ["eyebrow", "title", "subtitle"],
    defaults: {
      content: {
        eyebrow: bi("Standing out", "कर्तृत्व"),
        title: bi("Beyond the classroom, on every stage", "स्पर्धा परीक्षांतील आमची यशोगाथा"),
        subtitle: bi("Olympiads, NMMS, scholarship exams, sports meets and cultural competitions — our students' results.",
          "ऑलिम्पियाड, NMMS, शिष्यवृत्ती परीक्षा, क्रीडा व सांस्कृतिक स्पर्धांमध्ये आमच्या विद्यार्थ्यांची कामगिरी."),
      },
      config: { limit: 6, display: "cards" }, items: [],
    },
  },
  {
    kind: "events", label: "Events",
    description: "Recent events as story chapters with their photos. Or show your own banners.",
    dataDriven: true, items: "banner", supportsBanners: true, fields: ["eyebrow", "title", "subtitle"],
    defaults: {
      content: {
        eyebrow: bi("School life", "शालेय जीवन"),
        title: bi("Life beyond the classroom", "वर्गाबाहेरचे क्षण"),
        subtitle: bi("Annual day, sports day, trips and festivals — the moments that make the year.",
          "स्नेहसंमेलन, क्रीडा दिन, सहली आणि सण — आमच्या शाळेचे जिवंत क्षण."),
      },
      config: { limit: 3, display: "cards" }, items: [],
    },
  },
  {
    kind: "facilities", label: "Feature cards",
    description: "Cards with an icon, title and a line of text — facilities, highlights, programmes.",
    dataDriven: false, items: "facility", supportsBanners: false, fields: ["eyebrow", "title", "subtitle"],
    defaults: {
      content: {
        eyebrow: bi("Why families choose us", "आमचं वेगळेपण"),
        title: bi("Everything a growing student needs", "शिक्षणासाठी लागणारं सगळं, एका छताखाली"),
        subtitle: bi("Not just classrooms — the facilities, support and community that help children thrive.",
          "फक्त वर्ग नाही — मुलांच्या पूर्ण विकासाला हातभार लावणारी सुविधा आणि सेवा."),
      },
      config: {}, items: FACILITY_DEFAULTS,
    },
  },
  {
    kind: "gallery", label: "Photo gallery",
    description: "Your photos with captions — grid, staggered masonry or a swipeable row. Tap a photo to view it full screen.",
    dataDriven: false, items: "photo", supportsBanners: false, fields: ["eyebrow", "title", "subtitle"],
    defaults: {
      content: { eyebrow: bi("Gallery", "छायाचित्रे"), title: bi("Moments from school", "शाळेतील क्षणचित्रे") },
      config: { layout: "masonry", columns: 3 }, items: [],
    },
  },
  {
    kind: "testimonials", label: "Testimonials",
    description: "Quotes from parents, students and alumni.",
    dataDriven: false, items: "testimonial", supportsBanners: false, fields: ["eyebrow", "title"],
    defaults: {
      content: { eyebrow: bi("In their words", "आवाज"), title: bi("What our community says", "पालक आणि विद्यार्थ्यांचा विश्वास") },
      config: {}, items: TESTIMONIAL_SAMPLES,
    },
  },
  {
    kind: "text", label: "Text block",
    description: "Your own heading, paragraph, optional photo and button — for anything else.",
    dataDriven: false, items: null, supportsBanners: false,
    fields: ["eyebrow", "title", "body", "image_url", "button_label", "button_href"],
    defaults: { content: { title: bi("New section", "नवीन विभाग"), body: bi() }, config: { align: "left" }, items: [] },
  },
  {
    kind: "cta", label: "Closing invitation",
    description: "A bold coloured band with one button — usually last.",
    dataDriven: false, items: null, supportsBanners: false, fields: ["eyebrow", "title", "body", "button_label", "button_href"],
    defaults: {
      content: {
        eyebrow: bi("Visit us", "भेट द्या"),
        title: bi("Come and see us in person.", "आमची शाळा प्रत्यक्ष पहा."),
        body: bi("Walk the classrooms, labs and library, and meet the teachers — the best way to know if we're right for your child.",
          "वर्ग, प्रयोगशाळा, ग्रंथालय आणि शिक्षकांना भेटा — आपल्या मुलासाठी योग्य शाळा निवडा."),
        button_label: bi("Schedule a visit", "भेटीसाठी ठरवा"), button_href: "/contact",
      },
      config: {}, items: [],
    },
  },
];

export function kindSpec(kind: string): KindSpec | undefined {
  return KINDS.find((k) => k.kind === kind);
}

/** A new section of `kind` with its default wording. */
export function newSection(kind: SectionKind, display_order: number, id: string): HomeSection {
  const spec = kindSpec(kind)!;
  return {
    id, kind, display_order, is_visible: true,
    content: structuredClone(spec.defaults.content),
    config: structuredClone(spec.defaults.config),
    items: structuredClone(spec.defaults.items),
  };
}

const ABOUT_PILLARS: SectionItem[] = [
  { id: "p1", icon: "Eye", title: bi("Our vision", "आमचं स्वप्न"),
    body: bi("To help every student step into the world with confidence, creativity and care.",
      "प्रत्येक विद्यार्थी आत्मविश्वासाने, सर्जनशीलतेने आणि करुणेने जगू शकेल — असं शिक्षण देणं.") },
  { id: "p2", icon: "Target", title: bi("Our mission", "आमचं ध्येय"),
    body: bi("To offer rigorous academics, strong values and rich opportunities for the whole child to grow.",
      "गुणवत्तापूर्ण शैक्षणिक अनुभव, नैतिक मूल्यसंस्कार आणि सर्वांगीण विकासाच्या संधी उपलब्ध करून देणे.") },
  { id: "p3", icon: "Heart", title: bi("Our values", "आमची मूल्यं"),
    body: bi("Respect, honesty, curiosity and service — learning is shaped by values, not just books.",
      "सन्मान, प्रामाणिकपणा, जिज्ञासा आणि सेवा — शिक्षण फक्त पुस्तकांतून नाही, तर मूल्यांतून घडतं.") },
  { id: "p4", icon: "Landmark", title: bi("Our story", "आमची पार्श्वभूमी"),
    body: bi("Serving Vasind since {since} — {years} years of schooling, kept alive in the success stories of thousands of alumni.",
      "{since} पासून वासिंदमध्ये — {years} वर्षांची शैक्षणिक परंपरा, हजारो विद्यार्थ्यांच्या यशोगाथांच्या रूपात जिवंत.") },
];

type LayoutEntry = { kind: SectionKind; visible: boolean; override?: Partial<Omit<HomeSection, "id" | "kind">> };

/** Out-of-the-box layouts (used until the admin saves their own). */
export const DEFAULT_LAYOUTS: Record<SitePage, LayoutEntry[]> = {
  home: [
  { kind: "ticker", visible: true },
  { kind: "statement", visible: true },
  { kind: "notices", visible: true },
  { kind: "banners", visible: true },
  { kind: "toppers", visible: true },
  { kind: "achievements", visible: true },
  { kind: "events", visible: true },
  { kind: "facilities", visible: true },
  { kind: "testimonials", visible: false },
  { kind: "cta", visible: true },
  ],
  about: [
    { kind: "intro", visible: true },
    {
      kind: "facilities", visible: true,
      override: { content: {}, config: { columns: 2 }, items: ABOUT_PILLARS },
    },
    { kind: "cta", visible: true },
  ],
};

export function defaultSections(page: SitePage = "home"): HomeSection[] {
  return DEFAULT_LAYOUTS[page].map((d, i) => ({
    ...newSection(d.kind, i, `default-${page}-${d.kind}-${i}`),
    ...structuredClone(d.override ?? {}),
    page,
    is_visible: d.visible,
  }));
}

export function kindsForPage(page: SitePage): KindSpec[] {
  return KINDS.filter((k) => !k.pages || k.pages.includes(page));
}

/** Icons offered for feature cards (names from lucide-react). */
export const FEATURE_ICONS = [
  "Eye", "Target", "Heart", "Landmark", "BookOpen", "Microscope", "Trophy", "Palette", "Bus", "HeartHandshake", "Laptop", "Music",
  "Dumbbell", "GraduationCap", "Leaf", "ShieldCheck", "Languages", "Users", "Utensils", "Stethoscope",
] as const;

// Grid columns for `n` items. With `fixed` the admin's per-row count is
// used on large screens (phones still stack, tablets use at most 2–3);
// otherwise columns suit the count: never a lonely card in a three-column
// row, never a squeezed 5-across. Class names are spelled out in full so
// Tailwind can see them.
export function gridColsFor(n: number, fixed?: Columns): string {
  switch (fixed) {
    case 1: return "grid-cols-1 max-w-3xl mx-auto";
    case 2: return "grid-cols-1 sm:grid-cols-2";
    case 3: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    case 4: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
    case 5: return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5";
  }
  if (n <= 1) return "grid-cols-1 max-w-xl mx-auto";
  if (n === 2) return "grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto";
  if (n === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

/** CSS columns for masonry. */
export function masonryColsFor(fixed?: Columns): string {
  switch (fixed) {
    case 1: return "columns-1 max-w-3xl mx-auto";
    case 2: return "columns-1 sm:columns-2";
    case 4: return "columns-2 lg:columns-4";
    case 5: return "columns-2 md:columns-3 lg:columns-5";
    default: return "columns-1 sm:columns-2 lg:columns-3";
  }
}
