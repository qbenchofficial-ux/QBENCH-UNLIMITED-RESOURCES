-- ============================================================================
-- QBENCH Dynamic Portfolio CMS: Permissions and RLS Policy Decoupling
-- Migration: 20261003_portfolio_cms_permissions_and_rls_fix.sql
-- ============================================================================

-- 1. Grant EXECUTE on public.is_qbench_admin() to anon, authenticated, and service_role
-- This prevents the "permission denied for function is_qbench_admin" (code 42501)
-- when anonymous or authenticated clients execute queries against tables with RLS.
grant execute on function public.is_qbench_admin() to anon, authenticated, service_role;

-- 2. Grant table SELECT permissions to anon and authenticated
grant select on table public.categories to anon, authenticated;
grant select on table public.projects to anon, authenticated;
grant select on table public.portfolio_images to anon, authenticated;
grant select on table public.site_settings to anon, authenticated;

-- Grant admin table write permissions to authenticated users
grant insert, update, delete on table public.categories to authenticated;
grant insert, update, delete on table public.projects to authenticated;
grant insert, update, delete on table public.portfolio_images to authenticated;

-- 3. Decouple Public and Admin SELECT policies on public.projects
-- Public policy ONLY checks status = 'published' (never calls is_qbench_admin for anonymous public visitors)
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

-- 4. Ensure Categories public SELECT policy is decoupled
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

-- 5. Portfolio Images public SELECT policy
drop policy if exists "Public can view portfolio_images" on public.portfolio_images;
create policy "Public can view portfolio_images"
on public.portfolio_images
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage portfolio_images" on public.portfolio_images;
create policy "Admins can manage portfolio_images"
on public.portfolio_images
for all
to authenticated
using (public.is_qbench_admin())
with check (public.is_qbench_admin());
