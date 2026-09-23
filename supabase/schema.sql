-- Saraswati Portal — Schema v3
-- Adds: exam date range as identity, upload idempotency, audit log.
-- Safe to re-run.
-- For an existing v1 / v2 database, run the wipe block once, then this script.
-- Wipe:
--   drop table if exists audit_log, upload_batches, marks, exam_subjects, exams,
--                        students, divisions, standards, classes, school_settings cascade;
--   drop function if exists set_updated_at(), audit_marks(), audit_students() cascade;

-- =========================================================
-- 0. Shared trigger fn
-- =========================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================
-- 1. School settings
-- =========================================================
create table if not exists school_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  address text not null default '',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_school_settings_updated on school_settings;
create trigger trg_school_settings_updated before update on school_settings
  for each row execute function set_updated_at();
insert into school_settings (name)
select 'Saraswati School'
where not exists (select 1 from school_settings);

-- =========================================================
-- 2. Standards & Divisions
-- =========================================================
create table if not exists standards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  academic_year text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, academic_year)
);
drop trigger if exists trg_standards_updated on standards;
create trigger trg_standards_updated before update on standards
  for each row execute function set_updated_at();

create table if not exists divisions (
  id uuid primary key default gen_random_uuid(),
  standard_id uuid not null references standards(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (standard_id, name)
);
drop trigger if exists trg_divisions_updated on divisions;
create trigger trg_divisions_updated before update on divisions
  for each row execute function set_updated_at();
create index if not exists divisions_standard_idx on divisions (standard_id);

-- =========================================================
-- 3. Students
-- =========================================================
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references divisions(id) on delete cascade,
  gr_no text,
  roll_no int not null,
  student_name text not null,
  parent_mobile text not null,
  dob date not null,
  gender text,
  admission_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (division_id, roll_no)
);
create unique index if not exists students_gr_no_unique
  on students (gr_no) where gr_no is not null;
create index if not exists students_parent_mobile_idx on students (parent_mobile);
create index if not exists students_dob_idx on students (dob);
create index if not exists students_division_idx on students (division_id);
drop trigger if exists trg_students_updated on students;
create trigger trg_students_updated before update on students
  for each row execute function set_updated_at();

-- =========================================================
-- 4. Exams (identity now includes exam_start_date)
-- =========================================================
create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references divisions(id) on delete cascade,
  test_type text not null,
  exam_start_date date not null,          -- min paper date in this exam
  exam_end_date date not null,            -- max paper date in this exam
  exam_date date,                         -- legacy display field (=start_date)
  academic_year text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Two "आठवडी परीक्षा" instances with different start dates are DIFFERENT exams:
  unique (division_id, test_type, academic_year, exam_start_date)
);
create index if not exists exams_division_idx on exams (division_id);
drop trigger if exists trg_exams_updated on exams;
create trigger trg_exams_updated before update on exams
  for each row execute function set_updated_at();

create table if not exists exam_subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  subject_name text not null,
  max_marks numeric,
  paper_no int,
  paper_date date,
  display_order int not null default 0,
  unique (exam_id, subject_name, paper_no)
);
create index if not exists exam_subjects_exam_idx on exam_subjects (exam_id);

create table if not exists marks (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  subject_id uuid not null references exam_subjects(id) on delete cascade,
  marks_obtained numeric,
  grade text,
  updated_by uuid,                        -- auth.uid() of last writer
  updated_source text,                    -- 'upload' | 'manual_edit'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, student_id, subject_id)
);
create index if not exists marks_student_idx on marks (student_id);
create index if not exists marks_exam_idx on marks (exam_id);
drop trigger if exists trg_marks_updated on marks;
create trigger trg_marks_updated before update on marks
  for each row execute function set_updated_at();

-- =========================================================
-- 5. Upload idempotency batches
-- =========================================================
create table if not exists upload_batches (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,   -- sha256(file bytes + division + user)
  file_name text,
  uploaded_by uuid,                       -- auth.uid()
  uploaded_at timestamptz not null default now(),
  rows_saved int not null default 0,
  students_created int not null default 0,
  exams_touched int not null default 0,
  status text not null default 'committed',    -- 'committed' | 'failed'
  notes text
);
create index if not exists upload_batches_uploader_idx on upload_batches (uploaded_by);
create index if not exists upload_batches_time_idx on upload_batches (uploaded_at desc);

-- =========================================================
-- 6. Audit log (marks + students)
-- =========================================================
create table if not exists audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid,                          -- auth.uid() if available
  table_name text not null,
  row_id uuid not null,
  action text not null,                   -- 'insert' | 'update' | 'delete'
  before jsonb,
  after jsonb,
  source text                             -- 'upload' | 'manual_edit' | 'import' | 'system'
);
create index if not exists audit_log_row_idx on audit_log (table_name, row_id);
create index if not exists audit_log_time_idx on audit_log (at desc);
create index if not exists audit_log_actor_idx on audit_log (actor_id);

-- Trigger fn for marks
create or replace function audit_marks() returns trigger as $$
declare
  a uuid;
  src text;
begin
  begin
    a := auth.uid();
  exception when others then
    a := null;
  end;
  src := coalesce(new.updated_source, old.updated_source, 'system');
  if TG_OP = 'INSERT' then
    insert into audit_log (actor_id, table_name, row_id, action, before, after, source)
      values (a, 'marks', new.id, 'insert', null, to_jsonb(new), src);
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into audit_log (actor_id, table_name, row_id, action, before, after, source)
      values (a, 'marks', new.id, 'update', to_jsonb(old), to_jsonb(new), src);
    return new;
  elsif TG_OP = 'DELETE' then
    insert into audit_log (actor_id, table_name, row_id, action, before, after, source)
      values (a, 'marks', old.id, 'delete', to_jsonb(old), null, coalesce(old.updated_source, 'system'));
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_audit_marks on marks;
create trigger trg_audit_marks
  after insert or update or delete on marks
  for each row execute function audit_marks();

-- Trigger fn for students
create or replace function audit_students() returns trigger as $$
declare a uuid;
begin
  begin a := auth.uid(); exception when others then a := null; end;
  if TG_OP = 'INSERT' then
    insert into audit_log (actor_id, table_name, row_id, action, before, after, source)
      values (a, 'students', new.id, 'insert', null, to_jsonb(new), 'system');
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into audit_log (actor_id, table_name, row_id, action, before, after, source)
      values (a, 'students', new.id, 'update', to_jsonb(old), to_jsonb(new), 'system');
    return new;
  elsif TG_OP = 'DELETE' then
    insert into audit_log (actor_id, table_name, row_id, action, before, after, source)
      values (a, 'students', old.id, 'delete', to_jsonb(old), null, 'system');
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_audit_students on students;
create trigger trg_audit_students
  after insert or update or delete on students
  for each row execute function audit_students();

-- =========================================================
-- 7. RLS
-- =========================================================
alter table school_settings enable row level security;
alter table standards       enable row level security;
alter table divisions       enable row level security;
alter table students        enable row level security;
alter table exams           enable row level security;
alter table exam_subjects   enable row level security;
alter table marks           enable row level security;
alter table upload_batches  enable row level security;
alter table audit_log       enable row level security;

drop policy if exists "auth_all_school_settings" on school_settings;
create policy "auth_all_school_settings" on school_settings for all
  to authenticated using (true) with check (true);
drop policy if exists "auth_all_standards" on standards;
create policy "auth_all_standards" on standards for all
  to authenticated using (true) with check (true);
drop policy if exists "auth_all_divisions" on divisions;
create policy "auth_all_divisions" on divisions for all
  to authenticated using (true) with check (true);
drop policy if exists "auth_all_students" on students;
create policy "auth_all_students" on students for all
  to authenticated using (true) with check (true);
drop policy if exists "auth_all_exams" on exams;
create policy "auth_all_exams" on exams for all
  to authenticated using (true) with check (true);
drop policy if exists "auth_all_exam_subjects" on exam_subjects;
create policy "auth_all_exam_subjects" on exam_subjects for all
  to authenticated using (true) with check (true);
drop policy if exists "auth_all_marks" on marks;
create policy "auth_all_marks" on marks for all
  to authenticated using (true) with check (true);
drop policy if exists "auth_all_upload_batches" on upload_batches;
create policy "auth_all_upload_batches" on upload_batches for all
  to authenticated using (true) with check (true);
drop policy if exists "auth_read_audit_log" on audit_log;
create policy "auth_read_audit_log" on audit_log for select
  to authenticated using (true);

drop policy if exists "anon_read_school_settings" on school_settings;
create policy "anon_read_school_settings" on school_settings for select
  to anon using (true);
