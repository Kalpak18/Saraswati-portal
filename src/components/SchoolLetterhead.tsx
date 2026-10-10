import type { Branding } from "@/lib/branding";

// The school's letterhead as printed on report cards. A plain component (no
// hooks) so the server-rendered report card and the live preview in
// Settings render exactly the same thing.

export type LetterheadSchool = {
  name: string | null;
  name_mr: string | null;
  address: string;
  logo_url: string | null;
};

const LOGO_SIZE = {
  sm: "h-10 w-10 sm:h-12 sm:w-12",
  md: "h-12 w-12 sm:h-16 sm:w-16",
  lg: "h-16 w-16 sm:h-20 sm:w-20",
} as const;

export function SchoolLetterhead({ school, branding }: { school: LetterheadSchool; branding: Branding }) {
  const r = branding.report;
  const en = school.name?.trim() || "";
  const mr = school.name_mr?.trim() || "";
  // Name(s) the admin chose for the printed card; fall back to whichever exists.
  const names = r.name_lang === "both" ? [mr, en].filter(Boolean)
    : r.name_lang === "mr" ? [mr || en] : [en || mr];
  // Report cards are Marathi documents: prefer the Marathi line, then English.
  const top = (branding.top.mr || branding.top.en).trim();
  const bottom = (branding.bottom.mr || branding.bottom.en).trim();
  const logo = school.logo_url;
  const pos = logo ? r.logo_position : "none";
  const center = r.align === "center";
  const logoEl = (key?: string) => logo && (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img key={key} src={logo} alt="" className={`${LOGO_SIZE[r.logo_size]} flex-none object-contain`} />
  );

  const text = (
    <div className={`min-w-0 flex-1 ${center ? "text-center" : "text-left"}`}>
      {r.show_top && top && <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-700 sm:text-xs">{top}</div>}
      {names.map((n, i) => (
        <h1 key={i} className={i === 0 ? "font-display text-base font-bold leading-tight sm:text-xl" : "font-display text-sm font-semibold leading-tight sm:text-base"}>{n}</h1>
      ))}
      {r.show_bottom && bottom && <div className="mt-0.5 text-[10px] font-medium text-ink-700 sm:text-xs">{bottom}</div>}
      {r.show_address && school.address && <div className="mt-0.5 text-[10px] text-ink-600 sm:text-xs">{school.address}</div>}
    </div>
  );

  return (
    <header className="mb-4 border-b border-ink-900 pb-3">
      {pos === "top" ? (
        <div className={`flex flex-col gap-2 ${center ? "items-center" : "items-start"}`}>
          {logoEl()}
          {text}
        </div>
      ) : (
        <div className="flex items-center gap-3 sm:gap-4">
          {(pos === "left" || pos === "both") && logoEl("l")}
          {text}
          {pos === "both" && logoEl("r")}
        </div>
      )}
    </header>
  );
}
