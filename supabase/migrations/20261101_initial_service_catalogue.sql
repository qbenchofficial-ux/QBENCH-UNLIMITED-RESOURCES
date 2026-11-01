-- ==============================================================================
-- Migration: 20261101_initial_service_catalogue.sql
-- Description: Idempotent seeding of QBENCH initial 7 service categories & services catalogue
-- ==============================================================================

-- 1. Ensure public.site_settings table exists
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.site_settings enable row level security;

-- Grant SELECT to anon and authenticated
grant select on table public.site_settings to anon, authenticated;

-- Ensure public can read site settings
drop policy if exists "Public can view site settings" on public.site_settings;
create policy "Public can view site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

-- Ensure admins can manage site settings
drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
  on public.site_settings
  for all
  to authenticated
  using (public.is_qbench_admin())
  with check (public.is_qbench_admin());

-- 2. Safely seed the initial service catalogue only if not already present
-- Preserves existing administrator-customized categories and services
do $$
begin
  if not exists (
    select 1 from public.site_settings where setting_key = 'cms_services_data'
  ) then
    insert into public.site_settings (setting_key, setting_value)
    values (
      'cms_services_data',
      '[
        {
          "id": "branding",
          "title": "Branding & Identity",
          "label": "Branding & Identity",
          "emoji": "🎨",
          "iconName": "Layers",
          "desc": "",
          "deliverables": [
            "Logo Design",
            "Brand Identity Design",
            "Brand Guidelines",
            "Business Card Design",
            "Letterhead Design",
            "Packaging Design",
            "Brand Collateral Design"
          ]
        },
        {
          "id": "social-media",
          "title": "Social Media Design",
          "label": "Social Media Design",
          "emoji": "📱",
          "iconName": "MessageSquare",
          "desc": "",
          "deliverables": [
            "Social Media Post Design",
            "Instagram Story Design",
            "Carousel Design",
            "Social Media Ad Creatives",
            "Festival Creatives",
            "Social Media Campaign Design"
          ]
        },
        {
          "id": "video-editing",
          "title": "Video Editing",
          "label": "Video Editing",
          "emoji": "🎬",
          "iconName": "Video",
          "desc": "",
          "deliverables": [
            "Promotional Video Editing",
            "Corporate Video Editing",
            "Advertisement Video Editing",
            "Reels Editing",
            "Product Video Editing",
            "Event Video Editing"
          ]
        },
        {
          "id": "digital-marketing",
          "title": "Digital Marketing",
          "label": "Digital Marketing",
          "emoji": "📈",
          "iconName": "Target",
          "desc": "",
          "deliverables": [
            "Social Media Management",
            "Social Media Advertising",
            "Google Ads Management",
            "Search Engine Optimization (SEO)",
            "Digital Campaign Management",
            "Content Strategy"
          ]
        },
        {
          "id": "webdev",
          "title": "Website Development",
          "label": "Website Development",
          "emoji": "🌐",
          "iconName": "Code",
          "desc": "",
          "deliverables": [
            "Business Website Development",
            "Portfolio Website Development",
            "E-commerce Website Development",
            "Landing Page Development",
            "Website Maintenance",
            "Website Redesign"
          ]
        },
        {
          "id": "motion",
          "title": "Motion Graphics",
          "label": "Motion Graphics",
          "emoji": "✨",
          "iconName": "Sparkles",
          "desc": "",
          "deliverables": [
            "2D Animation",
            "Motion Graphics",
            "Logo Animation",
            "Product Animation",
            "Explainer Videos",
            "Animated Social Media Creatives"
          ]
        },
        {
          "id": "creative-design",
          "title": "Creative Design",
          "label": "Creative Design",
          "emoji": "📐",
          "iconName": "Palette",
          "desc": "",
          "deliverables": [
            "Poster Design",
            "Brochure Design",
            "Flyer Design",
            "Catalogue Design",
            "Presentation Design",
            "Advertising Creative Design",
            "Digital and Print Design"
          ]
        }
      ]'
    );
  end if;
end $$;
