-- Saraswati Portal — home page builder + contact details
--
-- Additive migration. Apply AFTER home_story.sql. Safe to re-run.
--
-- home_sections holds the home page as an ordered list the admin arranges.
-- It starts empty: until the admin opens Website → Home page, the site
-- shows the built-in default layout; opening the builder saves that
-- default here (including any banners from home_banners) so it can be edited.

create table if not exists home_sections (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                       -- see src/lib/homeSections.ts
  display_order int not null default 0,
  is_visible boolean not null default true,
  content jsonb not null default '{}'::jsonb,   -- bilingual headings / text
  config  jsonb not null default '{}'::jsonb,   -- filters, limits, display mode
  items   jsonb not null default '[]'::jsonb,   -- banners, feature cards, quotes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists home_sections_order_idx on home_sections (display_order);

drop trigger if exists trg_home_sections_updated on home_sections;
create trigger trg_home_sections_updated before update on home_sections
  for each row execute function set_updated_at();

alter table home_sections enable row level security;

drop policy if exists "auth_all_home_sections" on home_sections;
create policy "auth_all_home_sections" on home_sections for all
  to authenticated using (true) with check (true);

-- Visitors read every row (hidden ones are filtered out when rendering).
-- Section wording isn't private, and knowing that a saved layout exists —
-- even an all-hidden one — stops the site falling back to the default.
drop policy if exists "anon_read_home_sections" on home_sections;
create policy "anon_read_home_sections" on home_sections for select
  to anon using (true);

-- Contact details shown in the footer and on the contact page.
alter table school_settings
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists office_hours text,
  add column if not exists office_hours_mr text;

-- Sections belong to a page ('home' | 'about'); one builder, several pages.
alter table home_sections add column if not exists page text not null default 'home';
create index if not exists home_sections_page_order_idx on home_sections (page, display_order);

-- Site-wide appearance: { brand, accent, heading_font, corners } (Admin → Settings → Appearance).
alter table school_settings add column if not exists theme jsonb not null default '{}'::jsonb;
