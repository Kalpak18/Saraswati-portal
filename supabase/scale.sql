-- Saraswati Portal — sized for a full school
-- ~5000 students, classes 1–12 × ~6 divisions, ~1M marks a year, and
-- thousands of parents opening results on the same day.
-- Safe to re-run. Apply in the Supabase SQL Editor AFTER production.sql.

-- =========================================================
-- 1. Indexes for deletes and admin lists
-- =========================================================
-- Deleting or re-uploading an exam cascades exam_subjects → marks. Without
-- an index on marks.subject_id every subject deleted scans all marks.
create index if not exists marks_subject_idx on marks (subject_id);

-- Deleting a student checks these foreign keys.
create index if not exists toppers_student_idx on toppers (student_id);
create index if not exists achievements_student_idx on achievements (student_id);

-- Admin results list: one year at a time, newest first.
create index if not exists exams_year_start_idx on exams (academic_year, exam_start_date desc);

-- Name matching / roster reads.
create index if not exists students_active_name_idx on students (is_active, student_name);

-- =========================================================
-- 2. Result-day rate limiting
-- =========================================================
-- The app now records two keys per lookup: the visitor's network (generous
-- — hundreds of parents share one Jio/Airtel or school Wi-Fi address) and
-- the mobile number being searched (strict — stops guessing a child's date
-- of birth from any number of networks). Same table, same function.
create index if not exists lookup_attempts_at_idx on lookup_attempts (at);

create or replace function record_lookup_attempt(
  p_ip_hash text,
  p_window_seconds int default 600
) returns int as $$
declare
  n int;
begin
  -- Housekeeping on ~1% of calls, so concurrent lookups don't queue up
  -- behind each other deleting the same old rows.
  if random() < 0.01 then
    delete from lookup_attempts where at < now() - interval '1 day';
  end if;

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
-- 3. Audit log size
-- =========================================================
-- A full year of uploads is ~1M mark rows. Logging every uploaded mark
-- doubled the database for no benefit: the upload itself is recorded in
-- upload_batches and the file can be re-uploaded. Corrections (update)
-- and removals (delete) are still logged with before/after values.
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
    if src = 'upload' then return new; end if;
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

-- =========================================================
-- 4. Fresh statistics for the planner
-- =========================================================
analyze students;
analyze marks;
analyze exams;
analyze exam_subjects;
