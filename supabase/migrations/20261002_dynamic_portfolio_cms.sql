-- ============================================================================
-- QBENCH Dynamic Portfolio / Example Projects CMS Migration
-- Safe, idempotent migration reusing existing categories, projects, and portfolio_images tables
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Extend public.categories with dynamic portfolio section controls
alter table if exists public.categories
  add column if not exists cover_image_url text,
  add column if not exists display_order integer not null default 0,
  add column if not exists projects_display_limit integer not null default 4,
  add column if not exists show_view_all boolean not null default true,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_categories_display_order
  on public.categories(display_order asc, name asc);

create index if not exists idx_categories_is_active
  on public.categories(is_active);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row
execute function public.handle_updated_at();

-- Provide logical view portfolio_categories mapped 1:1 to public.categories (no duplicate table)
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

grant select on public.portfolio_categories to anon, authenticated;
grant insert, update, delete on public.portfolio_categories to authenticated;

-- 2. Extend public.projects with full case-study metadata and ordering fields
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

create index if not exists idx_projects_display_order
  on public.projects(display_order asc, created_at desc);

-- 3. Extend public.portfolio_images with display_order
alter table if exists public.portfolio_images
  add column if not exists display_order integer not null default 0;

create index if not exists idx_portfolio_images_display_order
  on public.portfolio_images(project_id, display_order asc, sort_order asc);

-- 4. Ensure RLS Policies on categories, projects, portfolio_images, and storage.objects
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.portfolio_images enable row level security;

drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories"
on public.categories
for select
to anon, authenticated
using (is_active = true or public.is_qbench_admin());

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

drop policy if exists "Public can view published projects" on public.projects;
create policy "Public can view published projects"
on public.projects
for select
to anon, authenticated
using (status = 'published' or public.is_qbench_admin());

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
using (true);

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
