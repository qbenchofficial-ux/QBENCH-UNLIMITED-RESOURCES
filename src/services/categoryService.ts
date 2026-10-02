import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_WARNING,
  slugify,
} from '../lib/supabase';
import type { Category, CategoryFormData } from '../types/project';

const CATEGORY_META_SETTING_KEY = 'cms_portfolio_categories_meta_v1';

interface CategoryExtendedMeta {
  cover_image_url?: string | null;
  display_order?: number;
  projects_display_limit?: number;
  show_view_all?: boolean;
  is_active?: boolean;
  updated_at?: string;
}

type CategoryMetaMap = Record<string, CategoryExtendedMeta>;

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'df50ce32-be74-4e0d-acea-f3a388f71690',
    name: 'Motion Graphics',
    slug: 'motion-graphics',
    description:
      '2D/3D motion design, luxury product animations, title sequences, and dynamic visual storytelling.',
    cover_image_url: null,
    display_order: 1,
    projects_display_limit: 4,
    show_view_all: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'd2a9aa87-11f7-4626-ab18-2e858a4bcf50',
    name: 'Branding & Identity',
    slug: 'branding',
    description:
      'Brand identity systems, logos, typography, and comprehensive visual guidelines.',
    cover_image_url: null,
    display_order: 2,
    projects_display_limit: 4,
    show_view_all: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '5c912245-2ae0-40c2-8781-aef99dab9a24',
    name: 'Social Media Design',
    slug: 'social-media',
    description:
      'High-converting social media creatives, grids, and multi-platform campaign visuals.',
    cover_image_url: null,
    display_order: 3,
    projects_display_limit: 4,
    show_view_all: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-video-editing',
    name: 'Video Editing',
    slug: 'video-editing',
    description:
      'Commercial cuts, reels, product showcases, and high-impact brand storytelling.',
    cover_image_url: null,
    display_order: 4,
    projects_display_limit: 4,
    show_view_all: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '32765bd7-0e36-4494-8d40-5ea771b3220b',
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    description:
      'User-centered web and mobile product interfaces, prototypes, and design systems.',
    cover_image_url: null,
    display_order: 5,
    projects_display_limit: 4,
    show_view_all: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '8376e650-d580-48d6-a37b-8876a696d4fd',
    name: 'AI Creative Designs',
    slug: 'ai-creative',
    description:
      'Generative visual direction, concept art, and AI-augmented creative production.',
    cover_image_url: null,
    display_order: 6,
    projects_display_limit: 4,
    show_view_all: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-web-development',
    name: 'Web Development',
    slug: 'web-development',
    description:
      'Responsive, high-performance websites, custom web apps, and digital flagships.',
    cover_image_url: null,
    display_order: 7,
    projects_display_limit: 4,
    show_view_all: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-print-design',
    name: 'Print Design',
    slug: 'print-design',
    description:
      'Editorial layouts, packaging, collateral, and physical brand touchpoints.',
    cover_image_url: null,
    display_order: 8,
    projects_display_limit: 4,
    show_view_all: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

const DEFAULT_DISPLAY_ORDER_BY_SLUG: Record<string, number> = {
  'motion-graphics': 1,
  branding: 2,
  'branding-identity': 2,
  'social-media': 3,
  'social-media-design': 3,
  'video-editing': 4,
  'ui-ux-design': 5,
  'ui-ux': 5,
  'ai-creative': 6,
  'ai-creative-designs': 6,
  'ai-design': 6,
  'web-development': 7,
  'web-design': 7,
  'print-design': 8,
  'creative-campaigns': 9,
};

async function loadCategoryMetaMap(): Promise<CategoryMetaMap> {
  let localMap: CategoryMetaMap = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(CATEGORY_META_SETTING_KEY);
      if (raw) {
        localMap = JSON.parse(raw) as CategoryMetaMap;
      }
    } catch {
      // ignore local storage errors
    }
  }

  if (!isSupabaseConfigured) {
    return localMap;
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', CATEGORY_META_SETTING_KEY)
      .maybeSingle();

    if (!error && data?.setting_value) {
      const parsed = JSON.parse(String(data.setting_value)) as CategoryMetaMap;
      return { ...localMap, ...parsed };
    }
  } catch {
    // ignore parse errors
  }

  return localMap;
}

async function saveCategoryMetaMap(metaMap: CategoryMetaMap): Promise<void> {
  const serialized = JSON.stringify(metaMap);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CATEGORY_META_SETTING_KEY, serialized);
    } catch {
      // ignore local storage errors
    }
  }

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('site_settings').upsert(
      [
        {
          setting_key: CATEGORY_META_SETTING_KEY,
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

function normalizeCategoryRow(
  row: Record<string, unknown>,
  metaMap: CategoryMetaMap,
  fallbackIndex: number
): Category {
  const id = String(row.id || '');
  const name = String(row.name || '');
  const slug = String(row.slug || slugify(name));
  const meta = metaMap[id] || metaMap[slug] || {};

  const defaultOrder =
    DEFAULT_DISPLAY_ORDER_BY_SLUG[slug] ?? fallbackIndex + 1;

  const displayOrder =
    typeof row.display_order === 'number'
      ? row.display_order
      : typeof meta.display_order === 'number'
      ? meta.display_order
      : defaultOrder;

  const displayLimit =
    typeof row.projects_display_limit === 'number' &&
    row.projects_display_limit > 0
      ? row.projects_display_limit
      : typeof meta.projects_display_limit === 'number' &&
        meta.projects_display_limit > 0
      ? meta.projects_display_limit
      : 4;

  const showViewAll =
    typeof row.show_view_all === 'boolean'
      ? row.show_view_all
      : typeof meta.show_view_all === 'boolean'
      ? meta.show_view_all
      : true;

  const isActive =
    typeof row.is_active === 'boolean'
      ? row.is_active
      : typeof meta.is_active === 'boolean'
      ? meta.is_active
      : true;

  const coverImageUrl =
    row.cover_image_url !== undefined && row.cover_image_url !== null
      ? String(row.cover_image_url)
      : meta.cover_image_url
      ? String(meta.cover_image_url)
      : null;

  return {
    id,
    name,
    slug,
    description: row.description ? String(row.description) : null,
    cover_image_url: coverImageUrl,
    display_order: displayOrder,
    projects_display_limit: displayLimit,
    show_view_all: showViewAll,
    is_active: isActive,
    created_at: row.created_at
      ? String(row.created_at)
      : new Date().toISOString(),
    updated_at: row.updated_at
      ? String(row.updated_at)
      : meta.updated_at || new Date().toISOString(),
  };
}

export function sortCategories(list: Category[]): Category[] {
  return [...list].sort((a, b) => {
    const orderDiff = (a.display_order ?? 999) - (b.display_order ?? 999);
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name);
  });
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) {
    return sortCategories(SEED_CATEGORIES);
  }

  const metaMap = await loadCategoryMetaMap();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as Record<string, unknown>[];
  if (rows.length === 0) {
    const seededWithMeta = SEED_CATEGORIES.map((cat, idx) =>
      normalizeCategoryRow(cat as unknown as Record<string, unknown>, metaMap, idx)
    );
    return sortCategories(seededWithMeta);
  }

  const normalized = rows.map((row, idx) =>
    normalizeCategoryRow(row, metaMap, idx)
  );
  return sortCategories(normalized);
}

export async function getActiveCategories(): Promise<Category[]> {
  const all = await getCategories();
  return all.filter((cat) => cat.is_active !== false);
}

export async function createCategory(
  input: CategoryFormData
): Promise<Category> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const name = input.name.trim();
  const slug = slugify(input.slug || name);
  if (!name || !slug) {
    throw new Error('Category name and slug are required.');
  }

  const existing = await getCategories();
  const nextOrder =
    typeof input.display_order === 'number'
      ? input.display_order
      : existing.length > 0
      ? Math.max(...existing.map((c) => c.display_order || 0)) + 1
      : 1;

  const limit =
    typeof input.projects_display_limit === 'number' &&
    input.projects_display_limit > 0
      ? Math.round(input.projects_display_limit)
      : 4;
  const showViewAll =
    typeof input.show_view_all === 'boolean' ? input.show_view_all : true;
  const isActive =
    typeof input.is_active === 'boolean' ? input.is_active : true;
  const coverImageUrl = input.cover_image_url?.trim() || null;
  const now = new Date().toISOString();

  const fullPayload = {
    name,
    slug,
    description: input.description?.trim() || null,
    cover_image_url: coverImageUrl,
    display_order: nextOrder,
    projects_display_limit: limit,
    show_view_all: showViewAll,
    is_active: isActive,
    updated_at: now,
  };

  let { data, error } = await supabase
    .from('categories')
    .insert([fullPayload])
    .select('*')
    .single();

  if (
    error &&
    error.message &&
    (error.message.includes('column') ||
      error.message.includes('schema cache'))
  ) {
    const basicPayload = {
      name,
      slug,
      description: input.description?.trim() || null,
    };
    const retry = await supabase
      .from('categories')
      .insert([basicPayload])
      .select('*')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    if (error.code === '23505') {
      throw new Error(`A category with slug "${slug}" already exists.`);
    }
    throw new Error(error.message);
  }

  const createdRow = data as Record<string, unknown>;
  const createdId = String(createdRow.id);

  // Persist extended category settings in site_settings so they survive even before DDL migration
  const metaMap = await loadCategoryMetaMap();
  const metaEntry: CategoryExtendedMeta = {
    cover_image_url: coverImageUrl,
    display_order: nextOrder,
    projects_display_limit: limit,
    show_view_all: showViewAll,
    is_active: isActive,
    updated_at: now,
  };
  metaMap[createdId] = metaEntry;
  metaMap[slug] = metaEntry;
  await saveCategoryMetaMap(metaMap);

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return normalizeCategoryRow(createdRow, metaMap, existing.length);
}

export async function updateCategory(
  id: string,
  input: CategoryFormData
): Promise<Category> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const name = input.name.trim();
  const slug = slugify(input.slug || name);
  if (!name || !slug) {
    throw new Error('Category name and slug are required.');
  }

  const existingList = await getCategories();
  const currentCat = existingList.find((c) => c.id === id || c.slug === slug);

  const displayOrder =
    typeof input.display_order === 'number'
      ? input.display_order
      : currentCat?.display_order ?? 1;

  const limit =
    typeof input.projects_display_limit === 'number' &&
    input.projects_display_limit > 0
      ? Math.round(input.projects_display_limit)
      : currentCat?.projects_display_limit ?? 4;

  const showViewAll =
    typeof input.show_view_all === 'boolean'
      ? input.show_view_all
      : currentCat?.show_view_all ?? true;

  const isActive =
    typeof input.is_active === 'boolean'
      ? input.is_active
      : currentCat?.is_active ?? true;

  const coverImageUrl =
    input.cover_image_url !== undefined
      ? input.cover_image_url?.trim() || null
      : currentCat?.cover_image_url ?? null;

  const now = new Date().toISOString();

  // If id is a non-UUID seed category, create it in Supabase first
  if (id.startsWith('cat-')) {
    return createCategory({
      name,
      slug,
      description: input.description,
      cover_image_url: coverImageUrl,
      display_order: displayOrder,
      projects_display_limit: limit,
      show_view_all: showViewAll,
      is_active: isActive,
    });
  }

  const fullPayload = {
    name,
    slug,
    description:
      input.description !== undefined
        ? input.description?.trim() || null
        : currentCat?.description ?? null,
    cover_image_url: coverImageUrl,
    display_order: displayOrder,
    projects_display_limit: limit,
    show_view_all: showViewAll,
    is_active: isActive,
    updated_at: now,
  };

  let { data, error } = await supabase
    .from('categories')
    .update(fullPayload)
    .eq('id', id)
    .select('*')
    .single();

  if (
    error &&
    error.message &&
    (error.message.includes('column') ||
      error.message.includes('schema cache'))
  ) {
    const basicPayload = {
      name,
      slug,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : currentCat?.description ?? null,
    };
    const retry = await supabase
      .from('categories')
      .update(basicPayload)
      .eq('id', id)
      .select('*')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    if (error.code === '23505') {
      throw new Error(`A category with slug "${slug}" already exists.`);
    }
    throw new Error(error.message);
  }

  const metaMap = await loadCategoryMetaMap();
  const metaEntry: CategoryExtendedMeta = {
    cover_image_url: coverImageUrl,
    display_order: displayOrder,
    projects_display_limit: limit,
    show_view_all: showViewAll,
    is_active: isActive,
    updated_at: now,
  };
  metaMap[id] = metaEntry;
  metaMap[slug] = metaEntry;
  await saveCategoryMetaMap(metaMap);

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return normalizeCategoryRow(data as Record<string, unknown>, metaMap, 0);
}

export async function deleteCategory(
  id: string,
  unassignLinkedProjects = true
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  if (!id.startsWith('cat-')) {
    if (unassignLinkedProjects) {
      await supabase
        .from('projects')
        .update({ category_id: null })
        .eq('category_id', id);
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'Cannot delete this category because one or more projects are linked to it. Please reassign those projects first.'
        );
      }
      throw new Error(error.message);
    }
  }

  const metaMap = await loadCategoryMetaMap();
  if (metaMap[id]) {
    delete metaMap[id];
    await saveCategoryMetaMap(metaMap);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}
