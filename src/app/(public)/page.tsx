import Link from "next/link";
import { ArrowRight, Calendar, Sparkles, Trophy, GraduationCap, Users, Search } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import HomeHero from "./HomeHero";

/**
 * Public / (Home) — the school's front door.
 *
 * All content on this page is DB-driven and admin-editable. Any section
 * without data falls back to a friendly empty state so the page always
 * looks intentional, never broken.
 */
export default async function HomePage() {
  const supabase = await createSupabaseServer();

  const [{ data: hero }, { data: events }, { data: toppers }, { data: achievements }, { count: studentsCount }] =
    await Promise.all([
      supabase
        .from("hero_content")
        .select("title, tagline, cover_photo_url, primary_cta_label, primary_cta_href, secondary_cta_label, secondary_cta_href, meta_line")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("events")
        .select("id, title, slug, event_date, cover_photo_url, description")
        .eq("is_published", true)
        .order("event_date", { ascending: false, nullsFirst: false })
        .limit(3),
      supabase
        .from("toppers")
        .select("id, rank, note, photo_url, students(id, student_name, gr_no), exams(test_type, academic_year, exam_start_date)")
        .eq("is_featured", true)
        .order("rank", { ascending: true })
        .limit(6),
      supabase
        .from("achievements")
        .select("id, title, description, category, achieved_on, photo_url")
        .eq("is_published", true)
        .order("achieved_on", { ascending: false, nullsFirst: false })
        .limit(3),
      supabase.from("students").select("id", { count: "exact", head: true }),
    ]);

  const heroData = {
    title: hero?.title ?? "",
    tagline: hero?.tagline ?? "",
    cover_photo_url: hero?.cover_photo_url ?? null,
    primary_cta_label: hero?.primary_cta_label ?? "परिणाम पहा · Check Result",
    primary_cta_href: hero?.primary_cta_href ?? "/lookup",
    secondary_cta_label: hero?.secondary_cta_label ?? null,
    secondary_cta_href: hero?.secondary_cta_href ?? null,
    meta_line: hero?.meta_line ?? null,
  };

  return (
    <>
      <HomeHero data={heroData} studentsCount={studentsCount ?? 0} />

      {/* ==================================================================
          Featured Toppers
      ================================================================== */}
      {toppers && toppers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Our stars"
            title="Featured toppers"
            subtitle="Celebrating our top-performing students this year."
            action={{ href: "/achievements", label: "See all achievements" }}
          />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {toppers.map((t) => {
              const student = t.students as unknown as { id: string; student_name: string; gr_no: string | null } | null;
              const exam = t.exams as unknown as { test_type: string; academic_year: string } | null;
              return (
                <div
                  key={t.id}
                  className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative">
                    <div className="h-20 w-20 overflow-hidden rounded-full bg-linear-to-br from-indigo-100 to-purple-100 ring-4 ring-white">
                      {t.photo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={t.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-indigo-500">
                          {student?.student_name?.trim().charAt(0).toUpperCase() ?? "S"}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-white ring-2 ring-white">
                      #{t.rank}
                    </div>
                  </div>
                  <div className="mt-3 line-clamp-1 text-sm font-semibold text-gray-900">
                    {student?.student_name ?? "—"}
                  </div>
                  {exam && (
                    <div className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">
                      {exam.test_type} · {exam.academic_year}
                    </div>
                  )}
                  {t.note && (
                    <div className="mt-1 line-clamp-2 text-[11px] text-indigo-600">
                      {t.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================================================================
          Recent Events
      ================================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="What's happening"
          title="Recent events"
          subtitle="Photos and updates from around the school."
          action={{ href: "/events", label: "View all events" }}
        />
        {events && events.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-16/9 w-full overflow-hidden bg-gray-100">
                  {e.cover_photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={e.cover_photo_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-50 to-purple-50 text-indigo-300">
                      <Calendar className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                    {e.event_date ?? "Coming soon"}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-base font-semibold text-gray-900 group-hover:text-indigo-700">
                    {e.title}
                  </h3>
                  {e.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{e.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <Calendar className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-700">No events published yet</p>
            <p className="mt-1 text-xs text-gray-500">Check back soon for upcoming activities.</p>
          </div>
        )}
      </section>

      {/* ==================================================================
          Achievements Preview
      ================================================================== */}
      {achievements && achievements.length > 0 && (
        <section className="border-y border-gray-100 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Making us proud"
              title="Recent achievements"
              subtitle="Academic, sports and cultural highlights."
              action={{ href: "/achievements", label: "See all" }}
            />
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      {a.category}
                      {a.achieved_on && ` · ${a.achieved_on}`}
                    </div>
                    <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900">
                      {a.title}
                    </h3>
                    {a.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">{a.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================================================================
          Quick Nav Cards
      ================================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Explore"
          title="Discover more"
          subtitle="Everything you need, one click away."
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickCard
            href="/lookup"
            title="Check Result"
            subtitle="Enter mobile + DOB"
            icon={<Search className="h-5 w-5" />}
            tone="indigo"
          />
          <QuickCard
            href="/events"
            title="Upcoming Events"
            subtitle="Never miss a moment"
            icon={<Calendar className="h-5 w-5" />}
            tone="purple"
          />
          <QuickCard
            href="/team"
            title="Meet the Team"
            subtitle="Our teachers & leaders"
            icon={<Users className="h-5 w-5" />}
            tone="green"
          />
          <QuickCard
            href="/about"
            title="About School"
            subtitle="Vision, mission, more"
            icon={<GraduationCap className="h-5 w-5" />}
            tone="amber"
          />
        </div>
      </section>

      {/* ==================================================================
          CTA Band
      ================================================================== */}
      <section className="bg-linear-to-br from-indigo-600 to-purple-700 py-14">
        <div className="mx-auto max-w-4xl px-4 text-center text-white sm:px-6 lg:px-8">
          <Sparkles className="mx-auto h-8 w-8 text-white/60" />
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            Check your child&apos;s result in seconds
          </h2>
          <p className="mt-3 text-sm text-indigo-100 sm:text-base">
            Enter the registered mobile number and date of birth. No signup needed.
          </p>
          <Link
            href="/lookup"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            परिणाम पहा · Check Result
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

// ------------------------------------------------------------
// Small helpers used above
// ------------------------------------------------------------
function SectionHeader({
  eyebrow, title, subtitle, action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex flex-none items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function QuickCard({
  href, title, subtitle, icon, tone,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "indigo" | "purple" | "green" | "amber";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  } as const;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
    >
      <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${tones[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div>
      </div>
      <ArrowRight className="h-4 w-4 flex-none text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
    </Link>
  );
}
