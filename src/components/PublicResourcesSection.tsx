import React, { useState, useEffect, useMemo } from 'react';
import {
  QBenchCategory,
  QBenchResource,
  QBenchAnnouncement,
  RESOURCE_TYPES,
} from '../types';
import {
  supabase,
  isSupabaseConfigured,
  ensureSupabaseConfig,
} from '../lib/supabase';
import {
  Search,
  Star,
  FileText,
  ExternalLink,
  Megaphone,
  Download,
  BookOpen,
} from 'lucide-react';

export default function PublicResourcesSection() {
  const [resources, setResources] = useState<QBenchResource[]>([]);
  const [categories, setCategories] = useState<QBenchCategory[]>([]);
  const [announcements, setAnnouncements] = useState<QBenchAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    let mounted = true;

    async function loadPublicSupabaseData() {
      setLoading(true);
      await ensureSupabaseConfig();

      if (!isSupabaseConfigured) {
        try {
          const localRes = JSON.parse(localStorage.getItem('qbench_local_resources_v1') || '[]');
          const localCat = JSON.parse(localStorage.getItem('qbench_local_categories_v1') || '[]');
          const localAnn = JSON.parse(localStorage.getItem('qbench_local_announcements_v1') || '[]');
          if (mounted) {
            setResources(Array.isArray(localRes) ? localRes.filter((r: any) => r.published) : []);
            setCategories(Array.isArray(localCat) ? localCat.filter((c: any) => c.published) : []);
            setAnnouncements(Array.isArray(localAnn) ? localAnn.filter((a: any) => a.published) : []);
          }
        } catch {
          // Ignore
        } finally {
          if (mounted) setLoading(false);
        }
        return;
      }

      try {
        const [resQuery, catQuery, annQuery] = await Promise.all([
          supabase
            .from('resources')
            .select('*')
            .eq('published', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('*')
            .eq('published', true)
            .order('name', { ascending: true }),
          supabase
            .from('announcements')
            .select('*')
            .eq('published', true)
            .order('created_at', { ascending: false }),
        ]);

        if (!mounted) return;
        if (!resQuery.error && resQuery.data) {
          setResources(resQuery.data as QBenchResource[]);
        }
        if (!catQuery.error && catQuery.data) {
          setCategories(catQuery.data as QBenchCategory[]);
        }
        if (!annQuery.error && annQuery.data) {
          setAnnouncements(annQuery.data as QBenchAnnouncement[]);
        }
      } catch (err) {
        console.error('[QBench Public Supabase Query Error]:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPublicSupabaseData();
    return () => {
      mounted = false;
    };
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, QBenchCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const featuredResources = useMemo(
    () => resources.filter((r) => r.published && r.featured),
    [resources]
  );

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources.filter((res) => {
      if (!res.published) return false;
      if (selectedCategory !== 'all' && res.category_id !== selectedCategory) return false;
      if (selectedType !== 'all' && res.resource_type !== selectedType) return false;

      if (!q) return true;
      const inTitle = (res.title || '').toLowerCase().includes(q);
      const inDesc = (res.description || '').toLowerCase().includes(q);
      const tagsStr = Array.isArray(res.tags)
        ? res.tags.join(' ').toLowerCase()
        : String(res.tags || '').toLowerCase();
      return inTitle || inDesc || tagsStr.includes(q);
    });
  }, [resources, searchQuery, selectedCategory, selectedType]);

  // If Supabase has no published announcements, categories, or resources yet, render nothing so the public design stays 100% untouched
  if (!loading && resources.length === 0 && announcements.length === 0) {
    return null;
  }

  return (
    <section id="qbench-public-resources" className="mx-auto max-w-7xl px-6 py-16 lg:px-12 space-y-12">
      {/* Published Announcements Banner */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#4CAF50]/30 bg-[#4CAF50]/10 px-5 py-4"
            >
              <div className="flex items-start gap-3">
                <Megaphone className="h-5 w-5 text-[#2E7D32] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display text-sm font-black text-brand-text">
                    {ann.title}
                  </h4>
                  <p className="font-sans text-xs text-brand-text-muted mt-0.5">
                    {ann.message}
                  </p>
                </div>
              </div>
              {ann.link && (
                <a
                  href={ann.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#4CAF50] px-4 py-2 font-display text-xs font-bold text-white hover:bg-[#43A047] transition-colors shrink-0"
                >
                  <span>Explore</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Featured Resources (published = true AND featured = true) */}
      {featuredResources.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="font-tech text-[10px] tracking-widest text-[#4CAF50] font-extrabold uppercase">
              FEATURED RESOURCES
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
              Highlighted Study Materials & Tools
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredResources.map((res) => (
              <div
                key={res.id}
                className="bg-white border border-[#4CAF50]/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  {res.thumbnail_url && (
                    <img
                      src={res.thumbnail_url}
                      alt={res.title}
                      className="h-40 w-full rounded-xl object-cover border border-brand-outline/15"
                    />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-0.5 font-tech text-[10px] font-bold text-amber-700">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      Featured • {res.resource_type}
                    </span>
                    {res.category_id && categoryMap.get(res.category_id) && (
                      <span className="font-tech text-[10px] font-bold text-[#2E7D32]">
                        {categoryMap.get(res.category_id)?.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-black text-brand-text">
                    {res.title}
                  </h3>
                  {res.description && (
                    <p className="font-sans text-xs text-brand-text-muted leading-relaxed">
                      {res.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-brand-outline/15">
                  {res.file_url && (
                    <a
                      href={res.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] px-3.5 py-2 font-display text-xs font-bold text-white transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download / View File</span>
                    </a>
                  )}
                  {res.external_url && (
                    <a
                      href={res.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-brand-outline/30 bg-white hover:bg-brand-surface-low px-3.5 py-2 font-display text-xs font-bold text-brand-text transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open Link</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Published Resources with Search, Category Filter & Resource-Type Filter */}
      {resources.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-brand-outline/20 pb-6">
            <div className="space-y-1">
              <span className="font-tech text-[10px] tracking-widest text-[#4CAF50] font-extrabold uppercase">
                QBENCH – UNLIMITED RESOURCES
              </span>
              <h2 className="font-display text-3xl font-black text-brand-text">
                Resource Library
              </h2>
            </div>

            {/* Search + Category + Resource Type Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[560px]">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, description, tags..."
                  className="w-full rounded-xl border border-brand-outline/30 bg-white pl-10 pr-3.5 py-2 text-xs text-brand-text focus:border-[#4CAF50] focus:outline-none"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-brand-outline/30 bg-white px-3 py-2 text-xs text-brand-text focus:border-[#4CAF50] focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-xl border border-brand-outline/30 bg-white px-3 py-2 text-xs text-brand-text focus:border-[#4CAF50] focus:outline-none"
              >
                <option value="all">All Resource Types</option>
                {RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res) => {
              const tagsList = Array.isArray(res.tags)
                ? res.tags
                : typeof res.tags === 'string' && res.tags.trim()
                ? res.tags.split(',').map((t) => t.trim())
                : [];

              return (
                <div
                  key={res.id}
                  className="bg-white border border-brand-outline/25 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all"
                >
                  <div className="space-y-3">
                    {res.thumbnail_url && (
                      <img
                        src={res.thumbnail_url}
                        alt={res.title}
                        className="h-40 w-full rounded-xl object-cover border border-brand-outline/15"
                      />
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-[#4CAF50]/10 px-2.5 py-0.5 font-tech text-[10px] font-bold text-[#2E7D32]">
                        {res.resource_type}
                      </span>
                      {res.category_id && categoryMap.get(res.category_id) && (
                        <span className="font-tech text-[10px] text-brand-text-muted font-bold">
                          {categoryMap.get(res.category_id)?.name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-base font-black text-brand-text">
                      {res.title}
                    </h3>

                    {res.description && (
                      <p className="font-sans text-xs text-brand-text-muted leading-relaxed">
                        {res.description}
                      </p>
                    )}

                    {tagsList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tagsList.map((tag, i) => (
                          <span
                            key={i}
                            className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-brand-outline/15">
                    {res.file_url && (
                      <a
                        href={res.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] px-3.5 py-2 font-display text-xs font-bold text-white transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Access Resource</span>
                      </a>
                    )}
                    {res.external_url && (
                      <a
                        href={res.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-brand-outline/30 bg-white hover:bg-brand-surface-low px-3.5 py-2 font-display text-xs font-bold text-brand-text transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Visit URL</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
