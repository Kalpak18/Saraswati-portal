"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { saveHero, uploadHeroImage } from "./actions";

type HeroForm = {
  title: string;
  tagline: string;
  meta_line: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  cover_photo_url: string | null;
};

export default function HeroEditor({ initial }: { initial: HeroForm }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<HeroForm>(initial);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveHero({
          ...form,
          meta_line: form.meta_line || null,
          secondary_cta_label: form.secondary_cta_label || null,
          secondary_cta_href: form.secondary_cta_href || null,
          cover_photo_url: form.cover_photo_url || null,
        });
        toast.success("Home hero saved");
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumbs={[
          { label: "Website", href: "/admin/website" },
          { label: "Home hero" },
        ]}
        title="Home hero"
        description="The banner at the top of the / (home) page. What you enter here shows up immediately after save."
        actions={
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-700 shadow-sm hover:bg-ink-50"
          >
            <ExternalLink className="h-4 w-4" />
            View live
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: text fields */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink-900">Text content</h2>
            <p className="mt-1 text-xs text-ink-500">Leave a field blank to use a bilingual default.</p>
            <div className="mt-5 space-y-5">
              <Input
                label="Title"
                placeholder="e.g. Excellence in education, brighter futures"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                hint="Big headline on the home hero."
              />
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-ink-700">Tagline</span>
                <textarea
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  rows={3}
                  placeholder="e.g. Committed to the all-round development of every child."
                  className="block w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm shadow-sm outline-none placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <span className="text-xs text-ink-500">One or two sentences under the title.</span>
              </label>
              <Input
                label="Small caption"
                placeholder="e.g. Since 1985 · SSC affiliated"
                value={form.meta_line}
                onChange={(e) => setForm({ ...form, meta_line: e.target.value })}
                hint="Optional. Shown as a small line under the tagline."
              />
            </div>
          </section>

          <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink-900">Call-to-action buttons</h2>
            <p className="mt-1 text-xs text-ink-500">
              The primary button is always visible. Secondary is shown next to it when both label &amp; link are provided.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Primary label"
                required
                value={form.primary_cta_label}
                onChange={(e) => setForm({ ...form, primary_cta_label: e.target.value })}
              />
              <Input
                label="Primary link"
                required
                placeholder="/lookup"
                value={form.primary_cta_href}
                onChange={(e) => setForm({ ...form, primary_cta_href: e.target.value })}
                hint="Where the primary button goes. Usually /lookup."
              />
              <Input
                label="Secondary label"
                placeholder="Learn more"
                value={form.secondary_cta_label}
                onChange={(e) => setForm({ ...form, secondary_cta_label: e.target.value })}
              />
              <Input
                label="Secondary link"
                placeholder="/about"
                value={form.secondary_cta_href}
                onChange={(e) => setForm({ ...form, secondary_cta_href: e.target.value })}
              />
            </div>
          </section>
        </div>

        {/* Right: photo + save */}
        <div className="space-y-6">
          <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink-900">Cover photo</h2>
            <p className="mt-1 text-xs text-ink-500">
              Used as the hero background. If not set, a soft indigo gradient is shown instead.
            </p>
            <div className="mt-5">
              <ImageUpload
                aspect="wide"
                value={form.cover_photo_url}
                onChange={(url) => setForm({ ...form, cover_photo_url: url })}
                onUpload={uploadHeroImage}
                hint="Landscape orientation, max 1600px. Auto-compressed on upload."
              />
            </div>
          </section>

          <div className="sticky bottom-4">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={pending}
              leftIcon={pending ? undefined : <Save className="h-4 w-4" />}
            >
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
