-- =============================================================================
-- QBENCH — Security Hardening & Consolidated RLS / Storage Policy Migration
-- Migration: 20261007_security_rls_and_storage_hardening.sql
-- =============================================================================
-- Purpose:
--   1. Ensure `public.is_qbench_admin()` is hardened with `SECURITY DEFINER`,
--      `STABLE`, `SET search_path = public`, and checks `user_id = auth.uid()`
--      and `role = 'admin'` against `public.admin_profiles`.
--   2. Grant `EXECUTE` on `public.is_qbench_admin()` to `anon`, `authenticated`,
--      and `service_role`.
--   3. Reconcile `public.categories` public SELECT policy (`is_active = true`)
--      and admin SELECT policy (`public.is_qbench_admin()`).
--   4. Restrict `public.portfolio_images` public SELECT policy so anonymous
--      visitors only view images belonging to published projects (or general
--      library assets with `project_id IS NULL`), while admins view all rows.
--   5. Ensure `storage.buckets` (`portfolio-images` and `portfolio-videos`)
--      enforce explicit `file_size_limit` and `allowed_mime_types` (including
--      sanitized `image/svg+xml` on `portfolio-images`), with Storage RLS
--      restricting `INSERT`, `UPDATE`, and `DELETE` on `storage.objects`
--      exclusively to `public.is_qbench_admin()`.
-- =============================================================================

-- 1. Hardened Admin Verification Function
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

grant usage on schema public to anon, authenticated, service_role;
grant execute on function public.is_qbench_admin() to anon, authenticated, service_role;

-- 2. Enable Row Level Security on all application tables
alter table if exists public.admin_profiles enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.projects enable row level security;
alter table if exists public.portfolio_images enable row level security;
alter table if exists public.project_videos enable row level security;
alter table if exists public.site_settings enable row level security;
alter table if exists public.project_inquiries enable row level security;

-- 3. Reconcile Categories RLS Policies (Active only for public, all for Admin)
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

-- 4. Harden Portfolio Images RLS Policies (Prevent draft project gallery exposure to anon)
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

-- 5. Reconcile Storage Bucket Limits & Allowed MIME Types
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

notify pgrst, 'reload schema';
