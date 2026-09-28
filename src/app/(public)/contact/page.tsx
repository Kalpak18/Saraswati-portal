import { MapPin, Phone, Mail } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import PageIntro from "../PageIntro";
import ContactForm from "./ContactForm";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const supabase = await createSupabaseServer();
  const { data: school } = await supabase
    .from("school_settings")
    .select("name, address")
    .limit(1)
    .maybeSingle();

  return (
    <>
      <PageIntro
        eyebrow="Get in touch"
        title="Contact us"
        subtitle="Have a question or want to visit? We'd love to hear from you."
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left: info cards */}
          <div className="space-y-4 lg:col-span-2">
            {school?.address && (
              <InfoCard
                icon={<MapPin className="h-5 w-5" />}
                title="Visit us"
                lines={[school.address]}
              />
            )}
            <InfoCard
              icon={<Phone className="h-5 w-5" />}
              title="Call us"
              lines={["Details coming soon"]}
            />
            <InfoCard
              icon={<Mail className="h-5 w-5" />}
              title="Message us"
              lines={["Use the form to send a message directly."]}
            />
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900">Send a message</h2>
              <p className="mt-1 text-sm text-gray-500">
                We&apos;ll get back to you as soon as possible.
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

function InfoCard({
  icon, title, lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="mt-1 space-y-0.5 text-sm text-gray-600">
          {lines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      </div>
    </div>
  );
}
