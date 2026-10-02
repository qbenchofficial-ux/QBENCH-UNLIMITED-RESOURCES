import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_WARNING,
  PORTFOLIO_BUCKET,
  PORTFOLIO_VIDEOS_BUCKET,
  STORAGE_BUCKET,
  MAX_PORTFOLIO_VIDEO_SIZE_MB,
  MAX_PORTFOLIO_VIDEO_SIZE_BYTES,
  slugify,
  isValidUuid,
} from '../lib/supabase';
import type {
  MediaFile,
  PortfolioImage,
  GalleryImageInput,
  ProjectVideo,
  ProjectVideoInput,
} from '../types/project';

export const MAX_PORTFOLIO_IMAGE_SIZE_MB = 10;
export const MAX_PORTFOLIO_IMAGE_SIZE_BYTES =
  MAX_PORTFOLIO_IMAGE_SIZE_MB * 1024 * 1024;

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov'];
const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
];

/**
 * Detects whether a string looks like a local computer path (e.g. C:\..., D:\..., file://..., /Users/..., blob:...)
 * so local paths are never stored in Supabase database records.
 */
export function isLocalComputerPath(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  if (
    /^[a-zA-Z]:[\\/]/.test(v) ||
    v.startsWith('\\\\') ||
    v.toLowerCase().startsWith('file://') ||
    v.toLowerCase().startsWith('blob:') ||
    v.startsWith('/Users/') ||
    v.startsWith('/home/') ||
    v.includes('\\Users\\') ||
    v.includes('\\Desktop\\') ||
    v.includes('\\Downloads\\')
  ) {
    return true;
  }
  return false;
}

export function validatePortfolioImage(file: File): string | null {
  if (!file || !(file instanceof File)) {
    return 'Please select a valid image file from your computer.';
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();
  const extAllowed = ALLOWED_EXTENSIONS.includes(ext);
  const mimeAllowed = ALLOWED_MIMES.includes(mime);

  if (!extAllowed || (mime && !mimeAllowed)) {
    return `Unsupported image format "${file.name}". Supported formats: JPG, JPEG, PNG, WEBP, and sanitized SVG.`;
  }
  if (file.size <= 0) {
    return `File "${file.name}" is empty (0 bytes).`;
  }
  if (file.size > MAX_PORTFOLIO_IMAGE_SIZE_BYTES) {
    return `File "${file.name}" (${formatFileSize(
      file.size
    )}) exceeds the ${MAX_PORTFOLIO_IMAGE_SIZE_MB} MB maximum size limit.`;
  }
  return null;
}

/**
 * Securely sanitizes an SVG file before uploading to Supabase Storage or displaying publicly.
 * Removes <script>, <foreignObject>, <iframe>, <object>, <embed>, inline event handlers (on*),
 * and unsafe javascript:/data: URIs.
 */
export async function sanitizeSvgFile(file: File): Promise<File> {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();
  if (ext !== 'svg' && mime !== 'image/svg+xml') {
    return file;
  }

  const rawText = await file.text();
  if (!rawText || !rawText.includes('<svg')) {
    throw new Error(`Invalid SVG file "${file.name}".`);
  }

  if (typeof DOMParser !== 'undefined' && typeof XMLSerializer !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawText, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`Malformed SVG XML in "${file.name}".`);
    }

    const forbiddenTags = [
      'script',
      'foreignObject',
      'iframe',
      'object',
      'embed',
      'link',
      'meta',
    ];
    forbiddenTags.forEach((tag) => {
      doc.querySelectorAll(tag).forEach((el) => el.remove());
    });

    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const nameLower = attr.name.toLowerCase();
        const valLower = attr.value.trim().toLowerCase();
        if (nameLower.startsWith('on')) {
          el.removeAttribute(attr.name);
        } else if (
          (nameLower === 'href' || nameLower === 'xlink:href') &&
          (valLower.startsWith('javascript:') ||
            valLower.startsWith('data:text/html') ||
            valLower.startsWith('vbscript:'))
        ) {
          el.removeAttribute(attr.name);
        } else if (
          nameLower === 'style' &&
          (valLower.includes('javascript:') || valLower.includes('expression('))
        ) {
          el.removeAttribute(attr.name);
        }
      }
    });

    const serialized = new XMLSerializer().serializeToString(doc);
    return new File([serialized], file.name, {
      type: 'image/svg+xml',
      lastModified: Date.now(),
    });
  }

  // Regex fallback if DOMParser is unavailable
  const cleaned = rawText
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');

  return new File([cleaned], file.name, {
    type: 'image/svg+xml',
    lastModified: Date.now(),
  });
}

export function formatFileSize(bytes?: number | null): string {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateProjectVideo(file: File): {
  valid: boolean;
  error: string | null;
  warning: string | null;
} {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();

  if (
    !ALLOWED_VIDEO_EXTENSIONS.includes(ext) &&
    !ALLOWED_VIDEO_MIMES.includes(mime)
  ) {
    return {
      valid: false,
      error: `Unsupported video format "${file.name}". Supported formats: MP4, WebM, and MOV.`,
      warning: null,
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: `File "${file.name}" is empty (0 bytes).`,
      warning: null,
    };
  }

  if (file.size > MAX_PORTFOLIO_VIDEO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Video "${file.name}" (${formatFileSize(
        file.size
      )}) exceeds the ${MAX_PORTFOLIO_VIDEO_SIZE_MB} MB Supabase Storage upload limit. Please compress the video (H.264 MP4 or WebM recommended) and try again.`,
      warning: null,
    };
  }

  let warning: string | null = null;
  if (ext === 'mov' || mime === 'video/quicktime') {
    if (typeof document !== 'undefined') {
      const testVideo = document.createElement('video');
      const canPlayMov =
        testVideo.canPlayType('video/quicktime') ||
        testVideo.canPlayType('video/mp4');
      if (!canPlayMov) {
        return {
          valid: false,
          error: `MOV file "${file.name}" is not supported for native playback in this browser environment. Please convert to MP4 (H.264) or WebM.`,
          warning: null,
        };
      }
    }
    warning =
      'MOV selected: H.264 MP4 or WebM is recommended for universal playback across all desktop and mobile browsers.';
  }

  return { valid: true, error: null, warning };
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
 * Extract the bucket and relative storage path from any Supabase Storage public video URL.
 */
export function extractVideoStorageInfoFromUrl(url: string): {
  bucket: string;
  path: string;
} | null {
  if (!url) return null;
  for (const bucket of [
    PORTFOLIO_VIDEOS_BUCKET,
    STORAGE_BUCKET,
    PORTFOLIO_BUCKET,
  ]) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return {
        bucket,
        path: decodeURIComponent(url.slice(idx + marker.length)),
      };
    }
  }
  return null;
}

export type StorageFolderTarget =
  | 'categories'
  | 'projects'
  | 'site'
  | 'covers'
  | 'gallery'
  | 'library';

/**
 * Upload an image file to the Supabase `portfolio-images` Storage bucket
 * using organised paths:
 * - `portfolio-images/projects/{project_id}/`
 * - `portfolio-images/categories/`
 * - `portfolio-images/site/`
 * Returns its public URL and storage path (never stores base64 or local paths in the database).
 */
export async function uploadPortfolioImage(
  rawFile: File,
  folder: StorageFolderTarget = 'projects',
  onProgress?: (percent: number) => void,
  projectId?: string | null,
  altText?: string | null,
  displayOrder = 0
): Promise<MediaFile> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const validationError = validatePortfolioImage(rawFile);
  if (validationError) {
    throw new Error(validationError);
  }

  onProgress?.(10);

  // Sanitize SVG files before uploading to Supabase Storage
  const file = await sanitizeSvgFile(rawFile);

  onProgress?.(25);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const baseName =
    slugify(file.name.replace(/\.[^/.]+$/, '')) || 'portfolio-image';
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);
  const fileName = `${Date.now()}-${uniqueSuffix}-${baseName}.${ext}`;

  let directoryPath = 'projects/shared';
  if (folder === 'categories') {
    directoryPath = 'categories';
  } else if (folder === 'site' || folder === 'library') {
    directoryPath = 'site';
  } else {
    const rawPid = typeof projectId === 'string' ? projectId.trim() : '';
    const cleanProjectId = isValidUuid(rawPid)
      ? rawPid
      : rawPid && !rawPid.startsWith('seed-')
      ? slugify(rawPid) || 'shared'
      : 'shared';
    directoryPath = `projects/${cleanProjectId}`;
  }

  const filePath = `${directoryPath}/${fileName}`;
  const mimeType =
    file.type ||
    (ext === 'svg'
      ? 'image/svg+xml'
      : `image/${ext === 'jpg' ? 'jpeg' : ext}`);

  onProgress?.(50);

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

  onProgress?.(90);

  const { data } = supabase.storage
    .from(PORTFOLIO_BUCKET)
    .getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  onProgress?.(100);

  const isRealProjectUuid = isValidUuid(projectId);

  return {
    name: file.name || fileName,
    path: filePath,
    url: publicUrl,
    alt_text: altText || baseName,
    sort_order: displayOrder,
    display_order: displayOrder,
    created_at: new Date().toISOString(),
    size: file.size,
    project_id: isRealProjectUuid && projectId ? projectId.trim() : null,
  };
}

/**
 * Upload a video file to the Supabase `portfolio-videos` Storage bucket
 * under `portfolio-videos/projects/{project_id}/{filename}`.
 * Strictly validates file format (MP4, WebM, MOV) and size (<= 50 MB).
 */
export async function uploadProjectVideo(
  file: File,
  projectId?: string | null,
  onProgress?: (percent: number) => void,
  options?: {
    videoTitle?: string;
    videoDescription?: string;
    displayOrder?: number;
    isFeatured?: boolean;
  }
): Promise<ProjectVideoInput> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const validation = validateProjectVideo(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid video file.');
  }

  onProgress?.(12);

  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const rawBaseName = file.name.replace(/\.[^/.]+$/, '');
  const baseName = slugify(rawBaseName) || 'project-video';
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);
  const fileName = `${Date.now()}-${uniqueSuffix}-${baseName}.${ext}`;

  const rawPid = typeof projectId === 'string' ? projectId.trim() : '';
  const cleanProjectFolder = isValidUuid(rawPid)
    ? rawPid
    : rawPid && !rawPid.startsWith('seed-')
    ? slugify(rawPid) || 'unassigned'
    : 'unassigned';

  // Path inside `portfolio-videos` bucket: `projects/{project_id}/{filename}`
  // Full logical path: `portfolio-videos/projects/{project_id}/{filename}`
  const relativePath = `projects/${cleanProjectFolder}/${fileName}`;
  const mimeType =
    file.type ||
    (ext === 'webm'
      ? 'video/webm'
      : ext === 'mov'
      ? 'video/quicktime'
      : 'video/mp4');

  onProgress?.(35);

  let targetBucket = PORTFOLIO_VIDEOS_BUCKET;
  let finalStoragePath = relativePath;

  let { error: uploadError } = await supabase.storage
    .from(PORTFOLIO_VIDEOS_BUCKET)
    .upload(relativePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType,
    });

  // If the `portfolio-videos` bucket has not been created via migration yet,
  // attempt fallback to `qbench-resources` under `portfolio-videos/projects/{project_id}/{filename}`
  if (
    uploadError &&
    /bucket.*not found|does not exist/i.test(uploadError.message)
  ) {
    const fallbackPath = `${PORTFOLIO_VIDEOS_BUCKET}/${relativePath}`;
    const fallbackUpload = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fallbackPath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });

    if (!fallbackUpload.error) {
      targetBucket = STORAGE_BUCKET;
      finalStoragePath = fallbackPath;
      uploadError = null;
    }
  }

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  onProgress?.(85);

  const { data } = supabase.storage
    .from(targetBucket)
    .getPublicUrl(finalStoragePath);
  const publicUrl = data.publicUrl;

  const fullLogicalStoragePath =
    targetBucket === PORTFOLIO_VIDEOS_BUCKET
      ? `${PORTFOLIO_VIDEOS_BUCKET}/${finalStoragePath}`
      : finalStoragePath;

  const defaultTitle =
    options?.videoTitle?.trim() ||
    rawBaseName.replace(/[-_]+/g, ' ').trim() ||
    'Project Video';
  const defaultDescription = options?.videoDescription?.trim() || '';
  const displayOrder =
    typeof options?.displayOrder === 'number' ? options.displayOrder : 0;
  const isFeatured = Boolean(options?.isFeatured);

  let recordId: string | undefined;
  if (isValidUuid(projectId)) {
    const { data: vidRow, error: vidErr } = await supabase
      .from('project_videos')
      .insert([
        {
          project_id: projectId.trim(),
          video_url: publicUrl,
          storage_path: fullLogicalStoragePath,
          video_title: defaultTitle,
          video_description: defaultDescription || null,
          display_order: displayOrder,
          is_featured: isFeatured,
        },
      ])
      .select('id')
      .maybeSingle();

    if (!vidErr && vidRow?.id && isValidUuid(String(vidRow.id))) {
      recordId = String(vidRow.id);
    }
  }

  onProgress?.(100);

  return {
    id: recordId,
    video_url: publicUrl,
    storage_path: fullLogicalStoragePath,
    video_title: defaultTitle,
    video_description: defaultDescription,
    display_order: displayOrder,
    is_featured: isFeatured,
    file_size: file.size,
    file_name: file.name,
  };
}

/**
 * Remove a video file from Supabase Storage (`portfolio-videos`) and optionally delete its database row.
 */
export async function deleteProjectVideoAsset(
  storagePath?: string | null,
  videoUrl?: string | null,
  videoId?: string | null
): Promise<void> {
  if (!isSupabaseConfigured) return;

  // 1. Delete from Storage bucket
  const resolvedInfo = videoUrl ? extractVideoStorageInfoFromUrl(videoUrl) : null;
  if (resolvedInfo) {
    try {
      await supabase.storage
        .from(resolvedInfo.bucket)
        .remove([resolvedInfo.path]);
    } catch {
      // Ignore storage cleanup notice
    }
  } else if (storagePath) {
    const cleanPath = storagePath.replace(/^portfolio-videos\//, '');
    try {
      await supabase.storage.from(PORTFOLIO_VIDEOS_BUCKET).remove([cleanPath]);
    } catch {
      // Ignore storage cleanup notice
    }
  }

  // 2. Delete from public.project_videos table if applicable
  if (isValidUuid(videoId)) {
    try {
      await supabase.from('project_videos').delete().eq('id', videoId.trim());
    } catch {
      // Ignore if table not yet migrated
    }
  } else if (videoUrl) {
    try {
      await supabase
        .from('project_videos')
        .delete()
        .eq('video_url', videoUrl.trim());
    } catch {
      // Ignore if table not yet migrated
    }
  }
}

/**
 * Fetch all `public.project_videos` rows for a specific project UUID.
 * Strictly validates `isValidUuid(projectId)` so seed IDs are never passed to UUID columns.
 */
export async function getProjectVideos(
  projectId: string
): Promise<ProjectVideo[]> {
  if (!isSupabaseConfigured || !isValidUuid(projectId)) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_videos')
    .select('*')
    .eq('project_id', projectId.trim())
    .order('display_order', { ascending: true });

  if (error || !data) {
    return [];
  }

  const mapped = (data as Record<string, unknown>[])
    .map((row, idx) => ({
      id: String(row.id || `${projectId}-vid-${idx}`),
      project_id: row.project_id ? String(row.project_id) : null,
      video_url: String(row.video_url || ''),
      storage_path: row.storage_path ? String(row.storage_path) : null,
      video_title: row.video_title ? String(row.video_title) : null,
      video_description: row.video_description
        ? String(row.video_description)
        : null,
      display_order:
        typeof row.display_order === 'number' ? row.display_order : idx,
      is_featured: Boolean(row.is_featured),
      created_at: String(row.created_at || new Date().toISOString()),
    }))
    .filter((v) => Boolean(v.video_url));

  return mapped.sort((a, b) => a.display_order - b.display_order);
}

/**
 * Batch-fetch all rows from `public.project_videos` grouped by `project_id`.
 */
export async function getAllProjectVideosByProject(): Promise<
  Map<string, ProjectVideo[]>
> {
  const byProject = new Map<string, ProjectVideo[]>();
  if (!isSupabaseConfigured) return byProject;

  const { data, error } = await supabase
    .from('project_videos')
    .select('*')
    .order('display_order', { ascending: true });

  if (error || !data) return byProject;

  for (let i = 0; i < data.length; i++) {
    const row = data[i] as Record<string, unknown>;
    const projectId = row.project_id ? String(row.project_id).trim() : null;
    const videoUrl = String(row.video_url || '').trim();
    if (!projectId || !isValidUuid(projectId) || !videoUrl) continue;

    const item: ProjectVideo = {
      id: String(row.id || `${projectId}-vid-${i}`),
      project_id: projectId,
      video_url: videoUrl,
      storage_path: row.storage_path ? String(row.storage_path) : null,
      video_title: row.video_title ? String(row.video_title) : null,
      video_description: row.video_description
        ? String(row.video_description)
        : null,
      display_order:
        typeof row.display_order === 'number' ? row.display_order : i,
      is_featured: Boolean(row.is_featured),
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
 * Synchronize `public.project_videos` rows for a project when it is created or updated,
 * and clean up any removed video files from Supabase Storage.
 * Strictly validates `isValidUuid(projectId)`.
 */
export async function syncProjectVideos(
  projectId: string,
  videoItems?: ProjectVideoInput[]
): Promise<void> {
  if (!isSupabaseConfigured || !isValidUuid(projectId)) {
    return;
  }

  const cleanProjectId = projectId.trim();
  const incoming = (videoItems || [])
    .filter((v) => Boolean(v.video_url?.trim()))
    .map((v, idx) => ({
      video_url: v.video_url.trim(),
      storage_path: v.storage_path || null,
      video_title: v.video_title?.trim() || `Project Video ${idx + 1}`,
      video_description: v.video_description?.trim() || null,
      display_order: typeof v.display_order === 'number' ? v.display_order : idx,
      is_featured: Boolean(v.is_featured),
    }));

  // Ensure at most one featured video (or mark first as featured if none selected)
  if (incoming.length > 0 && !incoming.some((v) => v.is_featured)) {
    incoming[0].is_featured = true;
  }

  try {
    const existingVideos = await getProjectVideos(cleanProjectId);
    const incomingUrls = new Set(incoming.map((v) => v.video_url));

    // Clean up storage objects for videos that were removed from this project
    for (const prev of existingVideos) {
      if (!incomingUrls.has(prev.video_url)) {
        await deleteProjectVideoAsset(prev.storage_path, prev.video_url, prev.id);
      }
    }

    const { error: delErr } = await supabase
      .from('project_videos')
      .delete()
      .eq('project_id', cleanProjectId);

    if (delErr) {
      // Table may not exist yet if migration hasn't been executed
      return;
    }

    if (incoming.length === 0) return;

    const rowsToInsert = incoming.map((v, idx) => ({
      project_id: cleanProjectId,
      video_url: v.video_url,
      storage_path: v.storage_path,
      video_title: v.video_title,
      video_description: v.video_description,
      display_order: idx,
      is_featured: v.is_featured,
    }));

    await supabase.from('project_videos').insert(rowsToInsert);
  } catch {
    // Graceful fallback if project_videos table is not yet migrated
  }
}

/**
 * Fetch gallery records from `public.portfolio_images` for a specific project.
 */
export async function getProjectPortfolioImages(
  projectId: string
): Promise<PortfolioImage[]> {
  if (!isSupabaseConfigured || !isValidUuid(projectId)) {
    return [];
  }

  const { data, error } = await supabase
    .from('portfolio_images')
    .select('*')
    .eq('project_id', projectId.trim())
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
      const imageUrl = String(row.image_url || row.public_url || '');
      const storagePath = row.storage_path
        ? String(row.storage_path)
        : extractStoragePathFromUrl(imageUrl);
      const fileName = row.file_name
        ? String(row.file_name)
        : storagePath
        ? storagePath.split('/').pop() || null
        : null;
      return {
        id: String(row.id || idx),
        project_id: row.project_id ? String(row.project_id) : null,
        image_url: imageUrl,
        storage_path: storagePath,
        file_name: fileName,
        file_size: typeof row.size_bytes === 'number' ? row.size_bytes : null,
        alt_text: row.alt_text
          ? String(row.alt_text)
          : fileName,
        sort_order: orderVal,
        display_order: orderVal,
        created_at: String(row.created_at || new Date().toISOString()),
      };
    })
    .filter((item) => Boolean(item.image_url) && !isLocalComputerPath(item.image_url));

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
    const projectId = row.project_id ? String(row.project_id).trim() : null;
    const imageUrl = String(row.image_url || row.public_url || '');
    if (
      !projectId ||
      !isValidUuid(projectId) ||
      !imageUrl ||
      isLocalComputerPath(imageUrl)
    )
      continue;

    const orderVal =
      typeof row.display_order === 'number'
        ? row.display_order
        : typeof row.sort_order === 'number'
        ? row.sort_order
        : i;

    const storagePath = row.storage_path
      ? String(row.storage_path)
      : extractStoragePathFromUrl(imageUrl);
    const fileName = row.file_name
      ? String(row.file_name)
      : storagePath
      ? storagePath.split('/').pop() || null
      : null;

    const item: PortfolioImage = {
      id: String(row.id || i),
      project_id: projectId,
      image_url: imageUrl,
      storage_path: storagePath,
      file_name: fileName,
      file_size: typeof row.size_bytes === 'number' ? row.size_bytes : null,
      alt_text: row.alt_text ? String(row.alt_text) : fileName,
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
 * Delete a single image file from `portfolio-images` Storage bucket and `public.portfolio_images` table.
 */
export async function deleteSinglePortfolioImageAsset(
  storagePath?: string | null,
  imageUrl?: string | null
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const resolvedPath =
    (storagePath ? storagePath.trim() : null) ||
    (imageUrl ? extractStoragePathFromUrl(imageUrl) : null);

  if (resolvedPath) {
    try {
      await supabase.storage.from(PORTFOLIO_BUCKET).remove([resolvedPath]);
    } catch {
      // Ignore if object already removed
    }
  }

  if (imageUrl && imageUrl.trim()) {
    try {
      await supabase
        .from('portfolio_images')
        .delete()
        .eq('image_url', imageUrl.trim());
    } catch {
      // Ignore if row already removed
    }
  }
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
  if (!isSupabaseConfigured || !isValidUuid(projectId)) {
    return;
  }

  const cleanProjectId = projectId.trim();

  const normalizedItems: GalleryImageInput[] =
    galleryItems && galleryItems.length > 0
      ? galleryItems
          .filter(
            (item) =>
              Boolean(item.image_url?.trim()) &&
              !isLocalComputerPath(item.image_url)
          )
          .map((item, idx) => ({
            image_url: item.image_url.trim(),
            storage_path:
              item.storage_path || extractStoragePathFromUrl(item.image_url),
            alt_text:
              item.alt_text?.trim() ||
              `${projectTitle} — Image ${String(idx + 1).padStart(2, '0')}`,
            display_order:
              typeof item.display_order === 'number' ? item.display_order : idx,
          }))
      : galleryUrls
          .map((u) => u.trim())
          .filter((u) => Boolean(u) && !isLocalComputerPath(u))
          .map((imageUrl, idx) => ({
            image_url: imageUrl,
            storage_path: extractStoragePathFromUrl(imageUrl),
            alt_text: `${projectTitle} — Image ${String(idx + 1).padStart(2, '0')}`,
            display_order: idx,
          }));

  await supabase
    .from('portfolio_images')
    .delete()
    .eq('project_id', cleanProjectId);

  if (normalizedItems.length === 0) return;

  // Try inserting with sort_order, display_order, and storage_path first
  const fullRows = normalizedItems.map((item, idx) => ({
    project_id: cleanProjectId,
    image_url: item.image_url,
    storage_path: item.storage_path || null,
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
      project_id: cleanProjectId,
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
    'site',
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
 * Delete storage images and videos associated with a project when a project is deleted.
 */
export async function deleteProjectStorageAssets(
  coverImage: string | null,
  gallery: string[],
  projectId?: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  if (isValidUuid(projectId)) {
    const cleanProjectId = projectId.trim();

    // Clean up project_videos storage files & rows
    try {
      const existingVideos = await getProjectVideos(cleanProjectId);
      for (const vid of existingVideos) {
        await deleteProjectVideoAsset(vid.storage_path, vid.video_url, vid.id);
      }
      await supabase
        .from('project_videos')
        .delete()
        .eq('project_id', cleanProjectId);
    } catch {
      // Ignore if project_videos table is not yet created
    }

    await supabase
      .from('portfolio_images')
      .delete()
      .eq('project_id', cleanProjectId);
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
