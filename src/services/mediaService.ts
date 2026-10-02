import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_WARNING,
  PORTFOLIO_BUCKET,
  slugify,
} from '../lib/supabase';
import type {
  MediaFile,
  PortfolioImage,
  GalleryImageInput,
} from '../types/project';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export function validatePortfolioImage(file: File): string | null {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIMES.includes(file.type)) {
    return `Unsupported file format (${file.name}). Allowed formats: JPG, JPEG, PNG, WEBP, GIF, AVIF.`;
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

export type StorageFolderTarget =
  | 'categories'
  | 'projects'
  | 'covers'
  | 'gallery'
  | 'library';

/**
 * Upload an image file to the Supabase `portfolio-images` Storage bucket
 * using organised paths:
 * - `portfolio-images/categories/...`
 * - `portfolio-images/projects/{project_id}/...`
 * Returns its public URL (never stores base64 in the database).
 */
export async function uploadPortfolioImage(
  file: File,
  folder: StorageFolderTarget = 'projects',
  onProgress?: (percent: number) => void,
  projectId?: string | null,
  altText?: string | null,
  displayOrder = 0
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
  const baseName =
    slugify(file.name.replace(/\.[^/.]+$/, '')) || 'portfolio-image';
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);
  const fileName = `${Date.now()}-${uniqueSuffix}-${baseName}.${ext}`;

  let directoryPath = 'projects/unassigned';
  if (folder === 'categories') {
    directoryPath = 'categories';
  } else if (folder === 'library') {
    directoryPath = 'library';
  } else {
    const cleanProjectId =
      projectId && !projectId.startsWith('seed-')
        ? slugify(projectId) || projectId
        : 'shared';
    directoryPath = `projects/${cleanProjectId}`;
  }

  const filePath = `${directoryPath}/${fileName}`;
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

  const { data } = supabase.storage
    .from(PORTFOLIO_BUCKET)
    .getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  let recordId: string | undefined;
  const isRealProjectUuid =
    projectId &&
    !projectId.startsWith('seed-') &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      projectId
    );

  if (isRealProjectUuid && (folder === 'projects' || folder === 'gallery')) {
    const { data: imgRow, error: imgInsertErr } = await supabase
      .from('portfolio_images')
      .insert([
        {
          project_id: projectId,
          image_url: publicUrl,
          alt_text: altText || baseName,
          sort_order: displayOrder,
        },
      ])
      .select('id')
      .maybeSingle();

    if (!imgInsertErr && imgRow?.id) {
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
    sort_order: displayOrder,
    display_order: displayOrder,
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
  if (!isSupabaseConfigured || !projectId || projectId.startsWith('seed-')) {
    return [];
  }

  const { data, error } = await supabase
    .from('portfolio_images')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  const mapped = (data as Record<string, unknown>[])
    .map((row, idx) => {
      const orderVal =
        typeof row.display_order === 'number'
          ? row.display_order
          : typeof row.sort_order === 'number'
          ? row.sort_order
          : idx;
      return {
        id: String(row.id || idx),
        project_id: row.project_id ? String(row.project_id) : null,
        image_url: String(row.image_url || row.public_url || ''),
        alt_text: row.alt_text
          ? String(row.alt_text)
          : row.file_name
          ? String(row.file_name)
          : null,
        sort_order: orderVal,
        display_order: orderVal,
        created_at: String(row.created_at || new Date().toISOString()),
      };
    })
    .filter((item) => Boolean(item.image_url));

  return mapped.sort((a, b) => a.display_order - b.display_order);
}

/**
 * Fetch all rows from `public.portfolio_images` grouped by project_id for fast batch normalization.
 */
export async function getAllPortfolioImagesByProject(): Promise<
  Map<string, PortfolioImage[]>
> {
  const byProject = new Map<string, PortfolioImage[]>();
  if (!isSupabaseConfigured) return byProject;

  const { data, error } = await supabase
    .from('portfolio_images')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data) return byProject;

  for (let i = 0; i < data.length; i++) {
    const row = data[i] as Record<string, unknown>;
    const projectId = row.project_id ? String(row.project_id) : null;
    const imageUrl = String(row.image_url || row.public_url || '');
    if (!projectId || !imageUrl) continue;

    const orderVal =
      typeof row.display_order === 'number'
        ? row.display_order
        : typeof row.sort_order === 'number'
        ? row.sort_order
        : i;

    const item: PortfolioImage = {
      id: String(row.id || i),
      project_id: projectId,
      image_url: imageUrl,
      alt_text: row.alt_text ? String(row.alt_text) : null,
      sort_order: orderVal,
      display_order: orderVal,
      created_at: String(row.created_at || new Date().toISOString()),
    };

    const existing = byProject.get(projectId) || [];
    existing.push(item);
    byProject.set(projectId, existing);
  }

  for (const [pid, list] of byProject.entries()) {
    list.sort((a, b) => a.display_order - b.display_order);
    byProject.set(pid, list);
  }

  return byProject;
}

/**
 * Synchronize `public.portfolio_images` rows for a project whenever its gallery is created or updated.
 * Supports both string[] URLs and rich GalleryImageInput[] items with alt_text and display_order.
 */
export async function syncProjectPortfolioImages(
  projectId: string,
  galleryUrls: string[],
  projectTitle: string,
  galleryItems?: GalleryImageInput[]
): Promise<void> {
  if (!isSupabaseConfigured || !projectId || projectId.startsWith('seed-')) {
    return;
  }

  const normalizedItems: GalleryImageInput[] =
    galleryItems && galleryItems.length > 0
      ? galleryItems
          .filter((item) => Boolean(item.image_url?.trim()))
          .map((item, idx) => ({
            image_url: item.image_url.trim(),
            alt_text:
              item.alt_text?.trim() ||
              `${projectTitle} — Image ${String(idx + 1).padStart(2, '0')}`,
            display_order:
              typeof item.display_order === 'number' ? item.display_order : idx,
          }))
      : galleryUrls
          .map((u) => u.trim())
          .filter(Boolean)
          .map((imageUrl, idx) => ({
            image_url: imageUrl,
            alt_text: `${projectTitle} — Image ${String(idx + 1).padStart(2, '0')}`,
            display_order: idx,
          }));

  await supabase.from('portfolio_images').delete().eq('project_id', projectId);

  if (normalizedItems.length === 0) return;

  // Try inserting with both sort_order and display_order first
  const fullRows = normalizedItems.map((item, idx) => ({
    project_id: projectId,
    image_url: item.image_url,
    alt_text: item.alt_text,
    sort_order: typeof item.display_order === 'number' ? item.display_order : idx,
    display_order:
      typeof item.display_order === 'number' ? item.display_order : idx,
  }));

  const { error: firstErr } = await supabase
    .from('portfolio_images')
    .insert(fullRows);

  if (firstErr) {
    // Fallback to standard sort_order column in public.portfolio_images
    const compatRows = normalizedItems.map((item, idx) => ({
      project_id: projectId,
      image_url: item.image_url,
      alt_text: item.alt_text,
      sort_order:
        typeof item.display_order === 'number' ? item.display_order : idx,
    }));
    await supabase.from('portfolio_images').insert(compatRows);
  }
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
  const folders = [
    'categories',
    'projects',
    'projects/shared',
    'covers',
    'gallery',
    'library',
    '',
  ];

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
      // If item is a subfolder inside 'projects' (no metadata/id), list inside it
      if (!item.id && !item.metadata && folder === 'projects') {
        const subFolder = `projects/${item.name}`;
        const { data: subData } = await supabase.storage
          .from(PORTFOLIO_BUCKET)
          .list(subFolder, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          });
        if (subData) {
          for (const subItem of subData) {
            if (!subItem.name || subItem.name === '.emptyFolderPlaceholder')
              continue;
            const subFullPath = `${subFolder}/${subItem.name}`;
            if (seenPaths.has(subFullPath)) continue;
            seenPaths.add(subFullPath);
            const { data: pub } = supabase.storage
              .from(PORTFOLIO_BUCKET)
              .getPublicUrl(subFullPath);
            seenUrls.add(pub.publicUrl);
            allFiles.push({
              name: subItem.name,
              path: subFullPath,
              url: pub.publicUrl,
              created_at: subItem.created_at || new Date().toISOString(),
              size:
                typeof subItem.metadata?.size === 'number'
                  ? subItem.metadata.size
                  : null,
            });
          }
        }
        continue;
      }

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
        size:
          typeof item.metadata?.size === 'number' ? item.metadata.size : null,
      });
    }
  }

  // 2. Also include any records in `public.portfolio_images`
  const { data: tableRows, error: tableError } = await supabase
    .from('portfolio_images')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (!tableError && tableRows) {
    for (const row of tableRows as Record<string, unknown>[]) {
      const imageUrl = String(row.image_url || row.public_url || '');
      if (!imageUrl || seenUrls.has(imageUrl)) continue;
      seenUrls.add(imageUrl);

      const storagePath =
        (row.storage_path ? String(row.storage_path) : null) ||
        extractStoragePathFromUrl(imageUrl) ||
        imageUrl.split('/').pop() ||
        `image-${row.id}`;

      const orderVal =
        typeof row.display_order === 'number'
          ? row.display_order
          : typeof row.sort_order === 'number'
          ? row.sort_order
          : 0;

      allFiles.push({
        id: String(row.id),
        name: row.alt_text
          ? String(row.alt_text)
          : row.file_name
          ? String(row.file_name)
          : storagePath.split('/').pop() || 'portfolio-image',
        path: storagePath,
        url: imageUrl,
        alt_text: row.alt_text ? String(row.alt_text) : null,
        sort_order: orderVal,
        display_order: orderVal,
        created_at: String(row.created_at || new Date().toISOString()),
        size: typeof row.size_bytes === 'number' ? row.size_bytes : null,
        project_id: row.project_id ? String(row.project_id) : null,
      });
    }
  }

  return allFiles.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
    const { error: delImgUrlErr } = await supabase
      .from('portfolio_images')
      .delete()
      .in('image_url', validUrls);
    if (delImgUrlErr) {
      await supabase
        .from('portfolio_images')
        .delete()
        .in('public_url', validUrls);
    }
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

  if (projectId && !projectId.startsWith('seed-')) {
    await supabase
      .from('portfolio_images')
      .delete()
      .eq('project_id', projectId);
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
