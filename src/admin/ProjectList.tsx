import React, { useState, useMemo } from 'react';
import type { Project, Category } from '../types/project';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Globe,
  EyeOff,
  Star,
  Image as ImageIcon,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  categories: Category[];
  loading: boolean;
  onNavigateRoute: (path: string) => void;
  onToggleStatus: (project: Project) => Promise<void>;
  onToggleFeatured: (project: Project) => Promise<void>;
  onDeleteProject: (project: Project) => Promise<void>;
}

const ITEMS_PER_PAGE = 8;

export default function ProjectList({
  projects,
  categories,
  loading,
  onNavigateRoute,
  onToggleStatus,
  onToggleFeatured,
  onDeleteProject,
}: ProjectListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'standard'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (featuredFilter === 'featured' && !p.featured) return false;
      if (featuredFilter === 'standard' && p.featured) return false;

      if (!q) return true;
      const inTitle = p.title.toLowerCase().includes(q);
      const inClient = (p.client || '').toLowerCase().includes(q);
      const inCat = (p.category || '').toLowerCase().includes(q);
      const inDesc = (p.short_description || '').toLowerCase().includes(q);
      return inTitle || inClient || inCat || inDesc;
    });
  }, [projects, search, categoryFilter, statusFilter, featuredFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProjects = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, safePage]);

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await onDeleteProject(projectToDelete);
      setProjectToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
              PORTFOLIO PROJECTS
            </span>
            <h2 className="font-display text-2xl font-black text-slate-900">
              All Projects ({filteredProjects.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/projects/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] px-4 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search title, client, category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#00685b] focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'published' | 'draft');
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#00685b] focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value as 'all' | 'featured' | 'standard');
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#00685b] focus:outline-none"
          >
            <option value="all">All Featured States</option>
            <option value="featured">Featured Only</option>
            <option value="standard">Non-Featured</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-7 w-7 text-[#00685b] animate-spin" />
            <p className="font-display text-xs font-bold text-slate-500">
              Loading projects...
            </p>
          </div>
        ) : paginatedProjects.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <p className="font-display text-sm font-bold text-slate-700">
              No projects match your current filters
            </p>
            <p className="font-sans text-xs text-slate-500">
              Try clearing your search filters or create a new project.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 font-tech text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-4">Cover & Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4">Updated Date</th>
                  <th className="py-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/70">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3.5">
                        {project.cover_image ? (
                          <img
                            src={project.cover_image}
                            alt={project.title}
                            loading="lazy"
                            className="h-12 w-18 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-18 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-display font-bold text-slate-900 truncate max-w-xs">
                            {project.title}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                            /{project.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 font-tech text-[10px] font-bold text-slate-700">
                        {project.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-600 tabular-nums">
                      {project.year || '—'}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(project)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                          project.status === 'published'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {project.status === 'published' ? (
                          <>
                            <Globe className="h-3 w-3" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleFeatured(project)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                          project.featured
                            ? 'border-amber-300 bg-amber-50 text-amber-800'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            project.featured ? 'fill-amber-400 text-amber-500' : ''
                          }`}
                        />
                        <span>{project.featured ? 'Featured' : 'Standard'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onNavigateRoute(`/portfolio/${project.slug}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
                          title="Preview Project"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onNavigateRoute(`/admin/projects/${project.id}/edit`)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-[#00685b] cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProjectToDelete(project)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 px-2.5 py-1.5 text-xs font-bold text-red-700 cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
            <span className="text-slate-500">
              Page <strong className="text-slate-900">{safePage}</strong> of{' '}
              <strong className="text-slate-900">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-black text-slate-900">
                  Delete Project: {projectToDelete.title}
                </h3>
                <p className="font-sans text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete this project? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setProjectToDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-display text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 font-display text-xs font-bold text-white cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
