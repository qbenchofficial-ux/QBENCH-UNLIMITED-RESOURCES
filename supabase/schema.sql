-- ============================================================================
-- QBENCH CREATIVE AGENCY — PRODUCTION SUPABASE DATABASE & STORAGE SCHEMA
-- File: supabase/schema.sql
-- Tables:
--   1. public.admin_profiles
--   2. public.categories
--   3. public.projects
--   4. public.portfolio_images
--   5. public.site_settings
--   6. public.project_inquiries
-- Storage Bucket:
--   - portfolio-images (public read, admin write/update/delete)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. ADMIN PROFILES TABLE (Role-Based Access Control)
-- ============================================================================
create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_admin_profiles_user_id on public.admin_profiles(user_id);
create index if not exists idx_admin_profiles_email on public.admin_profiles(email);

-- Helper function to check if the current authenticated user is an authorized admin
create or replace function public.is_qbench_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.admin_profiles
    where (user_id = auth.uid() or id = auth.uid())
      and role = 'admin'
  );
$$;

-- ============================================================================
-- 2. CATEGORIES TABLE (Dynamic Portfolio Categories)
-- ============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_slug on public.categories(slug);

-- ============================================================================
-- 3. PROJECTS TABLE (Dynamic Agency Portfolio Projects)
-- ============================================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  description text,
  category text,
  category_id uuid references public.categories(id) on delete set null,
  client text,
  year integer default extract(year from now())::integer,
  services text[] not null default '{}',
  cover_image text,
  gallery text[] not null default '{}',
  video_url text,
  behance_url text,
  instagram_url text,
  website_url text,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_category on public.projects(category);
create index if not exists idx_projects_category_id on public.projects(category_id);
create index if not exists idx_projects_featured on public.projects(featured);
create index if not exists idx_projects_sort_order on public.projects(sort_order asc, created_at desc);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row
execute function public.handle_updated_at();

-- ============================================================================
-- 4. PORTFOLIO IMAGES TABLE (Tracks Uploaded Portfolio Media Assets)
-- ============================================================================
create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  file_name text not null,
  storage_path text not null unique,
  public_url text not null,
  folder text not null default 'gallery',
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_portfolio_images_project_id on public.portfolio_images(project_id);
create index if not exists idx_portfolio_images_created_at on public.portfolio_images(created_at desc);

-- ============================================================================
-- 5. SITE SETTINGS TABLE (QBENCH Agency Information)
-- ============================================================================
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  agency_name text not null default 'QBENCH',
  agency_description text not null default 'QBENCH is a creative & digital agency specializing in Strategy → Creativity → Execution across branding, social media design, motion graphics, video editing, UI/UX, and web development.',
  email text not null default 'qbench.official@gmail.com',
  phone text not null default '+91 73565 25932',
  whatsapp text not null default '917356525932',
  instagram_url text default 'https://www.instagram.com/qbench_official',
  linkedin_url text default 'https://www.linkedin.com/company/qbench',
  behance_url text default 'https://www.behance.net/gallery/253620337/The-Journey-of-a-Ring-Luxury-Jewellery-Motion-Design',
  website_url text default 'https://www.qbench.in',
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row
execute function public.handle_updated_at();

-- ============================================================================
-- 6. PROJECT INQUIRIES TABLE (Contact & Start a Project Submissions)
-- ============================================================================
create table if not exists public.project_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text not null,
  phone text not null,
  service text not null,
  budget text,
  timeline text,
  project_description text,
  reference_url text,
  message text,
  status text not null default 'new' check (status in ('new', 'in_review', 'contacted', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists idx_project_inquiries_created_at on public.project_inquiries(created_at desc);
create index if not exists idx_project_inquiries_status on public.project_inquiries(status);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.admin_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.site_settings enable row level security;
alter table public.project_inquiries enable row level security;

-- admin_profiles policies:
drop policy if exists "Users can view own admin profile" on public.admin_profiles;
create policy "Users can view own admin profile"
on public.admin_profiles
for select
to authenticated
using (user_id = auth.uid() or id = auth.uid() or public.is_qbench_admin());

drop policy if exists "Admins can manage admin profiles" on public.admin_profiles;
create policy "Admins can manage admin profiles"
on public.admin_profiles
for all
to authenticated
using (public.is_qbench_admin())
with check (public.is_qbench_admin());

-- categories policies:
drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories"
on public.categories
for select
to anon, authenticated
using (true);

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

-- projects policies:
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

-- portfolio_images policies:
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

-- site_settings policies:
drop policy if exists "Public can view site_settings" on public.site_settings;
create policy "Public can view site_settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage site_settings" on public.site_settings;
create policy "Admins can manage site_settings"
on public.site_settings
for all
to authenticated
using (public.is_qbench_admin())
with check (public.is_qbench_admin());

-- project_inquiries policies:
-- Public visitors can submit project inquiries (insert); only authorized admins can view, update, or delete
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

-- ============================================================================
-- 8. SUPABASE STORAGE BUCKET & STORAGE RLS POLICIES (portfolio-images)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images',
  'portfolio-images',
  true,
  10485760, -- 10MB limit per image
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

drop policy if exists "Public can view portfolio-images" on storage.objects;
create policy "Public can view portfolio-images"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('portfolio-images', 'portfolio'));

drop policy if exists "Admins can upload portfolio-images" on storage.objects;
create policy "Admins can upload portfolio-images"
on storage.objects
for insert
to authenticated
with check (bucket_id in ('portfolio-images', 'portfolio') and public.is_qbench_admin());

drop policy if exists "Admins can update portfolio-images" on storage.objects;
create policy "Admins can update portfolio-images"
on storage.objects
for update
to authenticated
using (bucket_id in ('portfolio-images', 'portfolio') and public.is_qbench_admin())
with check (bucket_id in ('portfolio-images', 'portfolio') and public.is_qbench_admin());

drop policy if exists "Admins can delete portfolio-images" on storage.objects;
create policy "Admins can delete portfolio-images"
on storage.objects
for delete
to authenticated
using (bucket_id in ('portfolio-images', 'portfolio') and public.is_qbench_admin());

-- ============================================================================
-- 9. SEED DATA (Initial Categories, Projects & Site Settings)
-- ============================================================================
insert into public.categories (name, slug, description)
values
  ('Branding', 'branding', 'Brand identity systems, logos, typography, and visual guidelines.'),
  ('Motion Graphics', 'motion-graphics', '2D/3D motion design, title sequences, and dynamic brand animations.'),
  ('Social Media', 'social-media', 'High-converting social media creatives, grids, and campaign visuals.'),
  ('UI/UX', 'ui-ux', 'User-centered web and mobile product interfaces and design systems.'),
  ('Web Design', 'web-design', 'Responsive, high-performance websites and digital flagships.'),
  ('Digital Marketing', 'digital-marketing', 'Performance campaigns, growth creatives, and conversion assets.'),
  ('AI Design', 'ai-design', 'Generative visual direction and AI-augmented creative production.'),
  ('Video Editing', 'video-editing', 'Commercial cuts, reels, product showcases, and brand storytelling.'),
  ('Print Design', 'print-design', 'Editorial layouts, packaging, collateral, and physical brand touchpoints.'),
  ('Creative Campaigns', 'creative-campaigns', 'Integrated multi-channel brand campaigns and visual storytelling.')
on conflict (slug) do nothing;

insert into public.projects (
  title,
  slug,
  short_description,
  description,
  category,
  client,
  year,
  services,
  cover_image,
  gallery,
  behance_url,
  featured,
  status,
  sort_order
)
values
  (
    'The Journey of a Ring',
    'the-journey-of-a-ring',
    'Cinematic luxury jewellery motion design exploring the craftsmanship, brilliance, and timeless elegance of a fine diamond ring.',
    'An evocative motion graphics showcase created to highlight the intricate artistry of fine diamond jewellery. Through macro lighting studies, fluid camera choreography, and bespoke sound design, this piece transforms product visualization into an emotional luxury narrative.',
    'Motion Graphics',
    'Luxury Jewellery Collective',
    2026,
    array['Motion Graphics', '3D Visualization', 'Art Direction'],
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&h=500&q=80',
    array[
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80'
    ],
    'https://www.behance.net/gallery/253620337/The-Journey-of-a-Ring-Luxury-Jewellery-Motion-Design?platform=direct',
    true,
    'published',
    1
  ),
  (
    'Sleepless Night',
    'sleepless-night',
    'Atmospheric motion graphics narrative exploring late-night creative focus, urban rhythm, and visual storytelling.',
    'Sleepless Night is a conceptual motion graphics piece blending kinetic typography, moody lighting transitions, and frame-by-frame visual pacing to capture the energy of midnight creative breakthroughs.',
    'Motion Graphics',
    'QBENCH Studio Originals',
    2026,
    array['Motion Graphics', 'Visual Storytelling', 'Sound Sync'],
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&h=500&q=80',
    array['https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80'],
    null,
    true,
    'published',
    2
  ),
  (
    'Treat Your Kidneys Well',
    'treat-your-kidneys-well',
    'High-impact public awareness creative campaign designed to communicate preventive health through approachable visual design.',
    'A multi-format creative campaign developed to make vital kidney health education engaging, memorable, and shareable across digital and print platforms. Combines clear infographic storytelling with warm, human-centered illustration.',
    'Creative Campaigns',
    'Healthcare Awareness Initiative',
    2026,
    array['Creative Campaigns', 'Social Media', 'Infographic Design'],
    'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&h=500&q=80',
    array['https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80'],
    null,
    true,
    'published',
    3
  )
on conflict (slug) do nothing;

insert into public.site_settings (
  agency_name,
  agency_description,
  email,
  phone,
  whatsapp,
  instagram_url,
  linkedin_url,
  behance_url,
  website_url
)
select
  'QBENCH',
  'QBENCH is a creative & digital agency specializing in Strategy → Creativity → Execution across branding, social media design, motion graphics, video editing, UI/UX, and web development.',
  'qbench.official@gmail.com',
  '+91 73565 25932',
  '917356525932',
  'https://www.instagram.com/qbench_official',
  'https://www.linkedin.com/company/qbench',
  'https://www.behance.net/gallery/253620337/The-Journey-of-a-Ring-Luxury-Jewellery-Motion-Design',
  'https://www.qbench.in'
where not exists (select 1 from public.site_settings);
