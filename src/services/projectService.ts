import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_WARNING,
  slugify,
  isValidUuid,
} from '../lib/supabase';
import {
  deleteProjectStorageAssets,
  getProjectPortfolioImages,
  getAllPortfolioImagesByProject,
  syncProjectPortfolioImages,
  getProjectVideos,
  getAllProjectVideosByProject,
  syncProjectVideos,
} from './mediaService';
import {
  getCategories,
  getActiveCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  sortCategories,
  SEED_CATEGORIES,
} from './categoryService';
import {
  createProjectInquiry,
  getProjectInquiries,
  updateProjectInquiryStatus,
  deleteProjectInquiry,
} from './inquiryService';
import {
  getSiteSettings,
  saveSiteSettings,
  getSiteSettingRows,
  DEFAULT_SITE_SETTINGS,
} from './settingsService';
import type {
  Project,
  ProjectFormData,
  Category,
  PortfolioImage,
  GalleryImageInput,
  ProjectVideo,
  ProjectVideoInput,
  ProjectThumbnailMode,
} from '../types/project';

export {
  getCategories,
  getActiveCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  sortCategories,
  SEED_CATEGORIES,
  createProjectInquiry,
  getProjectInquiries,
  updateProjectInquiryStatus,
  deleteProjectInquiry,
  getSiteSettings,
  saveSiteSettings,
  getSiteSettingRows,
  DEFAULT_SITE_SETTINGS,
};

const PROJECT_META_SETTING_KEY = 'cms_portfolio_projects_meta_v1';
const DELETED_SEEDS_SETTING_KEY = 'cms_deleted_seed_projects_v1';

interface ProjectExtendedMeta {
  short_description?: string | null;
  project_date?: string | null;
  project_type?: string | null;
  software_tools?: string[];
  display_order?: number;
  video_url?: string | null;
  client_name?: string | null;
  instagram_url?: string | null;
  website_url?: string | null;
  thumbnail_mode?: ProjectThumbnailMode;
  gallery_items?: GalleryImageInput[];
  video_items?: ProjectVideoInput[];
}

type ProjectMetaMap = Record<string, ProjectExtendedMeta>;

async function loadProjectMetaMap(): Promise<ProjectMetaMap> {
  let localMap: ProjectMetaMap = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(PROJECT_META_SETTING_KEY);
      if (raw) {
        localMap = JSON.parse(raw) as ProjectMetaMap;
      }
    } catch {
      // ignore localStorage errors
    }
  }

  if (!isSupabaseConfigured) {
    return localMap;
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', PROJECT_META_SETTING_KEY)
      .maybeSingle();

    if (!error && data?.setting_value) {
      const parsed = JSON.parse(String(data.setting_value)) as ProjectMetaMap;
      return { ...localMap, ...parsed };
    }
  } catch {
    // ignore parse errors
  }

  return localMap;
}

async function saveProjectMetaMap(metaMap: ProjectMetaMap): Promise<void> {
  const serialized = JSON.stringify(metaMap);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PROJECT_META_SETTING_KEY, serialized);
    } catch {
      // ignore localStorage errors
    }
  }

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('site_settings').upsert(
      [
        {
          setting_key: PROJECT_META_SETTING_KEY,
          setting_value: serialized,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'setting_key' }
    );
  } catch {
    // ignore if non-admin or transient error
  }
}

async function loadDeletedSeedIds(): Promise<Set<string>> {
  const deleted = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(DELETED_SEEDS_SETTING_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((v) => deleted.add(String(v)));
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }

  if (!isSupabaseConfigured) return deleted;

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', DELETED_SEEDS_SETTING_KEY)
      .maybeSingle();

    if (!error && data?.setting_value) {
      const parsed = JSON.parse(String(data.setting_value));
      if (Array.isArray(parsed)) {
        parsed.forEach((v) => deleted.add(String(v)));
      }
    }
  } catch {
    // ignore parse errors
  }

  return deleted;
}

async function markSeedAsDeleted(seedIdOrSlug: string): Promise<void> {
  const current = await loadDeletedSeedIds();
  current.add(seedIdOrSlug);
  const seedMatch = SEED_PROJECTS.find(
    (p) => p.id === seedIdOrSlug || p.slug === seedIdOrSlug
  );
  if (seedMatch) {
    current.add(seedMatch.id);
    current.add(seedMatch.slug);
  }

  const serialized = JSON.stringify(Array.from(current));
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(DELETED_SEEDS_SETTING_KEY, serialized);
    } catch {
      // ignore localStorage errors
    }
  }

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('site_settings').upsert(
      [
        {
          setting_key: DELETED_SEEDS_SETTING_KEY,
          setting_value: serialized,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'setting_key' }
    );
  } catch {
    // ignore if non-admin
  }
}

export const SEED_PROJECTS: Project[] = [
  {
    id: 'seed-1',
    title: 'The Journey of a Ring',
    slug: 'the-journey-of-a-ring',
    short_description:
      'Cinematic luxury jewellery motion design exploring the craftsmanship, brilliance, and timeless elegance of a fine diamond ring.',
    description:
      'An evocative motion graphics showcase created to highlight the intricate artistry of fine diamond jewellery. Through macro lighting studies, fluid camera choreography, and bespoke sound design, this piece transforms product visualization into an emotional luxury narrative.',
    category_id: 'df50ce32-be74-4e0d-acea-f3a388f71690',
    category: 'Motion Graphics',
    client: 'Luxury Jewellery Collective',
    client_name: 'Luxury Jewellery Collective',
    year: 2026,
    project_date: 'February 2026',
    project_type: '3D Luxury Motion Design',
    services: ['Motion Graphics', '3D Visualization', 'Art Direction'],
    software_tools: [
      'Cinema 4D',
      'Octane Render',
      'After Effects',
      'Premiere Pro',
    ],
    cover_image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&h=500&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&h=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1200&q=80',
    ],
    portfolio_images: [
      {
        id: 'seed-1-img-1',
        project_id: 'seed-1',
        image_url:
          'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Main Cover Image',
        sort_order: 0,
        display_order: 0,
        created_at: '2026-02-10T10:00:00.000Z',
      },
      {
        id: 'seed-1-img-2',
        project_id: 'seed-1',
        image_url:
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Storyboard Image 01',
        sort_order: 1,
        display_order: 1,
        created_at: '2026-02-10T10:00:00.000Z',
      },
      {
        id: 'seed-1-img-3',
        project_id: 'seed-1',
        image_url:
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Storyboard Image 02',
        sort_order: 2,
        display_order: 2,
        created_at: '2026-02-10T10:00:00.000Z',
      },
      {
        id: 'seed-1-img-4',
        project_id: 'seed-1',
        image_url:
          'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Final Artwork',
        sort_order: 3,
        display_order: 3,
        created_at: '2026-02-10T10:00:00.000Z',
      },
      {
        id: 'seed-1-img-5',
        project_id: 'seed-1',
        image_url:
          'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Project Presentation',
        sort_order: 4,
        display_order: 4,
        created_at: '2026-02-10T10:00:00.000Z',
      },
    ],
    behance_url:
      'https://www.behance.net/gallery/253620337/The-Journey-of-a-Ring-Luxury-Jewellery-Motion-Design?platform=direct',
    youtube_url: null,
    video_url: null,
    instagram_url: null,
    website_url: null,
    featured: true,
    is_featured: true,
    status: 'published',
    sort_order: 1,
    display_order: 1,
    is_seed: true,
    created_at: '2026-02-10T10:00:00.000Z',
    updated_at: '2026-02-10T10:00:00.000Z',
  },
  {
    id: 'seed-2',
    title: 'Sleepless Night',
    slug: 'sleepless-night',
    short_description:
      'Atmospheric motion graphics narrative exploring late-night creative focus, urban rhythm, and visual storytelling.',
    description:
      'Sleepless Night is a conceptual motion graphics piece blending kinetic typography, moody lighting transitions, and frame-by-frame visual pacing to capture the energy of midnight creative breakthroughs.',
    category_id: 'df50ce32-be74-4e0d-acea-f3a388f71690',
    category: 'Motion Graphics',
    client: 'QBENCH Studio Originals',
    client_name: 'QBENCH Studio Originals',
    year: 2026,
    project_date: 'February 2026',
    project_type: 'Conceptual Motion Film',
    services: ['Motion Graphics', 'Visual Storytelling', 'Sound Sync'],
    software_tools: ['After Effects', 'Illustrator', 'Photoshop'],
    cover_image:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&h=500&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&h=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    ],
    portfolio_images: [
      {
        id: 'seed-2-img-1',
        project_id: 'seed-2',
        image_url:
          'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Main Cover Image',
        sort_order: 0,
        display_order: 0,
        created_at: '2026-02-14T10:00:00.000Z',
      },
      {
        id: 'seed-2-img-2',
        project_id: 'seed-2',
        image_url:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Visual Lighting Study',
        sort_order: 1,
        display_order: 1,
        created_at: '2026-02-14T10:00:00.000Z',
      },
    ],
    behance_url: null,
    youtube_url: null,
    video_url: null,
    instagram_url: null,
    website_url: null,
    featured: true,
    is_featured: true,
    status: 'published',
    sort_order: 2,
    display_order: 2,
    is_seed: true,
    created_at: '2026-02-14T10:00:00.000Z',
    updated_at: '2026-02-14T10:00:00.000Z',
  },
  {
    id: 'seed-3',
    title: 'Treat Your Kidneys Well',
    slug: 'treat-your-kidneys-well',
    short_description:
      'High-impact public awareness creative campaign designed to communicate preventive health through approachable visual design.',
    description:
      'A multi-format creative campaign developed to make vital kidney health education engaging, memorable, and shareable across digital and print platforms. Combines clear infographic storytelling with warm, human-centered illustration.',
    category_id: '5c912245-2ae0-40c2-8781-aef99dab9a24',
    category: 'Social Media',
    client: 'Healthcare Awareness Initiative',
    client_name: 'Healthcare Awareness Initiative',
    year: 2026,
    project_date: 'February 2026',
    project_type: 'Social Media & Public Awareness Campaign',
    services: ['Creative Campaigns', 'Social Media', 'Infographic Design'],
    software_tools: ['Illustrator', 'Photoshop', 'After Effects'],
    cover_image:
      'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&h=500&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&h=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
    ],
    portfolio_images: [
      {
        id: 'seed-3-img-1',
        project_id: 'seed-3',
        image_url:
          'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
        alt_text: 'Campaign Key Visual',
        sort_order: 0,
        display_order: 0,
        created_at: '2026-02-18T10:00:00.000Z',
      },
    ],
    behance_url: null,
    youtube_url: null,
    video_url: null,
    instagram_url: null,
    website_url: null,
    featured: true,
    is_featured: true,
    status: 'published',
    sort_order: 3,
    display_order: 3,
    is_seed: true,
    created_at: '2026-02-18T10:00:00.000Z',
    updated_at: '2026-02-18T10:00:00.000Z',
  },
];

function seedToFormData(seed: Project): ProjectFormData {
  return {
    title: seed.title,
    slug: seed.slug,
    short_description: seed.short_description || '',
    description: seed.description || seed.short_description || '',
    category_id: isValidUuid(seed.category_id) ? seed.category_id : null,
    category: seed.category || 'Motion Graphics',
    client: seed.client || 'QBENCH Client',
    client_name: seed.client_name || seed.client || 'QBENCH Client',
    year: seed.year || 2026,
    project_date: seed.project_date || 'February 2026',
    project_type: seed.project_type || '',
    services: seed.services || [],
    software_tools: seed.software_tools || [],
    cover_image: seed.cover_image,
    cover_image_url: seed.cover_image_url || seed.cover_image,
    gallery: seed.gallery || [],
    gallery_items: (seed.portfolio_images || []).map((img, i) => ({
      image_url: img.image_url,
      alt_text: img.alt_text || `${seed.title} — Image ${i + 1}`,
      display_order: img.display_order ?? i,
    })),
    behance_url: seed.behance_url || '',
    youtube_url: seed.youtube_url || '',
    video_url: seed.video_url || '',
    instagram_url: seed.instagram_url || '',
    website_url: seed.website_url || '',
    featured: seed.featured,
    is_featured: seed.is_featured,
    status: seed.status,
    sort_order: seed.sort_order || 1,
    display_order: seed.display_order || 1,
  };
}

async function getActiveSeedProjects(): Promise<Project[]> {
  const deleted = await loadDeletedSeedIds();
  return SEED_PROJECTS.filter(
    (seed) => !deleted.has(seed.id) && !deleted.has(seed.slug)
  );
}

export function sortProjects(list: Project[]): Project[] {
  return [...list].sort((a, b) => {
    const orderA = a.display_order ?? a.sort_order ?? 999;
    const orderB = b.display_order ?? b.sort_order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

function normalizeProject(
  raw: Record<string, unknown>,
  categoriesById: Map<string, Category>,
  portfolioImages?: PortfolioImage[],
  metaMap?: ProjectMetaMap,
  projectVideos?: ProjectVideo[]
): Project {
  const id = String(raw.id || '').trim();
  const slug = String(raw.slug || '').trim();
  const meta = (metaMap && (metaMap[id] || metaMap[slug])) || {};

  const rawCatId = raw.category_id ? String(raw.category_id).trim() : null;
  const categoryId = isValidUuid(rawCatId) ? rawCatId : null;
  const matchedCat = categoryId ? categoriesById.get(categoryId) : undefined;
  const categoryName = matchedCat
    ? matchedCat.name
    : raw.category
    ? String(raw.category)
    : null;

  const description = raw.description ? String(raw.description) : null;
  const shortDescription = raw.short_description
    ? String(raw.short_description)
    : meta.short_description
    ? String(meta.short_description)
    : description
    ? description.split('\n')[0].slice(0, 220)
    : null;

  const rawGallery = Array.isArray(raw.gallery)
    ? raw.gallery.map(String).filter(Boolean)
    : [];

  // Build portfolio_images from DB rows or meta.gallery_items or rawGallery
  let resolvedPortfolioImages: PortfolioImage[] = [];
  if (portfolioImages && portfolioImages.length > 0) {
    resolvedPortfolioImages = [...portfolioImages].sort(
      (a, b) =>
        (a.display_order ?? a.sort_order) - (b.display_order ?? b.sort_order)
    );
  } else if (meta.gallery_items && meta.gallery_items.length > 0) {
    resolvedPortfolioImages = meta.gallery_items.map((item, idx) => ({
      id: isValidUuid(item.id) ? item.id : `${id}-img-${idx}`,
      project_id: isValidUuid(id) ? id : null,
      image_url: item.image_url,
      alt_text: item.alt_text || null,
      sort_order: item.display_order ?? idx,
      display_order: item.display_order ?? idx,
      created_at: String(raw.created_at || new Date().toISOString()),
    }));
  } else if (rawGallery.length > 0) {
    resolvedPortfolioImages = rawGallery.map((url, idx) => ({
      id: `${id}-img-${idx}`,
      project_id: isValidUuid(id) ? id : null,
      image_url: url,
      alt_text: `${String(raw.title || 'Project')} — Image ${String(
        idx + 1
      ).padStart(2, '0')}`,
      sort_order: idx,
      display_order: idx,
      created_at: String(raw.created_at || new Date().toISOString()),
    }));
  }

  // Build project_videos from DB rows or meta.video_items
  let resolvedProjectVideos: ProjectVideo[] = [];
  if (projectVideos && projectVideos.length > 0) {
    resolvedProjectVideos = [...projectVideos].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
  } else if (meta.video_items && meta.video_items.length > 0) {
    resolvedProjectVideos = meta.video_items
      .filter((v) => Boolean(v.video_url?.trim()))
      .map((v, idx) => ({
        id: isValidUuid(v.id) ? v.id : `${id}-vid-${idx}`,
        project_id: isValidUuid(id) ? id : null,
        video_url: v.video_url.trim(),
        storage_path: v.storage_path || null,
        video_title: v.video_title || null,
        video_description: v.video_description || null,
        display_order:
          typeof v.display_order === 'number' ? v.display_order : idx,
        is_featured: Boolean(v.is_featured),
        file_size: v.file_size ?? null,
        created_at: String(raw.created_at || new Date().toISOString()),
      }))
      .sort((a, b) => a.display_order - b.display_order);
  }

  const extraImages = resolvedPortfolioImages
    .map((img) => img.image_url)
    .filter(Boolean);
  const mergedGallery =
    extraImages.length > 0
      ? extraImages
      : Array.from(new Set([...rawGallery, ...extraImages]));

  const primaryUploadedVideo =
    resolvedProjectVideos.find((v) => v.is_featured) ||
    resolvedProjectVideos[0];

  const videoUrl = raw.video_url
    ? String(raw.video_url)
    : raw.youtube_url
    ? String(raw.youtube_url)
    : meta.video_url
    ? String(meta.video_url)
    : primaryUploadedVideo?.video_url || null;

  const clientVal = raw.client_name
    ? String(raw.client_name)
    : raw.client
    ? String(raw.client)
    : meta.client_name
    ? String(meta.client_name)
    : null;

  const yearVal =
    typeof raw.year === 'number'
      ? raw.year
      : raw.year
      ? Number(raw.year)
      : new Date().getFullYear();

  const projectDate = raw.project_date
    ? String(raw.project_date)
    : meta.project_date
    ? String(meta.project_date)
    : String(yearVal);

  const projectType = raw.project_type
    ? String(raw.project_type)
    : meta.project_type
    ? String(meta.project_type)
    : null;

  const servicesList = Array.isArray(raw.services)
    ? raw.services.map(String).filter(Boolean)
    : typeof raw.services === 'string' && raw.services.trim()
    ? raw.services
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const softwareTools = Array.isArray(raw.software_tools)
    ? raw.software_tools.map(String).filter(Boolean)
    : Array.isArray(meta.software_tools)
    ? meta.software_tools.map(String).filter(Boolean)
    : [];

  const coverImg = raw.cover_image_url
    ? String(raw.cover_image_url)
    : raw.cover_image
    ? String(raw.cover_image)
    : mergedGallery[0] || null;

  const isFeatured =
    typeof raw.is_featured === 'boolean'
      ? raw.is_featured
      : Boolean(raw.featured);

  const displayOrder =
    typeof raw.display_order === 'number'
      ? raw.display_order
      : typeof raw.sort_order === 'number'
      ? raw.sort_order
      : typeof meta.display_order === 'number'
      ? meta.display_order
      : 0;

  const thumbnailMode: ProjectThumbnailMode =
    raw.thumbnail_mode === 'video_thumbnail' ||
    meta.thumbnail_mode === 'video_thumbnail'
      ? 'video_thumbnail'
      : 'cover_image';

  return {
    id,
    title: String(raw.title || ''),
    slug,
    description,
    short_description: shortDescription,
    category_id: categoryId,
    category: categoryName,
    client: clientVal,
    client_name: clientVal,
    year: yearVal,
    project_date: projectDate,
    project_type: projectType,
    services: servicesList,
    software_tools: softwareTools,
    cover_image: coverImg,
    cover_image_url: coverImg,
    thumbnail_mode: thumbnailMode,
    gallery: mergedGallery,
    behance_url: raw.behance_url ? String(raw.behance_url) : null,
    youtube_url: videoUrl,
    video_url: videoUrl,
    instagram_url: raw.instagram_url
      ? String(raw.instagram_url)
      : meta.instagram_url || null,
    website_url: raw.website_url
      ? String(raw.website_url)
      : meta.website_url || null,
    featured: isFeatured,
    is_featured: isFeatured,
    status: raw.status === 'published' ? 'published' : 'draft',
    sort_order: displayOrder,
    display_order: displayOrder,
    portfolio_images: resolvedPortfolioImages,
    project_videos: resolvedProjectVideos,
    is_seed: !isValidUuid(id),
    created_at: raw.created_at
      ? String(raw.created_at)
      : new Date().toISOString(),
    updated_at: raw.updated_at
      ? String(raw.updated_at)
      : new Date().toISOString(),
  };
}

async function buildCategoryMaps(): Promise<{
  byId: Map<string, Category>;
  byNameOrSlug: Map<string, Category>;
}> {
  const categories = await getCategories();
  const byId = new Map<string, Category>();
  const byNameOrSlug = new Map<string, Category>();

  for (const cat of categories) {
    byId.set(cat.id, cat);
    byNameOrSlug.set(cat.name.toLowerCase(), cat);
    byNameOrSlug.set(cat.slug.toLowerCase(), cat);
  }

  return { byId, byNameOrSlug };
}

async function resolveCategoryId(
  formData: Pick<ProjectFormData, 'category_id' | 'category'>
): Promise<string | null> {
  const { byId, byNameOrSlug } = await buildCategoryMaps();

  if (
    formData.category_id &&
    isValidUuid(formData.category_id) &&
    byId.has(formData.category_id.trim())
  ) {
    return formData.category_id.trim();
  }

  const rawCategory = (formData.category || '').trim();
  if (!rawCategory) return null;

  const existing =
    byNameOrSlug.get(rawCategory.toLowerCase()) ||
    byNameOrSlug.get(slugify(rawCategory));

  if (existing && isValidUuid(existing.id)) {
    return existing.id.trim();
  }

  // Create category in Supabase if it doesn't exist yet as a real UUID row
  try {
    const created = await createCategory({ name: rawCategory });
    return isValidUuid(created.id) ? created.id.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Migrate a single demo/seed project into `public.projects` as a real UUID record.
 * Prevents duplicate imports by checking `.eq('slug', seed.slug)` first.
 */
export async function migrateSeedProjectToSupabase(
  seed: Project
): Promise<Project> {
  const existing = await getProjectBySlug(seed.slug, true);
  if (existing && isValidUuid(existing.id)) {
    return existing;
  }
  return createProject(seedToFormData(seed));
}

let seedMigrationPromise: Promise<void> | null = null;

/**
 * Ensure all non-deleted demo/seed projects are migrated into `public.projects`
 * with real PostgreSQL UUIDs when an authenticated admin session is active.
 */
async function ensureSeedProjectsMigratedIfEmpty(): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (seedMigrationPromise) {
    return seedMigrationPromise;
  }

  seedMigrationPromise = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { count, error: countErr } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true });

      if (countErr || (typeof count === 'number' && count > 0)) {
        return;
      }

      const activeSeeds = await getActiveSeedProjects();
      for (const seed of activeSeeds) {
        try {
          const { data: existingSlug } = await supabase
            .from('projects')
            .select('id')
            .eq('slug', seed.slug)
            .maybeSingle();

          if (!existingSlug) {
            await createProject(seedToFormData(seed));
          }
        } catch {
          // Ignore individual seed migration failure
        }
      }
    } finally {
      seedMigrationPromise = null;
    }
  })();

  return seedMigrationPromise;
}

/**
 * Fetch ALL projects (published + draft) for the Admin CMS.
 * Automatically migrates seed projects into real Supabase UUID records if the table is empty
 * and an admin session is active.
 */
export async function getAllProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    return sortProjects(await getActiveSeedProjects());
  }

  await ensureSeedProjectsMigratedIfEmpty();

  const [{ byId }, imagesByProject, videosByProject, metaMap] =
    await Promise.all([
      buildCategoryMaps(),
      getAllPortfolioImagesByProject(),
      getAllProjectVideosByProject(),
      loadProjectMetaMap(),
    ]);

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []).map((row) => {
    const raw = row as Record<string, unknown>;
    const pid = String(raw.id || '').trim();
    return normalizeProject(
      raw,
      byId,
      imagesByProject.get(pid),
      metaMap,
      videosByProject.get(pid)
    );
  });

  if (rows.length === 0) {
    return sortProjects(await getActiveSeedProjects());
  }

  return sortProjects(rows);
}

/**
 * Fetch ONLY published projects (`status = 'published'`) for the public website.
 */
export async function getPublishedProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    const activeSeeds = await getActiveSeedProjects();
    return sortProjects(activeSeeds.filter((p) => p.status === 'published'));
  }

  const [{ byId }, imagesByProject, videosByProject, metaMap] =
    await Promise.all([
      buildCategoryMaps(),
      getAllPortfolioImagesByProject(),
      getAllProjectVideosByProject(),
      loadProjectMetaMap(),
    ]);

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const publishedRows = (data || []).map((row) => {
    const raw = row as Record<string, unknown>;
    const pid = String(raw.id || '').trim();
    return normalizeProject(
      raw,
      byId,
      imagesByProject.get(pid),
      metaMap,
      videosByProject.get(pid)
    );
  });

  if (publishedRows.length > 0) {
    return sortProjects(publishedRows);
  }

  // Check if any projects exist in DB at all (e.g. if all DB projects are drafts, return empty rather than seed)
  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true });

  if (typeof count === 'number' && count > 0) {
    return [];
  }

  const activeSeeds = await getActiveSeedProjects();
  return sortProjects(activeSeeds.filter((p) => p.status === 'published'));
}

/**
 * Fetch a single project by its URL slug (`slug`), including its `portfolio_images` and `project_videos` rows.
 */
export async function getProjectBySlug(
  slug: string,
  includeDrafts = false
): Promise<Project | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  if (!isSupabaseConfigured) {
    const activeSeeds = await getActiveSeedProjects();
    return (
      activeSeeds.find(
        (p) =>
          p.slug === cleanSlug && (includeDrafts || p.status === 'published')
      ) || null
    );
  }

  const [{ byId }, metaMap] = await Promise.all([
    buildCategoryMaps(),
    loadProjectMetaMap(),
  ]);

  let query = supabase.from('projects').select('*').eq('slug', cleanSlug);

  if (!includeDrafts) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    const { count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true });
    if (typeof count === 'number' && count > 0) {
      return null;
    }
    const activeSeeds = await getActiveSeedProjects();
    return (
      activeSeeds.find(
        (p) =>
          p.slug === cleanSlug && (includeDrafts || p.status === 'published')
      ) || null
    );
  }

  const projectId = String((data as Record<string, unknown>).id || '').trim();
  const [portfolioImages, projectVideos] = isValidUuid(projectId)
    ? await Promise.all([
        getProjectPortfolioImages(projectId),
        getProjectVideos(projectId),
      ])
    : [[], []];

  return normalizeProject(
    data as Record<string, unknown>,
    byId,
    portfolioImages,
    metaMap,
    projectVideos
  );
}

/**
 * Verify whether a project slug is already taken by another project in `public.projects`.
 * Never sends non-UUID `excludeProjectId` values to `.neq('id', ...)`.
 */
export async function isSlugTaken(
  slug: string,
  excludeProjectId?: string
): Promise<boolean> {
  const cleanSlug = slugify(slug);
  if (!cleanSlug || !isSupabaseConfigured) return false;

  let query = supabase.from('projects').select('id').eq('slug', cleanSlug);
  if (excludeProjectId && isValidUuid(excludeProjectId)) {
    query = query.neq('id', excludeProjectId.trim());
  }
  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return Boolean(data);
}

/**
 * Create a new project in `public.projects` and sync `public.portfolio_images`.
 * Lets PostgreSQL generate the UUID automatically and returns the created record.
 */
export async function createProject(
  formData: ProjectFormData
): Promise<Project> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const cleanSlug = slugify(formData.slug || formData.title);
  if (!formData.title.trim()) {
    throw new Error('Project Title is required.');
  }
  if (!cleanSlug) {
    throw new Error('A valid URL slug is required.');
  }

  const duplicate = await isSlugTaken(cleanSlug);
  if (duplicate) {
    throw new Error(
      `The slug "${cleanSlug}" is already in use. Please choose a unique slug.`
    );
  }

  const resolvedCatId = await resolveCategoryId(formData);
  const safeCategoryId = isValidUuid(resolvedCatId)
    ? resolvedCatId.trim()
    : null;
  const now = new Date().toISOString();

  const shortDesc = formData.short_description?.trim() || null;
  const fullDescription =
    formData.description.trim() || shortDesc || null;

  const videoUrl =
    (formData.video_url || formData.youtube_url || '').trim() || null;

  const clientVal =
    (formData.client_name || formData.client || '').trim() || null;

  const cleanGallery = formData.gallery.map((u) => u.trim()).filter(Boolean);
  const coverImage =
    formData.cover_image_url ||
    formData.cover_image ||
    cleanGallery[0] ||
    null;

  const isFeatured =
    typeof formData.is_featured === 'boolean'
      ? formData.is_featured
      : Boolean(formData.featured);

  const displayOrder =
    typeof formData.display_order === 'number'
      ? formData.display_order
      : typeof formData.sort_order === 'number'
      ? formData.sort_order
      : 1;

  const softwareTools = (formData.software_tools || [])
    .map((t) => t.trim())
    .filter(Boolean);

  const thumbnailMode: ProjectThumbnailMode =
    formData.thumbnail_mode === 'video_thumbnail'
      ? 'video_thumbnail'
      : 'cover_image';

  const fullPayload = {
    title: formData.title.trim(),
    slug: cleanSlug,
    short_description: shortDesc,
    description: fullDescription,
    category_id: safeCategoryId,
    client: clientVal,
    client_name: clientVal,
    year: Number(formData.year) || new Date().getFullYear(),
    project_date:
      formData.project_date?.trim() ||
      String(formData.year || new Date().getFullYear()),
    project_type: formData.project_type?.trim() || null,
    services: formData.services.map((s) => s.trim()).filter(Boolean),
    software_tools: softwareTools,
    cover_image: coverImage,
    cover_image_url: coverImage,
    thumbnail_mode: thumbnailMode,
    gallery: cleanGallery,
    behance_url: formData.behance_url.trim() || null,
    youtube_url: videoUrl,
    video_url: videoUrl,
    featured: isFeatured,
    is_featured: isFeatured,
    status: formData.status,
    display_order: displayOrder,
    sort_order: displayOrder,
    updated_at: now,
  };

  let { data, error } = await supabase
    .from('projects')
    .insert([fullPayload])
    .select('*')
    .single();

  if (
    error &&
    error.message &&
    (error.message.includes('column') ||
      error.message.includes('schema cache'))
  ) {
    // Try without thumbnail_mode first if only thumbnail_mode is missing
    const { thumbnail_mode: _omitted, ...payloadWithoutThumbMode } =
      fullPayload;
    const retryMid = await supabase
      .from('projects')
      .insert([payloadWithoutThumbMode])
      .select('*')
      .single();

    if (!retryMid.error) {
      data = retryMid.data;
      error = null;
    } else {
      const basicPayload = {
        title: formData.title.trim(),
        slug: cleanSlug,
        description: fullDescription,
        category_id: safeCategoryId,
        client: clientVal,
        year: Number(formData.year) || new Date().getFullYear(),
        services: formData.services.map((s) => s.trim()).filter(Boolean),
        cover_image: coverImage,
        gallery: cleanGallery,
        behance_url: formData.behance_url.trim() || null,
        youtube_url: videoUrl,
        featured: isFeatured,
        status: formData.status,
        updated_at: now,
      };
      const retry = await supabase
        .from('projects')
        .insert([basicPayload])
        .select('*')
        .single();
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    if (error.code === '23505') {
      throw new Error(`A project with slug "${cleanSlug}" already exists.`);
    }
    throw new Error(error.message);
  }

  const createdRow = data as Record<string, unknown>;
  const createdId = String(createdRow.id || '').trim();

  // Sync gallery records into public.portfolio_images and videos into public.project_videos using the newly generated UUID
  if (isValidUuid(createdId)) {
    await Promise.all([
      syncProjectPortfolioImages(
        createdId,
        cleanGallery,
        fullPayload.title,
        formData.gallery_items
      ),
      syncProjectVideos(createdId, formData.video_items),
    ]);
  }

  // Persist extended project metadata in site_settings so it survives even before DDL migration
  const metaMap = await loadProjectMetaMap();
  const metaEntry: ProjectExtendedMeta = {
    short_description: shortDesc,
    project_date: fullPayload.project_date,
    project_type: fullPayload.project_type,
    software_tools: softwareTools,
    display_order: displayOrder,
    video_url: videoUrl,
    client_name: clientVal,
    instagram_url: formData.instagram_url?.trim() || null,
    website_url: formData.website_url?.trim() || null,
    thumbnail_mode: thumbnailMode,
    gallery_items: formData.gallery_items,
    video_items: formData.video_items,
  };
  if (createdId) {
    metaMap[createdId] = metaEntry;
  }
  metaMap[cleanSlug] = metaEntry;
  await saveProjectMetaMap(metaMap);

  const { byId } = await buildCategoryMaps();
  const [portfolioImages, projectVideos] = isValidUuid(createdId)
    ? await Promise.all([
        getProjectPortfolioImages(createdId),
        getProjectVideos(createdId),
      ])
    : [[], []];

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return normalizeProject(
    createdRow,
    byId,
    portfolioImages,
    metaMap,
    projectVideos
  );
}

/**
 * Update an existing project in `public.projects` and sync `public.portfolio_images`.
 * - If `id` is a seed/demo identifier (e.g. "seed-1", "seed-2", "seed-3"), never sends `id`
 *   to a UUID column; instead migrates/upserts into `public.projects` with a real UUID.
 * - If `id` is a valid database UUID, updates the record via `.eq('id', id)`.
 */
export async function updateProject(
  id: string,
  formData: ProjectFormData
): Promise<Project> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const cleanId = (id || '').trim();

  // Handle seed/demo project IDs safely without ever querying `.eq('id', 'seed-...')`
  if (!isValidUuid(cleanId)) {
    const seedMatch = SEED_PROJECTS.find(
      (p) => p.id === cleanId || p.slug === cleanId
    );
    const activeSeeds = await getActiveSeedProjects();

    // Migrate the other active seed projects first so they remain in the database
    for (const seed of activeSeeds) {
      if (seed.id === cleanId || (seedMatch && seed.id === seedMatch.id)) {
        continue;
      }
      try {
        const taken = await isSlugTaken(seed.slug);
        if (!taken) {
          await createProject(seedToFormData(seed));
        }
      } catch {
        // Ignore if another seed project is already present
      }
    }

    // Check if the seed project being edited was already migrated to Supabase (by original slug or target slug)
    const candidateSlugs = Array.from(
      new Set(
        [seedMatch?.slug, slugify(formData.slug || formData.title)].filter(
          Boolean
        ) as string[]
      )
    );

    for (const slugCandidate of candidateSlugs) {
      const { data: existingRow } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slugCandidate)
        .maybeSingle();

      if (existingRow?.id && isValidUuid(String(existingRow.id))) {
        return updateProject(String(existingRow.id).trim(), formData);
      }
    }

    // Otherwise insert it into Supabase as a new real UUID record
    return createProject(formData);
  }

  const cleanSlug = slugify(formData.slug || formData.title);
  if (!formData.title.trim()) {
    throw new Error('Project Title is required.');
  }
  if (!cleanSlug) {
    throw new Error('A valid URL slug is required.');
  }

  const duplicate = await isSlugTaken(cleanSlug, cleanId);
  if (duplicate) {
    throw new Error(
      `The slug "${cleanSlug}" is already used by another project.`
    );
  }

  const resolvedCatId = await resolveCategoryId(formData);
  const safeCategoryId = isValidUuid(resolvedCatId)
    ? resolvedCatId.trim()
    : null;
  const now = new Date().toISOString();

  const shortDesc = formData.short_description?.trim() || null;
  const fullDescription =
    formData.description.trim() || shortDesc || null;

  const videoUrl =
    (formData.video_url || formData.youtube_url || '').trim() || null;

  const clientVal =
    (formData.client_name || formData.client || '').trim() || null;

  const cleanGallery = formData.gallery.map((u) => u.trim()).filter(Boolean);
  const coverImage =
    formData.cover_image_url ||
    formData.cover_image ||
    cleanGallery[0] ||
    null;

  const isFeatured =
    typeof formData.is_featured === 'boolean'
      ? formData.is_featured
      : Boolean(formData.featured);

  const displayOrder =
    typeof formData.display_order === 'number'
      ? formData.display_order
      : typeof formData.sort_order === 'number'
      ? formData.sort_order
      : 1;

  const softwareTools = (formData.software_tools || [])
    .map((t) => t.trim())
    .filter(Boolean);

  const thumbnailMode: ProjectThumbnailMode =
    formData.thumbnail_mode === 'video_thumbnail'
      ? 'video_thumbnail'
      : 'cover_image';

  const fullPayload = {
    title: formData.title.trim(),
    slug: cleanSlug,
    short_description: shortDesc,
    description: fullDescription,
    category_id: safeCategoryId,
    client: clientVal,
    client_name: clientVal,
    year: Number(formData.year) || new Date().getFullYear(),
    project_date:
      formData.project_date?.trim() ||
      String(formData.year || new Date().getFullYear()),
    project_type: formData.project_type?.trim() || null,
    services: formData.services.map((s) => s.trim()).filter(Boolean),
    software_tools: softwareTools,
    cover_image: coverImage,
    cover_image_url: coverImage,
    thumbnail_mode: thumbnailMode,
    gallery: cleanGallery,
    behance_url: formData.behance_url.trim() || null,
    youtube_url: videoUrl,
    video_url: videoUrl,
    featured: isFeatured,
    is_featured: isFeatured,
    status: formData.status,
    display_order: displayOrder,
    sort_order: displayOrder,
    updated_at: now,
  };

  let { data, error } = await supabase
    .from('projects')
    .update(fullPayload)
    .eq('id', cleanId)
    .select('*')
    .single();

  if (
    error &&
    error.message &&
    (error.message.includes('column') ||
      error.message.includes('schema cache'))
  ) {
    const { thumbnail_mode: _omitted, ...payloadWithoutThumbMode } =
      fullPayload;
    const retryMid = await supabase
      .from('projects')
      .update(payloadWithoutThumbMode)
      .eq('id', cleanId)
      .select('*')
      .single();

    if (!retryMid.error) {
      data = retryMid.data;
      error = null;
    } else {
      const basicPayload = {
        title: formData.title.trim(),
        slug: cleanSlug,
        description: fullDescription,
        category_id: safeCategoryId,
        client: clientVal,
        year: Number(formData.year) || new Date().getFullYear(),
        services: formData.services.map((s) => s.trim()).filter(Boolean),
        cover_image: coverImage,
        gallery: cleanGallery,
        behance_url: formData.behance_url.trim() || null,
        youtube_url: videoUrl,
        featured: isFeatured,
        status: formData.status,
        updated_at: now,
      };
      const retry = await supabase
        .from('projects')
        .update(basicPayload)
        .eq('id', cleanId)
        .select('*')
        .single();
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    if (error.code === '23505') {
      throw new Error(`A project with slug "${cleanSlug}" already exists.`);
    }
    throw new Error(error.message);
  }

  await Promise.all([
    syncProjectPortfolioImages(
      cleanId,
      cleanGallery,
      fullPayload.title,
      formData.gallery_items
    ),
    syncProjectVideos(cleanId, formData.video_items),
  ]);

  const metaMap = await loadProjectMetaMap();
  const metaEntry: ProjectExtendedMeta = {
    short_description: shortDesc,
    project_date: fullPayload.project_date,
    project_type: fullPayload.project_type,
    software_tools: softwareTools,
    display_order: displayOrder,
    video_url: videoUrl,
    client_name: clientVal,
    instagram_url: formData.instagram_url?.trim() || null,
    website_url: formData.website_url?.trim() || null,
    thumbnail_mode: thumbnailMode,
    gallery_items: formData.gallery_items,
    video_items: formData.video_items,
  };
  metaMap[cleanId] = metaEntry;
  metaMap[cleanSlug] = metaEntry;
  await saveProjectMetaMap(metaMap);

  const { byId } = await buildCategoryMaps();
  const [portfolioImages, projectVideos] = await Promise.all([
    getProjectPortfolioImages(cleanId),
    getProjectVideos(cleanId),
  ]);

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return normalizeProject(
    data as Record<string, unknown>,
    byId,
    portfolioImages,
    metaMap,
    projectVideos
  );
}

/**
 * Quick-toggle a project's status ('published' | 'draft'), featured flag, or display_order.
 */
export async function patchProjectFlags(
  id: string,
  patch: Partial<Pick<Project, 'status' | 'featured' | 'display_order'>>
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const cleanId = (id || '').trim();

  if (!isValidUuid(cleanId)) {
    await seedDefaultPortfolioProjects();
    const seed = SEED_PROJECTS.find(
      (p) => p.id === cleanId || p.slug === cleanId
    );
    if (seed) {
      const existing = await getProjectBySlug(seed.slug, true);
      if (existing && isValidUuid(existing.id)) {
        await patchProjectFlags(existing.id, patch);
      }
    }
    return;
  }

  const now = new Date().toISOString();
  const dbPatch: Record<string, unknown> = { updated_at: now };
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.featured !== undefined) {
    dbPatch.featured = patch.featured;
    dbPatch.is_featured = patch.featured;
  }
  if (typeof patch.display_order === 'number') {
    dbPatch.display_order = patch.display_order;
    dbPatch.sort_order = patch.display_order;
  }

  let { error } = await supabase
    .from('projects')
    .update(dbPatch)
    .eq('id', cleanId);

  if (
    error &&
    error.message &&
    (error.message.includes('column') ||
      error.message.includes('schema cache'))
  ) {
    const basicPatch: Record<string, unknown> = { updated_at: now };
    if (patch.status !== undefined) basicPatch.status = patch.status;
    if (patch.featured !== undefined) basicPatch.featured = patch.featured;
    const retry = await supabase
      .from('projects')
      .update(basicPatch)
      .eq('id', cleanId);
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  if (typeof patch.display_order === 'number') {
    const metaMap = await loadProjectMetaMap();
    metaMap[cleanId] = {
      ...(metaMap[cleanId] || {}),
      display_order: patch.display_order,
    };
    await saveProjectMetaMap(metaMap);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}

/**
 * Fetch a single project by its ID (`id`), including its `portfolio_images` rows.
 * - Strictly validates `isValidUuid(id)` before querying `.eq('id', id)`.
 * - If `id` is a seed ID ("seed-1", "seed-2", "seed-3"), checks if that project's slug
 *   already exists in `public.projects` (or migrates it if admin is authenticated) and returns
 *   the real database UUID record, falling back to the seed object without ever passing
 *   a seed ID to a UUID database column.
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const cleanId = (id || '').trim();
  if (!cleanId) return null;

  if (!isValidUuid(cleanId)) {
    const seedMatch = SEED_PROJECTS.find(
      (p) => p.id === cleanId || p.slug === cleanId
    );

    if (!isSupabaseConfigured) {
      return seedMatch || null;
    }

    const lookupSlug = seedMatch ? seedMatch.slug : slugify(cleanId);
    if (lookupSlug) {
      try {
        const existingInDb = await getProjectBySlug(lookupSlug, true);
        if (existingInDb && isValidUuid(existingInDb.id)) {
          return existingInDb;
        }
      } catch {
        // Fallback below
      }
    }

    // If an admin session is active and this is a valid seed project, migrate it to Supabase
    // so editing immediately operates on a real database UUID
    if (seedMatch) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await ensureSeedProjectsMigratedIfEmpty();
          const migrated = await getProjectBySlug(seedMatch.slug, true);
          if (migrated && isValidUuid(migrated.id)) {
            return migrated;
          }
          const created = await migrateSeedProjectToSupabase(seedMatch);
          if (created && isValidUuid(created.id)) {
            return created;
          }
        }
      } catch {
        // Return in-memory seed fallback if migration is not permitted
      }
      return seedMatch;
    }

    return null;
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  const [{ byId }, metaMap] = await Promise.all([
    buildCategoryMaps(),
    loadProjectMetaMap(),
  ]);

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', cleanId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [portfolioImages, projectVideos] = await Promise.all([
    getProjectPortfolioImages(cleanId),
    getProjectVideos(cleanId),
  ]);

  return normalizeProject(
    data as Record<string, unknown>,
    byId,
    portfolioImages,
    metaMap,
    projectVideos
  );
}

/**
 * Delete a project from `public.projects`, remove its `portfolio_images` rows,
 * and clean up associated files in the `portfolio-images` Storage bucket.
 * Never sends non-UUID seed IDs to `.eq('id', ...)`.
 */
export async function deleteProject(
  projectOrId: string | Project
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const rawId =
    typeof projectOrId === 'string' ? projectOrId : projectOrId.id;
  const cleanId = (rawId || '').trim();
  const projectSlug =
    typeof projectOrId === 'object' && projectOrId?.slug
      ? projectOrId.slug
      : undefined;

  if (!isValidUuid(cleanId)) {
    const seedMatch = SEED_PROJECTS.find(
      (p) =>
        p.id === cleanId ||
        p.slug === cleanId ||
        (projectSlug && p.slug === projectSlug)
    );

    await markSeedAsDeleted(cleanId);
    if (seedMatch) {
      await markSeedAsDeleted(seedMatch.id);
      await markSeedAsDeleted(seedMatch.slug);
    }

    // Migrate the remaining non-deleted seed projects into Supabase
    const remainingSeeds = await getActiveSeedProjects();
    for (const seed of remainingSeeds) {
      if (seed.id === cleanId || (seedMatch && seed.id === seedMatch.id)) {
        continue;
      }
      try {
        const taken = await isSlugTaken(seed.slug);
        if (!taken) {
          await createProject(seedToFormData(seed));
        }
      } catch {
        // Ignore
      }
    }

    // If a row with that slug was already in Supabase, delete it by its real UUID
    const targetSlug = seedMatch?.slug || projectSlug;
    if (targetSlug) {
      const { data: existingBySlug } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', targetSlug)
        .maybeSingle();

      if (existingBySlug?.id && isValidUuid(String(existingBySlug.id))) {
        await deleteProject(String(existingBySlug.id));
        return;
      }
    }

    window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
    return;
  }

  const { data: existing } = await supabase
    .from('projects')
    .select('cover_image, gallery, slug')
    .eq('id', cleanId)
    .maybeSingle();

  const existingSlug =
    existing && (existing as Record<string, unknown>).slug
      ? String((existing as Record<string, unknown>).slug)
      : projectSlug;

  if (existingSlug) {
    const matchingSeed = SEED_PROJECTS.find((p) => p.slug === existingSlug);
    if (matchingSeed) {
      await markSeedAsDeleted(matchingSeed.id);
      await markSeedAsDeleted(matchingSeed.slug);
    }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', cleanId);

  if (error) {
    throw new Error(error.message);
  }

  const metaMap = await loadProjectMetaMap();
  if (metaMap[cleanId]) delete metaMap[cleanId];
  if (existingSlug && metaMap[existingSlug]) {
    delete metaMap[existingSlug];
  }
  await saveProjectMetaMap(metaMap);

  if (existing) {
    const row = existing as Record<string, unknown>;
    const coverImage = row.cover_image ? String(row.cover_image) : null;
    const gallery = Array.isArray(row.gallery)
      ? row.gallery.map(String).filter(Boolean)
      : [];
    await deleteProjectStorageAssets(coverImage, gallery, cleanId);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}

/**
 * Seed default QBENCH categories and showcase projects into Supabase if not already present.
 */
export async function seedDefaultPortfolioProjects(): Promise<number> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  let insertedCount = 0;
  const activeSeeds = await getActiveSeedProjects();

  for (const seed of activeSeeds) {
    const exists = await isSlugTaken(seed.slug);
    if (exists) continue;

    await createProject(seedToFormData(seed));
    insertedCount++;
  }

  return insertedCount;
}
