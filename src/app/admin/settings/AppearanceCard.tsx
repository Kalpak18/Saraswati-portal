"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ACCENT_PRESETS, BRAND_PRESETS, CORNER_STYLES, HEADING_FONTS, themeCss, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { saveTheme } from "./actions";

/**
 * Site-wide look: brand colour, accent colour, heading font, corner style.
 * The preview card on the right updates live; Save applies it everywhere.
 */
export default function AppearanceCard({ initial }: { initial: Theme }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [t, setT] = useState<Required<Theme>>({
    brand: initial.brand ?? "teal",
    accent: initial.accent ?? "amber",
    heading_font: initial.heading_font ?? "fraunces",
    corners: initial.corners ?? "soft",
  });

  function save() {
    startTransition(async () => {
      try {
        await saveTheme(t);
        toast.success("Appearance saved — the whole site now uses it");
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  // Live preview: the same variables, scoped to the preview box only.
  const previewCss = themeCss(t, true).replace(":root", "#theme-preview");

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-brand-700" />
        <h2 className="text-base font-semibold text-ink-900">Appearance</h2>
      </div>
      <p className="mt-1 text-sm text-ink-500">The look of the whole website and this admin panel.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-5">
          <Swatches label="Brand colour" value={t.brand} onChange={(brand) => setT({ ...t, brand })}
            options={BRAND_PRESETS.map((b) => ({ key: b.key, label: b.label, colors: [b.scale["700"], b.scale["300"]] }))} />
          <Swatches label="Accent colour" value={t.accent} onChange={(accent) => setT({ ...t, accent })}
            options={ACCENT_PRESETS.map((a) => ({ key: a.key, label: a.label, colors: [a.scale["500"]!, a.scale["200"]!] }))} />

          <div>
            <div className="mb-1.5 text-sm font-medium text-ink-700">Heading font</div>
            <div className="grid grid-cols-2 gap-2">
              {HEADING_FONTS.map((f) => (
                <button key={f.key} type="button" onClick={() => setT({ ...t, heading_font: f.key })}
                  aria-pressed={t.heading_font === f.key}
                  className={cn("rounded-lg border p-3 text-left transition-colors",
                    t.heading_font === f.key ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200 hover:bg-ink-50")}>
                  <div className="text-lg font-semibold text-ink-900" style={{ fontFamily: f.css }}>Aa · शाळा</div>
                  <div className="text-xs font-medium text-ink-700">{f.label}</div>
                  <div className="text-[11px] text-ink-500">{f.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-sm font-medium text-ink-700">Corners</div>
            <div className="flex gap-2">
              {CORNER_STYLES.map((c) => (
                <button key={c.key} type="button" onClick={() => setT({ ...t, corners: c.key })}
                  aria-pressed={t.corners === c.key}
                  className={cn("flex flex-1 flex-col items-center gap-2 border p-3 text-xs font-medium transition-colors",
                    t.corners === c.key ? "border-brand-500 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-700 hover:bg-ink-50")}
                  style={{ borderRadius: c.key === "sharp" ? 4 : c.key === "round" ? 16 : 10 }}>
                  <span className="h-6 w-10 border-2 border-current"
                    style={{ borderRadius: c.key === "sharp" ? 2 : c.key === "round" ? 12 : 6 }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div>
          <div className="mb-1.5 text-sm font-medium text-ink-700">Preview</div>
          <style dangerouslySetInnerHTML={{ __html: previewCss }} />
          <div id="theme-preview" className="space-y-3 rounded-2xl border border-ink-200 bg-ink-50 p-4">
            <div className="rounded-2xl bg-linear-to-br from-brand-700 to-brand-900 p-4 text-white">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-accent-300">Welcome to</div>
              <div className="font-display text-xl font-semibold">Saraswati Vidyalaya</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
              <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-brand-700">
                <span className="h-px w-5 bg-current" /> Our pride
              </div>
              <div className="mt-1 font-display text-lg font-semibold text-ink-900">Our shining stars</div>
              <div className="mt-3 flex gap-2">
                <span className="rounded-full bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white">Check result</span>
                <span className="rounded-full bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white">New</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} loading={pending} leftIcon={<Check className="h-4 w-4" />}>Save appearance</Button>
      </div>
    </div>
  );
}

function Swatches({ label, value, options, onChange }: {
  label: string; value: string; options: { key: string; label: string; colors: string[] }[]; onChange: (k: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-ink-700">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.key} type="button" onClick={() => onChange(o.key)} aria-pressed={value === o.key} title={o.label}
            className={cn("flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition-colors",
              value === o.key ? "border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-100" : "border-ink-200 text-ink-700 hover:bg-ink-50")}>
            <span className="h-6 w-6 rounded-full ring-1 ring-black/10"
              style={{ background: `linear-gradient(135deg, ${o.colors[0]} 50%, ${o.colors[1]} 50%)` }} />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
