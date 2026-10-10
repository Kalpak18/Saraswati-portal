"use client";

import { clientAction } from "@/lib/clientAction";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, IdCard, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SchoolLetterhead } from "@/components/SchoolLetterhead";
import { lineFor, type BiText, type Branding } from "@/lib/branding";
import { cn } from "@/lib/utils";
import {
  saveBranding as saveBrandingAction, uploadLogo as uploadLogoAction, removeLogo as removeLogoAction,
} from "./actions";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const saveBranding = clientAction(saveBrandingAction);
const uploadLogo = clientAction(uploadLogoAction);
const removeLogo = clientAction(removeLogoAction);

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

type School = { name: string; name_mr: string; address: string; logo_url: string | null };

/**
 * Logo + the lines above and below the school name, where each appears,
 * and the report-card letterhead — with live previews of the website
 * header, the home hero and the printed result.
 */
export default function IdentityCard({ school, initial }: { school: School; initial: Branding }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [b, setB] = useState<Branding>(initial);
  const [logo, setLogo] = useState<string | null>(school.logo_url);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [previewLang, setPreviewLang] = useState<"en" | "mr">("en");

  const patch = <K extends keyof Branding>(k: K, v: Partial<Branding[K]>) =>
    setB((x) => ({ ...x, [k]: { ...(x[k] as object), ...v } }));

  async function onLogo(file: File) {
    if (!LOGO_TYPES.includes(file.type)) { toast.error("Logo must be a PNG, JPG, WebP or GIF image"); return; }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error(`This file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the logo can be up to 2 MB.`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await uploadLogo(fd);
      setLogo(url);
      toast.success("Logo updated everywhere on the site");
      router.refresh();
    } catch (err) { toast.error((err as Error).message); }
    finally { setUploading(false); }
  }

  function onRemoveLogo() {
    startTransition(async () => {
      try { await removeLogo(); setLogo(null); toast.success("Logo removed"); router.refresh(); }
      catch (err) { toast.error((err as Error).message); }
    });
  }

  function save() {
    startTransition(async () => {
      try { await saveBranding(b); toast.success("School identity saved"); router.refresh(); }
      catch (err) { toast.error((err as Error).message); }
    });
  }

  const name = previewLang === "mr" ? school.name_mr || school.name : school.name || school.name_mr;
  const top = lineFor(b.top, previewLang);
  const bottom = lineFor(b.bottom, previewLang);

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <IdCard className="h-5 w-5 text-brand-700" />
        <h2 className="text-base font-semibold text-ink-900">School identity &amp; letterhead</h2>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        The logo and the lines above and below the school name — on the website and on every printed result.
      </p>

      <div className="mt-5 grid gap-8 xl:grid-cols-[1fr_minmax(0,420px)]">
        {/* ---------- Controls ---------- */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-xl bg-ink-50 ring-1 ring-ink-200">
              {logo
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={logo} alt="School logo" className="h-full w-full object-contain p-1" />
                : <span className="text-xs text-ink-400">No logo</span>}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" loading={uploading}
                  leftIcon={<ImagePlus className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
                  {logo ? "Replace logo" : "Upload logo"}
                </Button>
                {logo && (
                  <Button type="button" size="sm" variant="ghost" className="text-red-600 hover:bg-red-50"
                    leftIcon={<Trash2 className="h-4 w-4" />} onClick={onRemoveLogo} disabled={pending}>Remove</Button>
                )}
              </div>
              <p className="text-xs text-ink-500">PNG with a transparent background looks best · up to 2 MB. Used in the header, footer, hero, results and login.</p>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onLogo(f); }} />
            </div>
          </div>

          <LineField label="Line above the school name" hint="e.g. the trust or society: “Shri Saraswati Shikshan Prasarak Mandal”"
            value={b.top} onChange={(top) => setB({ ...b, top })} />
          <LineField label="Line below the school name" hint="e.g. “Affiliated to Maharashtra State Board · UDISE 27xxxxxxxx”"
            value={b.bottom} onChange={(bottom) => setB({ ...b, bottom })} />

          {/* Where the lines show */}
          <div>
            <div className="mb-2 text-sm font-medium text-ink-700">Show the lines on</div>
            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs text-ink-500">
                  <tr><th className="px-3 py-2 font-medium">Place</th><th className="px-3 py-2 font-medium">Line above</th><th className="px-3 py-2 font-medium">Line below</th></tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {([
                    ["header", "Website header"],
                    ["hero", "Home page hero"],
                    ["footer", "Footer"],
                    ["report", "Result / report card"],
                  ] as const).map(([k, label]) => (
                    <tr key={k}>
                      <td className="px-3 py-2 text-ink-800">{label}</td>
                      <td className="px-3 py-2"><Check2 on={b[k].show_top} onChange={(v) => patch(k, { show_top: v })} /></td>
                      <td className="px-3 py-2"><Check2 on={b[k].show_bottom} onChange={(v) => patch(k, { show_bottom: v })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={b.hero.show_logo} onChange={(e) => patch("hero", { show_logo: e.target.checked })}
                className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
              Show the logo on the home page hero
            </label>
          </div>

          {/* Report letterhead */}
          <div className="space-y-3 rounded-lg bg-ink-50 p-4">
            <div className="text-sm font-semibold text-ink-900">Result / report card letterhead</div>
            <Chips label="Logo" value={b.report.logo_position} onChange={(v) => patch("report", { logo_position: v })}
              options={[["left", "Left"], ["top", "On top"], ["both", "Both sides"], ["none", "No logo"]]} />
            <Chips label="Logo size" value={b.report.logo_size} onChange={(v) => patch("report", { logo_size: v })}
              options={[["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]} />
            <Chips label="Text" value={b.report.align} onChange={(v) => patch("report", { align: v })}
              options={[["center", "Centred"], ["left", "Left"]]} />
            <Chips label="School name" value={b.report.name_lang} onChange={(v) => patch("report", { name_lang: v })}
              options={[["mr", "मराठी"], ["en", "English"], ["both", "Both"]]} />
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={b.report.show_address} onChange={(e) => patch("report", { show_address: e.target.checked })}
                className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
              Show the address
            </label>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} loading={pending} leftIcon={<Check className="h-4 w-4" />}>Save identity</Button>
          </div>
        </div>

        {/* ---------- Live previews ---------- */}
        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-ink-700">Live preview</div>
            <div className="flex overflow-hidden rounded-full border border-ink-200 text-[11px] font-medium">
              {(["en", "mr"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setPreviewLang(l)} aria-pressed={previewLang === l}
                  className={cn("px-2.5 py-1", previewLang === l ? "bg-ink-900 text-white" : "bg-white text-ink-600")}>
                  {l === "en" ? "EN" : "मराठी"}
                </button>
              ))}
            </div>
          </div>

          {/* Website header */}
          <PreviewFrame label="Website header">
            <div className="flex items-center gap-3 bg-white px-4 py-3">
              <Mark logo={logo} name={name} />
              <div className="min-w-0">
                {b.header.show_top && top && <div className="truncate text-[9px] font-semibold uppercase tracking-wider text-ink-500">{top}</div>}
                <div className="truncate font-display text-sm font-semibold text-ink-900">{name}</div>
                {b.header.show_bottom && bottom && <div className="truncate text-[9px] font-medium text-ink-500">{bottom}</div>}
              </div>
            </div>
          </PreviewFrame>

          {/* Hero */}
          <PreviewFrame label="Home page hero">
            <div className="bg-linear-to-br from-brand-700 to-brand-950 px-5 pb-5 pt-10 text-white">
              {b.hero.show_logo && logo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logo} alt="" className="mb-2 h-9 w-9 rounded-lg bg-white/95 object-contain p-1" />
              )}
              <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-accent-300">
                {(b.hero.show_top && top) || (previewLang === "mr" ? "स्वागत आहे" : "Welcome to")}
              </div>
              <div className="mt-1 font-display text-2xl font-semibold leading-tight">{name}</div>
              {b.hero.show_bottom && bottom && <div className="mt-1 text-[11px] text-white/85">{bottom}</div>}
            </div>
          </PreviewFrame>

          {/* Report card */}
          <PreviewFrame label="Result / report card (as printed)">
            <div className="bg-white p-4 text-ink-900">
              <SchoolLetterhead school={{ ...school, logo_url: logo }} branding={b} />
              <div className="text-center font-display text-sm font-semibold">१० वी — अ घटक चाचणी १ 2026-27</div>
              <div className="mt-2 h-2 rounded bg-ink-100" />
              <div className="mt-1 h-2 w-2/3 rounded bg-ink-100" />
            </div>
          </PreviewFrame>
        </div>
      </div>
    </div>
  );
}

function LineField({ label, hint, value, onChange }: { label: string; hint: string; value: BiText; onChange: (v: BiText) => void }) {
  const cls = "block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm shadow-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100";
  return (
    <div>
      <div className="text-sm font-medium text-ink-700">{label}</div>
      <p className="mb-1.5 text-xs text-ink-500">{hint}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-400">English</span>
          <input value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} className={cls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-400">मराठी · used on results</span>
          <input lang="mr" value={value.mr} onChange={(e) => onChange({ ...value, mr: e.target.value })} className={cls}
            placeholder="Optional — Marathi version" />
        </label>
      </div>
    </div>
  );
}

function Check2({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
  );
}

function Chips<V extends string>({ label, value, options, onChange }: {
  label: string; value: V; options: [V, string][]; onChange: (v: V) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 text-xs font-medium text-ink-600">{label}</span>
      {options.map(([k, l]) => (
        <button key={k} type="button" onClick={() => onChange(k)} aria-pressed={value === k}
          className={cn("h-7 rounded-md border px-2.5 text-xs font-medium",
            value === k ? "border-brand-500 bg-white text-brand-800 ring-2 ring-brand-100" : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50")}>
          {l}
        </button>
      ))}
    </div>
  );
}

function PreviewFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</div>
      <div className="overflow-hidden rounded-xl shadow-sm ring-1 ring-ink-200">{children}</div>
    </div>
  );
}

function Mark({ logo, name }: { logo: string | null; name: string }) {
  return logo
    /* eslint-disable-next-line @next/next/no-img-element */
    ? <img src={logo} alt="" className="h-9 w-9 flex-none rounded-lg object-contain ring-1 ring-ink-100" />
    : <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</div>;
}
