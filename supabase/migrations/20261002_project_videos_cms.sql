-- ============================================================================
-- QBENCH Portfolio Video Upload & Management Migration
-- Creates public.project_videos, adds thumbnail_mode to public.projects,
-- and provisions the portfolio-videos Supabase Storage bucket + RLS policies
-- ============================================================================

-- 1. Add thumbnail_mode column to public.projects ('cover_image' | 'video_thumbnail')
alter table public.projects
  add column if not exists thumbnail_mode text not null default 'cover_image'
  check (thumbnail_mode in ('cover_image', 'video_thumbnail'));

-- 2. Create public.project_videos table
create table if not exists public.project_videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  video_url text not null,
  storage_path text,
  video_title text,
  video_description text,
  display_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_videos_project_id
  on public.project_videos(project_id);

create index if not exists idx_project_videos_display_order
  on public.project_videos(project_id, display_order);

-- 3. Enable RLS and configure policies on public.project_videos
alter table public.project_videos enable row level security;

drop policy if exists "Public can view videos of published projects" on public.project_videos;
create policy "Public can view videos of published projects"
on public.project_videos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_videos.project_id
      and p.status = 'published'
  )
);

drop policy if exists "Admins can view all project_videos" on public.project_videos;
create policy "Admins can view all project_videos"
on public.project_videos
for select
to authenticated
using (public.is_qbench_admin());

drop policy if exists "Admins can insert project_videos" on public.project_videos;
create policy "Admins can insert project_videos"
on public.project_videos
for insert
to authenticated
with check (public.is_qbench_admin());

drop policy if exists "Admins can update project_videos" on public.project_videos;
create policy "Admins can update project_videos"
on public.project_videos
for update
to authenticated
using (public.is_qbench_admin())
with check (public.is_qbench_admin());

drop policy if exists "Admins can delete project_videos" on public.project_videos;
create policy "Admins can delete project_videos"
on public.project_videos
for delete
to authenticated
using (public.is_qbench_admin());

-- 4. Provision portfolio-videos Storage bucket (50 MB max per file; MP4, WebM, MOV)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-videos',
  'portfolio-videos',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime'];

-- 5. Storage RLS policies for portfolio-videos bucket
drop policy if exists "Public read access for portfolio-videos" on storage.objects;
create policy "Public read access for portfolio-videos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-videos');

drop policy if exists "Admins can upload to portfolio-videos" on storage.objects;
create policy "Admins can upload to portfolio-videos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-videos'
  and public.is_qbench_admin()
);

drop policy if exists "Admins can update portfolio-videos" on storage.objects;
create policy "Admins can update portfolio-videos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-videos'
  and public.is_qbench_admin()
)
with check (
  bucket_id = 'portfolio-videos'
  and public.is_qbench_admin()
);

drop policy if exists "Admins can delete from portfolio-videos" on storage.objects;
create policy "Admins can delete from portfolio-videos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-videos'
  and public.is_qbench_admin()
);
