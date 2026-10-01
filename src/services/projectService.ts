import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_WARNING,
  slugify,
} from '../lib/supabase';
import {
  deleteProjectStorageAssets,
  getProjectPortfolioImages,
  syncProjectPortfolioImages,
} from './mediaService';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
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
} from '../types/project';

export {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
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

export const SEED_PROJECTS: Project[] = [
  {
    id: 'seed-1',
    title: 'The Journey of a Ring',
    slug: 'the-journey-of-a-ring',
    short_description:
      'Cinematic luxury jewellery motion design exploring the craftsmanship, brilliance, and timeless elegance of a fine diamond ring.',
    description:
      'An evocative motion graphics showcase created to highlight the intricate artistry of fine diamond jewellery. Through macro lighting studies, fluid camera choreography, and bespoke sound design, this piece transforms product visualization into an emotional luxury narrative.',
    category_id: 'cat-motion-graphics',
    category: 'Motion Graphics',
    client: 'Luxury Jewellery Collective',
    year: 2026,
    services: ['Motion Graphics', '3D Visualization', 'Art Direction'],
    cover_image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&h=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
    ],
    behance_url:
      'https://www.behance.net/gallery/253620337/The-Journey-of-a-Ring-Luxury-Jewellery-Motion-Design?platform=direct',
    youtube_url: null,
    video_url: null,
    instagram_url: null,
    website_url: null,
    featured: true,
    status: 'published',
    sort_order: 1,
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
    category_id: 'cat-motion-graphics',
    category: 'Motion Graphics',
    client: 'QBENCH Studio Originals',
    year: 2026,
    services: ['Motion Graphics', 'Visual Storytelling', 'Sound Sync'],
    cover_image:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&h=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    ],
    behance_url: null,
    youtube_url: null,
    video_url: null,
    instagram_url: null,
    website_url: null,
    featured: true,
    status: 'published',
    sort_order: 2,
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
    category_id: 'cat-creative-campaigns',
    category: 'Creative Campaigns',
    client: 'Healthcare Awareness Initiative',
    year: 2026,
    services: ['Creative Campaigns', 'Social Media', 'Infographic Design'],
    cover_image:
      'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&h=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
    ],
    behance_url: null,
    youtube_url: null,
    video_url: null,
    instagram_url: null,
    website_url: null,
    featured: true,
    status: 'published',
    sort_order: 3,
    created_at: '2026-02-18T10:00:00.000Z',
    updated_at: '2026-02-18T10:00:00.000Z',
  },
];

// Exact columns in public.projects:
// id, title, slug, description, category_id, client, year, services, cover_image, gallery, behance_url, youtube_url, featured, status, created_at, updated_at
const PROJECT_SELECT_COLUMNS =
  'id, title, slug, description, category_id, client, year, services, cover_image, gallery, behance_url, youtube_url, featured, status, created_at, updated_at';

function normalizeProject(
  raw: Record<string, unknown>,
  categoriesById: Map<string, Category>,
  portfolioImages?: PortfolioImage[]
): Project {
  const categoryId = raw.category_id ? String(raw.category_id) : null;
  const matchedCat = categoryId ? categoriesById.get(categoryId) : undefined;
  const categoryName = matchedCat
    ? matchedCat.name
    : raw.category
    ? String(raw.category)
    : null;

  const description = raw.description ? String(raw.description) : null;
  const shortDescription = raw.short_description
    ? String(raw.short_description)
    : description
    ? description.split('\n')[0].slice(0, 220)
    : null;

  const rawGallery = Array.isArray(raw.gallery)
    ? raw.gallery.map(String).filter(Boolean)
    : [];

  // Merge gallery URLs from both projects.gallery and public.portfolio_images
  const extraImages = (portfolioImages || [])
    .map((img) => img.image_url)
    .filter(Boolean);
  const mergedGallery = Array.from(new Set([...rawGallery, ...extraImages]));

  const youtubeUrl = raw.youtube_url
    ? String(raw.youtube_url)
    : raw.video_url
    ? String(raw.video_url)
    : null;

  return {
    id: String(raw.id || ''),
    title: String(raw.title || ''),
    slug: String(raw.slug || ''),
    description,
    short_description: shortDescription,
    category_id: categoryId,
    category: categoryName,
    client: raw.client ? String(raw.client) : null,
    year:
      typeof raw.year === 'number'
        ? raw.year
        : raw.year
        ? Number(raw.year)
        : new Date().getFullYear(),
    services: Array.isArray(raw.services)
      ? raw.services.map(String).filter(Boolean)
      : typeof raw.services === 'string' && raw.services.trim()
      ? raw.services
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    cover_image: raw.cover_image
      ? String(raw.cover_image)
      : mergedGallery[0] || null,
    gallery: mergedGallery,
    behance_url: raw.behance_url ? String(raw.behance_url) : null,
    youtube_url: youtubeUrl,
    video_url: youtubeUrl,
    instagram_url: raw.instagram_url ? String(raw.instagram_url) : null,
    website_url: raw.website_url ? String(raw.website_url) : null,
    featured: Boolean(raw.featured),
    status: raw.status === 'published' ? 'published' : 'draft',
    sort_order: typeof raw.sort_order === 'number' ? raw.sort_order : 0,
    portfolio_images: portfolioImages,
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

  if (formData.category_id && byId.has(formData.category_id)) {
    return formData.category_id;
  }

  const cleanCat = (formData.category || '').trim();
  if (!cleanCat) return null;

  const found =
    byNameOrSlug.get(cleanCat.toLowerCase()) ||
    byNameOrSlug.get(slugify(cleanCat));

  if (found) {
    return found.id;
  }

  return null;
}

/**
 * Fetch all projects (for Admin CMS).
 */
export async function getAllProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    return SEED_PROJECTS;
  }

  const [{ byId }, { data, error }] = await Promise.all([
    buildCategoryMaps(),
    supabase
      .from('projects')
      .select(PROJECT_SELECT_COLUMNS)
      .order('created_at', { ascending: false }),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row) =>
    normalizeProject(row as Record<string, unknown>, byId)
  );
}

/**
 * Fetch published projects (for Public Portfolio).
 * If `includeDraftsForAdmin` is true and the user is an authenticated admin, returns all projects.
 */
export async function getPublishedProjects(
  includeDraftsForAdmin = false
): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    return SEED_PROJECTS.filter((p) => p.status === 'published');
  }

  const { byId } = await buildCategoryMaps();

  let query = supabase
    .from('projects')
    .select(PROJECT_SELECT_COLUMNS)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (!includeDraftsForAdmin) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row) =>
    normalizeProject(row as Record<string, unknown>, byId)
  );
}

/**
 * Fetch a single project by its ID (for /admin/projects/:id/edit).
 */
export async function getProjectById(id: string): Promise<Project | null> {
  if (!isSupabaseConfigured) {
    return SEED_PROJECTS.find((p) => p.id === id) || null;
  }

  const [{ byId }, { data, error }, portfolioImages] = await Promise.all([
    buildCategoryMaps(),
    supabase
      .from('projects')
      .select(PROJECT_SELECT_COLUMNS)
      .eq('id', id)
      .maybeSingle(),
    getProjectPortfolioImages(id),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return normalizeProject(
    data as Record<string, unknown>,
    byId,
    portfolioImages
  );
}

/**
 * Fetch a single project by slug (for /portfolio/:slug).
 * Also loads gallery records from `public.portfolio_images`.
 */
export async function getProjectBySlug(
  slug: string,
  includeDrafts = false
): Promise<Project | null> {
  if (!isSupabaseConfigured) {
    return (
      SEED_PROJECTS.find(
        (p) => p.slug === slug && (includeDrafts || p.status === 'published')
      ) || null
    );
  }

  const { byId } = await buildCategoryMaps();

  let query = supabase
    .from('projects')
    .select(PROJECT_SELECT_COLUMNS)
    .eq('slug', slug);

  if (!includeDrafts) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const projectId = String((data as Record<string, unknown>).id || '');
  const portfolioImages = projectId
    ? await getProjectPortfolioImages(projectId)
    : [];

  return normalizeProject(
    data as Record<string, unknown>,
    byId,
    portfolioImages
  );
}

/**
 * Verify whether a project slug is already taken by another project.
 */
export async function isSlugTaken(
  slug: string,
  excludeProjectId?: string
): Promise<boolean> {
  const cleanSlug = slugify(slug);
  if (!cleanSlug || !isSupabaseConfigured) return false;

  let query = supabase.from('projects').select('id').eq('slug', cleanSlug);
  if (excludeProjectId) {
    query = query.neq('id', excludeProjectId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return Boolean(data);
}

/**
 * Create a new project in `public.projects` and sync `public.portfolio_images`.
 */
export async function createProject(formData: ProjectFormData): Promise<Project> {
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

  const categoryId = await resolveCategoryId(formData);
  const now = new Date().toISOString();

  const fullDescription =
    formData.description.trim() ||
    formData.short_description?.trim() ||
    null;

  const youtubeUrl =
    (formData.youtube_url || formData.video_url || '').trim() || null;

  const cleanGallery = formData.gallery.map((u) => u.trim()).filter(Boolean);

  const payload = {
    title: formData.title.trim(),
    slug: cleanSlug,
    description: fullDescription,
    category_id: categoryId,
    client: formData.client.trim() || null,
    year: Number(formData.year) || new Date().getFullYear(),
    services: formData.services.map((s) => s.trim()).filter(Boolean),
    cover_image: formData.cover_image || cleanGallery[0] || null,
    gallery: cleanGallery,
    behance_url: formData.behance_url.trim() || null,
    youtube_url: youtubeUrl,
    featured: Boolean(formData.featured),
    status: formData.status,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert([payload])
    .select(PROJECT_SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`A project with slug "${cleanSlug}" already exists.`);
    }
    throw new Error(error.message);
  }

  const createdRow = data as Record<string, unknown>;
  const createdId = String(createdRow.id);

  // Sync gallery records into public.portfolio_images
  await syncProjectPortfolioImages(createdId, cleanGallery, payload.title);

  const { byId } = await buildCategoryMaps();
  const portfolioImages = await getProjectPortfolioImages(createdId);

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return normalizeProject(createdRow, byId, portfolioImages);
}

/**
 * Update an existing project in `public.projects` and sync `public.portfolio_images`.
 */
export async function updateProject(
  id: string,
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

  const duplicate = await isSlugTaken(cleanSlug, id);
  if (duplicate) {
    throw new Error(
      `The slug "${cleanSlug}" is already used by another project.`
    );
  }

  const categoryId = await resolveCategoryId(formData);
  const now = new Date().toISOString();

  const fullDescription =
    formData.description.trim() ||
    formData.short_description?.trim() ||
    null;

  const youtubeUrl =
    (formData.youtube_url || formData.video_url || '').trim() || null;

  const cleanGallery = formData.gallery.map((u) => u.trim()).filter(Boolean);

  const payload = {
    title: formData.title.trim(),
    slug: cleanSlug,
    description: fullDescription,
    category_id: categoryId,
    client: formData.client.trim() || null,
    year: Number(formData.year) || new Date().getFullYear(),
    services: formData.services.map((s) => s.trim()).filter(Boolean),
    cover_image: formData.cover_image || cleanGallery[0] || null,
    gallery: cleanGallery,
    behance_url: formData.behance_url.trim() || null,
    youtube_url: youtubeUrl,
    featured: Boolean(formData.featured),
    status: formData.status,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select(PROJECT_SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`A project with slug "${cleanSlug}" already exists.`);
    }
    throw new Error(error.message);
  }

  // Sync gallery records into public.portfolio_images
  await syncProjectPortfolioImages(id, cleanGallery, payload.title);

  const { byId } = await buildCategoryMaps();
  const portfolioImages = await getProjectPortfolioImages(id);

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return normalizeProject(data as Record<string, unknown>, byId, portfolioImages);
}

/**
 * Quick-toggle a project's status ('published' | 'draft') or featured flag.
 */
export async function patchProjectFlags(
  id: string,
  patch: Partial<Pick<Project, 'status' | 'featured'>>
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('projects')
    .update({ ...patch, updated_at: now })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}

/**
 * Delete a project and clean up its storage files and `public.portfolio_images` rows.
 */
export async function deleteProject(project: Project): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  await deleteProjectStorageAssets(
    project.cover_image,
    project.gallery,
    project.id
  );

  const { error } = await supabase.from('projects').delete().eq('id', project.id);
  if (error) {
    throw new Error(error.message);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}
