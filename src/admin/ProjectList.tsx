import React, { useState, useMemo } from 'react';
import { slugify } from '../lib/supabase';
import type { Project, Category } from '../types/project';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Star,
  Globe,
  FileEdit,
  ExternalLink,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  Database,
} from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  categories: Category[];
  loading?: boolean;
  onCreateNew?: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => Promise<void>;
  onDeleteProject?: (project: Project) => Promise<void>;
  onNavigateRoute?: (path: string) => void;
  onToggleStatus: (project: Project) => Promise<void>;
  onToggleFeatured: (project: Project) => Promise<void>;
  onOpenPublicSlug?: (slug: string) => void;
  onSeedDefaults?: () => Promise<void>;
}

const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=400&h=260&q=80';

export default function ProjectList({
  projects,
  categories,
  onCreateNew,
  onEdit,
  onDelete,
  onDeleteProject,
  onNavigateRoute,
  onToggleStatus,
  onToggleFeatured,
  onOpenPublicSlug,
  onSeedDefaults,
}: ProjectListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'published' | 'draft'
  >('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [confirmDeleteProject, setConfirmDeleteProject] =
    useState<Project | null>(null);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'all') {
        const matchId = p.category_id === categoryFilter;
        const matchSlug = slugify(p.category || '') === categoryFilter;
        const matchName =
          (p.category || '').toLowerCase() === categoryFilter.toLowerCase();
        if (!matchId && !matchSlug && !matchName) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inClient = (p.client || p.client_name || '')
          .toLowerCase()
          .includes(q);
        const inCat = (p.category || '').toLowerCase().includes(q);
        const inType = (p.project_type || '').toLowerCase().includes(q);
        return inTitle || inClient || inCat || inType;
      }
      return true;
    });
  }, [projects, search, categoryFilter, statusFilter]);

  const hasSeedOnlyProjects = useMemo(
    () => projects.some((p) => p.id.startsWith('seed-')),
    [projects]
  );

  const handleCreate = () => {
    if (onCreateNew) {
      onCreateNew();
    } else if (onNavigateRoute) {
      onNavigateRoute('/admin/projects/new');
    }
  };

  const handleEditProject = (project: Project) => {
    if (onEdit) {
      onEdit(project);
    } else if (onNavigateRoute) {
      onNavigateRoute(`/admin/projects/edit/${project.id}`);
    }
  };

  const handleOpenSlug = (slug: string) => {
    if (onOpenPublicSlug) {
      onOpenPublicSlug(slug);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/portfolio/${slug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteProject) return;
    setBusyId(confirmDeleteProject.id);
    try {
      const fn = onDelete || onDeleteProject;
      if (fn) {
        await fn(confirmDeleteProject);
      }
      setConfirmDeleteProject(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            PORTFOLIO PROJECTS CMS
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900 mt-0.5">
            Portfolio Projects ({projects.length})
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Add, edit, reorder, feature, publish, or save draft projects across dynamic portfolio categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          {hasSeedOnlyProjects && onSeedDefaults && (
            <button
              type="button"
              disabled={seeding}
              onClick={async () => {
                setSeeding(true);
                try {
                  await onSeedDefaults();
                } finally {
                  setSeeding(false);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#00685b]/30 bg-[#00685b]/5 hover:bg-[#00685b]/10 px-3.5 py-2.5 font-display text-xs font-bold text-[#00685b] cursor-pointer"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              <span>Persist Starter Projects to DB</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] px-4 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-5 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project title, category, client, or type..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold text-slate-700 focus:border-[#00685b] focus:outline-none"
          >
            <option value="all">All Portfolio Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'published' | 'draft')
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold text-slate-700 focus:border-[#00685b] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-black text-slate-900">
                  Delete "{confirmDeleteProject.title}"?
                </h3>
                <p className="font-sans text-xs text-slate-600 leading-relaxed">
                  This will permanently remove the project and its gallery records from Supabase. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteProject(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-display text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={busyId === confirmDeleteProject.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 font-display text-xs font-bold text-white cursor-pointer"
              >
                {busyId === confirmDeleteProject.id && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <p className="font-display text-base font-black text-slate-800">
            No matching portfolio projects found
          </p>
          <p className="font-sans text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your category or status filter, or click "Add New Project" to create a new portfolio case study.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project, idx) => {
            const thumb =
              project.cover_image_url ||
              project.cover_image ||
              project.gallery?.[0] ||
              FALLBACK_THUMB;
            const imageCount = Math.max(
              project.portfolio_images?.length || 0,
              project.gallery?.length || 0,
              project.cover_image ? 1 : 0
            );
            const isBusy = busyId === project.id;

            return (
              <div
                key={project.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-all"
              >
                <div>
                  {/* Cover Thumbnail */}
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                    <img
                      src={thumb}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="rounded-md bg-slate-900/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                        #{project.display_order ?? project.sort_order ?? idx + 1}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 font-tech text-[9px] font-extrabold uppercase ${
                          project.status === 'published'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/75 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                        <ImageIcon className="h-3 w-3" />
                        <span>{imageCount}</span>
                      </span>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={async () => {
                          setBusyId(project.id);
                          try {
                            await onToggleFeatured(project);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        className="rounded-md bg-white/90 p-1.5 shadow-2xs hover:bg-white cursor-pointer"
                        title={
                          project.featured
                            ? 'Remove Featured status'
                            : 'Mark as Featured'
                        }
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            project.featured
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-slate-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-[#00685b] bg-[#00685b]/10 px-2.5 py-0.5 rounded-full truncate">
                        {project.category || 'Uncategorized'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {project.project_date || project.year || 2026}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-black text-slate-900 line-clamp-1">
                      {project.title}
                    </h3>

                    {project.project_type && (
                      <p className="font-tech text-[10px] font-bold text-slate-500 uppercase">
                        {project.project_type}
                      </p>
                    )}

                    <p className="font-sans text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {project.short_description ||
                        project.description ||
                        'No description provided.'}
                    </p>

                    {project.software_tools &&
                      project.software_tools.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {project.software_tools.slice(0, 4).map((tool) => (
                            <span
                              key={tool}
                              className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-600"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditProject(project)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#00685b] hover:bg-[#005348] px-2.5 py-1.5 font-display text-[11px] font-bold text-white cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={async () => {
                        setBusyId(project.id);
                        try {
                          await onToggleStatus(project);
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-2.5 py-1.5 font-display text-[11px] font-bold text-slate-700 cursor-pointer"
                    >
                      {project.status === 'published' ? (
                        <>
                          <FileEdit className="h-3 w-3 text-amber-600" />
                          <span>Unpublish</span>
                        </>
                      ) : (
                        <>
                          <Globe className="h-3 w-3 text-emerald-600" />
                          <span>Publish</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenSlug(project.slug)}
                      className="rounded-lg border border-slate-200 bg-white hover:bg-slate-100 p-1.5 text-slate-600 cursor-pointer"
                      title="Open Project Page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteProject(project)}
                      className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 p-1.5 text-red-600 cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
