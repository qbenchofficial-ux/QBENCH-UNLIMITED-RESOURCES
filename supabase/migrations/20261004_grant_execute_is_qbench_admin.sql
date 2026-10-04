-- =============================================================================
-- QBENCH — Fix EXECUTE Permission for public.is_qbench_admin()
-- Run this script in your Supabase Dashboard -> SQL Editor
-- =============================================================================
-- Reason:
-- If EXECUTE privileges were revoked on `public.is_qbench_admin()`, PostgreSQL
-- returns `42501: permission denied for function is_qbench_admin` whenever:
--   1. The frontend calls `supabase.rpc('is_qbench_admin')` after sign-in, OR
--   2. Any Row Level Security (RLS) policy evaluates `public.is_qbench_admin()`.
--
-- This script does NOT modify or recreate `public.is_qbench_admin()`, does NOT
-- add public SELECT access to `public.admin_profiles`, and does NOT weaken RLS.
-- It strictly grants `EXECUTE` on the existing function so Supabase Auth sessions
-- and RLS policies can invoke it.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant execute on function public.is_qbench_admin() to authenticated;
grant execute on function public.is_qbench_admin() to anon;
grant execute on function public.is_qbench_admin() to service_role;

notify pgrst, 'reload schema';
