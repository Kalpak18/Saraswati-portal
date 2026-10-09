-- Saraswati Portal — cinematic home page
--
-- Additive migration. Apply AFTER cms.sql. Safe to re-run.
--
--   hero_content.media_type / cover_video_url
--       The hero is now just the school on screen: a photo or a looping
--       video. cover_photo_url doubles as the video's poster frame (shown
--       while the video loads, and on phones in data-saver mode).
--   home_banners
--       Full-width banners for the home page story — competitive-exam
--       result posters, admissions notices, event announcements.

alter table hero_content
  add column if not exists media_type text not null default 'photo',   -- 'photo' | 'video'
  add column if not exists cover_video_url text;

create table if not exists home_banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text not null default '',
  caption text not null default '',
  link_href text,
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists home_banners_order_idx on home_banners (is_published, display_order);

drop trigger if exists trg_home_banners_updated on home_banners;
create trigger trg_home_banners_updated before update on home_banners
  for each row execute function set_updated_at();

alter table home_banners enable row level security;

drop policy if exists "auth_all_home_banners" on home_banners;
create policy "auth_all_home_banners" on home_banners for all
  to authenticated using (true) with check (true);

drop policy if exists "anon_read_home_banners" on home_banners;
create policy "anon_read_home_banners" on home_banners for select
  to anon using (is_published = true);

-- =========================================================
-- School address + map link (shown in the footer, contact page and home)
-- =========================================================
alter table school_settings add column if not exists map_url text;

-- Fill in only where the admin hasn't set a value yet.
update school_settings
  set address = 'Saraswati Vidyalaya, Savarkar Nagar, Ward No 3, Vasind, Maharashtra 421601'
  where coalesce(trim(address), '') = '';
update school_settings
  set map_url = 'https://maps.app.goo.gl/YTZigfPcgZAeXGnV6'
  where coalesce(trim(map_url), '') = '';

-- =========================================================
-- Marathi school name (shown when a visitor switches to मराठी)
-- =========================================================
alter table school_settings add column if not exists name_mr text;
update school_settings
  set name_mr = 'सरस्वती विद्यालय, वासिंद'
  where coalesce(trim(name_mr), '') = ''
     or name_mr = 'सरस्वती विद्यालय';   -- earlier seed of this file left out the town

-- =========================================================
-- Hero slideshow: any mix of photos and videos, none required
-- =========================================================
-- slides = [{ "id", "type": "photo" | "video", "url", "poster_url"? }, …]
-- Replaces the one-slot media_type / cover_photo_url / cover_video_url
-- (kept for old rows; the site reads them if slides is empty).
alter table hero_content add column if not exists slides jsonb not null default '[]'::jsonb;

-- Carry an existing single photo / video over as the first slide.
update hero_content
set slides = case
  when cover_video_url is not null then jsonb_build_array(jsonb_build_object(
    'id', 'legacy-video', 'type', 'video', 'url', cover_video_url, 'poster_url', cover_photo_url))
  when cover_photo_url is not null then jsonb_build_array(jsonb_build_object(
    'id', 'legacy-photo', 'type', 'photo', 'url', cover_photo_url))
  else '[]'::jsonb
end
where slides = '[]'::jsonb and (cover_video_url is not null or cover_photo_url is not null);

-- Hero slideshow timing: seconds each slide stays up (videos may run to their end).
alter table hero_content add column if not exists slide_seconds int not null default 6;
-- Default camera move for hero slides (each slide may override).
alter table hero_content add column if not exists slide_effect text not null default 'zoom-in';
-- Hero height: full | tall | medium | short | original (the first slide's own shape).
alter table hero_content add column if not exists hero_height text not null default 'full';
