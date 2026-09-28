import Link from "next/link";
import {
  Home, Calendar, Users, Trophy, Camera, MessageSquare, ArrowRight, Sparkles,
} from "lucide-react";
export const dynamic = "force-dynamic";

const TILES: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "indigo" | "purple" | "green" | "amber" | "blue" | "red";
  ready: boolean;
}[] = [
  {
    href: "/admin/website/hero",
    title: "Home hero",
    description: "Title, tagline, cover photo, CTA buttons on the / page.",
    icon: Sparkles,
    tone: "indigo",
    ready: true,
  },
  {
    href: "/admin/website/events",
    title: "Events",
    description: "Add & edit events with photo galleries.",
    icon: Calendar,
    tone: "purple",
    ready: false,
  },
  {
    href: "/admin/website/team",
    title: "Team",
    description: "Leadership, teachers, and support staff.",
    icon: Users,
    tone: "green",
    ready: false,
  },
  {
    href: "/admin/website/achievements",
    title: "Achievements",
    description: "Academic, sports and cultural highlights.",
    icon: Trophy,
    tone: "amber",
    ready: false,
  },
  {
    href: "/admin/website/gallery",
    title: "Gallery",
    description: "Photo albums organised by event.",
    icon: Camera,
    tone: "blue",
    ready: false,
  },
  {
    href: "/admin/website/messages",
    title: "Contact inbox",
    description: "View messages sent from the public contact form.",
    icon: MessageSquare,
    tone: "red",
    ready: false,
  },
];

const tones: Record<string, { bg: string; text: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  green:  { bg: "bg-green-50",  text: "text-green-600" },
  amber:  { bg: "bg-amber-50",  text: "text-amber-600" },
  blue:   { bg: "bg-blue-50",   text: "text-blue-600" },
  red:    { bg: "bg-red-50",    text: "text-red-600" },
};

export default function WebsiteIndexPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Content management
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            Website content
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Every section of the public school website is editable from here.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Home className="h-4 w-4" />
          View live site
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => {
          const Icon = t.icon;
          const tone = tones[t.tone];
          const inner = (
            <>
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone.bg} ${tone.text}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {!t.ready && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    Coming next
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900">{t.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{t.description}</p>
              {t.ready && (
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                  Open editor <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </>
          );
          return t.ready ? (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={t.href}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm opacity-70"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
