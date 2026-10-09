-- Saraswati Portal — launch migration: appearance, team details, downloads.
--
-- Additive. Apply AFTER home_sections.sql. Safe to re-run.

-- =========================================================
-- 1. Site-wide appearance (Admin → Settings → Appearance)
-- =========================================================
alter table school_settings add column if not exists theme jsonb not null default '{}'::jsonb;

-- =========================================================
-- 2. Team / faculty details
-- =========================================================
alter table team_members
  add column if not exists designation_mr text,
  add column if not exists qualification text,
  add column if not exists subjects text,
  add column if not exists show_contact boolean not null default false;  -- email/phone on the public page

-- Visitors read the team through this view only. Email / phone appear
-- only for people marked show_contact; the table itself is closed to the
-- public API so private numbers can't be pulled from it directly.
create or replace view team_public as
  select id, name, designation, designation_mr, qualification, subjects, bio, photo_url,
         category, display_order,
         case when show_contact then email end as email,
         case when show_contact then phone end as phone
  from team_members
  where is_active;
grant select on team_public to anon, authenticated;

drop policy if exists "anon_read_team_members" on team_members;
revoke select on team_members from anon;

-- =========================================================
-- 3. Downloads — calendar, forms, circulars, syllabus…
-- =========================================================
create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_mr text,
  description text not null default '',
  category text not null default 'other',   -- calendar | forms | circulars | syllabus | results | other
  file_url text not null,
  file_name text,
  file_size bigint,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists downloads_order_idx on downloads (is_published, category, display_order);

drop trigger if exists trg_downloads_updated on downloads;
create trigger trg_downloads_updated before update on downloads
  for each row execute function set_updated_at();

alter table downloads enable row level security;

drop policy if exists "auth_all_downloads" on downloads;
create policy "auth_all_downloads" on downloads for all
  to authenticated using (true) with check (true);

drop policy if exists "anon_read_downloads" on downloads;
create policy "anon_read_downloads" on downloads for select
  to anon using (is_published = true);
