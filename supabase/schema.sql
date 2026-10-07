create extension if not exists "pgcrypto";

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_admin_profiles_user_id on public.admin_profiles(user_id);
create index if not exists idx_admin_profiles_email on public.admin_profiles(email);

create or replace function public.is_qbench_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
select exists (
  select 1
  from public.admin_profiles
  where user_id = auth.uid()
  and role = 'admin'
);
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  display_order integer not null default 0,
  projects_display_limit integer not null default 4,
  show_view_all boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.categories
  add column if not exists cover_image_url text,
  add column if not exists display_order integer not null default 0,
  add column if not exists projects_display_limit integer not null default 4,
  add column if not exists show_view_all boolean not null default true,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_display_order on public.categories(display_order asc, name asc);
create index if not exists idx_categories_is_active on public.categories(is_active);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row
execute function public.handle_updated_at();

create or replace view public.portfolio_categories as
select
  id,
  name,
  slug,
  description,
  cover_image_url,
  display_order,
  projects_display_limit,
  show_view_all,
  is_active,
  created_at,
  updated_at
from public.categories;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  client text,
  client_name text,
  year integer default extract(year from now())::integer,
  project_date text,
  project_type text,
  services text[] not null default '{}',
  software_tools text[] not null default '{}',
  cover_image text,
  cover_image_url text,
  gallery text[] not null default '{}',
  behance_url text,
  youtube_url text,
  video_url text,
  featured boolean not null default false,
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  display_order integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.projects
  add column if not exists short_description text,
  add column if not exists cover_image_url text,
  add column if not exists video_url text,
  add column if not exists client_name text,
  add column if not exists project_date text,
  add column if not exists project_type text,
  add column if not exists software_tools text[] not null default '{}',
  add column if not exists is_featured boolean not null default false,
  add column if not exists display_order integer not null default 0,
  add column if not exists sort_order integer not null default 0;

create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_category_id on public.projects(category_id);
create index if not exists idx_projects_featured on public.projects(featured);
create index if not exists idx_projects_display_order on public.projects(display_order asc, created_at desc);
create index if not exists idx_projects_created_at on public.projects(created_at desc);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row
execute function public.handle_updated_at();

create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table if exists public.portfolio_images
  add column if not exists display_order integer not null default 0;

create index if not exists idx_portfolio_images_project_id on public.portfolio_images(project_id, display_order asc, sort_order asc);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_site_settings_setting_key on public.site_settings(setting_key);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row
execute function public.handle_updated_at();

create table if not exists public.project_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  company text,
  service text not null,
  budget text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_inquiries_created_at on public.project_inquiries(created_at desc);
create index if not exists idx_project_inquiries_status on public.project_inquiries(status);

drop trigger if exists trg_project_inquiries_updated_at on public.project_inquiries;
create trigger trg_project_inquiries_updated_at
before update on public.project_inquiries
for each row
execute function public.handle_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.site_settings enable row level security;
alter table public.project_inquiries enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant select on table public.portfolio_categories to anon, authenticated;
grant select on table public.projects to anon, authenticated;
grant select on table public.portfolio_images to anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant insert on table public.project_inquiries to anon, authenticated;
grant all on table public.admin_profiles to authenticated;
grant all on table public.categories to authenticated;
grant all on table public.portfolio_categories to authenticated;
grant all on table public.projects to authenticated;
grant all on table public.portfolio_images to authenticated;
grant all on table public.site_settings to authenticated;
grant all on table public.project_inquiries to authenticated;

drop policy if exists "Users can view own admin profile" on public.admin_profiles;
create policy "Users can view own admin profile"
on public.admin_profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_qbench_admin());

drop policy if exists "Admins can manage admin profiles" on public.admin_profiles;
create policy "Admins can manage admin profiles"
on public.admin_profiles
for all
to authenticated
using (public.is_qbench_admin())
with check (public.is_qbench_admin());

drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can view all categories" on public.categories;
create policy "Admins can view all categories"
on public.categories
for select
to authenticated
using (public.is_qbench_admin());

drop policy if exists "Admins can insert categories" on public.categories;
create policy "Admins can insert categories"
on public.categories
for insert
to authenticated
with check (public.is_qbench_admin());

drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories"
on public.categories
for update
to authenticated
using (public.is_qbench_admin())
with check (public.is_qbench_admin());

drop policy if exists "Admins can delete categories" on public.categories;
create policy "Admins can delete categories"
on public.categories
for delete
to authenticated
using (public.is_qbench_admin());

grant execute on function public.is_qbench_admin() to anon, authenticated, service_role;

drop policy if exists "Public can view published projects" on public.projects;
create policy "Public can view published projects"
on public.projects
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can view all projects" on public.projects;
create policy "Admins can view all projects"
on public.projects
for select
to authenticated
using (public.is_qbench_admin());

drop policy if exists "Admins can insert projects" on public.projects;
create policy "Admins can insert projects"
on public.projects
for insert
to authenticated
with check (public.is_qbench_admin());

drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
on public.projects
for update
to authenticated
using (public.is_qbench_admin())
with check (public.is_qbench_admin());

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
on public.projects
for delete
to authenticated
using (public.is_qbench_admin());

drop policy if exists "Public can view portfolio_images" on public.portfolio_images;
create policy "Public can view portfolio_images"
on public.portfolio_images
for select
to anon, authenticated
using (
  project_id is null
  or exists (
    select 1
    from public.projects p
    where p.id = portfolio_images.project_id
      and p.status = 'published'
  )
);

drop policy if exists "Admins can view all portfolio_images" on public.portfolio_images;
create policy "Admins can view all portfolio_images"
on public.portfolio_images
for select
to authenticated
using (public.is_qbench_admin());

drop policy if exists "Admins can insert portfolio_images" on public.portfolio_images;
create policy "Admins can insert portfolio_images"
on public.portfolio_images
for insert
to authenticated
with check (public.is_qbench_admin());

drop policy if exists "Admins can update portfolio_images" on public.portfolio_images;
create policy "Admins can update portfolio_images"
on public.portfolio_images
for update
to authenticated
using (public.is_qbench_admin())
with check (public.is_qbench_admin());

drop policy if exists "Admins can delete portfolio_images" on public.portfolio_images;
create policy "Admins can delete portfolio_images"
on public.portfolio_images
for delete
to authenticated
using (public.is_qbench_admin());

drop policy if exists "Public can view site_settings" on public.site_settings;
create policy "Public can view site_settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert site_settings" on public.site_settings;
create policy "Admins can insert site_settings"
on public.site_settings
for insert
to authenticated
with check (public.is_qbench_admin());

drop policy if exists "Admins can update site_settings" on public.site_settings;
create policy "Admins can update site_settings"
on public.site_settings
for update
to authenticated
using (public.is_qbench_admin())
with check (public.is_qbench_admin());

drop policy if exists "Admins can delete site_settings" on public.site_settings;
create policy "Admins can delete site_settings"
on public.site_settings
for delete
to authenticated
using (public.is_qbench_admin());

drop policy if exists "Public can submit project inquiries" on public.project_inquiries;
create policy "Public can submit project inquiries"
on public.project_inquiries
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can view project inquiries" on public.project_inquiries;
create policy "Admins can view project inquiries"
on public.project_inquiries
for select
to authenticated
using (public.is_qbench_admin());

drop policy if exists "Admins can update project inquiries" on public.project_inquiries;
create policy "Admins can update project inquiries"
on public.project_inquiries
for update
to authenticated
using (public.is_qbench_admin())
with check (public.is_qbench_admin());

drop policy if exists "Admins can delete project inquiries" on public.project_inquiries;
create policy "Admins can delete project inquiries"
on public.project_inquiries
for delete
to authenticated
using (public.is_qbench_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images',
  'portfolio-images',
  true,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

drop policy if exists "Public read access for portfolio-images" on storage.objects;
create policy "Public read access for portfolio-images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-images');

drop policy if exists "Admins can upload to portfolio-images" on storage.objects;
create policy "Admins can upload to portfolio-images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-images'
  and public.is_qbench_admin()
);

drop policy if exists "Admins can update portfolio-images" on storage.objects;
create policy "Admins can update portfolio-images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-images'
  and public.is_qbench_admin()
)
with check (
  bucket_id = 'portfolio-images'
  and public.is_qbench_admin()
);

drop policy if exists "Admins can delete from portfolio-images" on storage.objects;
create policy "Admins can delete from portfolio-images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-images'
  and public.is_qbench_admin()
);

alter table public.projects
  add column if not exists thumbnail_mode text not null default 'cover_image'
  check (thumbnail_mode in ('cover_image', 'video_thumbnail'));

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
