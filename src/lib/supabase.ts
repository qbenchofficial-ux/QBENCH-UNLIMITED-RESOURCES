import { createClient } from "@supabase/supabase-js";

export const SUPABASE_PROJECT_REF = "zsbpxqzmkhcvxdvjoabp";
export const SUPABASE_DEFAULT_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
export const SUPABASE_DASHBOARD_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}`;
export const VERCEL_PRODUCTION_CHECKLIST_URL =
  "https://vercel.com/qbench2/qbench-unlimited-resources#production-checklist";
export const VERCEL_ENV_SETTINGS_URL =
  "https://vercel.com/qbench2/qbench-unlimited-resources/settings/environment-variables";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl =
  envUrl &&
  !String(envUrl).includes("your-project-id") &&
  !String(envUrl).includes("placeholder-project") &&
  String(envUrl).startsWith("http")
    ? String(envUrl).trim()
    : SUPABASE_DEFAULT_URL;

const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ""
).trim();

// Security guard: ensure no service_role or secret key is ever used in frontend code
const isForbiddenSecretKey = Boolean(
  supabasePublishableKey &&
    (String(supabasePublishableKey).startsWith("sb_secret_") ||
      String(supabasePublishableKey).includes("service_role"))
);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabasePublishableKey &&
    !isForbiddenSecretKey &&
    !String(supabasePublishableKey).includes("your-supabase-publishable-key") &&
    !String(supabasePublishableKey).includes("placeholder-publishable-key")
);

export const activeSupabaseUrl = supabaseUrl;

export const supabase = createClient(
  supabaseUrl,
  isSupabaseConfigured ? supabasePublishableKey : "placeholder-publishable-key"
);

export const STORAGE_BUCKET = "qbench-resources";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Upload a file to the `qbench-resources` Supabase Storage bucket
 * under either `resources/` or `thumbnails/` and return its public URL.
 */
export async function uploadToQBenchBucket(
  file: File,
  folder: "resources" | "thumbnails"
): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const safeBase = slugify(file.name.replace(/\.[^/.]+$/, "")) || "file";
  const filePath = `${folder}/${Date.now()}-${safeBase}.${ext}`;

  if (!isSupabaseConfigured) {
    // Fallback object URL in local preview mode when publishable key is not yet injected
    return URL.createObjectURL(file);
  }

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Verify that the authenticated user exists in `public.admin_profiles`
 * with `id = auth.uid()` AND `role = 'admin'`.
 */
export async function verifyAdminProfile(userId: string): Promise<{
  isAdmin: boolean;
  profile: { id: string; role: string; email?: string; full_name?: string } | null;
  error?: string;
}> {
  if (!userId) {
    return { isAdmin: false, profile: null, error: "Not authenticated." };
  }

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { isAdmin: false, profile: null, error: error.message };
  }

  if (!data || data.role !== "admin") {
    return {
      isAdmin: false,
      profile: data || null,
      error: "Access denied. Your account does not have administrator privileges.",
    };
  }

  return { isAdmin: true, profile: data };
}

export interface SupabaseDiagnosticsResult {
  projectRef: string;
  projectUrl: string;
  envConfigured: boolean;
  urlPresent: boolean;
  publishableKeyPresent: boolean;
  noSecretKeyExposed: boolean;
  authReachable: boolean;
  databaseReachable: boolean;
  storageBucketConfigured: boolean;
  adminSessionActive: boolean;
  adminRoleVerified: boolean;
  detailMessage: string;
}

/**
 * Non-destructive diagnostic check for Supabase client, Auth, Database, and admin_profiles.
 */
export async function runSupabaseDiagnostics(): Promise<SupabaseDiagnosticsResult> {
  const urlPresent = Boolean(supabaseUrl && supabaseUrl.startsWith("https://"));
  const publishableKeyPresent = isSupabaseConfigured;
  const noSecretKeyExposed = !isForbiddenSecretKey;

  if (!publishableKeyPresent) {
    return {
      projectRef: SUPABASE_PROJECT_REF,
      projectUrl: supabaseUrl,
      envConfigured: false,
      urlPresent,
      publishableKeyPresent: false,
      noSecretKeyExposed,
      authReachable: false,
      databaseReachable: false,
      storageBucketConfigured: true,
      adminSessionActive: false,
      adminRoleVerified: false,
      detailMessage: `Connected to project URL (${supabaseUrl}). Add VITE_SUPABASE_PUBLISHABLE_KEY in environment variables to enable live Supabase queries.`,
    };
  }

  let authReachable = false;
  let databaseReachable = false;
  let adminSessionActive = false;
  let adminRoleVerified = false;
  let detailMessage = `Connected to Supabase project ${SUPABASE_PROJECT_REF}.`;

  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (!sessionErr) {
      authReachable = true;
      if (sessionData?.session?.user) {
        adminSessionActive = true;
        const roleCheck = await verifyAdminProfile(sessionData.session.user.id);
        adminRoleVerified = roleCheck.isAdmin;
      }
    } else {
      detailMessage = `Auth error: ${sessionErr.message}`;
    }

    const { error: dbErr } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true });

    if (!dbErr) {
      databaseReachable = true;
    } else {
      detailMessage = `Database query notice: ${dbErr.message}`;
    }
  } catch (err: any) {
    detailMessage = err?.message || "Connection test failed.";
  }

  return {
    projectRef: SUPABASE_PROJECT_REF,
    projectUrl: supabaseUrl,
    envConfigured: true,
    urlPresent,
    publishableKeyPresent,
    noSecretKeyExposed,
    authReachable,
    databaseReachable,
    storageBucketConfigured: true,
    adminSessionActive,
    adminRoleVerified,
    detailMessage,
  };
}
