import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !String(supabaseUrl).includes("your-project-id") &&
    String(supabaseUrl).startsWith("http")
);

export const supabase = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
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
