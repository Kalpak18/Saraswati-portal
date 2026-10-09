-- Saraswati Portal — notice board (admissions, results, exams, holidays…)
--
-- Additive migration. Apply AFTER schema.sql. Safe to re-run.
--
-- A notice is live when it is published, its publish date has arrived and
-- it has not passed its expiry date. Pinned notices sort first and scroll
-- in the "Latest updates" bar on the home page.

create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  category text not null default 'general',  -- admission | result | exam | event | holiday | general
  link_href text,                             -- optional "read more" link
  attachment_url text,                        -- optional PDF / image of the printed notice
  attachment_name text,
  is_pinned boolean not null default false,
  is_published boolean not null default true,
  publish_on date not null default current_date,
  expires_on date,                            -- null = never expires
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notices_live_idx
  on notices (is_published, is_pinned desc, publish_on desc);

drop trigger if exists trg_notices_updated on notices;
create trigger trg_notices_updated before update on notices
  for each row execute function set_updated_at();

alter table notices enable row level security;

drop policy if exists "auth_all_notices" on notices;
create policy "auth_all_notices" on notices for all
  to authenticated using (true) with check (true);

-- Visitors only ever see live notices, even if they query the API directly.
drop policy if exists "anon_read_notices" on notices;
create policy "anon_read_notices" on notices for select
  to anon using (
    is_published
    and publish_on <= current_date
    and (expires_on is null or expires_on >= current_date)
  );
