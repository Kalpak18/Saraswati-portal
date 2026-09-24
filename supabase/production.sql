-- Saraswati Portal — production hardening
-- Safe to re-run. Apply in Supabase SQL Editor AFTER schema.sql.

-- =========================================================
-- 1. Indexed parent-mobile lookup
-- =========================================================
-- Numbers are stored however they were typed: "9822014571",
-- "+919822014571", "09822014571", "98220 14571". A suffix match
-- (like '%9822014571') cannot use an index and degrades to a full
-- table scan on every parent lookup. A stored generated column of
-- the last 10 digits makes it an equality hit instead.
alter table students
  add column if not exists parent_mobile_norm text
  generated always as (right(regexp_replace(parent_mobile, '\D', '', 'g'), 10)) stored;

-- The lookup filters on both columns together.
create index if not exists students_mobile_norm_dob_idx
  on students (parent_mobile_norm, dob);

-- Covers "which exams does this student have marks in".
create index if not exists marks_student_exam_idx
  on marks (student_id, exam_id);

-- Report-card read path: all marks for one student in one exam.
create index if not exists marks_exam_student_idx
  on marks (exam_id, student_id);

-- Ordering the exam list.
create index if not exists exams_start_date_idx
  on exams (exam_start_date desc);

-- =========================================================
-- 2. Rate limiting for the public lookup
-- =========================================================
-- Without this, mobile+DOB can be brute-forced to enumerate children.
create table if not exists lookup_attempts (
  id         bigserial primary key,
  ip_hash    text        not null,      -- sha256(ip + salt); no raw IPs stored
  at         timestamptz not null default now(),
  found      boolean     not null default false
);

create index if not exists lookup_attempts_ip_time_idx
  on lookup_attempts (ip_hash, at desc);

alter table lookup_attempts enable row level security;
-- No policy: only the service role (server-side) may touch this table.

-- Counts recent attempts and records this one, in a single round trip.
-- Returns the number of attempts in the window INCLUDING this one.
create or replace function record_lookup_attempt(
  p_ip_hash text,
  p_window_seconds int default 600
) returns int as $$
declare
  n int;
begin
  delete from lookup_attempts where at < now() - interval '1 day';

  select count(*) into n
  from lookup_attempts
  where ip_hash = p_ip_hash
    and at > now() - make_interval(secs => p_window_seconds);

  insert into lookup_attempts (ip_hash) values (p_ip_hash);
  return n + 1;
end;
$$ language plpgsql security definer;

revoke all on function record_lookup_attempt(text, int) from public, anon, authenticated;

-- =========================================================
-- 3. Audit log retention
-- =========================================================
-- audit_log grows with every mark written. Keep two years.
create or replace function prune_audit_log() returns void as $$
begin
  delete from audit_log where at < now() - interval '2 years';
end;
$$ language plpgsql security definer;

-- =========================================================
-- 4. Verify
-- =========================================================
-- select indexname from pg_indexes where tablename in ('students','marks','exams');
-- explain analyze select id from students where parent_mobile_norm = '9822014571' and dob = '2010-05-13';
