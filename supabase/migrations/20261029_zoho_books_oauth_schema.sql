-- ==============================================================================
-- Migration: 20261029_zoho_books_oauth_schema.sql
-- Description: Schema and RLS for Zoho Books OAuth Connection & States
-- Organization: QBENCH (Org ID: 60072580070)
-- ==============================================================================

-- 1. Table to securely store encrypted Zoho OAuth connections
CREATE TABLE IF NOT EXISTS public.zoho_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  org_name text,
  api_domain text NOT NULL DEFAULT 'https://www.zohoapis.in',
  refresh_token_ciphertext text NOT NULL,
  refresh_token_iv text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_zoho_connections_org UNIQUE (org_id)
);

-- 2. Table for OAuth state verification (CSRF protection)
CREATE TABLE IF NOT EXISTS public.zoho_oauth_states (
  state_hash text PRIMARY KEY,
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zoho_connections_org_id ON public.zoho_connections(org_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.zoho_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoho_oauth_states ENABLE ROW LEVEL SECURITY;

-- Deny all public access; only authenticated administrators and service_role can access
DROP POLICY IF EXISTS "Admins can view zoho connections" ON public.zoho_connections;
CREATE POLICY "Admins can view zoho connections"
  ON public.zoho_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.user_id = auth.uid() AND admin_profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert zoho connections" ON public.zoho_connections;
CREATE POLICY "Admins can insert zoho connections"
  ON public.zoho_connections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.user_id = auth.uid() AND admin_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.user_id = auth.uid() AND admin_profiles.role = 'admin'
    )
  );

-- OAuth States Policy
DROP POLICY IF EXISTS "Admins can manage oauth states" ON public.zoho_oauth_states;
CREATE POLICY "Admins can manage oauth states"
  ON public.zoho_oauth_states
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.user_id = auth.uid() AND admin_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.user_id = auth.uid() AND admin_profiles.role = 'admin'
    )
  );

-- Service role bypasses RLS automatically in Supabase
