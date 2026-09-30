import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    !String(supabaseUrl).includes("your-project-id") &&
    !String(supabaseUrl).includes("placeholder-project") &&
    String(supabaseUrl).startsWith("http")
);

export const supabase = createClient(
  supabaseUrl && !String(supabaseUrl).includes("your-project-id")
    ? supabaseUrl
    : "https://placeholder-project.supabase.co",
  supabasePublishableKey && !isForbiddenSecretKey
    ? supabasePublishableKey
    : "placeholder-publishable-key"
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
  envConfigured: boolean;
  urlPresent: boolean;
  publishableKeyPresent: boolean;
  noSecretKeyExposed: boolean;
  authReachable: boolean;
  databaseReachable: boolean;
  adminSessionActive: boolean;
  adminRoleVerified: boolean;
  detailMessage: string;
}

/**
 * Non-destructive diagnostic check for Supabase client, Auth, Database, and admin_profiles.
 */
export async function runSupabaseDiagnostics(): Promise<SupabaseDiagnosticsResult> {
  const urlPresent = Boolean(
    supabaseUrl &&
      !String(supabaseUrl).includes("your-project-id") &&
      !String(supabaseUrl).includes("placeholder-project")
  );
  const publishableKeyPresent = Boolean(
    supabasePublishableKey &&
      !String(supabasePublishableKey).includes("your-supabase-publishable-key") &&
      !String(supabasePublishableKey).includes("placeholder-publishable-key")
  );
  const noSecretKeyExposed = !isForbiddenSecretKey;

  if (!urlPresent || !publishableKeyPresent) {
    return {
      envConfigured: false,
      urlPresent,
      publishableKeyPresent,
      noSecretKeyExposed,
      authReachable: false,
      databaseReachable: false,
      adminSessionActive: false,
      adminRoleVerified: false,
      detailMessage:
        "VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY are not set in the current environment.",
    };
  }

  let authReachable = false;
  let databaseReachable = false;
  let adminSessionActive = false;
  let adminRoleVerified = false;
  let detailMessage = "Connected to Supabase.";

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
    envConfigured: true,
    urlPresent,
    publishableKeyPresent,
    noSecretKeyExposed,
    authReachable,
    databaseReachable,
    adminSessionActive,
    adminRoleVerified,
    detailMessage,
  };
}
