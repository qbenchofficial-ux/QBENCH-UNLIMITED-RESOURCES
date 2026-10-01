import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AdminProfile } from '../types/project';

export const DEFAULT_SUPABASE_PROJECT_URL =
  'https://zsbpxqzmkhcvxdvjoabp.supabase.co';

function cleanEnvString(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

const rawSupabaseUrl = cleanEnvString(import.meta.env.VITE_SUPABASE_URL);
export const resolvedSupabaseUrl =
  rawSupabaseUrl &&
  rawSupabaseUrl.startsWith('http') &&
  !rawSupabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL') &&
  !rawSupabaseUrl.includes('your-project-id') &&
  !rawSupabaseUrl.includes('placeholder-project')
    ? rawSupabaseUrl
    : DEFAULT_SUPABASE_PROJECT_URL;

let resolvedSupabaseAnonKey = cleanEnvString(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
);

export function isValidUrl(url: string): boolean {
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

export function isValidAnonKey(key: string): boolean {
  if (!key) return false;
  // Never allow service_role or secret keys in frontend code
  if (key.startsWith('sb_secret_') || key.includes('service_role')) return false;
  if (
    key.includes('YOUR_SUPABASE_') ||
    key.includes('your-supabase') ||
    key.includes('placeholder-') ||
    key === 'undefined' ||
    key === 'null'
  ) {
    return false;
  }
  return true;
}

export let isSupabaseConfigured = Boolean(
  isValidUrl(resolvedSupabaseUrl) && isValidAnonKey(resolvedSupabaseAnonKey)
);

export const SUPABASE_CONFIG_WARNING =
  'Supabase client is missing VITE_SUPABASE_ANON_KEY. Please set VITE_SUPABASE_URL=https://zsbpxqzmkhcvxdvjoabp.supabase.co and VITE_SUPABASE_ANON_KEY in your environment variables (and redeploy if on Vercel).';

export let supabase: SupabaseClient = createClient(
  resolvedSupabaseUrl,
  isValidAnonKey(resolvedSupabaseAnonKey)
    ? resolvedSupabaseAnonKey
    : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Safe diagnostic helper that logs Supabase client readiness without exposing secret values.
 */
export function getSupabaseClientDiagnostics(): {
  configured: boolean;
  projectUrl: string;
  anonKeyPresent: boolean;
  anonKeyFormat: 'jwt' | 'publishable' | 'missing' | 'invalid';
} {
  const key = resolvedSupabaseAnonKey;
  let anonKeyFormat: 'jwt' | 'publishable' | 'missing' | 'invalid' = 'missing';
  if (key) {
    if (!isValidAnonKey(key)) {
      anonKeyFormat = 'invalid';
    } else if (key.startsWith('eyJ')) {
      anonKeyFormat = 'jwt';
    } else if (key.startsWith('sb_publishable_')) {
      anonKeyFormat = 'publishable';
    } else {
      anonKeyFormat = 'jwt';
    }
  }
  return {
    configured: isSupabaseConfigured,
    projectUrl: resolvedSupabaseUrl,
    anonKeyPresent: Boolean(key && isValidAnonKey(key)),
    anonKeyFormat,
  };
}

/**
 * Ensures Supabase is configured; if build-time env var was omitted on a server environment,
 * attempts a one-time check against `/api/integration-config`.
 */
export async function ensureSupabaseConfig(): Promise<boolean> {
  if (isSupabaseConfigured) {
    return true;
  }

  try {
    const resp = await fetch('/api/integration-config');
    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        const runtimeKey = cleanEnvString(
          data.VITE_SUPABASE_ANON_KEY || data.SUPABASE_ANON_KEY
        );
        const runtimeUrl = cleanEnvString(
          data.VITE_SUPABASE_URL || data.SUPABASE_URL || resolvedSupabaseUrl
        );
        if (isValidUrl(runtimeUrl) && isValidAnonKey(runtimeKey)) {
          resolvedSupabaseAnonKey = runtimeKey;
          isSupabaseConfigured = true;
          supabase = createClient(runtimeUrl, runtimeKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
            },
          });
          return true;
        }
      }
    }
  } catch {
    // Ignore when running on static hosting without /api/integration-config
  }

  return isSupabaseConfigured;
}

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
  await ensureSupabaseConfig();

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
  await ensureSupabaseConfig();

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
