"use client";

import { clientAction } from "@/lib/clientAction";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLang } from "@/lib/i18n/LangContext";
import { dict, t } from "@/lib/i18n/dict";
import { saveSettings as saveSettingsAction } from "./actions";
import AppearanceCard from "./AppearanceCard";
import IdentityCard from "./IdentityCard";
import type { Branding } from "@/lib/branding";
import type { Theme } from "@/lib/theme";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const saveSettings = clientAction(saveSettingsAction);

type Initial = {
  name: string; name_mr: string; phone: string; email: string; office_hours: string; office_hours_mr: string;
  address: string; map_url: string; logo_url: string | null };

export default function SettingsClient({ initial, theme, branding }: { initial: Initial; theme: Theme; branding: Branding }) {
  const { lang } = useLang();
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [nameMr, setNameMr] = useState(initial.name_mr);
  const [address, setAddress] = useState(initial.address);
  const [mapUrl, setMapUrl] = useState(initial.map_url);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [hours, setHours] = useState(initial.office_hours);
  const [hoursMr, setHoursMr] = useState(initial.office_hours_mr);
  const [pending, startTransition] = useTransition();

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveSettings({
          name, name_mr: nameMr, address, map_url: mapUrl,
          phone, email, office_hours: hours, office_hours_mr: hoursMr,
        });
        toast.success(t(dict.settings.saved, lang));
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <IdentityCard
        school={{ name: initial.name, name_mr: initial.name_mr, address: initial.address, logo_url: initial.logo_url }}
        initial={branding}
      />
      <AppearanceCard initial={theme} />
      <h1 className="text-xl font-semibold text-ink-900">{t(dict.settings.title, lang)}</h1>

      <div className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
        <form onSubmit={onSave} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink-700">{t(dict.settings.name, lang)}</span>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink-700">{t(dict.settings.nameMr, lang)}</span>
            <Input lang="mr" placeholder="सरस्वती विद्यालय" value={nameMr} onChange={(e) => setNameMr(e.target.value)} />
            <span className="text-xs text-ink-500">
              {lang === "mr"
                ? "वेबसाइट मराठीत पाहताना हे नाव दिसेल."
                : "Shown across the site when visitors switch to मराठी."}
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink-700">{t(dict.settings.address, lang)}</span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink-700">{t(dict.settings.mapUrl, lang)}</span>
            <Input
              type="url"
              placeholder="https://maps.app.goo.gl/…"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
            />
            <span className="text-xs text-ink-500">
              {lang === "mr"
                ? "Google Maps मध्ये शाळा उघडा → Share → लिंक कॉपी करा."
                : "Open the school in Google Maps → Share → Copy link."}
            </span>
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink-700">{t(dict.settings.phone, lang)}</span>
              <Input type="tel" placeholder="+91 98xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink-700">{t(dict.settings.email, lang)}</span>
              <Input type="email" placeholder="office@school.in" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink-700">{t(dict.settings.hours, lang)} (EN)</span>
              <Input placeholder="Mon – Sat, 9 AM to 5 PM" value={hours} onChange={(e) => setHours(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink-700">{t(dict.settings.hours, lang)} (मराठी)</span>
              <Input lang="mr" placeholder="सोम – शनि, सकाळी ९ ते संध्याकाळी ५" value={hoursMr} onChange={(e) => setHoursMr(e.target.value)} />
            </label>
          </div>
          <p className="-mt-2 text-xs text-ink-500">
            {lang === "mr"
              ? "वेबसाइटच्या तळटीप, संपर्क पान आणि मुख्यपृष्ठावर दिसेल. रिकामे ठेवल्यास लपवले जाईल."
              : "Shown in the footer, contact page and home page. Leave blank to hide."}
          </p>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? t(dict.common.loading, lang) : t(dict.common.save, lang)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
