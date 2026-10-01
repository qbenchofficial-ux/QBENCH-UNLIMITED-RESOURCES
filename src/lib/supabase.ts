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
  if (url.includes('your-project-id') || url.includes('placeholder-project')) return false;
  return true;
}

function isValidAnonKey(key: string): boolean {
  if (!key) return false;
  // Never allow service_role or secret keys in the browser
  if (key.startsWith('sb_secret_') || key.includes('service_role')) return false;
  if (key.includes('your-supabase') || key.includes('placeholder-')) {
    return false;
  }
  return true;
}

export const isSupabaseConfigured = Boolean(
  isValidUrl(supabaseUrl) && isValidAnonKey(supabaseAnonKey)
);

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
export const LEGACY_PORTFOLIO_BUCKET = 'portfolio';
export const STORAGE_BUCKET = 'qbench-resources';

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
 * Verify that the authenticated user has an authorized row in `public.admin_profiles`
 * with `role = 'admin'` (matching either `user_id = auth.uid()` or `id = auth.uid()`).
 */
export async function verifyAdminProfile(
  userId: string,
  userEmail?: string
): Promise<{
  isAdmin: boolean;
  profile: AdminProfile | null;
  error?: string;
}> {
  if (!userId) {
    return { isAdmin: false, profile: null, error: 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('admin_profiles')
    .select('*')
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (error) {
    return { isAdmin: false, profile: null, error: error.message };
  }

  if (!data || data.role !== 'admin') {
    return {
      isAdmin: false,
      profile: (data as AdminProfile) || null,
      error:
        'Access denied. Your account does not have an authorized admin profile (role = "admin").',
    };
  }

  return {
    isAdmin: true,
    profile: {
      id: data.id,
      user_id: data.user_id || data.id,
      email: data.email || userEmail || '',
      role: data.role,
      created_at: data.created_at,
    },
  };
}

/**
 * Legacy helper for uploading to qbench-resources bucket if used by existing components.
 */
export async function uploadToQBenchBucket(
  file: File,
  folder: 'resources' | 'thumbnails'
): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const safeBase = slugify(file.name.replace(/\.[^/.]+$/, '')) || 'file';
  const filePath = `${folder}/${Date.now()}-${safeBase}.${ext}`;

  if (!isSupabaseConfigured) {
    return URL.createObjectURL(file);
  }

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
