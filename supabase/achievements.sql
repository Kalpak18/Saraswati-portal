-- Saraswati Portal — competitive-exam achievements + public-safe toppers
--
-- Additive migration. Apply AFTER schema.sql, production.sql, cms.sql and
-- drop_deprecated.sql. Safe to re-run.
--
-- Why snapshot columns?
-- ---------------------
-- `students` and `exams` are readable by authenticated users only (they hold
-- parent mobiles and DOBs). The public website runs as `anon`, so a join like
-- toppers → students(student_name) silently returns null and every card on
-- the site shows "—". Instead, the admin tools copy the few display fields
-- (name, standard, exam label) onto the public row at the moment it is
-- published. Nothing sensitive is ever copied.

-- =========================================================
-- 1. achievements — structured competitive-exam fields
-- =========================================================
alter table achievements
  add column if not exists student_name    text,     -- display name (snapshot)
  add column if not exists standard_label  text,     -- e.g. "१० वी"
  add column if not exists exam_name       text,     -- e.g. "MTS Olympiad", "NMMS"
  add column if not exists level           text,     -- school | centre | taluka | district | division | state | national | international
  add column if not exists rank            int,
  add column if not exists score           numeric,
  add column if not exists max_score       numeric,
  add column if not exists award           text,     -- "Gold medal", "Merit scholarship", "Qualified"
  add column if not exists medal           text,     -- gold | silver | bronze
  add column if not exists academic_year   text,     -- "2025-26"
  add column if not exists import_batch_id uuid;

create index if not exists achievements_exam_idx
  on achievements (exam_name, academic_year);
create index if not exists achievements_published_idx
  on achievements (is_published, achieved_on desc);
create index if not exists achievements_batch_idx
  on achievements (import_batch_id);

-- One row per imported results file, so a re-upload of the same file is
-- detected and a whole import can be rolled back in one click.
create table if not exists achievement_imports (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  file_name text,
  exam_name text,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now(),
  rows_inserted int not null default 0,
  rows_updated int not null default 0
);
create index if not exists achievement_imports_time_idx
  on achievement_imports (uploaded_at desc);

alter table achievement_imports enable row level security;
drop policy if exists "auth_all_achievement_imports" on achievement_imports;
create policy "auth_all_achievement_imports" on achievement_imports for all
  to authenticated using (true) with check (true);

-- =========================================================
-- 2. toppers — snapshot display fields, allow ties
-- =========================================================
alter table toppers
  add column if not exists student_name   text,
  add column if not exists standard_label text,
  add column if not exists exam_label     text,
  add column if not exists academic_year  text,
  add column if not exists total          numeric,
  add column if not exists max_total      numeric,
  add column if not exists percentage     numeric;

-- Two students with the same total share a rank (1, 1, 3). The original
-- unique (exam_id, rank) made that impossible.
alter table toppers drop constraint if exists toppers_exam_id_rank_key;

-- =========================================================
-- 3. Public stats — counts only, no rows
-- =========================================================
-- Lets the anon home page show real numbers without granting SELECT on
-- students.
create or replace function public_site_stats() returns json as $$
  select json_build_object(
    'students',      (select count(*) from students where is_active),
    'achievements',  (select count(*) from achievements where is_published),
    'state_plus',    (select count(*) from achievements
                        where is_published and level in ('state', 'national', 'international')),
    'exams',         (select count(distinct exam_name) from achievements
                        where is_published and exam_name is not null)
  );
$$ language sql stable security definer set search_path = public;

revoke all on function public_site_stats() from public;
grant execute on function public_site_stats() to anon, authenticated;
