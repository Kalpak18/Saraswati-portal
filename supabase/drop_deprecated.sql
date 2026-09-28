-- Saraswati Portal — drop deprecated columns
--
-- Apply AFTER schema.sql / production.sql / cms.sql. Idempotent.
--
-- Removes fields that the school decided not to track any more:
--   students.gr_no          — the General Register number
--   students.admission_date — admission date
--   marks.grade             — letter grade per subject
--
-- Views/indexes/policies referencing these columns are dropped explicitly
-- below so the ALTERs succeed on a first run.

-- Any partial index built on the removed column would block ALTER … DROP
-- COLUMN. This one was created in production.sql.
drop index if exists students_gr_no_unique;

alter table students drop column if exists gr_no;
alter table students drop column if exists admission_date;

alter table marks drop column if exists grade;
