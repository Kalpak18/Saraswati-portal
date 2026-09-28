-- Saraswati Portal — CMS tables (school website content).
--
-- Additive migration. Apply AFTER schema.sql and production.sql.
-- Safe to re-run.
--
-- What each table is for
-- ----------------------
-- hero_content       Single-row settings for the public / (Home) page hero.
-- events             Events + photo album. photo_url on the row is the cover;
--                    event_photos holds the gallery images.
-- event_photos       Many-per-event photos with an ordering field.
-- team_members       Secretary / Principal / Teachers with photo, bio, contact.
-- achievements       Standalone achievements (sports, cultural, etc.), with
--                    an optional student_id when it maps to a real roster row.
-- toppers            Admin-curated ranked list per exam. student_id + rank +
--                    optional override photo. UI computes totals from marks.
-- gallery_albums     Album folders shown on /gallery.
-- gallery_photos     Photos within an album with an ordering field.
-- about_sections     Rich-text sections for the /about page.
-- contact_messages   Inbox for the public contact form.
--
-- All content tables enable RLS with two policies:
--   - authenticated: full CRUD
--   - anon:          SELECT-only on the publicly-visible rows

-- =========================================================
-- 1. hero_content — single-row site hero
-- =========================================================
create table if not exists hero_content (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  tagline text not null default '',
  cover_photo_url text,
  primary_cta_label text not null default 'परिणाम पहा · Check Result',
  primary_cta_href text not null default '/lookup',
  secondary_cta_label text,
  secondary_cta_href text,
  /** Optional short line under the tagline (est. 1985 · 1,200 students…) */
  meta_line text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_hero_updated on hero_content;
create trigger trg_hero_updated before update on hero_content
  for each row execute function set_updated_at();

-- Seed a single blank row so the Home page always has data to show.
insert into hero_content (title, tagline)
select '', ''
where not exists (select 1 from hero_content);

-- =========================================================
-- 2. events + event_photos
-- =========================================================
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  event_date date,
  cover_photo_url text,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_date_idx on events (event_date desc);
create index if not exists events_published_idx on events (is_published, event_date desc);

drop trigger if exists trg_events_updated on events;
create trigger trg_events_updated before update on events
  for each row execute function set_updated_at();

create table if not exists event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  photo_url text not null,
  caption text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists event_photos_event_idx on event_photos (event_id, display_order);

-- =========================================================
-- 3. team_members
-- =========================================================
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text not null,       -- Secretary, Principal, Vice-Principal, etc.
  bio text not null default '',
  photo_url text,
  email text,
  phone text,
  /** Category groups the cards on /team. */
  category text not null default 'faculty',  -- 'leadership' | 'faculty' | 'management'
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists team_category_order_idx on team_members (category, display_order);

drop trigger if exists trg_team_updated on team_members;
create trigger trg_team_updated before update on team_members
  for each row execute function set_updated_at();

-- =========================================================
-- 4. achievements
-- =========================================================
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'academic',   -- 'academic' | 'sports' | 'cultural' | 'other'
  achieved_on date,
  photo_url text,
  /** Optional link to an existing student. Null = external / group achievement. */
  student_id uuid references students(id) on delete set null,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists achievements_category_idx on achievements (category, achieved_on desc);

drop trigger if exists trg_achievements_updated on achievements;
create trigger trg_achievements_updated before update on achievements
  for each row execute function set_updated_at();

-- =========================================================
-- 5. toppers — curated ranked list per exam
-- =========================================================
create table if not exists toppers (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  rank int not null,
  /** Optional override photo when the student's own photo isn't uploaded. */
  photo_url text,
  /** Optional short note ("First in Marathi", "97% aggregate", etc.). */
  note text,
  /** Whether the topper should surface on the public home hero banner. */
  is_featured boolean not null default true,
  created_at timestamptz not null default now(),
  unique (exam_id, student_id),
  unique (exam_id, rank)
);
create index if not exists toppers_exam_rank_idx on toppers (exam_id, rank);
create index if not exists toppers_featured_idx on toppers (is_featured);

-- =========================================================
-- 6. gallery_albums + gallery_photos
-- =========================================================
create table if not exists gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  cover_photo_url text,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_gallery_albums_updated on gallery_albums;
create trigger trg_gallery_albums_updated before update on gallery_albums
  for each row execute function set_updated_at();

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references gallery_albums(id) on delete cascade,
  photo_url text not null,
  caption text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists gallery_photos_album_idx on gallery_photos (album_id, display_order);

-- =========================================================
-- 7. about_sections — freeform rich-text blocks for /about
-- =========================================================
create table if not exists about_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,               -- 'vision' | 'mission' | 'facilities' | ...
  heading text not null,
  body_html text not null default '',
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_about_updated on about_sections;
create trigger trg_about_updated before update on about_sections
  for each row execute function set_updated_at();

-- =========================================================
-- 8. contact_messages — public contact-form inbox
-- =========================================================
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  /** Server-side triage: 'new' | 'read' | 'replied' | 'archived' */
  status text not null default 'new',
  /** IP hash (same salt as parent lookup) for basic spam pattern spotting. */
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contact_messages_status_idx on contact_messages (status, created_at desc);

drop trigger if exists trg_contact_updated on contact_messages;
create trigger trg_contact_updated before update on contact_messages
  for each row execute function set_updated_at();

-- =========================================================
-- 9. Row Level Security
-- =========================================================
-- Content tables: anon reads published rows only, authenticated does everything.
-- contact_messages: anon INSERTs (submit form), authenticated reads/updates.

alter table hero_content    enable row level security;
alter table events          enable row level security;
alter table event_photos    enable row level security;
alter table team_members    enable row level security;
alter table achievements    enable row level security;
alter table toppers         enable row level security;
alter table gallery_albums  enable row level security;
alter table gallery_photos  enable row level security;
alter table about_sections  enable row level security;
alter table contact_messages enable row level security;

-- Authenticated full CRUD
drop policy if exists "auth_all_hero_content" on hero_content;
create policy "auth_all_hero_content" on hero_content for all
  to authenticated using (true) with check (true);

drop policy if exists "auth_all_events" on events;
create policy "auth_all_events" on events for all
  to authenticated using (true) with check (true);

drop policy if exists "auth_all_event_photos" on event_photos;
create policy "auth_all_event_photos" on event_photos for all
  to authenticated using (true) with check (true);

drop policy if exists "auth_all_team_members" on team_members;
create policy "auth_all_team_members" on team_members for all
  to authenticated using (true) with check (true);

drop policy if exists "auth_all_achievements" on achievements;
create policy "auth_all_achievements" on achievements for all
  to authenticated using (true) with check (true);

drop policy if exists "auth_all_toppers" on toppers;
create policy "auth_all_toppers" on toppers for all
  to authenticated using (true) with check (true);

drop policy if exists "auth_all_gallery_albums" on gallery_albums;
create policy "auth_all_gallery_albums" on gallery_albums for all
  to authenticated using (true) with check (true);

drop policy if exists "auth_all_gallery_photos" on gallery_photos;
create policy "auth_all_gallery_photos" on gallery_photos for all
  to authenticated using (true) with check (true);

drop policy if exists "auth_all_about_sections" on about_sections;
create policy "auth_all_about_sections" on about_sections for all
  to authenticated using (true) with check (true);

drop policy if exists "auth_all_contact_messages" on contact_messages;
create policy "auth_all_contact_messages" on contact_messages for all
  to authenticated using (true) with check (true);

-- Anon read access to published content
drop policy if exists "anon_read_hero_content" on hero_content;
create policy "anon_read_hero_content" on hero_content for select
  to anon using (true);

drop policy if exists "anon_read_events" on events;
create policy "anon_read_events" on events for select
  to anon using (is_published = true);

drop policy if exists "anon_read_event_photos" on event_photos;
create policy "anon_read_event_photos" on event_photos for select
  to anon using (
    exists (select 1 from events e where e.id = event_photos.event_id and e.is_published)
  );

drop policy if exists "anon_read_team_members" on team_members;
create policy "anon_read_team_members" on team_members for select
  to anon using (is_active = true);

drop policy if exists "anon_read_achievements" on achievements;
create policy "anon_read_achievements" on achievements for select
  to anon using (is_published = true);

drop policy if exists "anon_read_toppers" on toppers;
create policy "anon_read_toppers" on toppers for select
  to anon using (is_featured = true);

drop policy if exists "anon_read_gallery_albums" on gallery_albums;
create policy "anon_read_gallery_albums" on gallery_albums for select
  to anon using (is_published = true);

drop policy if exists "anon_read_gallery_photos" on gallery_photos;
create policy "anon_read_gallery_photos" on gallery_photos for select
  to anon using (
    exists (select 1 from gallery_albums a where a.id = gallery_photos.album_id and a.is_published)
  );

drop policy if exists "anon_read_about_sections" on about_sections;
create policy "anon_read_about_sections" on about_sections for select
  to anon using (true);

-- Contact form: anon can INSERT, cannot read anything back.
drop policy if exists "anon_insert_contact_messages" on contact_messages;
create policy "anon_insert_contact_messages" on contact_messages for insert
  to anon with check (true);
