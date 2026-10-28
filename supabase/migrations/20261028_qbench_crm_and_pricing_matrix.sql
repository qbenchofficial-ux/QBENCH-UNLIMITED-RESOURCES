-- ==============================================================================
-- Migration: 20261028_qbench_crm_and_pricing_matrix.sql
-- Description: Complete CRM Enquiry Management & Editable Pricing Matrix for QBENCH
-- ==============================================================================

-- 1. ENHANCE PROJECT_INQUIRIES TABLE (SAFE IDEMPOTENT UPGRADE)
-- Preserves all historical records, quotations, and contact inquiries.

ALTER TABLE public.project_inquiries 
  ADD COLUMN IF NOT EXISTS reference_id text,
  ADD COLUMN IF NOT EXISTS package text,
  ADD COLUMN IF NOT EXISTS requirements text,
  ADD COLUMN IF NOT EXISTS assigned_to text,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS quotation_number text,
  ADD COLUMN IF NOT EXISTS quotation_amount numeric,
  ADD COLUMN IF NOT EXISTS quotation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_feedback text,
  ADD COLUMN IF NOT EXISTS internal_remarks text,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS project_status text DEFAULT 'Not Started',
  ADD COLUMN IF NOT EXISTS project_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS project_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS project_completion_date timestamptz,
  ADD COLUMN IF NOT EXISTS total_agreed_amount numeric,
  ADD COLUMN IF NOT EXISTS advance_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_received numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS crm_meta jsonb DEFAULT '{}'::jsonb;

-- Populate reference_id for any historical rows that lack one
UPDATE public.project_inquiries
SET reference_id = 'QB-ENQ-' || to_char(created_at, 'YYYY') || '-' || upper(substr(md5(id::text), 1, 4))
WHERE reference_id IS NULL OR reference_id = '';

-- Create performance indexes for CRM dashboard operations
CREATE INDEX IF NOT EXISTS idx_project_inquiries_ref_id ON public.project_inquiries(reference_id);
CREATE INDEX IF NOT EXISTS idx_project_inquiries_status ON public.project_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_project_inquiries_next_followup ON public.project_inquiries(next_followup_at);
CREATE INDEX IF NOT EXISTS idx_project_inquiries_created_at_desc ON public.project_inquiries(created_at DESC);

-- Ensure public can submit minimal enquiries (with null email allowed)
ALTER TABLE public.project_inquiries ALTER COLUMN email DROP NOT NULL;

-- 2. CREATE SERVICE PRICING TABLE (FOR EXCEL-LIKE SPREADSHEET ERP)
CREATE TABLE IF NOT EXISTS public.service_pricing (
  id text PRIMARY KEY,
  service_category text NOT NULL,
  service_name text NOT NULL,
  package_name text NOT NULL,
  package_description text,
  deliverables text[] NOT NULL DEFAULT '{}'::text[],
  pricing_type text NOT NULL DEFAULT 'Fixed',
  base_price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  final_price numeric NOT NULL DEFAULT 0,
  gst_rate numeric NOT NULL DEFAULT 18,
  currency text NOT NULL DEFAULT 'INR',
  active boolean NOT NULL DEFAULT true,
  last_updated timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT 'Admin'
);

-- Index for public active pricing lookups
CREATE INDEX IF NOT EXISTS idx_service_pricing_active ON public.service_pricing(active, service_category);

-- Enable Row Level Security (RLS) on service_pricing
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

-- Public read access: Anyone can read active pricing packages
DROP POLICY IF EXISTS "Public can view active pricing" ON public.service_pricing;
CREATE POLICY "Public can view active pricing"
  ON public.service_pricing
  FOR SELECT
  USING (active = true);

-- Admin full access: Authenticated admin users can view, insert, update, and delete all pricing
DROP POLICY IF EXISTS "Admins have full pricing access" ON public.service_pricing;
CREATE POLICY "Admins have full pricing access"
  ON public.service_pricing
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. SEED INITIAL PRICING MATRIX (INCLUDING CONSOLIDATED AWARDS PACKAGE)
INSERT INTO public.service_pricing (
  id, service_category, service_name, package_name, package_description, deliverables,
  pricing_type, base_price, discount, final_price, gst_rate, currency, active, updated_by
) VALUES
  (
    'PRC-AWD-001',
    'Events & Stage',
    'Award Ceremony & Gala Production',
    'Awards Package',
    'All-in-one flagship award ceremony suite combining 30s celebration reels, custom stage backdrop screen visual images, winner presentation motion graphics, and live event production assets.',
    ARRAY[
      'Consolidated Ceremony Gala Package',
      '30-Second Award Celebration Reels',
      'Award Stage Screen Visual System (1920x1080 / 4K)',
      'Winner Presentation Title Motion Graphics',
      'Nominee Showcase Video Lower-Thirds',
      'Full Commercial & Live Broadcast Rights'
    ],
    'Fixed',
    40000,
    0,
    40000,
    18,
    'INR',
    true,
    'System Migration'
  ),
  (
    'PRC-BRD-001',
    'Branding',
    'Brand Identity Design',
    'Brand Identity Essentials',
    'Comprehensive brand identity system including primary logo, color palette, typography guidelines, and digital asset templates.',
    ARRAY[
      'Primary & Secondary Logo Suite',
      'Comprehensive Brand Guidelines (PDF)',
      'Typography & Color Palette System',
      'Vector Master Files (AI, EPS, SVG, PNG)'
    ],
    'Fixed',
    25000,
    10,
    22500,
    18,
    'INR',
    true,
    'System Migration'
  ),
  (
    'PRC-BRD-002',
    'Branding',
    'Corporate Rebrand Suite',
    'Enterprise Brand Transformation',
    'Full-scale corporate identity overhaul including stationery, brand voice bible, icon set, and presentation decks.',
    ARRAY[
      'Executive Logo & Sub-Brand System',
      'Complete Corporate Stationery Suite',
      'Brand Architecture & Messaging Guide',
      'Investor Pitch Deck Template'
    ],
    'Fixed',
    60000,
    15,
    51000,
    18,
    'INR',
    true,
    'System Migration'
  ),
  (
    'PRC-SOC-001',
    'Social Media',
    'Monthly Content Retainer',
    'Social Growth Starter',
    '12 high-impact monthly social posts, 4 reels, caption copywriting, and hashtag growth strategy.',
    ARRAY[
      '12 Carousel & Static Graphics',
      '4 Motion Reels / Short-Form Edits',
      'Copywriting & Content Calendar',
      'Monthly Performance Insights'
    ],
    'Per Month',
    18000,
    0,
    18000,
    18,
    'INR',
    true,
    'System Migration'
  ),
  (
    'PRC-VID-001',
    'Video Production',
    'Commercial Video Editing',
    'Brand Video Production',
    'Cinematic 60-90s brand story or commercial ad video with sound design, color grading, and motion titles.',
    ARRAY[
      '60-90s Master Commercial Cut',
      'Vertical Reel & Story Adaptations (9:16)',
      'Professional Color Grading & Sound Mix',
      'Licensed Royalty-Free Soundtrack'
    ],
    'Starting From',
    35000,
    0,
    35000,
    18,
    'INR',
    true,
    'System Migration'
  ),
  (
    'PRC-WEB-001',
    'Web Development',
    'Custom High-Conversion Website',
    'Full-Stack Web Experience',
    'Fast, responsive React/Next.js or Vite website with Tailwind CSS, CMS integration, and SEO optimization.',
    ARRAY[
      'Bespoke Interactive UI/UX Architecture',
      'Mobile-First Responsive Design',
      'Full SEO & Performance Optimization',
      'CMS Admin Control Portal'
    ],
    'Fixed',
    45000,
    10,
    40500,
    18,
    'INR',
    true,
    'System Migration'
  )
ON CONFLICT (id) DO UPDATE SET
  service_category = EXCLUDED.service_category,
  service_name = EXCLUDED.service_name,
  package_name = EXCLUDED.package_name,
  package_description = EXCLUDED.package_description,
  deliverables = EXCLUDED.deliverables,
  pricing_type = EXCLUDED.pricing_type,
  base_price = EXCLUDED.base_price,
  discount = EXCLUDED.discount,
  final_price = EXCLUDED.final_price,
  gst_rate = EXCLUDED.gst_rate,
  currency = EXCLUDED.currency,
  active = EXCLUDED.active,
  last_updated = now(),
  updated_by = EXCLUDED.updated_by;
