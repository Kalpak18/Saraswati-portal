"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLang } from "@/lib/i18n/LangContext";
import { dict, t } from "@/lib/i18n/dict";
import { saveSettings, uploadLogo, removeLogo } from "./actions";

type Initial = { name: string; address: string; logo_url: string | null };

export default function SettingsClient({ initial }: { initial: Initial }) {
  const { lang } = useLang();
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [address, setAddress] = useState(initial.address);
  const [logoUrl, setLogoUrl] = useState(initial.logo_url);
  const [pending, startTransition] = useTransition();

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveSettings({ name, address });
        toast.success(t(dict.settings.saved, lang));
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  async function onLogo(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      try {
        const { url } = await uploadLogo(fd);
        setLogoUrl(url);
        toast.success(t(dict.settings.saved, lang));
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  async function onRemoveLogo() {
    startTransition(async () => {
      try {
        await removeLogo();
        setLogoUrl(null);
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">{t(dict.settings.title, lang)}</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md bg-gray-100">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-gray-400">No logo</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
              {t(dict.settings.logo, lang)}
            </label>
            {logoUrl && (
              <button onClick={onRemoveLogo} disabled={pending}
                className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline">
                <Trash2 className="h-3 w-3" /> {t(dict.common.delete, lang)}
              </button>
            )}
          </div>
        </div>

        <form onSubmit={onSave} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">{t(dict.settings.name, lang)}</span>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">{t(dict.settings.address, lang)}</span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
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
