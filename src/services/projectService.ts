import { supabase, isSupabaseConfigured, slugify } from '../lib/supabase';
import { deleteProjectStorageAssets } from './mediaService';
import type {
  Project,
  ProjectFormData,
  Category,
  SiteSettings,
  ProjectInquiry,
  ProjectInquiryInput,
  InquiryStatus,
} from '../types/project';

const LOCAL_PROJECTS_KEY = 'qbench_cms_projects_v1';
const LOCAL_CATEGORIES_KEY = 'qbench_cms_categories_v1';
const LOCAL_SETTINGS_KEY = 'qbench_cms_settings_v1';
const LOCAL_INQUIRIES_KEY = 'qbench_cms_inquiries_v1';

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-branding',
    name: 'Branding',
    slug: 'branding',
    description: 'Brand identity systems, logos, typography, and visual guidelines.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-motion-graphics',
    name: 'Motion Graphics',
    slug: 'motion-graphics',
    description: '2D/3D motion design, title sequences, and dynamic brand animations.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-social-media',
    name: 'Social Media',
    slug: 'social-media',
    description: 'High-converting social media creatives, grids, and campaign visuals.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-ui-ux',
    name: 'UI/UX',
    slug: 'ui-ux',
    description: 'User-centered web and mobile product interfaces and design systems.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-web-design',
    name: 'Web Design',
    slug: 'web-design',
    description: 'Responsive, high-performance websites and digital flagships.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-digital-marketing',
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    description: 'Performance campaigns, growth creatives, and conversion assets.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-ai-design',
    name: 'AI Design',
    slug: 'ai-design',
    description: 'Generative visual direction and AI-augmented creative production.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-video-editing',
    name: 'Video Editing',
    slug: 'video-editing',
    description: 'Commercial cuts, reels, product showcases, and brand storytelling.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-print-design',
    name: 'Print Design',
    slug: 'print-design',
    description: 'Editorial layouts, packaging, collateral, and physical brand touchpoints.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-creative-campaigns',
    name: 'Creative Campaigns',
    slug: 'creative-campaigns',
    description: 'Integrated multi-channel brand campaigns and visual storytelling.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'seed-1',
    title: 'The Journey of a Ring',
    slug: 'the-journey-of-a-ring',
    short_description:
      'Cinematic luxury jewellery motion design exploring the craftsmanship, brilliance, and timeless elegance of a fine diamond ring.',
    description:
      'An evocative motion graphics showcase created to highlight the intricate artistry of fine diamond jewellery. Through macro lighting studies, fluid camera choreography, and bespoke sound design, this piece transforms product visualization into an emotional luxury narrative.',
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
    video_url: null,
    behance_url:
      'https://www.behance.net/gallery/253620337/The-Journey-of-a-Ring-Luxury-Jewellery-Motion-Design?platform=direct',
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
    category: 'Motion Graphics',
    client: 'QBENCH Studio Originals',
    year: 2026,
    services: ['Motion Graphics', 'Visual Storytelling', 'Sound Sync'],
    cover_image:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&h=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    ],
    video_url: null,
    behance_url: null,
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
    category: 'Creative Campaigns',
    client: 'Healthcare Awareness Initiative',
    year: 2026,
    services: ['Creative Campaigns', 'Social Media', 'Infographic Design'],
    cover_image:
      'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&h=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
    ],
    video_url: null,
    behance_url: null,
    instagram_url: null,
    website_url: null,
    featured: true,
    status: 'published',
    sort_order: 3,
    created_at: '2026-02-18T10:00:00.000Z',
    updated_at: '2026-02-18T10:00:00.000Z',
  },
  {
    id: 'seed-4',
    title: 'Luxury Jewellery Campaign',
    slug: 'luxury-jewellery-campaign',
    short_description:
      'A collection of premium social media creatives designed to showcase fine jewellery through elegant visuals and consistent brand storytelling.',
    description:
      'Crafted a cohesive social media visual system for a fine jewellery brand, combining editorial photography direction, bespoke typography, and carousel storytelling to elevate digital engagement.',
    category: 'Social Media',
    client: 'Luxora Fine Jewels',
    year: 2026,
    services: ['Social Media', 'Branding', 'Art Direction'],
    cover_image:
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&h=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80',
    ],
    video_url: null,
    behance_url: null,
    instagram_url: null,
    website_url: null,
    featured: true,
    status: 'published',
    sort_order: 4,
    created_at: '2026-02-20T10:00:00.000Z',
    updated_at: '2026-02-20T10:00:00.000Z',
  },
  {
    id: 'seed-5',
    title: 'Product Launch Reel',
    slug: 'product-launch-reel',
    short_description:
      'Professional video editing for promotional content, product showcases, and digital storytelling.',
    description:
      'High-energy commercial video editing and color grading designed for multi-platform product launches across Instagram Reels, YouTube Shorts, and digital ad placements.',
    category: 'Video Editing',
    client: 'NextGen Consumer Tech',
    year: 2026,
    services: ['Video Editing', 'Color Grading', 'Sound Design'],
    cover_image:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&h=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
    ],
    video_url: null,
    behance_url: null,
    instagram_url: null,
    website_url: null,
    featured: false,
    status: 'published',
    sort_order: 5,
    created_at: '2026-02-22T10:00:00.000Z',
    updated_at: '2026-02-22T10:00:00.000Z',
  },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  agency_name: 'QBENCH',
  agency_description:
    'QBENCH is a creative & digital agency specializing in Strategy → Creativity → Execution across branding, social media design, motion graphics, video editing, UI/UX, and web development.',
  email: 'qbench.official@gmail.com',
  phone: '+91 73565 25932',
  whatsapp: '917356525932',
  instagram_url: 'https://www.instagram.com/qbench_official',
  linkedin_url: 'https://www.linkedin.com/company/qbench',
  behance_url:
    'https://www.behance.net/gallery/253620337/The-Journey-of-a-Ring-Luxury-Jewellery-Motion-Design',
  website_url: 'https://www.qbench.in',
};

const PROJECT_SELECT_COLUMNS =
  'id, title, slug, short_description, description, category, client, year, services, cover_image, gallery, video_url, behance_url, instagram_url, website_url, featured, status, sort_order, created_at, updated_at';

function normalizeProject(raw: Record<string, unknown>): Project {
  return {
    id: String(raw.id || ''),
    title: String(raw.title || ''),
    slug: String(raw.slug || ''),
    short_description: raw.short_description ? String(raw.short_description) : null,
    description: raw.description ? String(raw.description) : null,
    category: raw.category ? String(raw.category) : null,
    client: raw.client ? String(raw.client) : null,
    year:
      typeof raw.year === 'number'
        ? raw.year
        : raw.year
        ? Number(raw.year)
        : new Date().getFullYear(),
    services: Array.isArray(raw.services)
      ? raw.services.map(String)
      : typeof raw.services === 'string' && raw.services.trim()
      ? raw.services.split(',').map((s) => s.trim())
      : [],
    cover_image: raw.cover_image ? String(raw.cover_image) : null,
    gallery: Array.isArray(raw.gallery)
      ? raw.gallery.map(String).filter(Boolean)
      : [],
    video_url: raw.video_url ? String(raw.video_url) : null,
    behance_url: raw.behance_url ? String(raw.behance_url) : null,
    instagram_url: raw.instagram_url ? String(raw.instagram_url) : null,
    website_url: raw.website_url ? String(raw.website_url) : null,
    featured: Boolean(raw.featured),
    status: raw.status === 'published' ? 'published' : 'draft',
    sort_order: typeof raw.sort_order === 'number' ? raw.sort_order : 0,
    created_at: raw.created_at ? String(raw.created_at) : new Date().toISOString(),
    updated_at: raw.updated_at ? String(raw.updated_at) : new Date().toISOString(),
  };
}

function getLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(SEED_PROJECTS));
      return SEED_PROJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PROJECTS;
  }
}

function saveLocalProjects(projects: Project[]): void {
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  } catch {
    // Ignore
  }
}

function getLocalCategories(): Category[] {
  try {
    const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(SEED_CATEGORIES));
      return SEED_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_CATEGORIES;
  }
}

function saveLocalCategories(categories: Category[]): void {
  try {
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  } catch {
    // Ignore
  }
}

function getLocalInquiries(): ProjectInquiry[] {
  try {
    const raw = localStorage.getItem(LOCAL_INQUIRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInquiries(inquiries: ProjectInquiry[]): void {
  try {
    localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(inquiries));
    window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  } catch {
    // Ignore
  }
}

/**
 * Fetch all projects (for Admin CMS).
 */
export async function getAllProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    return getLocalProjects().sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT_COLUMNS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row) => normalizeProject(row as Record<string, unknown>));
}

/**
 * Fetch only published projects (for Public Portfolio).
 */
export async function getPublishedProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    return getLocalProjects()
      .filter((p) => p.status === 'published')
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT_COLUMNS)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const list = (data || []).map((row) =>
    normalizeProject(row as Record<string, unknown>)
  );
  return list.length > 0 ? list : SEED_PROJECTS.filter((p) => p.status === 'published');
}

/**
 * Fetch a single project by its ID (for /admin/projects/:id/edit).
 */
export async function getProjectById(id: string): Promise<Project | null> {
  if (!isSupabaseConfigured) {
    return getLocalProjects().find((p) => p.id === id) || null;
  }

  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeProject(data as Record<string, unknown>) : null;
}

/**
 * Fetch a single published project by slug (for /portfolio/:slug).
 */
export async function getProjectBySlug(
  slug: string,
  includeDrafts = false
): Promise<Project | null> {
  if (!isSupabaseConfigured) {
    const match = getLocalProjects().find(
      (p) => p.slug === slug && (includeDrafts || p.status === 'published')
    );
    return match || null;
  }

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

  if (data) {
    return normalizeProject(data as Record<string, unknown>);
  }

  const seedMatch = SEED_PROJECTS.find(
    (p) => p.slug === slug && (includeDrafts || p.status === 'published')
  );
  return seedMatch || null;
}

/**
 * Verify whether a project slug is already taken by another project.
 */
export async function isSlugTaken(
  slug: string,
  excludeProjectId?: string
): Promise<boolean> {
  const cleanSlug = slugify(slug);
  if (!cleanSlug) return false;

  if (!isSupabaseConfigured) {
    return getLocalProjects().some(
      (p) => p.slug === cleanSlug && p.id !== excludeProjectId
    );
  }

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
 * Create a new project in Supabase.
 */
export async function createProject(formData: ProjectFormData): Promise<Project> {
  const cleanSlug = slugify(formData.slug || formData.title);
  if (!formData.title.trim()) {
    throw new Error('Project Title is required.');
  }
  if (!cleanSlug) {
    throw new Error('A valid URL slug is required.');
  }
  if (!formData.category.trim()) {
    throw new Error('Project Category is required.');
  }

  const duplicate = await isSlugTaken(cleanSlug);
  if (duplicate) {
    throw new Error(
      `The slug "${cleanSlug}" is already in use. Please choose a unique slug.`
    );
  }

  const now = new Date().toISOString();
  const payload = {
    title: formData.title.trim(),
    slug: cleanSlug,
    short_description: formData.short_description.trim() || null,
    description: formData.description.trim() || null,
    category: formData.category.trim(),
    client: formData.client.trim() || null,
    year: Number(formData.year) || new Date().getFullYear(),
    services: formData.services.filter(Boolean),
    cover_image: formData.cover_image || null,
    gallery: formData.gallery.filter(Boolean),
    video_url: formData.video_url.trim() || null,
    behance_url: formData.behance_url.trim() || null,
    instagram_url: formData.instagram_url.trim() || null,
    website_url: formData.website_url.trim() || null,
    featured: Boolean(formData.featured),
    status: formData.status,
    sort_order: Number(formData.sort_order) || 0,
    updated_at: now,
  };

  if (!isSupabaseConfigured) {
    const newProject: Project = {
      id: `local-proj-${Date.now()}`,
      ...payload,
      created_at: now,
    };
    const existing = getLocalProjects();
    saveLocalProjects([newProject, ...existing]);
    return newProject;
  }

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

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return normalizeProject(data as Record<string, unknown>);
}

/**
 * Update an existing project in Supabase and automatically update `updated_at`.
 */
export async function updateProject(
  id: string,
  formData: ProjectFormData
): Promise<Project> {
  const cleanSlug = slugify(formData.slug || formData.title);
  if (!formData.title.trim()) {
    throw new Error('Project Title is required.');
  }
  if (!cleanSlug) {
    throw new Error('A valid URL slug is required.');
  }
  if (!formData.category.trim()) {
    throw new Error('Project Category is required.');
  }

  const duplicate = await isSlugTaken(cleanSlug, id);
  if (duplicate) {
    throw new Error(
      `The slug "${cleanSlug}" is already used by another project.`
    );
  }

  const now = new Date().toISOString();
  const payload = {
    title: formData.title.trim(),
    slug: cleanSlug,
    short_description: formData.short_description.trim() || null,
    description: formData.description.trim() || null,
    category: formData.category.trim(),
    client: formData.client.trim() || null,
    year: Number(formData.year) || new Date().getFullYear(),
    services: formData.services.filter(Boolean),
    cover_image: formData.cover_image || null,
    gallery: formData.gallery.filter(Boolean),
    video_url: formData.video_url.trim() || null,
    behance_url: formData.behance_url.trim() || null,
    instagram_url: formData.instagram_url.trim() || null,
    website_url: formData.website_url.trim() || null,
    featured: Boolean(formData.featured),
    status: formData.status,
    sort_order: Number(formData.sort_order) || 0,
    updated_at: now,
  };

  if (!isSupabaseConfigured) {
    const existing = getLocalProjects();
    let updatedItem: Project | null = null;
    const next = existing.map((p) => {
      if (p.id === id) {
        updatedItem = { ...p, ...payload };
        return updatedItem;
      }
      return p;
    });
    saveLocalProjects(next);
    if (!updatedItem) throw new Error('Project not found.');
    return updatedItem;
  }

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

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return normalizeProject(data as Record<string, unknown>);
}

/**
 * Quick-toggle a project's status ('published' | 'draft') or featured flag.
 */
export async function patchProjectFlags(
  id: string,
  patch: Partial<Pick<Project, 'status' | 'featured' | 'sort_order'>>
): Promise<void> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const existing = getLocalProjects();
    saveLocalProjects(
      existing.map((p) => (p.id === id ? { ...p, ...patch, updated_at: now } : p))
    );
    return;
  }

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
 * Delete a project and clean up its storage files.
 */
export async function deleteProject(project: Project): Promise<void> {
  await deleteProjectStorageAssets(project.cover_image, project.gallery);

  if (!isSupabaseConfigured) {
    const existing = getLocalProjects();
    saveLocalProjects(existing.filter((p) => p.id !== project.id));
    return;
  }

  const { error } = await supabase.from('projects').delete().eq('id', project.id);
  if (error) {
    throw new Error(error.message);
  }
  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}

// ============================================================================
// CATEGORIES SERVICE
// ============================================================================
export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) {
    return getLocalCategories();
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, created_at')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const list = (data || []) as Category[];
  return list.length > 0 ? list : SEED_CATEGORIES;
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
}): Promise<Category> {
  const name = input.name.trim();
  const slug = slugify(input.slug || name);
  if (!name || !slug) {
    throw new Error('Category name and slug are required.');
  }

  const payload = {
    name,
    slug,
    description: input.description?.trim() || null,
  };

  if (!isSupabaseConfigured) {
    const existing = getLocalCategories();
    if (existing.some((c) => c.slug === slug)) {
      throw new Error(`Category slug "${slug}" already exists.`);
    }
    const created: Category = {
      id: `local-cat-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
    };
    saveLocalCategories([...existing, created]);
    return created;
  }

  const { data, error } = await supabase
    .from('categories')
    .insert([payload])
    .select('id, name, slug, description, created_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return data as Category;
}

export async function updateCategory(
  id: string,
  input: { name: string; slug?: string; description?: string }
): Promise<Category> {
  const name = input.name.trim();
  const slug = slugify(input.slug || name);
  if (!name || !slug) {
    throw new Error('Category name and slug are required.');
  }

  const payload = {
    name,
    slug,
    description: input.description?.trim() || null,
  };

  if (!isSupabaseConfigured) {
    const existing = getLocalCategories();
    let updated: Category | null = null;
    const next = existing.map((c) => {
      if (c.id === id) {
        updated = { ...c, ...payload };
        return updated;
      }
      return c;
    });
    saveLocalCategories(next);
    if (!updated) throw new Error('Category not found.');
    return updated;
  }

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select('id, name, slug, description, created_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const existing = getLocalCategories();
    saveLocalCategories(existing.filter((c) => c.id !== id));
    return;
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}

// ============================================================================
// SITE SETTINGS SERVICE (`public.site_settings` with fallback to `public.settings`)
// ============================================================================
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) {
    try {
      const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
      return raw ? { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SITE_SETTINGS;
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  }

  let { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    const fallback = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    data = fallback.data;
  }

  if (!data) {
    return DEFAULT_SITE_SETTINGS;
  }

  return {
    id: data.id,
    agency_name: data.agency_name || DEFAULT_SITE_SETTINGS.agency_name,
    agency_description:
      data.agency_description || DEFAULT_SITE_SETTINGS.agency_description,
    email: data.email || DEFAULT_SITE_SETTINGS.email,
    phone: data.phone || DEFAULT_SITE_SETTINGS.phone,
    whatsapp: data.whatsapp || DEFAULT_SITE_SETTINGS.whatsapp,
    instagram_url: data.instagram_url || DEFAULT_SITE_SETTINGS.instagram_url,
    linkedin_url: data.linkedin_url || DEFAULT_SITE_SETTINGS.linkedin_url,
    behance_url: data.behance_url || DEFAULT_SITE_SETTINGS.behance_url,
    website_url: data.website_url || DEFAULT_SITE_SETTINGS.website_url,
    updated_at: data.updated_at,
  };
}

export async function saveSiteSettings(
  settings: SiteSettings
): Promise<SiteSettings> {
  const payload = {
    agency_name: settings.agency_name.trim() || 'QBENCH',
    agency_description: settings.agency_description.trim(),
    email: settings.email.trim(),
    phone: settings.phone.trim(),
    whatsapp: settings.whatsapp.trim(),
    instagram_url: settings.instagram_url.trim(),
    linkedin_url: settings.linkedin_url.trim(),
    behance_url: settings.behance_url.trim(),
    website_url: settings.website_url.trim(),
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(payload));

  if (!isSupabaseConfigured) {
    window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
    return payload;
  }

  // Try `site_settings` first, then fallback to `settings`
  let tableName: 'site_settings' | 'settings' = 'site_settings';
  let existing = await supabase
    .from(tableName)
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    tableName = 'settings';
    existing = await supabase
      .from(tableName)
      .select('id')
      .limit(1)
      .maybeSingle();
  }

  if (existing.data?.id) {
    const { data, error } = await supabase
      .from(tableName)
      .update(payload)
      .eq('id', existing.data.id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
    return data as SiteSettings;
  } else {
    const { data, error } = await supabase
      .from(tableName)
      .insert([payload])
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
    return data as SiteSettings;
  }
}

// ============================================================================
// PROJECT INQUIRIES SERVICE (`public.project_inquiries`)
// ============================================================================
export async function createProjectInquiry(
  input: ProjectInquiryInput
): Promise<ProjectInquiry> {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const service = input.service.trim();

  if (!name || !email || !phone || !service) {
    throw new Error('Name, Email, Phone, and Service are required.');
  }

  const now = new Date().toISOString();
  const payload = {
    name,
    company: input.company?.trim() || null,
    email,
    phone,
    service,
    budget: input.budget?.trim() || null,
    timeline: input.timeline?.trim() || null,
    project_description: input.project_description?.trim() || null,
    reference_url: input.reference_url?.trim() || null,
    message: input.message?.trim() || null,
    status: 'new' as InquiryStatus,
  };

  const localRecord: ProjectInquiry = {
    id: `local-inq-${Date.now()}`,
    ...payload,
    created_at: now,
  };

  // Always save a local copy so inquiries are never lost
  const existingLocal = getLocalInquiries();
  saveLocalInquiries([localRecord, ...existingLocal]);

  if (!isSupabaseConfigured) {
    return localRecord;
  }

  const { data, error } = await supabase
    .from('project_inquiries')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    console.warn('[QBENCH Inquiry Supabase Notice]:', error.message);
    return localRecord;
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return data as ProjectInquiry;
}

export async function getProjectInquiries(): Promise<ProjectInquiry[]> {
  if (!isSupabaseConfigured) {
    return getLocalInquiries();
  }

  const { data, error } = await supabase
    .from('project_inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return getLocalInquiries();
  }

  const remote = (data || []) as ProjectInquiry[];
  return remote.length > 0 ? remote : getLocalInquiries();
}

export async function updateProjectInquiryStatus(
  id: string,
  status: InquiryStatus
): Promise<void> {
  const existingLocal = getLocalInquiries();
  saveLocalInquiries(
    existingLocal.map((item) => (item.id === id ? { ...item, status } : item))
  );

  if (!isSupabaseConfigured || id.startsWith('local-inq-')) {
    return;
  }

  const { error } = await supabase
    .from('project_inquiries')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}

export async function deleteProjectInquiry(id: string): Promise<void> {
  const existingLocal = getLocalInquiries();
  saveLocalInquiries(existingLocal.filter((item) => item.id !== id));

  if (!isSupabaseConfigured || id.startsWith('local-inq-')) {
    return;
  }

  const { error } = await supabase
    .from('project_inquiries')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}
