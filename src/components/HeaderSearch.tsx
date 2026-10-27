import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Briefcase,
  Layers,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ChevronRight,
  FileText,
  CornerDownLeft
} from 'lucide-react';
import { NavSection, ServiceTab } from '../types';
import { useProjects } from '../hooks/useProjects';
import { Project } from '../types/project';
import { ZOHO_CATALOG_ITEMS } from '../data/zohoCatalog';

interface HeaderSearchProps {
  onNavigate: (section: NavSection, serviceTab?: ServiceTab) => void;
  onOpenProjectDetail?: (slug: string) => void;
  className?: string;
  isMobileDrawer?: boolean;
}

interface CoreServiceItem {
  id: ServiceTab;
  title: string;
  category: string;
  desc: string;
  keywords: string[];
}

const CORE_SERVICES: CoreServiceItem[] = [
  {
    id: 'branding',
    title: 'Branding & Visual Identity',
    category: 'Brand Strategy',
    desc: 'Logo design, brand color palette, typography guidelines, and complete corporate identity systems.',
    keywords: ['logo', 'identity', 'brand', 'typography', 'palette', 'guidelines', 'stationery'],
  },
  {
    id: 'social-media',
    title: 'Social Media Design & Growth',
    category: 'Digital Presence',
    desc: 'Static post designs, story carousels, custom templates, and monthly digital content calendars.',
    keywords: ['instagram', 'social', 'posts', 'carousel', 'feed', 'stories', 'templates', 'grid'],
  },
  {
    id: 'video-editing',
    title: 'Video Editing & Post-Production',
    category: 'Media Production',
    desc: 'Cinematic short films, motion graphics, sound design, transitions, and high-retention ad creatives.',
    keywords: ['video', 'reels', 'shorts', 'youtube', 'cinematic', 'editing', 'ad creative', 'sound'],
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing & Performance SEO',
    category: 'Marketing Engine',
    desc: 'Ad campaign setup, SEO optimization, lead generation strategy, and monthly performance tracking.',
    keywords: ['marketing', 'seo', 'ads', 'google ads', 'meta ads', 'leads', 'growth', 'traffic'],
  },
  {
    id: 'uiux',
    title: 'UI/UX & Interactive Design',
    category: 'Product Design',
    desc: 'Wireframing, interactive prototyping, Figma design systems, and seamless developer handoff.',
    keywords: ['ui', 'ux', 'figma', 'prototype', 'wireframe', 'mobile app', 'interface', 'web design'],
  },
  {
    id: 'webdev',
    title: 'Web & Full-Stack Development',
    category: 'Engineering',
    desc: 'High-performance responsive websites, CMS integrations, custom web apps, and SEO architecture.',
    keywords: ['web', 'development', 'code', 'react', 'nextjs', 'fullstack', 'website', 'frontend'],
  },
  {
    id: 'motion',
    title: 'Motion Graphics & Visuals',
    category: 'Visual Effects',
    desc: 'Liquid animations, 2D/3D kinetic titles, stage LED loops, and explainer video production.',
    keywords: ['motion', 'animation', 'kinetic', 'vfx', 'stage visuals', 'explainer', 'titles'],
  },
  {
    id: 'growth',
    title: 'Digital Growth Strategy',
    category: 'Revenue & Scale',
    desc: 'Growth audits, competitor teardowns, performance funnels, and conversion rate optimization.',
    keywords: ['funnel', 'audit', 'conversion', 'scaling', 'competitor analysis', 'growth'],
  },
  {
    id: 'business-support',
    title: 'Studio Support & Content Operations',
    category: 'Creative Operations',
    desc: 'Pitch decks, presentation design, copywriting, print production specs, and digital asset management.',
    keywords: ['presentation', 'pitch deck', 'copywriting', 'support', 'deck', 'print', 'operations'],
  },
];

type SearchResultItem =
  | { type: 'service'; data: CoreServiceItem }
  | { type: 'project'; data: Project }
  | { type: 'package'; data: typeof ZOHO_CATALOG_ITEMS[number] };

export default function HeaderSearch({
  onNavigate,
  onOpenProjectDetail,
  className = '',
  isMobileDrawer = false,
}: HeaderSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { projects } = useProjects('public');

  // Filter results
  const cleanQuery = query.trim().toLowerCase();

  const matchedServices = useMemo(() => {
    if (!cleanQuery) return CORE_SERVICES.slice(0, 3);
    return CORE_SERVICES.filter((service) => {
      return (
        service.title.toLowerCase().includes(cleanQuery) ||
        service.desc.toLowerCase().includes(cleanQuery) ||
        service.category.toLowerCase().includes(cleanQuery) ||
        service.keywords.some((k) => k.includes(cleanQuery))
      );
    });
  }, [cleanQuery]);

  const matchedProjects = useMemo(() => {
    if (!cleanQuery) {
      // Suggest featured projects
      return projects.filter((p) => p.is_featured || p.featured).slice(0, 3);
    }
    return projects.filter((project) => {
      const titleMatch = project.title.toLowerCase().includes(cleanQuery);
      const clientMatch = (project.client || project.client_name || '').toLowerCase().includes(cleanQuery);
      const descMatch = (project.description || project.short_description || '').toLowerCase().includes(cleanQuery);
      const catMatch = (project.category || '').toLowerCase().includes(cleanQuery);
      const servMatch = (project.services || []).some((s) => s.toLowerCase().includes(cleanQuery));
      return titleMatch || clientMatch || descMatch || catMatch || servMatch;
    }).slice(0, 5);
  }, [cleanQuery, projects]);

  const matchedPackages = useMemo(() => {
    if (!cleanQuery) return [];
    return ZOHO_CATALOG_ITEMS.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(cleanQuery);
      const descMatch = (item.description || '').toLowerCase().includes(cleanQuery);
      const catMatch = (item.categoryLabel || '').toLowerCase().includes(cleanQuery);
      const delivMatch = (item.deliverables || []).some((d) => d.toLowerCase().includes(cleanQuery));
      return nameMatch || descMatch || catMatch || delivMatch;
    }).slice(0, 4);
  }, [cleanQuery]);

  // Combined flat list for keyboard navigation
  const allItems: SearchResultItem[] = useMemo(() => {
    const list: SearchResultItem[] = [];
    matchedServices.forEach((s) => list.push({ type: 'service', data: s }));
    matchedProjects.forEach((p) => list.push({ type: 'project', data: p }));
    matchedPackages.forEach((pkg) => list.push({ type: 'package', data: pkg }));
    return list;
  }, [matchedServices, matchedProjects, matchedPackages]);

  const totalResults = allItems.length;

  // Global keyboard shortcut (⌘K or Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [cleanQuery]);

  const handleSelectItem = (item: SearchResultItem) => {
    if (item.type === 'service') {
      onNavigate('services', item.data.id);
    } else if (item.type === 'project') {
      if (onOpenProjectDetail) {
        onOpenProjectDetail(item.data.slug);
      } else {
        onNavigate('portfolio');
      }
    } else if (item.type === 'package') {
      onNavigate('packages');
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalResults));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalResults) % Math.max(1, totalResults));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        handleSelectItem(allItems[selectedIndex]);
      }
    }
  };

  return (
    <div
      ref={searchContainerRef}
      id="header-search-wrapper"
      className={`relative ${className}`}
    >
      {/* Search Input Box */}
      <div
        id="header-search-input-box"
        className={`flex items-center gap-2 rounded-xl border bg-brand-surface-low/80 px-3 py-1.5 transition-all duration-200 ${
          isOpen
            ? 'border-brand-primary ring-2 ring-brand-primary/10 bg-white'
            : 'border-brand-outline/25 hover:border-brand-outline/50 hover:bg-white'
        } ${isMobileDrawer ? 'w-full py-2.5' : 'w-44 md:w-56 lg:w-64'}`}
      >
        <Search className="h-4 w-4 shrink-0 text-brand-text-muted/60" />
        <input
          ref={inputRef}
          id="header-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search projects, services..."
          className="w-full bg-transparent text-xs font-medium text-brand-text placeholder-brand-text-muted/50 focus:outline-none"
          autoComplete="off"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="shrink-0 rounded p-0.5 text-brand-text-muted/60 hover:text-brand-text transition-colors"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : !isMobileDrawer ? (
          <kbd className="hidden lg:inline-flex shrink-0 items-center gap-0.5 rounded border border-brand-outline/25 bg-brand-surface px-1.5 py-0.5 text-[9px] font-mono font-medium text-brand-text-muted/70">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        ) : null}
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && (
        <div
          id="header-search-dropdown"
          className={`absolute left-0 top-full mt-2 w-full min-w-[320px] md:min-w-[440px] lg:min-w-[480px] rounded-2xl border border-brand-outline/25 bg-white/95 p-3 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 max-h-[75vh] overflow-y-auto ${
            isMobileDrawer ? 'relative left-auto top-auto mt-2 min-w-full' : ''
          }`}
        >
          {/* Header indicator */}
          <div className="flex items-center justify-between border-b border-brand-outline/15 pb-2 px-1 text-[11px] font-tech font-bold uppercase tracking-wider text-brand-text-muted">
            <span>{cleanQuery ? `Results for "${cleanQuery}"` : 'Quick Suggestions'}</span>
            {totalResults > 0 && (
              <span className="text-[#00685b] font-mono lowercase">
                {totalResults} {totalResults === 1 ? 'match' : 'matches'}
              </span>
            )}
          </div>

          {/* Empty state */}
          {totalResults === 0 && cleanQuery && (
            <div className="py-8 text-center">
              <Search className="mx-auto h-8 w-8 text-brand-text-muted/30 stroke-[1.5]" />
              <p className="mt-2 text-xs font-bold text-brand-text">No matches found for &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-[11px] text-brand-text-muted">
                Try searching for &ldquo;Branding&rdquo;, &ldquo;Reels&rdquo;, &ldquo;UI/UX&rdquo;, or view our{' '}
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('portfolio');
                    setIsOpen(false);
                  }}
                  className="text-brand-primary underline hover:text-brand-primary-light"
                >
                  Portfolio
                </button>
              </p>
            </div>
          )}

          <div className="mt-2 space-y-4">
            {/* Core Services Section */}
            {matchedServices.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-tech font-bold uppercase tracking-widest text-[#00685b]">
                  <Sparkles className="h-3 w-3" />
                  <span>Services & Capabilities ({matchedServices.length})</span>
                </div>
                <div className="mt-1 space-y-1">
                  {matchedServices.map((service) => {
                    const itemIndex = allItems.findIndex(
                      (item) => item.type === 'service' && item.data.id === service.id
                    );
                    const isSelected = itemIndex === selectedIndex;

                    return (
                      <button
                        key={`service-${service.id}`}
                        type="button"
                        onClick={() => handleSelectItem({ type: 'service', data: service })}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-brand-primary/10 text-brand-primary'
                            : 'hover:bg-brand-surface-low text-brand-text'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? 'bg-brand-primary text-white' : 'bg-[#00685b]/10 text-[#00685b]'
                          }`}
                        >
                          <Layers className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold tracking-tight text-brand-text truncate">
                              {service.title}
                            </span>
                            <span className="text-[10px] font-tech uppercase text-[#00685b] font-semibold shrink-0 ml-2">
                              {service.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-brand-text-muted line-clamp-1 mt-0.5">
                            {service.desc}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-brand-text-muted/40 self-center" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Portfolio Projects Section */}
            {matchedProjects.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-tech font-bold uppercase tracking-widest text-[#00685b]">
                  <Briefcase className="h-3 w-3" />
                  <span>Portfolio Projects ({matchedProjects.length})</span>
                </div>
                <div className="mt-1 space-y-1">
                  {matchedProjects.map((project) => {
                    const itemIndex = allItems.findIndex(
                      (item) => item.type === 'project' && item.data.id === project.id
                    );
                    const isSelected = itemIndex === selectedIndex;
                    const thumb = project.cover_image || project.cover_image_url;

                    return (
                      <button
                        key={`project-${project.id}`}
                        type="button"
                        onClick={() => handleSelectItem({ type: 'project', data: project })}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-brand-primary/10 text-brand-primary'
                            : 'hover:bg-brand-surface-low text-brand-text'
                        }`}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={project.title}
                            className="h-9 w-12 rounded-lg object-cover shrink-0 border border-brand-outline/20 bg-slate-100"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-surface-low border border-brand-outline/20 text-brand-text-muted">
                            <Briefcase className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-brand-text truncate">
                              {project.title}
                            </span>
                            {project.category && (
                              <span className="text-[10px] font-mono text-brand-text-muted shrink-0 ml-2">
                                {project.category}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-brand-text-muted truncate mt-0.5">
                            {project.client ? `Client: ${project.client}` : project.short_description || 'Featured Project Case Study'}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-text-muted/40" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Specialized Deliverables Section */}
            {matchedPackages.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-tech font-bold uppercase tracking-widest text-[#00685b]">
                  <FileText className="h-3 w-3" />
                  <span>Standardized Deliverables ({matchedPackages.length})</span>
                </div>
                <div className="mt-1 space-y-1">
                  {matchedPackages.map((pkg) => {
                    const itemIndex = allItems.findIndex(
                      (item) => item.type === 'package' && item.data.itemId === pkg.itemId
                    );
                    const isSelected = itemIndex === selectedIndex;

                    return (
                      <button
                        key={`package-${pkg.itemId}`}
                        type="button"
                        onClick={() => handleSelectItem({ type: 'package', data: pkg })}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-brand-primary/10 text-brand-primary'
                            : 'hover:bg-brand-surface-low text-brand-text'
                        }`}
                      >
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-surface-low text-brand-text-muted">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-brand-text truncate">
                              {pkg.name}
                            </span>
                            <span className="text-[9px] font-mono uppercase bg-brand-outline/10 text-brand-text-muted px-1.5 py-0.5 rounded shrink-0 ml-2">
                              {pkg.unit}
                            </span>
                          </div>
                          <p className="text-[11px] text-brand-text-muted line-clamp-1 mt-0.5">
                            {pkg.description}
                          </p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-brand-text-muted/40 self-center" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Keyboard navigation hints footer */}
          <div className="mt-3 flex items-center justify-between border-t border-brand-outline/15 pt-2 px-1 text-[10px] text-brand-text-muted/70">
            <span className="flex items-center gap-1">
              <span className="rounded bg-brand-surface-low border border-brand-outline/25 px-1 font-mono">↑↓</span>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              Select
            </span>
            <span className="flex items-center gap-1">
              <span className="rounded bg-brand-surface-low border border-brand-outline/25 px-1 font-mono">ESC</span>
              Close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
