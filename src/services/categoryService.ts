import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_WARNING,
  slugify,
} from '../lib/supabase';
import type { Category } from '../types/project';

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

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) {
    return SEED_CATEGORIES;
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
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

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

  const { data, error } = await supabase
    .from('categories')
    .insert([payload])
    .select('id, name, slug, description, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`A category with slug "${slug}" already exists.`);
    }
    throw new Error(error.message);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return data as Category;
}

export async function updateCategory(
  id: string,
  input: { name: string; slug?: string; description?: string }
): Promise<Category> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

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

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select('id, name, slug, description, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`A category with slug "${slug}" already exists.`);
    }
    throw new Error(error.message);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  // Prevent deleting a category if any existing project references this category_id
  const { data: linkedProjects, error: checkError } = await supabase
    .from('projects')
    .select('id, title')
    .eq('category_id', id)
    .limit(5);

  if (checkError) {
    throw new Error(checkError.message);
  }

  if (linkedProjects && linkedProjects.length > 0) {
    const names = linkedProjects.map((p) => `"${p.title}"`).join(', ');
    throw new Error(
      `Cannot delete this category because it is assigned to ${linkedProjects.length} project(s) (${names}). Reassign those projects to another category before deleting.`
    );
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

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}
