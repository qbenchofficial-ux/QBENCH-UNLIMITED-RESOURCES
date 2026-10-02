import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useProjects } from '../hooks/useProjects';
import { slugify } from '../lib/supabase';
import { NavSection } from '../types';
import type { Project, Category } from '../types/project';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Loader2,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

interface PortfolioViewProps {
  onNavigate: (section: NavSection) => void;
  onOpenProjectDetail?: (slug: string) => void;
  initialCategorySlug?: string | null;
  onSelectCategorySlug?: (categorySlug: string | null) => void;
}

const DEFAULT_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&h=500&q=80';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      mass: 0.8,
    },
  },
};

export interface CategoryPortfolioGroup {
  category: Category;
  allProjects: Project[];
  displayedProjects: Project[];
}

export function buildCategoryPortfolioGroups(
  categories: Category[],
  publishedProjects: Project[]
): CategoryPortfolioGroup[] {
  const activeCategories = [...categories]
    .filter((cat) => cat.is_active !== false)
    .sort((a, b) => {
      const orderDiff = (a.display_order ?? 999) - (b.display_order ?? 999);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });

  const assignedProjectIds = new Set<string>();
  const groups: CategoryPortfolioGroup[] = [];

  for (const cat of activeCategories) {
    const catSlug = cat.slug || slugify(cat.name);
    const matching = publishedProjects
      .filter((p) => {
        if (p.status !== 'published') return false;
        if (p.category_id && p.category_id === cat.id) return true;
        const pCatSlug = slugify(p.category || '');
        const pCatName = (p.category || '').toLowerCase();
        return pCatSlug === catSlug || pCatName === cat.name.toLowerCase();
      })
      .sort((a, b) => {
        const orderA = a.display_order ?? a.sort_order ?? 999;
        const orderB = b.display_order ?? b.sort_order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

    if (matching.length > 0) {
      matching.forEach((p) => assignedProjectIds.add(p.id));
      const limit = Math.max(1, cat.projects_display_limit || 4);
      groups.push({
        category: cat,
        allProjects: matching,
        displayedProjects: matching.slice(0, limit),
      });
    }
  }

  // Also group any published projects whose category is not yet in categories table
  const disabledCategorySlugs = new Set(
    categories
      .filter((c) => c.is_active === false)
      .map((c) => c.slug || slugify(c.name))
  );
  const disabledCategoryIds = new Set(
    categories.filter((c) => c.is_active === false).map((c) => c.id)
  );

  const unassignedBySlug = new Map<string, { name: string; items: Project[] }>();
  for (const p of publishedProjects) {
    if (p.status !== 'published' || assignedProjectIds.has(p.id)) continue;
    if (p.category_id && disabledCategoryIds.has(p.category_id)) continue;
    const rawCat = (p.category || 'Creative Work').trim();
    const cSlug = slugify(rawCat) || 'creative-work';
    if (disabledCategorySlugs.has(cSlug)) continue;

    const existing = unassignedBySlug.get(cSlug) || {
      name: rawCat,
      items: [],
    };
    existing.items.push(p);
    unassignedBySlug.set(cSlug, existing);
  }

  let fallbackOrder = activeCategories.length + 1;
  for (const [cSlug, entry] of unassignedBySlug.entries()) {
    const sortedItems = entry.items.sort(
      (a, b) =>
        (a.display_order ?? a.sort_order ?? 999) -
        (b.display_order ?? b.sort_order ?? 999)
    );
    groups.push({
      category: {
        id: `dynamic-${cSlug}`,
        name: entry.name,
        slug: cSlug,
        description: null,
        cover_image_url: null,
        display_order: fallbackOrder++,
        projects_display_limit: 4,
        show_view_all: true,
        is_active: true,
      },
      allProjects: sortedItems,
      displayedProjects: sortedItems.slice(0, 4),
    });
  }

  return groups;
}

export default function PortfolioView({
  onNavigate,
  onOpenProjectDetail,
  initialCategorySlug = null,
  onSelectCategorySlug,
}: PortfolioViewProps) {
  const { projects, categories, loading, settings } = useProjects('public');
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(
    initialCategorySlug
  );

  useEffect(() => {
    setActiveCategorySlug(initialCategorySlug || null);
  }, [initialCategorySlug]);

  const categoryGroups = useMemo(
    () => buildCategoryPortfolioGroups(categories, projects),
    [categories, projects]
  );

  const selectedGroup = useMemo(() => {
    if (!activeCategorySlug || activeCategorySlug === 'all') return null;
    return (
      categoryGroups.find(
        (g) =>
          g.category.slug === activeCategorySlug ||
          slugify(g.category.name) === activeCategorySlug
      ) || null
    );
  }, [categoryGroups, activeCategorySlug]);

  const handleSelectCategory = (slug: string | null) => {
    const normalized = !slug || slug === 'all' ? null : slug;
    setActiveCategorySlug(normalized);
    if (onSelectCategorySlug) {
      onSelectCategorySlug(normalized);
    } else if (typeof window !== 'undefined') {
      const targetPath = normalized
        ? `/portfolio/category/${normalized}`
        : '/portfolio';
      window.history.pushState({}, '', targetPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenDetail = (slug: string) => {
    if (onOpenProjectDetail) {
      onOpenProjectDetail(slug);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/portfolio/${slug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const whatsappDigits = (settings.whatsapp || '917356525932').replace(
    /[^0-9]/g,
    ''
  );

  const renderProjectCard = (project: Project, idx: number) => {
    const imageUrl =
      project.cover_image_url ||
      project.cover_image ||
      project.gallery?.[0] ||
      DEFAULT_FALLBACK_COVER;
    const categoryLabel = project.category || 'Creative Work';
    const dateLabel =
      project.project_date || String(project.year || new Date().getFullYear());
    const summary = project.short_description || project.description || '';
    const externalUrl =
      project.behance_url || project.website_url || project.instagram_url;
    const refCode = `#QBP-2026-${String(idx + 1).padStart(3, '0')}`;
    const imageCount = Math.max(
      project.portfolio_images?.length || 0,
      project.gallery?.length || 0,
      1
    );

    return (
      <motion.div
        id={`portfolio-card-${project.id}`}
        key={project.id}
        variants={itemVariants}
        whileHover={{
          y: -6,
          transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
        }}
        className="group flex flex-col justify-between space-y-4 bg-white border border-brand-outline/25 hover:border-brand-outline rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="space-y-4">
          {/* Image panel with zoom scale on hover */}
          <div
            onClick={() => handleOpenDetail(project.slug)}
            className="aspect-[16/10] w-full rounded-xl overflow-hidden relative border border-brand-outline/10 bg-brand-surface-low cursor-pointer"
          >
            <img
              src={imageUrl}
              alt={project.title}
              loading="lazy"
              className="w-full h-full object-cover grayscale brightness-95 contrast-102 group-hover:grayscale-0 group-hover:scale-103 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            {imageCount > 1 && (
              <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-black/70 backdrop-blur-xs px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                <ImageIcon className="h-3 w-3" />
                <span>{imageCount} Frames</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 gap-2">
            <span className="font-tech text-[10px] tracking-wider text-brand-primary font-bold uppercase bg-brand-accent-light/50 border border-brand-accent/20 px-2.5 py-0.5 rounded-full truncate">
              {project.project_type || categoryLabel}
            </span>
            <span className="font-tech text-[10px] text-brand-text-muted font-bold shrink-0">
              {dateLabel}
            </span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleOpenDetail(project.slug)}
              className="text-left block font-display text-2xl font-black text-brand-text group-hover:text-brand-primary transition-colors duration-200 cursor-pointer"
            >
              {project.title}
            </button>
            <p className="font-sans text-xs sm:text-sm text-brand-text-variant leading-relaxed line-clamp-3">
              {summary}
            </p>
          </div>

          {project.software_tools && project.software_tools.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.software_tools.slice(0, 4).map((tool) => (
                <span
                  key={tool}
                  className="rounded-md bg-brand-surface-low border border-brand-outline/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-text-muted"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Read study CTA */}
        <div className="pt-4 border-t border-brand-outline/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id={`read-study-btn-${project.id}`}
              type="button"
              onClick={() => handleOpenDetail(project.slug)}
              className="font-display text-xs font-bold text-brand-primary hover:text-brand-primary-light flex items-center justify-center sm:justify-start gap-1 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-brand-primary/5 transition-colors shrink-0"
            >
              <span>View Case Study</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>

            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-xs font-bold text-brand-text-muted hover:text-brand-primary flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-brand-primary/5 transition-colors"
              >
                <span>{project.behance_url ? 'Behance' : 'Live Link'}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <a
            id={`whatsapp-portfolio-btn-${project.id}`}
            href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
              `Hello Q BENCH Team,\n\nI am interested in discussing a project similar to your portfolio project: ${project.title} (${categoryLabel}).\n\nReference ID: ${refCode}\nPage URL: ${
                typeof window !== 'undefined'
                  ? `${window.location.origin}/portfolio/${project.slug}`
                  : ''
              }\n\nPlease share more details about how we can get started.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer shrink-0"
          >
            <MessageSquare className="h-3.5 w-3.5 fill-current" />
            <span>Inquire on WhatsApp</span>
          </a>
        </div>
      </motion.div>
    );
  };

  return (
    <div
      id="portfolio-view"
      className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16 space-y-16"
    >
      {selectedGroup && (
        <Helmet>
          <title>{`${selectedGroup.category.name} Portfolio — QBENCH Creative Agency`}</title>
          <meta
            name="description"
            content={
              selectedGroup.category.description ||
              `Explore all ${selectedGroup.allProjects.length} published ${selectedGroup.category.name} projects by QBENCH.`
            }
          />
        </Helmet>
      )}

      {/* Title + Category Filter Bar */}
      <div
        id="portfolio-headline-segment"
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-4 border-b border-brand-outline/20"
      >
        <div className="space-y-4 max-w-2xl">
          {selectedGroup ? (
            <button
              type="button"
              onClick={() => handleSelectCategory(null)}
              className="inline-flex items-center gap-2 font-display text-xs font-bold text-brand-primary hover:text-brand-primary-light transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All Portfolio Categories</span>
            </button>
          ) : (
            <span className="font-tech text-xs tracking-widest text-brand-primary font-bold uppercase">
              PORTFOLIO & CASE STUDIES
            </span>
          )}

          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-text">
            {selectedGroup ? (
              <>
                {selectedGroup.category.name}{' '}
                <span className="text-brand-primary">Projects</span>
              </>
            ) : (
              <>
                Selected <span className="text-brand-primary">Projects</span>
              </>
            )}
          </h1>

          <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
            {selectedGroup?.category.description ||
              'A curated showcase of motion graphics, branding & identity, social media design, UI/UX, and AI-powered creative work crafted with purpose.'}
          </p>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div
          id="portfolio-filters"
          className="flex flex-wrap gap-2 pt-2 lg:pt-0"
        >
          <button
            id="filter-chip-all"
            type="button"
            onClick={() => handleSelectCategory(null)}
            className={`px-4 py-2 font-display text-xs font-bold rounded-lg tracking-wide border transition-all duration-300 cursor-pointer ${
              !activeCategorySlug || activeCategorySlug === 'all'
                ? 'bg-brand-primary text-white border-brand-primary shadow-sm scale-102'
                : 'bg-white border-brand-outline/30 text-brand-text-muted hover:text-brand-text hover:border-brand-outline/65'
            }`}
          >
            All Categories
          </button>

          {categoryGroups.map((group) => {
            const isActive = activeCategorySlug === group.category.slug;
            return (
              <button
                id={`filter-chip-${group.category.slug}`}
                key={group.category.id}
                type="button"
                onClick={() => handleSelectCategory(group.category.slug)}
                className={`px-4 py-2 font-display text-xs font-bold rounded-lg tracking-wide border transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-brand-primary text-white border-brand-primary shadow-sm scale-102'
                    : 'bg-white border-brand-outline/30 text-brand-text-muted hover:text-brand-text hover:border-brand-outline/65'
                }`}
              >
                <span>{group.category.name}</span>
                <span
                  className={`ml-1.5 font-mono text-[10px] ${
                    isActive ? 'text-white/80' : 'text-brand-text-muted'
                  }`}
                >
                  ({group.allProjects.length})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
          <p className="font-display text-xs font-bold text-brand-text-muted">
            Loading portfolio projects...
          </p>
        </div>
      ) : selectedGroup ? (
        /* Category-Specific "View All" Portfolio Listing Page (Displays ALL published projects in this category) */
        <section
          id={`category-listing-${selectedGroup.category.slug}`}
          className="space-y-10"
        >
          {selectedGroup.category.cover_image_url && (
            <div className="relative h-48 sm:h-64 w-full rounded-3xl overflow-hidden border border-brand-outline/20 bg-brand-surface-low">
              <img
                src={selectedGroup.category.cover_image_url}
                alt={selectedGroup.category.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6 sm:p-8">
                <div className="text-white space-y-1">
                  <span className="font-tech text-[10px] tracking-widest uppercase text-[#88f8c5] font-extrabold">
                    FULL CATEGORY ARCHIVE
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-black">
                    {selectedGroup.category.name} ({selectedGroup.allProjects.length})
                  </h2>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-tech text-xs font-bold uppercase tracking-wider text-brand-primary">
              Showing all {selectedGroup.allProjects.length} published{' '}
              {selectedGroup.category.name} project
              {selectedGroup.allProjects.length === 1 ? '' : 's'}
            </span>
          </div>

          <motion.div
            key={`cat-full-${selectedGroup.category.slug}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10"
          >
            {selectedGroup.allProjects.map((project, idx) =>
              renderProjectCard(project, idx)
            )}
          </motion.div>
        </section>
      ) : categoryGroups.length > 0 ? (
        /* Multi-Category Portfolio Sections (Each category displays up to its projects_display_limit) */
        <div className="space-y-20">
          {categoryGroups.map((group) => {
            const { category, allProjects, displayedProjects } = group;
            const showViewAllBtn = category.show_view_all !== false;

            return (
              <section
                id={`portfolio-category-section-${category.slug}`}
                key={category.id}
                className="space-y-8"
              >
                {/* Category Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-brand-outline/20 pb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 font-tech text-[11px] tracking-widest text-brand-primary font-extrabold uppercase bg-brand-primary/10 px-3 py-1 rounded-full">
                        <Layers className="h-3 w-3" />
                        <span>{category.name.toUpperCase()}</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-brand-text-muted">
                        {displayedProjects.length} of {allProjects.length}{' '}
                        {allProjects.length === 1 ? 'Project' : 'Projects'}
                      </span>
                    </div>

                    <h2 className="font-display text-2xl sm:text-3xl font-black text-brand-text tracking-tight">
                      {category.name}
                    </h2>

                    {category.description && (
                      <p className="font-sans text-xs sm:text-sm text-brand-text-muted max-w-2xl leading-relaxed">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {showViewAllBtn && (
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(category.slug)}
                      className="inline-flex items-center gap-1.5 font-display text-xs font-bold text-brand-primary hover:text-brand-primary-light py-2 px-3.5 rounded-xl border border-brand-outline/30 hover:border-brand-primary/40 bg-white hover:bg-brand-primary/5 transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <span>View All {category.name} Projects</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Projects Grid (Strictly respects category.projects_display_limit) */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10"
                >
                  {displayedProjects.map((project, idx) =>
                    renderProjectCard(project, idx)
                  )}
                </motion.div>

                {/* Bottom View All <Category> Projects CTA Button */}
                {showViewAllBtn && (
                  <div className="pt-2 flex justify-center sm:justify-start">
                    <button
                      id={`view-all-${category.slug}-btn`}
                      type="button"
                      onClick={() => handleSelectCategory(category.slug)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-primary hover:bg-brand-primary-light text-white font-display text-xs font-bold px-6 py-3 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      <span>
                        View All {category.name} Projects ({allProjects.length})
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div
          id="portfolio-empty"
          className="text-center py-20 bg-brand-surface-low rounded-2xl border border-brand-outline/10 space-y-3"
        >
          <p className="font-display text-base font-bold text-brand-text">
            No published portfolio projects yet
          </p>
          <p className="font-sans text-xs text-brand-text-muted max-w-md mx-auto">
            Publish projects in the QBENCH Admin Panel under Portfolio Projects to display them here.
          </p>
        </div>
      )}

      {/* Bottom Lead CTA Banner */}
      <div
        id="portfolio-bottom-cta"
        className="rounded-3xl p-8 lg:p-12 bg-brand-surface-low border border-brand-outline/30 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left shadow-xs"
      >
        <div className="space-y-2 max-w-xl">
          <span className="font-tech text-xs tracking-widest text-brand-primary font-bold uppercase">
            READY FOR IMPACT?
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-text">
            Want to build something remarkable together?
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-text-muted">
            Every great transformation starts with a clear vision. Let’s discuss your next project.
          </p>
        </div>
        <button
          id="portfolio-cta-button"
          onClick={() => onNavigate('contact')}
          className="px-7 py-4 bg-brand-primary hover:bg-brand-primary-light text-white font-display font-bold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap text-xs sm:text-sm"
        >
          Start Your Project Now
        </button>
      </div>
    </div>
  );
}
