import { createClient, SupabaseClient, type User } from '@supabase/supabase-js';
import type { AdminProfile } from '../types/project';

export const DEFAULT_SUPABASE_PROJECT_URL =
  'https://zsbpxqzmkhcvxdvjoabp.supabase.co';

// Public publishable/anon key for https://zsbpxqzmkhcvxdvjoabp.supabase.co (safe for browser client; protected by RLS)
export const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_BC9COvwoI_v9BX5XJocfLg_NCniLoiR';

function cleanEnvString(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

export function isValidUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  if (
    url.includes('YOUR_SUPABASE_') ||
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

const rawSupabaseUrl = cleanEnvString(import.meta.env.VITE_SUPABASE_URL);
export const resolvedSupabaseUrl = isValidUrl(rawSupabaseUrl)
  ? rawSupabaseUrl
  : DEFAULT_SUPABASE_PROJECT_URL;

const rawSupabaseKey = cleanEnvString(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
);

export let resolvedSupabaseAnonKey = isValidAnonKey(rawSupabaseKey)
  ? rawSupabaseKey
  : DEFAULT_SUPABASE_ANON_KEY;

export let isSupabaseConfigured = true;

export const SUPABASE_CONFIG_WARNING = '';

export let supabase: SupabaseClient = createClient(
  resolvedSupabaseUrl,
  resolvedSupabaseAnonKey,
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

export async function ensureSupabaseConfig(): Promise<boolean> {
  if (isValidUrl(resolvedSupabaseUrl) && isValidAnonKey(resolvedSupabaseAnonKey)) {
    isSupabaseConfigured = true;
    return true;
  }

  for (const endpoint of ['/api/supabase-config', '/api/integration-config']) {
    try {
      const resp = await fetch(endpoint);
      const contentType = resp.headers.get('content-type') || '';
      if (resp.ok && contentType.includes('application/json')) {
        const data = await resp.json();
        const runtimeKey = cleanEnvString(
          data.publishableKey ||
            data.VITE_SUPABASE_ANON_KEY ||
            data.SUPABASE_ANON_KEY
        );
        const runtimeUrl = cleanEnvString(
          data.url ||
            data.VITE_SUPABASE_URL ||
            data.SUPABASE_URL ||
            resolvedSupabaseUrl
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
    } catch {
      // Ignore when running on static hosting
    }
  }

  resolvedSupabaseAnonKey = DEFAULT_SUPABASE_ANON_KEY;
  isSupabaseConfigured = true;
  return true;
}

export const PORTFOLIO_BUCKET = 'portfolio-images';
export const PORTFOLIO_VIDEOS_BUCKET = 'portfolio-videos';
export const MAX_PORTFOLIO_VIDEO_SIZE_MB = 50;
export const MAX_PORTFOLIO_VIDEO_SIZE_BYTES =
  MAX_PORTFOLIO_VIDEO_SIZE_MB * 1024 * 1024;
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Strictly validates that a value is a canonical PostgreSQL UUID string.
 * Prevents seed IDs ("seed-1", "seed-2", "cat-*"), slugs, or temporary strings
 * from ever being passed into Supabase UUID columns.
 */
export function isValidUuid(
  value: unknown
): value is `${string}-${string}-${string}-${string}-${string}` {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('seed-') || trimmed.startsWith('cat-')) {
    return false;
  }
  return UUID_REGEX.test(trimmed);
}

/**
 * Checks whether an identifier is a demo/seed identifier rather than a database UUID.
 */
export function isSeedIdentifier(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return (
    trimmed.startsWith('seed-') ||
    trimmed.startsWith('cat-') ||
    !isValidUuid(trimmed)
  );
}

export interface AdminRpcVerificationResult {
  isAdmin: boolean;
  user: User | null;
  profile: AdminProfile | null;
  error?: string;
  isSystemError: boolean;
}

/**
 * Authoritatively verifies whether the currently authenticated Supabase session
 * belongs to a valid QBench administrator using the existing PostgreSQL RPC:
 * `supabase.rpc('is_qbench_admin')`.
 *
 * Strictly avoids querying `public.admin_profiles` directly from the browser.
 * Does NOT expose admin_profiles rows or rely on client email checks.
 * Treats the RPC return value strictly as a boolean.
 */
export async function checkIsQBenchAdminRpc(): Promise<AdminRpcVerificationResult> {
  await ensureSupabaseConfig();

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return {
      isAdmin: false,
      user: null,
      profile: null,
      error: sessionError?.message || 'No authenticated Supabase user session.',
      isSystemError: false,
    };
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc(
    'is_qbench_admin'
  );

  if (adminError) {
    return {
      isAdmin: false,
      user,
      profile: null,
      error: `Authentication system error: ${adminError.message || 'Failed to execute is_qbench_admin RPC.'}`,
      isSystemError: true,
    };
  }

  // Treat the returned result strictly as a boolean (not object, array, or row)
  const isAuthorized = isAdmin === true;

  if (!isAuthorized) {
    return {
      isAdmin: false,
      user,
      profile: null,
      error:
        'Access denied. Your account is not registered as an admin (role = "admin") in public.admin_profiles.',
      isSystemError: false,
    };
  }

  const profile: AdminProfile = {
    id: user.id,
    user_id: user.id,
    email: user.email || '',
    role: 'admin',
  };

  return {
    isAdmin: true,
    user,
    profile,
    error: undefined,
    isSystemError: false,
  };
}

/**
 * Backwards-compatible verifyAdminProfile that uses the secure RPC check
 * instead of direct public.admin_profiles table queries.
 */
export async function verifyAdminProfile(
  _userId?: string,
  _userEmail?: string
): Promise<{
  isAdmin: boolean;
  profile: AdminProfile | null;
  error?: string;
}> {
  const result = await checkIsQBenchAdminRpc();
  return {
    isAdmin: result.isAdmin,
    profile: result.profile,
    error: result.error,
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
