import {
  supabase,
  isSupabaseConfigured,
  PORTFOLIO_BUCKET,
  LEGACY_PORTFOLIO_BUCKET,
  slugify,
} from '../lib/supabase';
import type { MediaFile } from '../types/project';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const LOCAL_MEDIA_STORAGE_KEY = 'qbench_cms_media_v1';

export function validatePortfolioImage(file: File): string | null {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIMES.includes(file.type)) {
    return `Unsupported file format (${file.name}). Allowed formats: JPG, JPEG, PNG, WEBP.`;
  }
  if (file.size > 10 * 1024 * 1024) {
    return `File "${file.name}" exceeds the 10MB size limit.`;
  }
  return null;
}

function getLocalMedia(): MediaFile[] {
  try {
    const raw = localStorage.getItem(LOCAL_MEDIA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMedia(items: MediaFile[]): void {
  try {
    localStorage.setItem(LOCAL_MEDIA_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Upload an image file to the Supabase `portfolio-images` Storage bucket,
 * record its metadata in `public.portfolio_images`, and return its public URL.
 */
export async function uploadPortfolioImage(
  file: File,
  folder: 'covers' | 'gallery' | 'library' = 'gallery',
  onProgress?: (percent: number) => void,
  projectId?: string | null
): Promise<MediaFile> {
  const validationError = validatePortfolioImage(file);
  if (validationError) {
    throw new Error(validationError);
  }

  onProgress?.(15);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const baseName = slugify(file.name.replace(/\.[^/.]+$/, '')) || 'portfolio-image';
  const fileName = `${Date.now()}-${baseName}.${ext}`;
  const filePath = `${folder}/${fileName}`;
  const mimeType = file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  if (!isSupabaseConfigured) {
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
    onProgress?.(100);
    const item: MediaFile = {
      id: `local-img-${Date.now()}`,
      name: fileName,
      path: filePath,
      url,
      created_at: new Date().toISOString(),
      size: file.size,
      project_id: projectId || null,
    };
    const existing = getLocalMedia();
    saveLocalMedia([item, ...existing]);
    return item;
  }

  onProgress?.(45);

  let activeBucket = PORTFOLIO_BUCKET;
  let { error: uploadError } = await supabase.storage
    .from(activeBucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType,
    });

  // Fallback to legacy `portfolio` bucket if `portfolio-images` is not created yet
  if (uploadError && uploadError.message.toLowerCase().includes('bucket')) {
    activeBucket = LEGACY_PORTFOLIO_BUCKET;
    const retry = await supabase.storage.from(activeBucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType,
    });
    uploadError = retry.error;
  }

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  onProgress?.(85);

  const { data } = supabase.storage.from(activeBucket).getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  // Record in `public.portfolio_images` table (non-fatal if table migration is pending)
  let recordId: string | undefined;
  try {
    const { data: imgRow } = await supabase
      .from('portfolio_images')
      .insert([
        {
          project_id: projectId || null,
          file_name: fileName,
          storage_path: filePath,
          public_url: publicUrl,
          folder,
          mime_type: mimeType,
          size_bytes: file.size,
        },
      ])
      .select('id')
      .maybeSingle();
    if (imgRow?.id) {
      recordId = String(imgRow.id);
    }
  } catch {
    // Non-fatal if portfolio_images table does not exist yet
  }

  onProgress?.(100);

  return {
    id: recordId,
    name: fileName,
    path: filePath,
    url: publicUrl,
    created_at: new Date().toISOString(),
    size: file.size,
    project_id: projectId || null,
  };
}

/**
 * List uploaded portfolio images from `public.portfolio_images` and Supabase Storage (`portfolio-images` bucket).
 */
export async function listPortfolioMedia(): Promise<MediaFile[]> {
  if (!isSupabaseConfigured) {
    return getLocalMedia();
  }

  const allFiles: MediaFile[] = [];
  const seenPaths = new Set<string>();

  // 1. Query `public.portfolio_images` table first
  try {
    const { data: tableRows, error: tableError } = await supabase
      .from('portfolio_images')
      .select('id, project_id, file_name, storage_path, public_url, size_bytes, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!tableError && tableRows) {
      for (const row of tableRows) {
        const path = String(row.storage_path || row.file_name);
        if (seenPaths.has(path)) continue;
        seenPaths.add(path);
        allFiles.push({
          id: String(row.id),
          name: String(row.file_name),
          path,
          url: String(row.public_url),
          created_at: String(row.created_at || new Date().toISOString()),
          size: typeof row.size_bytes === 'number' ? row.size_bytes : null,
          project_id: row.project_id ? String(row.project_id) : null,
        });
      }
    }
  } catch {
    // Continue to storage bucket scan
  }

  // 2. Also scan Storage folders in `portfolio-images` (and `portfolio`)
  const buckets = [PORTFOLIO_BUCKET, LEGACY_PORTFOLIO_BUCKET];
  const folders = ['covers', 'gallery', 'library', ''];

  for (const bucket of buckets) {
    for (const folder of folders) {
      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error || !data) continue;

      for (const item of data) {
        if (!item.name || item.name === '.emptyFolderPlaceholder') continue;
        if (!item.id && !item.metadata) continue;

        const fullPath = folder ? `${folder}/${item.name}` : item.name;
        if (seenPaths.has(fullPath)) continue;
        seenPaths.add(fullPath);

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fullPath);

        allFiles.push({
          name: item.name,
          path: fullPath,
          url: pub.publicUrl,
          created_at: item.created_at || new Date().toISOString(),
          size: typeof item.metadata?.size === 'number' ? item.metadata.size : null,
        });
      }
    }
  }

  return allFiles.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Extract the relative storage path inside `portfolio-images` or `portfolio` from a public URL.
 */
export function extractStoragePathFromUrl(url: string): string | null {
  if (!url) return null;
  for (const bucket of [PORTFOLIO_BUCKET, LEGACY_PORTFOLIO_BUCKET]) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(url.slice(idx + marker.length));
    }
  }
  return null;
}

/**
 * Delete one or more files from the `portfolio-images` Storage bucket and `public.portfolio_images` table.
 */
export async function deletePortfolioMediaByPaths(paths: string[]): Promise<void> {
  const validPaths = paths.filter(Boolean);
  if (validPaths.length === 0) return;

  if (!isSupabaseConfigured) {
    const existing = getLocalMedia();
    saveLocalMedia(existing.filter((m) => !validPaths.includes(m.path)));
    return;
  }

  await supabase.storage.from(PORTFOLIO_BUCKET).remove(validPaths);
  await supabase.storage.from(LEGACY_PORTFOLIO_BUCKET).remove(validPaths).catch(() => null);

  try {
    await supabase
      .from('portfolio_images')
      .delete()
      .in('storage_path', validPaths);
  } catch {
    // Non-fatal if table does not exist
  }
}

/**
 * Delete storage images associated with a project (cover_image + gallery) when a project is deleted.
 */
export async function deleteProjectStorageAssets(
  coverImage: string | null,
  gallery: string[]
): Promise<void> {
  const urls = [coverImage, ...(gallery || [])].filter(Boolean) as string[];
  const paths = urls
    .map((u) => extractStoragePathFromUrl(u))
    .filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    try {
      await deletePortfolioMediaByPaths(paths);
    } catch (err) {
      console.warn('[QBENCH Media Cleanup Notice]:', err);
    }
  }
}
