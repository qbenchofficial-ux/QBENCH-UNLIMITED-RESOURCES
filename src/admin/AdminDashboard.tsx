import React, { useMemo } from 'react';
import type { Project, Category, ProjectInquiry } from '../types/project';
import type { CmsPackageCategory, CmsServiceItem } from '../services/siteContentService';
import {
  FolderKanban,
  Globe,
  FileEdit,
  Star,
  Plus,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  Tags,
  Package,
  Briefcase,
  FileText,
  MessageSquare,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface AdminDashboardProps {
  projects: Project[];
  categories: Category[];
  packages?: CmsPackageCategory[];
  services?: CmsServiceItem[];
  inquiries?: ProjectInquiry[];
  loading: boolean;
  onNavigateRoute: (path: string) => void;
  onToggleStatus: (project: Project) => Promise<void>;
  onToggleFeatured: (project: Project) => Promise<void>;
}

export default function AdminDashboard({
  projects,
  categories,
  packages = [],
  services = [],
  inquiries = [],
  loading,
  onNavigateRoute,
  onToggleStatus,
  onToggleFeatured,
}: AdminDashboardProps) {
  const stats = useMemo(() => {
    const total = projects.length;
    const published = projects.filter((p) => p.status === 'published').length;
    const draft = projects.filter((p) => p.status === 'draft').length;
    const featured = projects.filter((p) => p.featured).length;
    const newInquiries = inquiries.filter((i) => i.status === 'new').length;
    return { total, published, draft, featured, newInquiries };
  }, [projects, inquiries]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, 6);
  }, [projects]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            FULL WEBSITE CONTROL HUB
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900 mt-0.5">
            Portfolio, Packages, Services & Website CMS
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Control every part of QBENCH: portfolio case studies, package tiers & pricing matrices, service capabilities, homepage copy, process steps, team, and client inquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/packages')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <Package className="h-4 w-4 text-[#00685b]" />
            <span>Edit Packages ({packages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/services')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <Briefcase className="h-4 w-4 text-[#00685b]" />
            <span>Edit Services ({services.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/projects/new')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] hover:bg-[#005348] px-4 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      {/* 4 Required KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Projects
            </span>
            <p className="font-display text-3xl font-black text-slate-900 tabular-nums">
              {loading ? '—' : stats.total}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <FolderKanban className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-[#00685b]">
              Published Projects
            </span>
            <p className="font-display text-3xl font-black text-[#00685b] tabular-nums">
              {loading ? '—' : stats.published}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#00685b]/10 flex items-center justify-center text-[#00685b]">
            <Globe className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Draft Projects
            </span>
            <p className="font-display text-3xl font-black text-amber-600 tabular-nums">
              {loading ? '—' : stats.draft}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <FileEdit className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-amber-500">
              Featured Projects
            </span>
            <p className="font-display text-3xl font-black text-slate-900 tabular-nums">
              {loading ? '—' : stats.featured}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Star className="h-6 w-6 fill-amber-400" />
          </div>
        </div>
      </div>

      {/* Complete CMS Control Grid */}
      <div className="space-y-3">
        <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b] block">
          EDIT EVERYTHING ON THE WEBSITE
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/projects')}
            className="text-left bg-white hover:border-[#00685b] border border-slate-200 rounded-2xl p-5 shadow-2xs transition-all group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center">
                <FolderKanban className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#00685b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-slate-900">
                Portfolio Case Studies
              </h4>
              <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
                Add, edit, reorder, feature, or unpublish portfolio works, cover images, galleries, and Behance/YouTube links.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/packages')}
            className="text-left bg-white hover:border-[#00685b] border border-slate-200 rounded-2xl p-5 shadow-2xs transition-all group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#00685b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-slate-900">
                Packages & Pricing
              </h4>
              <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
                Edit all {packages.length} package categories, Basic/Standard/Premium prices, timelines, comparison matrix rows, and Business Support plans.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/services')}
            className="text-left bg-white hover:border-[#00685b] border border-slate-200 rounded-2xl p-5 shadow-2xs transition-all group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#00685b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-slate-900">
                Services & Capabilities
              </h4>
              <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
                Customize all {services.length} agency services, starting prices, descriptions, icons, and bulleted deliverables.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/content')}
            className="text-left bg-white hover:border-[#00685b] border border-slate-200 rounded-2xl p-5 shadow-2xs transition-all group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#00685b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-slate-900">
                Website Copy, Process & Team
              </h4>
              <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
                Edit homepage hero text, rotating words, Why Choose Us cards, 6-stage process timeline, team members, and studio locations.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/categories')}
            className="text-left bg-white hover:border-[#00685b] border border-slate-200 rounded-2xl p-5 shadow-2xs transition-all group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center">
                <Tags className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#00685b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-slate-900">
                Portfolio Categories ({categories.length})
              </h4>
              <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
                Create, rename, or delete filter categories for the public portfolio showcase.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/media')}
            className="text-left bg-white hover:border-[#00685b] border border-slate-200 rounded-2xl p-5 shadow-2xs transition-all group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center">
                <ImageIcon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#00685b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-slate-900">
                Media Library
              </h4>
              <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
                Upload images to Supabase Storage, copy public URLs, and manage uploaded visuals.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/inquiries')}
            className="text-left bg-white hover:border-[#00685b] border border-slate-200 rounded-2xl p-5 shadow-2xs transition-all group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              {stats.newInquiries > 0 ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-tech text-[10px] font-bold text-emerald-800">
                  {stats.newInquiries} New
                </span>
              ) : (
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#00685b] group-hover:translate-x-0.5 transition-all" />
              )}
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-slate-900">
                Client Inquiries ({inquiries.length})
              </h4>
              <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
                Review leads submitted from the contact & package booking forms and update their status.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/settings')}
            className="text-left bg-white hover:border-[#00685b] border border-slate-200 rounded-2xl p-5 shadow-2xs transition-all group cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center">
                <Settings className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#00685b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-slate-900">
                Agency Contact & Socials
              </h4>
              <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
                Update agency name, tagline, contact email, phone, WhatsApp number, and social profiles.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Projects List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
              RECENT ACTIVITY
            </span>
            <h3 className="font-display text-lg font-black text-slate-900">
              Recent Portfolio Projects
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateRoute('/admin/projects')}
            className="font-display text-xs font-bold text-[#00685b] hover:underline cursor-pointer"
          >
            View All Projects →
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center space-y-3">
            <p className="font-display text-sm font-bold text-slate-700">
              No portfolio projects yet
            </p>
            <p className="font-sans text-xs text-slate-500">
              Create your first portfolio project to publish it dynamically on the QBENCH website.
            </p>
            <button
              type="button"
              onClick={() => onNavigateRoute('/admin/projects/new')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] px-4 py-2 font-display text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Project</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 font-tech text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-4">Project</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        {project.cover_image ? (
                          <img
                            src={project.cover_image}
                            alt={project.title}
                            loading="lazy"
                            className="h-11 w-16 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="h-11 w-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-display font-bold text-slate-900 block truncate max-w-xs">
                            {project.title}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 block truncate max-w-xs">
                            /portfolio/{project.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {project.category || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 tabular-nums">
                      {project.year || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(project)}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold cursor-pointer ${
                          project.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {project.status === 'published' ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleFeatured(project)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            project.featured
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => onNavigateRoute(`/portfolio/${project.slug}`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateRoute(`/admin/projects/${project.id}/edit`)
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-[#00685b]/10 px-2.5 py-1 text-xs font-bold text-[#00685b] hover:bg-[#00685b]/20 cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
