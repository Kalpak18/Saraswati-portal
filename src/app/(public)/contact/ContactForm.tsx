"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Send } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitContactMessage } from "./actions";

export default function ContactForm() {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await submitContactMessage(form);
        setSent(true);
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-brand-50 p-8 text-center ring-1 ring-brand-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 ring-4 ring-white">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="font-display text-xl font-semibold text-ink-900">
          {t("संदेश पाठवला गेला", "Message sent")}
        </h3>
        <p className="max-w-sm text-sm text-ink-600">
          {t(
            "आम्ही लवकरच परत संपर्क साधू. तुमच्या संदेशाबद्दल धन्यवाद.",
            "Thanks for reaching out. We'll be in touch soon.",
          )}
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSent(false);
            setForm({ name: "", email: "", phone: "", subject: "", message: "" });
          }}
        >
          {t("दुसरा संदेश पाठवा", "Send another")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        label={t("तुमचं नाव", "Your name")}
        required
        placeholder={t("पूर्ण नाव", "Full name")}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        containerClassName="sm:col-span-2"
      />
      <Input
        label={t("ईमेल", "Email")}
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label={t("फोन", "Phone")}
        type="tel"
        inputMode="numeric"
        placeholder={t("फोन नंबर", "Phone number")}
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <Input
        label={t("विषय", "Subject")}
        placeholder={t("कशाबद्दल?", "What's this about?")}
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
        containerClassName="sm:col-span-2"
      />
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-ink-700">
          {t("संदेश *", "Message *")}
        </span>
        <textarea
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={5}
          placeholder={t("इथे तुमचा संदेश लिहा…", "Type your message here…")}
          className="block w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none placeholder:text-ink-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <div className="sm:col-span-2">
        <Button
          type="submit"
          size="lg"
          loading={pending}
          leftIcon={pending ? undefined : <Send className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          {t("संदेश पाठवा", "Send message")}
        </Button>
      </div>
    </form>
  );
}
