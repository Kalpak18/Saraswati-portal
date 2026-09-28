"use client";

import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { PageIntro } from "../components/PageIntro";
import ContactForm from "./ContactForm";

export default function ContactContent({
  school,
}: {
  school: { name: string | null; address: string | null };
}) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  return (
    <>
      <PageIntro
        eyebrow={t("संपर्क", "Get in touch")}
        title={t("आमच्याशी बोला.", "Let's talk.")}
        subtitle={t(
          "प्रवेश, माहितीसाठी किंवा शाळेला भेट देण्यासाठी — आम्हाला संपर्क करा.",
          "For admissions, information, or to plan a visit — we'd love to hear from you.",
        )}
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left: info stack */}
          <div className="lg:col-span-2">
            <div className="space-y-3">
              {school.address && (
                <InfoRow
                  icon={<MapPin className="h-5 w-5" />}
                  title={t("पत्ता", "Address")}
                  body={school.address}
                />
              )}
              <InfoRow
                icon={<Phone className="h-5 w-5" />}
                title={t("फोन", "Phone")}
                body={t("तपशील लवकरच", "Details coming soon")}
              />
              <InfoRow
                icon={<Mail className="h-5 w-5" />}
                title={t("ईमेल", "Email")}
                body={t("आमच्या फॉर्मद्वारे संदेश पाठवा.", "Reach us via the form.")}
              />
              <InfoRow
                icon={<Clock className="h-5 w-5" />}
                title={t("वेळ", "Office hours")}
                body={t("सोम – शनि, सकाळी ९ ते संध्याकाळी ५", "Mon – Sat, 9 AM to 5 PM")}
              />
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg shadow-brand-950/5 ring-1 ring-ink-100 sm:p-10">
              <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                {t("संदेश पाठवा", "Send a message")}
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                {t(
                  "आम्ही लवकरच परत संपर्क साधू.",
                  "We'll get back to you as soon as we can.",
                )}
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">
          {title}
        </div>
        <div className="mt-1 text-sm leading-relaxed text-ink-800">{body}</div>
      </div>
    </div>
  );
}
