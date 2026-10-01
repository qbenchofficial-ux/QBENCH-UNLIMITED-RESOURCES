import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_WARNING,
  PORTFOLIO_BUCKET,
  slugify,
} from '../lib/supabase';
import type { MediaFile, PortfolioImage } from '../types/project';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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

/**
 * Extract the relative storage path inside `portfolio-images` from a public URL.
 */
export function extractStoragePathFromUrl(url: string): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${PORTFOLIO_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(url.slice(idx + marker.length));
  }
  return null;
}

/**
 * Upload an image file to the Supabase `portfolio-images` Storage bucket
 * and return its public URL (never stores base64 in the database).
 */
export async function uploadPortfolioImage(
  file: File,
  folder: 'covers' | 'gallery' | 'library' = 'gallery',
  onProgress?: (percent: number) => void,
  projectId?: string | null,
  altText?: string | null,
  sortOrder = 0
): Promise<MediaFile> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const validationError = validatePortfolioImage(file);
  if (validationError) {
    throw new Error(validationError);
  }

  onProgress?.(15);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const baseName = slugify(file.name.replace(/\.[^/.]+$/, '')) || 'portfolio-image';
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);
  const fileName = `${Date.now()}-${uniqueSuffix}-${baseName}.${ext}`;
  const filePath = `${folder}/${fileName}`;
  const mimeType = file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  onProgress?.(45);

  const { error: uploadError } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  onProgress?.(85);

  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  let recordId: string | undefined;
  if (projectId && folder === 'gallery') {
    const { data: imgRow } = await supabase
      .from('portfolio_images')
      .insert([
        {
          project_id: projectId,
          image_url: publicUrl,
          alt_text: altText || baseName,
          sort_order: sortOrder,
        },
      ])
      .select('id')
      .maybeSingle();

    if (imgRow?.id) {
      recordId = String(imgRow.id);
    }
  }

  onProgress?.(100);

  return {
    id: recordId,
    name: fileName,
    path: filePath,
    url: publicUrl,
    alt_text: altText || baseName,
    sort_order: sortOrder,
    created_at: new Date().toISOString(),
    size: file.size,
    project_id: projectId || null,
  };
}

/**
 * Fetch gallery records from `public.portfolio_images` for a specific project.
 */
export async function getProjectPortfolioImages(
  projectId: string
): Promise<PortfolioImage[]> {
  if (!isSupabaseConfigured || !projectId) {
    return [];
  }

  const { data, error } = await supabase
    .from('portfolio_images')
    .select('id, project_id, image_url, alt_text, sort_order, created_at')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: String(row.id),
    project_id: row.project_id ? String(row.project_id) : null,
    image_url: String(row.image_url),
    alt_text: row.alt_text ? String(row.alt_text) : null,
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : 0,
    created_at: String(row.created_at || new Date().toISOString()),
  }));
}

/**
 * Synchronize `public.portfolio_images` rows for a project whenever its gallery is created or updated.
 */
export async function syncProjectPortfolioImages(
  projectId: string,
  galleryUrls: string[],
  projectTitle: string
): Promise<void> {
  if (!isSupabaseConfigured || !projectId) return;

  const cleanUrls = galleryUrls.map((u) => u.trim()).filter(Boolean);

  await supabase.from('portfolio_images').delete().eq('project_id', projectId);

  if (cleanUrls.length === 0) return;

  const rows = cleanUrls.map((imageUrl, idx) => ({
    project_id: projectId,
    image_url: imageUrl,
    alt_text: `${projectTitle} — Gallery Image ${idx + 1}`,
    sort_order: idx,
  }));

  await supabase.from('portfolio_images').insert(rows);
}

/**
 * List uploaded portfolio images from Supabase Storage bucket `portfolio-images`
 * and `public.portfolio_images`.
 */
export async function listPortfolioMedia(): Promise<MediaFile[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const allFiles: MediaFile[] = [];
  const seenUrls = new Set<string>();
  const seenPaths = new Set<string>();

  // 1. Scan Storage folders in `portfolio-images`
  const folders = ['covers', 'gallery', 'library', ''];

  for (const folder of folders) {
    const { data, error } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .list(folder, {
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

      const { data: pub } = supabase.storage
        .from(PORTFOLIO_BUCKET)
        .getPublicUrl(fullPath);

      seenUrls.add(pub.publicUrl);
      allFiles.push({
        name: item.name,
        path: fullPath,
        url: pub.publicUrl,
        created_at: item.created_at || new Date().toISOString(),
        size: typeof item.metadata?.size === 'number' ? item.metadata.size : null,
      });
    }
  }

  // 2. Also include any records in `public.portfolio_images`
  const { data: tableRows, error: tableError } = await supabase
    .from('portfolio_images')
    .select('id, project_id, image_url, alt_text, sort_order, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (!tableError && tableRows) {
    for (const row of tableRows) {
      const imageUrl = String(row.image_url || '');
      if (!imageUrl || seenUrls.has(imageUrl)) continue;
      seenUrls.add(imageUrl);

      const storagePath =
        extractStoragePathFromUrl(imageUrl) ||
        imageUrl.split('/').pop() ||
        `image-${row.id}`;

      allFiles.push({
        id: String(row.id),
        name: row.alt_text
          ? String(row.alt_text)
          : storagePath.split('/').pop() || 'portfolio-image',
        path: storagePath,
        url: imageUrl,
        alt_text: row.alt_text ? String(row.alt_text) : null,
        sort_order: typeof row.sort_order === 'number' ? row.sort_order : 0,
        created_at: String(row.created_at || new Date().toISOString()),
        size: null,
        project_id: row.project_id ? String(row.project_id) : null,
      });
    }
  }

  return allFiles.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Delete one or more files from the `portfolio-images` Storage bucket and `public.portfolio_images` table.
 */
export async function deletePortfolioMediaByPaths(
  paths: string[],
  imageUrls: string[] = []
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const validPaths = paths.filter(Boolean);
  const validUrls = imageUrls.filter(Boolean);

  if (validPaths.length > 0) {
    const { error } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .remove(validPaths);
    if (error) {
      throw new Error(error.message);
    }
  }

  if (validUrls.length > 0) {
    await supabase
      .from('portfolio_images')
      .delete()
      .in('image_url', validUrls);
  }
}

/**
 * Delete storage images associated with a project (cover_image + gallery) when a project is deleted.
 */
export async function deleteProjectStorageAssets(
  coverImage: string | null,
  gallery: string[],
  projectId?: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  if (projectId) {
    await supabase.from('portfolio_images').delete().eq('project_id', projectId);
  }

  const urls = [coverImage, ...(gallery || [])].filter(Boolean) as string[];
  const paths = urls
    .map((u) => extractStoragePathFromUrl(u))
    .filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    try {
      await deletePortfolioMediaByPaths(paths, urls);
    } catch (err) {
      console.warn('[QBENCH Media Cleanup Notice]:', err);
    }
  }
}
