"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { IconButton } from "@/components/ui/IconButton";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  ANIMATIONS, DARK_BGS, LIGHT_BGS, toneOf, CAPTION_STYLES, CARD_STYLES, FEATURE_ICONS, GAP_OPTIONS, PHOTO_LAYOUTS, PHOTO_SHAPES, SITE_PATHS, isKnownLink, type PhotoFit, type PhotoShape, KIND_LAYOUTS, LAYOUT_INFO, SPACE_OPTIONS, WIDTH_OPTIONS, type SectionConfig, bi, kindSpec, layoutOf, type CardStyle, type Layout, type Bi, type DisplayMode, type HomeSection, type ItemKind, type SectionContent,
  type SectionItem,
} from "@/lib/homeSections";
import { CATEGORIES, LEVELS } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { FeatureIcon } from "@/components/FeatureIcon";
import { moveItem, useDragSort } from "@/components/ui/useDragSort";
import { saveSection, uploadSectionImage } from "./actions";

const FIELD_LABEL: Record<Exclude<keyof SectionContent, "photos">, string> = {
  eyebrow: "Small label above the heading",
  title: "Heading",
  subtitle: "Sub-heading",
  body: "Text",
  button_label: "Button text",
  button_href: "Button link",
  image_url: "Photo",
};

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

export default function SectionEditor({
  section, exams, onClose, onSaved,
}: { section: HomeSection; exams: string[]; onClose: () => void; onSaved: () => void }) {
  const spec = kindSpec(section.kind)!;
  const [s, setS] = useState<HomeSection>(() => structuredClone(section));
  const [pending, startTransition] = useTransition();

  const setContent = <K extends keyof SectionContent>(k: K, v: SectionContent[K]) =>
    setS((x) => ({ ...x, content: { ...x.content, [k]: v } }));
  const setConfig = (patch: Partial<HomeSection["config"]>) =>
    setS((x) => ({ ...x, config: { ...x.config, ...patch } }));

  const display: DisplayMode = s.config.display ?? "cards";
  const layouts = KIND_LAYOUTS[s.kind];
  const layout = layoutOf(s);
  const showItems = spec.items && (!spec.supportsBanners || display !== "cards");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveSection(s);
        toast.success("Section saved");
        onSaved();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <Modal open onClose={onClose} size="2xl" title={`Edit · ${spec.label}`} description={spec.description} closeOnBackdrop={false}>
      <form onSubmit={submit} className="space-y-6">
        {/* Headings / text */}
        <div className="space-y-4">
          <p className="text-xs text-ink-500">
            Tip: type <code className="rounded bg-ink-100 px-1">{"{years}"}</code> or <code className="rounded bg-ink-100 px-1">{"{since}"}</code> in any text
            to show the school&apos;s age or founding year — they update on their own.
          </p>
          {spec.fields.map((f) => {
            if (f === "button_href") {
              return (
                <Input key={f} label={FIELD_LABEL[f]} placeholder="/contact or https://…"
                  value={s.content.button_href ?? ""} onChange={(e) => setContent("button_href", e.target.value)} />
              );
            }
            if (f === "image_url") {
              return (
                <div key={f}>
                  <div className="mb-1.5 text-sm font-medium text-ink-700">{FIELD_LABEL[f]} (optional)</div>
                  <div className="max-w-sm">
                    <ImageUpload aspect="wide" value={s.content.image_url ?? null}
                      onChange={(u) => setContent("image_url", u)} onUpload={uploadSectionImage} />
                  </div>
                </div>
              );
            }
            return (
              <BiField key={f} label={FIELD_LABEL[f]} value={(s.content[f] as Bi) ?? bi()}
                multiline={f === "body" || f === "subtitle"} onChange={(v) => setContent(f, v)} />
            );
          })}
        </div>

        {/* Kind-specific settings */}
        {(spec.supportsBanners || !!layouts || ["ticker", "notices", "achievements", "events", "text", "facilities"].includes(s.kind)) && (
          <fieldset className="space-y-4 rounded-xl border border-ink-200 p-4">
            <legend className="px-1 text-sm font-semibold text-ink-900">Layout & content</legend>

            {spec.supportsBanners && (
              <div>
                <div className="mb-1.5 text-sm font-medium text-ink-700">Display</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {([
                    ["cards", "Automatic cards", "Made from your data"],
                    ["banners", "My banners", "Upload ready-made designs"],
                    ["both", "Both", "Banners first, then cards"],
                  ] as const).map(([k, label, hint]) => (
                    <button key={k} type="button" onClick={() => setConfig({ display: k })} aria-pressed={display === k}
                      className={cn(
                        "rounded-lg border p-3 text-left text-sm transition-colors",
                        display === k ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200 hover:bg-ink-50",
                      )}>
                      <div className="font-medium text-ink-900">{label}</div>
                      <div className="text-xs text-ink-500">{hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {s.kind === "achievements" && display !== "banners" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LabeledSelect label="Exam / event" value={s.config.exam ?? ""} onChange={(v) => setConfig({ exam: v || undefined })}>
                  <option value="">All exams</option>
                  {exams.map((x) => <option key={x} value={x}>{x}</option>)}
                </LabeledSelect>
                <LabeledSelect label="Category" value={s.config.category ?? ""} onChange={(v) => setConfig({ category: v || undefined })}>
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.en}</option>)}
                </LabeledSelect>
                <LabeledSelect label="Level" value={s.config.min_level ?? ""} onChange={(v) => setConfig({ min_level: v || undefined })}>
                  <option value="">Any level</option>
                  {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.en} and above</option>)}
                </LabeledSelect>
              </div>
            )}

            {["ticker", "notices", "achievements", "events"].includes(s.kind) && display !== "banners" && (
              <div className="max-w-40">
                <LabeledSelect label={s.kind === "events" ? "Events to show" : "How many"}
                  value={String(s.config.limit ?? kindSpec(s.kind)!.defaults.config.limit ?? 6)}
                  onChange={(v) => setConfig({ limit: Number(v) })}>
                  {(s.kind === "events" ? [1, 2, 3, 4, 5, 6] : [3, 4, 5, 6, 8, 9, 12]).map((n) => <option key={n} value={n}>{n}</option>)}
                </LabeledSelect>
              </div>
            )}

            {s.kind === "gallery" && (
              <CaptionControls config={s.config} layout={layout} setConfig={setConfig} />
            )}

            {s.kind === "facilities" && (
              <div>
                <div className="mb-1.5 text-sm font-medium text-ink-700">Card style</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {CARD_STYLES.map((c) => {
                    const on = (s.config.card_style ?? "icon") === c.key;
                    return (
                      <button key={c.key} type="button" onClick={() => setConfig({ card_style: c.key })} aria-pressed={on}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                          on ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200 hover:bg-ink-50",
                        )}>
                        <CardStyleThumb style={c.key} />
                        <span>
                          <span className="block font-medium text-ink-900">{c.label}</span>
                          <span className="block text-xs text-ink-500">{c.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {layouts && (
              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 text-sm font-medium text-ink-700">Arrange items</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {layouts.map((l) => (
                      <button key={l} type="button" onClick={() => setConfig({ layout: l })} aria-pressed={layout === l}
                        className={cn(
                          "rounded-lg border p-2.5 text-left text-sm transition-colors",
                          layout === l ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200 hover:bg-ink-50",
                        )}>
                        <LayoutThumb layout={l} />
                        <div className="mt-2 font-medium text-ink-900">{LAYOUT_INFO[l].label}</div>
                        <div className="text-[11px] leading-tight text-ink-500">{l === "auto" ? AUTO_HINT[s.kind] ?? LAYOUT_INFO.auto.hint : LAYOUT_INFO[l].hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {layout !== "auto" && layout !== "split" && layout !== "stacked" && (
                  <div>
                    <div className="mb-1.5 text-sm font-medium text-ink-700">
                      {layout === "carousel" ? "Visible at once" : "Per row"} <span className="font-normal text-ink-400">(on a computer; phones show 1–2)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {([undefined, 1, 2, 3, 4, 5] as const).map((n) => (
                        <button key={n ?? "auto"} type="button" onClick={() => setConfig({ columns: n })}
                          aria-pressed={s.config.columns === n}
                          className={cn(
                            "h-9 min-w-9 rounded-lg border px-3 text-sm font-medium tabular-nums transition-colors",
                            s.config.columns === n ? "border-brand-500 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-700 hover:bg-ink-50",
                          )}>
                          {n ?? "Auto"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {s.kind === "text" && (
              <div className="flex flex-wrap gap-4">
                <div className="w-40">
                  <LabeledSelect label="Text alignment" value={s.config.align ?? "left"} onChange={(v) => setConfig({ align: v as "left" | "center" })}>
                    <option value="left">Left</option>
                    <option value="center">Centre (no photo)</option>
                  </LabeledSelect>
                </div>
                <div className="w-40">
                  <LabeledSelect label="Photo side" value={s.config.image_side ?? "right"} onChange={(v) => setConfig({ image_side: v as "left" | "right" })}>
                    <option value="right">Right</option>
                    <option value="left">Left</option>
                  </LabeledSelect>
                </div>
              </div>
            )}
          </fieldset>
        )}

        {showItems && spec.items && (
          <ItemsEditor kind={spec.items} items={s.items} cardStyle={s.config.card_style ?? "icon"}
            onChange={(items) => setS((x) => ({ ...x, items }))} />
        )}

        {/* Photos with any section */}
        {!["banners", "gallery", "ticker"].includes(s.kind) && (
          <fieldset className="space-y-4 rounded-xl border border-ink-200 p-4">
            <legend className="px-1 text-sm font-semibold text-ink-900">Photos with this section</legend>
            <p className="-mt-1 text-xs text-ink-500">
              Optional. Shown right after the section — and in its place while it has no data of its own yet.
            </p>
            {(s.content.photos?.length ?? 0) > 0 && (
              <div className="flex flex-wrap items-end gap-4">
                <ChipGroup label="Arrange photos"
                  value={s.config.photos_layout ?? "grid"}
                  options={PHOTO_LAYOUTS.map((o) => ({ key: o.key, label: o.label, hint: o.hint }))}
                  onChange={(v) => setConfig({ photos_layout: v })} />
                {!["split", "stacked"].includes(s.config.photos_layout ?? "grid") && (
                  <ChipGroup label={(s.config.photos_layout ?? "grid") === "carousel" ? "Visible at once" : "Per row"}
                    value={s.config.photos_columns ?? "auto"}
                    options={[{ key: "auto" as const, label: "Auto" }, ...([1, 2, 3, 4, 5] as const).map((n) => ({ key: n, label: String(n) }))]}
                    onChange={(v) => setConfig({ photos_columns: v === "auto" ? undefined : v })} />
                )}
              </div>
            )}
            {(s.content.photos?.length ?? 0) > 0 && (
              <CaptionControls config={s.config} layout={s.config.photos_layout ?? "grid"} setConfig={setConfig} />
            )}
            <ItemsEditor kind="photo" items={s.content.photos ?? []}
              onChange={(photos) => setContent("photos", photos)} />
          </fieldset>
        )}

        {/* Photo display — shape and fit for every photo this section shows */}
        {s.kind !== "ticker" && (
          <fieldset className="space-y-4 rounded-xl border border-ink-200 p-4">
            <legend className="px-1 text-sm font-semibold text-ink-900">Photo display</legend>
            <p className="-mt-1 text-xs text-ink-500">
              Applies to every photo in this section — {PHOTO_SCOPE[s.kind] ?? "its photos"}.
            </p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
              <ChipGroup label="Photo shape (height)"
                value={s.config.photo_shape ?? "default"}
                options={[{ key: "default" as const, label: "Section default" }, ...PHOTO_SHAPES.map((o) => ({ key: o.key, label: o.label }))]}
                onChange={(v) => setConfig({ photo_shape: v === "default" ? undefined : v })} />
              <ChipGroup label="Fit"
                value={s.config.photo_fit ?? "fill"}
                options={[
                  { key: "fill" as const, label: "Fill (crop edges)" },
                  { key: "contain" as const, label: "Show whole photo" },
                ]}
                onChange={(v) => setConfig({ photo_fit: v === "fill" ? undefined : v })} />
            </div>
            <ShapeDiagram shape={s.config.photo_shape} fit={s.config.photo_fit} />
          </fieldset>
        )}

        {/* Design */}
        {s.kind !== "ticker" && (
          <fieldset className="space-y-4 rounded-xl border border-ink-200 p-4">
            <legend className="px-1 text-sm font-semibold text-ink-900">Design</legend>

            <div>
              <div className="mb-1.5 text-sm font-medium text-ink-700">Background</div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Background">
                {[{ key: "default" as const, label: "Section default", swatch: "" },
                  ...(toneOf(s.kind) === "dark" ? DARK_BGS : LIGHT_BGS),
                  { key: "image" as const, label: "Photo", swatch: "" }].map((b) => {
                  const on = (s.config.background ?? "default") === b.key;
                  return (
                    <button key={b.key} type="button" role="radio" aria-checked={on}
                      onClick={() => setConfig({ background: b.key === "default" ? undefined : b.key })}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        on ? "border-brand-500 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-700 hover:bg-ink-50",
                      )}>
                      <span className={cn("h-5 w-5 flex-none rounded-full ring-1 ring-ink-200",
                        b.key === "default" && "bg-[conic-gradient(var(--color-ink-100)_0_50%,var(--color-ink-300)_0)]",
                        b.key === "image" && "bg-linear-to-br from-brand-300 to-accent-300")}
                        style={b.swatch ? { background: b.swatch } : undefined} />
                      {b.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-ink-500">
                {toneOf(s.kind) === "dark"
                  ? "This section has white text, so it's offered dark backgrounds."
                  : "This section has dark text, so it's offered light backgrounds."}
              </p>
            </div>

            {s.config.background === "image" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[240px_1fr] sm:items-start">
                <ImageUpload aspect="wide" value={s.config.bg_image ?? null} maxDimension={2400}
                  onChange={(u) => setConfig({ bg_image: u })} onUpload={uploadSectionImage}
                  label="Background photo" />
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-ink-700">
                    Tint over the photo: {s.config.bg_overlay ?? 60}%
                  </span>
                  <input type="range" min={0} max={90} step={5} value={s.config.bg_overlay ?? 60}
                    onChange={(e) => setConfig({ bg_overlay: Number(e.target.value) })} className="accent-brand-700" />
                  <span className="text-xs text-ink-500">
                    More tint = easier to read the text; less tint = more of the photo shows.
                  </span>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChipGroup label="Heading position"
                value={s.config.heading_align ?? "default"}
                options={[{ key: "default" as const, label: "Default" }, { key: "left" as const, label: "Left" }, { key: "center" as const, label: "Centre" }]}
                onChange={(v) => setConfig({ heading_align: v === "default" ? undefined : v })} />
              <ChipGroup label="Heading size"
                value={s.config.heading_size ?? "md"}
                options={[{ key: "sm" as const, label: "Small" }, { key: "md" as const, label: "Medium" }, { key: "lg" as const, label: "Large" }]}
                onChange={(v) => setConfig({ heading_size: v === "md" ? undefined : v })} />
              <ChipGroup label="Entrance animation"
                value={s.config.animation ?? "fade-up"}
                options={ANIMATIONS.map((a) => ({ key: a.key, label: a.label }))}
                onChange={(v) => setConfig({ animation: v === "fade-up" ? undefined : v })} />
              <ChipGroup label="Show on"
                value={s.config.show_on ?? "all"}
                options={[
                  { key: "all" as const, label: "All devices" },
                  { key: "desktop" as const, label: "Computers only" },
                  { key: "mobile" as const, label: "Phones only" },
                ]}
                onChange={(v) => setConfig({ show_on: v === "all" ? undefined : v })} />
            </div>
          </fieldset>
        )}

        {/* Spacing */}
        {s.kind !== "ticker" && (
          <fieldset className="space-y-4 rounded-xl border border-ink-200 p-4">
            <legend className="px-1 text-sm font-semibold text-ink-900">Spacing</legend>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChipGroup label="Space above"
                value={s.config.space_top ?? "md"}
                options={SPACE_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
                onChange={(v) => setConfig({ space_top: v === "md" ? undefined : v })} />
              <ChipGroup label="Space below"
                value={s.config.space_bottom ?? "md"}
                options={SPACE_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
                onChange={(v) => setConfig({ space_bottom: v === "md" ? undefined : v })} />
              <ChipGroup label="Width (left & right margins)"
                value={s.config.width ?? "wide"}
                options={WIDTH_OPTIONS.map((o) => ({ key: o.key, label: o.label, hint: o.hint }))}
                onChange={(v) => setConfig({ width: v === "wide" ? undefined : v })} />
              <ChipGroup label="Gap between items"
                value={s.config.gap ?? "normal"}
                options={GAP_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
                onChange={(v) => setConfig({ gap: v === "normal" ? undefined : v })} />
            </div>
            <SpacingDiagram c={s.config} />
          </fieldset>
        )}

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={s.is_visible} onChange={(e) => setS({ ...s, is_visible: e.target.checked })}
            className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
          Show this section on the page
        </label>

        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={pending}>Save section</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

// ============================================================
// Bits
// ============================================================
function BiField({ label, value, onChange, multiline, placeholder }: {
  label: string; value: Bi; onChange: (v: Bi) => void; multiline?: boolean; placeholder?: string;
}) {
  const cls = "block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm shadow-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100";
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-ink-700">{label}</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(["en", "mr"] as const).map((l) => (
          <label key={l} className="block">
            {/* Say plainly which box is which — the Marathi box is a translation, not a second field. */}
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              {l === "en" ? "English" : "मराठी · shown when visitors switch to Marathi"}
            </span>
            {multiline ? (
              <textarea rows={3} lang={l} value={value[l] ?? ""} onChange={(e) => onChange({ ...value, [l]: e.target.value })}
                placeholder={l === "mr" ? "Optional — Marathi translation" : placeholder}
                className={cls} />
            ) : (
              <input lang={l} value={value[l] ?? ""} onChange={(e) => onChange({ ...value, [l]: e.target.value })}
                placeholder={l === "mr" ? "Optional — Marathi translation" : placeholder}
                className={cls} />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

/** Link input that warns about links to pages that don't exist (e.g. "/link"). */
function LinkField({ value, onChange, hint, label = "Link (optional)" }: {
  value: string; onChange: (v: string) => void; hint?: string; label?: string;
}) {
  const bad = value.trim() !== "" && !isKnownLink(value);
  return (
    <div>
      <Input label={label} placeholder="/about, /notices or https://…" value={value}
        onChange={(e) => onChange(e.target.value)}
        error={bad ? `“${value}” isn't a page on this site. Use one of: ${SITE_PATHS.join(", ")} — or a full https:// address, or leave it empty.` : undefined}
        hint={bad ? undefined : hint} />
    </div>
  );
}

function LabeledSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-700">{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>{children}</Select>
    </label>
  );
}

const ITEM_NOUN: Record<ItemKind, string> = { banner: "banner", facility: "card", testimonial: "quote", photo: "photo" };

// What "Automatic" means for each kind, shown under the layout choice.
const AUTO_HINT: Partial<Record<string, string>> = {
  banners: "1 wide · 2 side by side · 3+ film strip",
  testimonials: "Sized to the number of quotes",
  events: "Story chapters with floating photos",
};

function ItemsEditor({ kind, items, onChange, cardStyle = "icon" }: {
  kind: ItemKind; items: SectionItem[]; onChange: (v: SectionItem[]) => void; cardStyle?: CardStyle;
}) {
  const patch = (i: number, p: Partial<SectionItem>) => onChange(items.map((it, j) => (j === i ? { ...it, ...p } : it)));
  const move = (i: number, d: -1 | 1) => onChange(moveItem(items, i, i + d));
  const drag = useDragSort(items.length, (from, to) => onChange(moveItem(items, from, to)));
  const blank = (): SectionItem =>
    kind === "banner" ? { id: newId(), image_url: null, title: bi(), caption: bi(), link_href: "" }
    : kind === "facility" ? { id: newId(), icon: "BookOpen", title: bi(), body: bi() }
    : kind === "photo" ? { id: newId(), image_url: null, caption: bi(), body: bi(), link_href: "" }
    : { id: newId(), quote: bi(), name: bi(), role: bi() };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-ink-900">
        {kind === "banner" ? "Banners" : kind === "facility" ? "Cards" : kind === "photo" ? "Photos" : "Quotes"}{" "}
        <span className="font-normal text-ink-500">({items.length})</span>
      </legend>
      {kind === "banner" && (
        <p className="text-xs text-ink-500">1 banner shows full width, 2 side by side, 3 or more slide across as visitors scroll.</p>
      )}

      {items.length > 1 && <p className="text-xs text-ink-500">Drag by the grip (or use the arrows) to change the order.</p>}
      {items.map((it, i) => (
        <div key={it.id} {...drag.itemProps(i)}
          className="rounded-xl border border-ink-200 bg-ink-50/40 p-4 transition-all data-dragging:opacity-40 data-drop-target:border-brand-500 data-drop-target:ring-2 data-drop-target:ring-brand-200">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
              <span {...drag.handleProps(i)} className="rounded p-1 text-ink-300 hover:bg-ink-100 hover:text-ink-600" title="Drag to reorder">
                <GripVertical className="h-4 w-4" aria-hidden="true" />
              </span>
              {ITEM_NOUN[kind]} {i + 1}
            </span>
            <div className="flex gap-1">
              <IconButton label="Move up" size="sm" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></IconButton>
              <IconButton label="Move down" size="sm" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></IconButton>
              <IconButton label="Remove" size="sm" tone="danger" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></IconButton>
            </div>
          </div>

          {kind === "banner" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
              <ImageUpload aspect="wide" value={it.image_url ?? null} maxDimension={2000}
                onChange={(u) => patch(i, { image_url: u })} onUpload={uploadSectionImage} />
              <div className="space-y-3">
                <BiField label="Title (optional)" value={it.title ?? bi()} onChange={(v) => patch(i, { title: v })} />
                <BiField label="Caption (optional)" value={it.caption ?? bi()} onChange={(v) => patch(i, { caption: v })} />
                <LinkField value={it.link_href ?? ""} onChange={(v) => patch(i, { link_href: v })} />
              </div>
            </div>
          )}

          {kind === "facility" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
              <div className="space-y-3">
                <ImageUpload
                  aspect={cardStyle === "overlay" ? "portrait" : "wide"}
                  value={it.image_url ?? null}
                  maxDimension={1400}
                  onChange={(u) => patch(i, { image_url: u })}
                  onUpload={uploadSectionImage}
                  label={<>Cover photo <span className="font-normal text-ink-400">(optional)</span></>}
                />
                {cardStyle === "icon" && it.image_url && (
                  <p className="text-xs text-amber-700">Switch the card style to a photo style to show this photo.</p>
                )}
              </div>
              <div className="space-y-3">
                <BiField label="Title" value={it.title ?? bi()} onChange={(v) => patch(i, { title: v })} />
                <BiField label="Caption" multiline value={it.body ?? bi()} onChange={(v) => patch(i, { body: v })} />
                <LinkField value={it.link_href ?? ""} onChange={(v) => patch(i, { link_href: v })}
                  hint="Makes the whole card clickable." />
                <div>
                  <div className="mb-1.5 text-sm font-medium text-ink-700">
                    Icon <span className="font-normal text-ink-400">{cardStyle === "icon" ? "" : "(shown when there's no photo)"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FEATURE_ICONS.map((name) => (
                      <button key={name} type="button" onClick={() => patch(i, { icon: name })} aria-label={name} aria-pressed={it.icon === name}
                        className={cn("flex h-9 w-9 items-center justify-center rounded-lg border",
                          it.icon === name ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 bg-white text-ink-500 hover:bg-ink-50")}>
                        <FeatureIcon name={name} className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {kind === "photo" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
              <ImageUpload aspect="wide" value={it.image_url ?? null} maxDimension={2000}
                onChange={(u) => patch(i, { image_url: u })} onUpload={uploadSectionImage} />
              <div className="space-y-3">
                <BiField label="Caption" placeholder="Short title, e.g. Annual sports day"
                  value={it.caption ?? bi()} onChange={(v) => patch(i, { caption: v })} />
                <BiField label="Description (optional)" multiline placeholder="A few lines about the photo"
                  value={it.body ?? bi()} onChange={(v) => patch(i, { body: v })} />
                <LinkField value={it.link_href ?? ""} onChange={(v) => patch(i, { link_href: v })}
                  hint="Leave empty to open the photo full screen when tapped." />
                {it.link_href && (
                  <BiField label="Link text (Photo + text layout)" placeholder="Learn more"
                    value={it.title ?? bi()} onChange={(v) => patch(i, { title: v })} />
                )}
              </div>
            </div>
          )}

          {kind === "testimonial" && (
            <div className="space-y-3">
              <BiField label="Quote" multiline value={it.quote ?? bi()} onChange={(v) => patch(i, { quote: v })} />
              <BiField label="Name" value={it.name ?? bi()} onChange={(v) => patch(i, { name: v })} />
              <BiField label="Who they are" value={it.role ?? bi()} onChange={(v) => patch(i, { role: v })} />
            </div>
          )}
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => onChange([...items, blank()])}>
        Add {ITEM_NOUN[kind]}
      </Button>
    </fieldset>
  );
}

/** Tiny wireframe of each card style for the picker. */
function CardStyleThumb({ style }: { style: CardStyle }) {
  if (style === "overlay") {
    return (
      <span className="relative flex h-12 w-10 flex-none overflow-hidden rounded-md bg-linear-to-br from-brand-300 to-brand-600">
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink-900/80 to-transparent" />
        <span className="absolute bottom-1.5 left-1.5 h-1 w-5 rounded bg-white" />
      </span>
    );
  }
  if (style === "photo") {
    return (
      <span className="flex h-12 w-10 flex-none flex-col overflow-hidden rounded-md bg-white ring-1 ring-ink-200">
        <span className="h-6 bg-linear-to-br from-brand-300 to-brand-600" />
        <span className="m-1.5 h-1 w-5 rounded bg-ink-400" />
        <span className="mx-1.5 h-1 w-4 rounded bg-ink-200" />
      </span>
    );
  }
  return (
    <span className="flex h-12 w-10 flex-none flex-col gap-1 rounded-md bg-white p-1.5 ring-1 ring-ink-200">
      <span className="h-3 w-3 rounded bg-brand-200" />
      <span className="h-1 w-5 rounded bg-ink-400" />
      <span className="h-1 w-4 rounded bg-ink-200" />
    </span>
  );
}

/** Tiny wireframe of each layout for the picker. */
function LayoutThumb({ layout }: { layout: Layout }) {
  const box = "rounded-sm bg-brand-300";
  const line = "h-1 rounded bg-ink-300";
  if (layout === "split") {
    return (
      <span className="flex h-8 flex-col gap-1">
        <span className="flex flex-1 gap-1"><span className={cn(box, "w-1/2")} /><span className="flex flex-1 flex-col justify-center gap-0.5"><span className={line} /><span className={cn(line, "w-2/3")} /></span></span>
        <span className="flex flex-1 gap-1"><span className="flex flex-1 flex-col justify-center gap-0.5"><span className={line} /><span className={cn(line, "w-2/3")} /></span><span className={cn(box, "w-1/2")} /></span>
      </span>
    );
  }
  if (layout === "stacked") {
    return (
      <span className="flex h-8 flex-col gap-0.5">
        <span className={cn(box, "h-4")} /><span className={cn(line, "w-3/4")} /><span className={cn(box, "h-2 opacity-60")} />
      </span>
    );
  }
  if (layout === "carousel") {
    return (
      <span className="flex h-8 gap-1 overflow-hidden">
        <span className={cn(box, "w-7 flex-none")} /><span className={cn(box, "w-7 flex-none")} /><span className={cn(box, "w-7 flex-none opacity-50")} />
      </span>
    );
  }
  if (layout === "masonry") {
    return (
      <span className="grid h-8 grid-cols-3 gap-1">
        <span className="flex flex-col gap-1"><span className={cn(box, "h-5")} /><span className={cn(box, "h-2")} /></span>
        <span className="flex flex-col gap-1"><span className={cn(box, "h-2")} /><span className={cn(box, "h-5")} /></span>
        <span className="flex flex-col gap-1"><span className={cn(box, "h-3.5")} /><span className={cn(box, "h-3.5")} /></span>
      </span>
    );
  }
  if (layout === "grid") {
    return <span className="grid h-8 grid-cols-3 gap-1">{Array.from({ length: 6 }).map((_, i) => <span key={i} className={box} />)}</span>;
  }
  return (
    <span className="flex h-8 items-center justify-center rounded-sm border border-dashed border-brand-300 text-[10px] font-semibold text-brand-700">AUTO</span>
  );
}

/** Row of pill buttons for a small set of choices. */
function ChipGroup<K extends string | number>({
  label, value, options, onChange,
}: {
  label: string;
  value: K;
  options: { key: K; label: string; hint?: string }[];
  onChange: (v: K) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-ink-700">{label}</div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={String(o.key)} type="button" role="radio" aria-checked={value === o.key} title={o.hint}
            onClick={() => onChange(o.key)}
            className={cn(
              "h-8 rounded-lg border px-3 text-xs font-medium transition-colors",
              value === o.key ? "border-brand-500 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-700 hover:bg-ink-50",
            )}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A small live sketch of the section's spacing so the settings are obvious. */
function SpacingDiagram({ c }: { c: SectionConfig }) {
  const px: Record<string, number> = { none: 0, sm: 6, md: 14, lg: 20, xl: 28 };
  const side: Record<string, number> = { full: 2, wide: 14, medium: 28, narrow: 44 };
  const gap: Record<string, number> = { tight: 3, normal: 6, relaxed: 11 };
  const t = px[c.space_top ?? "md"], b = px[c.space_bottom ?? "md"];
  const sd = side[c.width ?? "wide"], g = gap[c.gap ?? "normal"];
  return (
    <div className="rounded-lg bg-ink-100 p-2" aria-hidden="true">
      <div className="rounded bg-white ring-1 ring-ink-200 transition-all" style={{ paddingTop: t, paddingBottom: b, paddingInline: sd }}>
        <div className="mb-1.5 h-2 w-1/3 rounded bg-ink-300" />
        <div className="grid grid-cols-3" style={{ gap: g }}>
          {[0, 1, 2].map((i) => <div key={i} className="h-8 rounded bg-brand-200" />)}
        </div>
      </div>
      <div className="mt-1 text-center text-[10px] text-ink-500">Preview of the spacing</div>
    </div>
  );
}

// Where the Photo display settings show up, per section type.
const PHOTO_SCOPE: Partial<Record<string, string>> = {
  gallery: "the gallery photos",
  banners: "the banners",
  facilities: "card cover photos (Photo on top / Caption on photo styles)",
  text: "the text block's photo",
  events: "event covers and your banners",
  achievements: "your banners",
};

/** Sketch of how a photo will be framed with the chosen shape and fit. */
function ShapeDiagram({ shape, fit }: { shape?: PhotoShape; fit?: PhotoFit }) {
  const ratio: Record<string, string> = { "4:3": "4 / 3", "16:9": "16 / 9", "1:1": "1 / 1", "3:4": "3 / 4" };
  const frame = shape && shape !== "original" ? ratio[shape] : null;
  const photo = (
    <div className="h-full w-full bg-linear-to-br from-brand-300 via-brand-500 to-accent-400" />
  );
  return (
    <div className="flex items-center gap-3 rounded-lg bg-ink-100 p-3" aria-hidden="true">
      <div className="w-28 flex-none">
        {!frame ? (
          // Original / section default: the photo's own proportions (shown as 3:2).
          <div className="aspect-3/2 overflow-hidden rounded">{photo}</div>
        ) : fit === "contain" ? (
          <div className="relative overflow-hidden rounded bg-brand-200/60" style={{ aspectRatio: frame }}>
            <div className="absolute inset-x-0 top-1/2 aspect-3/2 -translate-y-1/2">{photo}</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded" style={{ aspectRatio: frame }}>{photo}</div>
        )}
      </div>
      <p className="text-xs text-ink-600">
        {!shape ? "Uses this section's usual shape." :
          shape === "original" ? "Each photo keeps its own shape and height — nothing is cropped." :
          fit === "contain" ? "Every photo sits in the same frame; the whole photo shows, with a soft blur filling the sides." :
          "Every photo is cropped to the same frame so rows line up evenly."}
      </p>
    </div>
  );
}

/** Where captions and descriptions go, and (for Photo + text) the photo's side and size. */
function CaptionControls({ config, layout, setConfig }: {
  config: SectionConfig; layout: string; setConfig: (p: Partial<SectionConfig>) => void;
}) {
  const oneRow = layout === "split" || layout === "stacked";
  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg bg-ink-50 p-3 lg:grid-cols-2">
      {layout !== "split" && (
        <ChipGroup label="Caption & description"
          value={config.caption_style ?? (oneRow ? "below" : "overlay")}
          options={CAPTION_STYLES.map((c) => ({ key: c.key, label: c.label }))}
          onChange={(v) => setConfig({ caption_style: v })} />
      )}
      <ChipGroup label="Text alignment"
        value={config.text_align ?? "left"}
        options={[{ key: "left" as const, label: "Left" }, { key: "center" as const, label: "Centre" }]}
        onChange={(v) => setConfig({ text_align: v === "left" ? undefined : v })} />
      {layout === "split" && (
        <>
          <ChipGroup label="Photo side"
            value={config.split_side ?? "alternate"}
            options={[
              { key: "left" as const, label: "Left" },
              { key: "right" as const, label: "Right" },
              { key: "alternate" as const, label: "Alternate" },
            ]}
            onChange={(v) => setConfig({ split_side: v === "alternate" ? undefined : v })} />
          <ChipGroup label="Photo size"
            value={config.split_size ?? "half"}
            options={[
              { key: "small" as const, label: "Smaller than text" },
              { key: "half" as const, label: "Half" },
              { key: "large" as const, label: "Larger than text" },
            ]}
            onChange={(v) => setConfig({ split_size: v === "half" ? undefined : v })} />
        </>
      )}
    </div>
  );
}
