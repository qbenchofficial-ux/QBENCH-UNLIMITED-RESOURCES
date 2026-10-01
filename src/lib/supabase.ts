import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AdminProfile } from '../types/project';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

function isValidUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  if (
    url.includes('YOUR_SUPABASE_PROJECT_URL') ||
    url.includes('your-project-id') ||
    url.includes('placeholder-project')
  ) {
    return false;
  }
  return true;
}

function isValidAnonKey(key: string): boolean {
  if (!key) return false;
  // Never allow service_role or secret keys in frontend code
  if (key.startsWith('sb_secret_') || key.includes('service_role')) return false;
  if (
    key.includes('YOUR_SUPABASE_') ||
    key.includes('your-supabase') ||
    key.includes('placeholder-')
  ) {
    return false;
  }
  return true;
}

export const isSupabaseConfigured = Boolean(
  isValidUrl(supabaseUrl) && isValidAnonKey(supabaseAnonKey)
);

export const SUPABASE_CONFIG_WARNING =
  'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables to connect to your Supabase project.';

export async function ensureSupabaseConfig(): Promise<boolean> {
  return isSupabaseConfigured;
}

export const supabase: SupabaseClient = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isValidAnonKey(supabaseAnonKey) ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const PORTFOLIO_BUCKET = 'portfolio-images';
export const STORAGE_BUCKET = 'qbench-resources';

export const AUTHORIZED_ADMIN_EMAIL = 'qbench.official@gmail.com';
export const AUTHORIZED_ADMIN_USER_ID = 'ab936bea-03f9-428f-a8a2-6b3e0a29edbe';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Verify that the authenticated Supabase user exists in `public.admin_profiles`
 * with `user_id = auth.uid()` and `role = 'admin'`.
 */
export async function verifyAdminProfile(
  userId: string,
  userEmail?: string
): Promise<{
  isAdmin: boolean;
  profile: AdminProfile | null;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      isAdmin: false,
      profile: null,
      error: SUPABASE_CONFIG_WARNING,
    };
  }

  if (!userId) {
    return { isAdmin: false, profile: null, error: 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, user_id, email, role, created_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { isAdmin: false, profile: null, error: error.message };
  }

  if (!data || data.role !== 'admin') {
    return {
      isAdmin: false,
      profile: (data as AdminProfile) || null,
      error:
        'Access denied. Your account is not registered as an admin (role = "admin") in public.admin_profiles.',
    };
  }

  return {
    isAdmin: true,
    profile: {
      id: String(data.id),
      user_id: String(data.user_id),
      email: String(data.email || userEmail || AUTHORIZED_ADMIN_EMAIL),
      role: String(data.role),
      created_at: data.created_at ? String(data.created_at) : undefined,
    },
  };
}

/**
 * Helper for uploading to qbench-resources bucket if used by existing components.
 */
export async function uploadToQBenchBucket(
  file: File,
  folder: 'resources' | 'thumbnails'
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const ext = file.name.split('.').pop() || 'bin';
  const safeBase = slugify(file.name.replace(/\.[^/.]+$/, '')) || 'file';
  const filePath = `${folder}/${Date.now()}-${safeBase}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
