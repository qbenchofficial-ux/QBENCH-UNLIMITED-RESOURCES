import React, { useState } from 'react';
import { slugify } from '../lib/supabase';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categoryService';
import { uploadPortfolioImage } from '../services/mediaService';
import type { Category, Project } from '../types/project';
import {
  Plus,
  Edit3,
  Trash2,
  Tags,
  Loader2,
  X,
  Upload,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Minus,
} from 'lucide-react';

interface CategoriesManagerProps {
  categories: Category[];
  projects: Project[];
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function CategoriesManager({
  categories,
  projects,
  onRefresh,
  onNotify,
}: CategoriesManagerProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [projectsDisplayLimit, setProjectsDisplayLimit] = useState<number>(4);
  const [showViewAll, setShowViewAll] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<{
    category: Category;
    linkedCount: number;
  } | null>(null);

  const openNew = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setSlugManuallyEdited(false);
    setDescription('');
    setCoverImageUrl(null);
    const maxOrder =
      categories.length > 0
        ? Math.max(...categories.map((c) => c.display_order || 0))
        : 0;
    setDisplayOrder(maxOrder + 1);
    setProjectsDisplayLimit(4);
    setShowViewAll(true);
    setIsActive(true);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setSlugManuallyEdited(true);
    setDescription(cat.description || '');
    setCoverImageUrl(cat.cover_image_url || null);
    setDisplayOrder(cat.display_order || 1);
    setProjectsDisplayLimit(cat.projects_display_limit || 4);
    setShowViewAll(cat.show_view_all !== false);
    setIsActive(cat.is_active !== false);
    setShowForm(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setUploadProgress(15);
    try {
      const uploaded = await uploadPortfolioImage(
        file,
        'categories',
        (pct) => setUploadProgress(pct),
        null,
        `${name || 'Category'} Cover`
      );
      setCoverImageUrl(uploaded.url);
      onNotify(
        'success',
        'Category cover image uploaded to portfolio-images/categories/.'
      );
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error
          ? err.message
          : 'Failed to upload category cover image.'
      );
    } finally {
      setUploadingCover(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        slug: slug || slugify(name),
        description,
        cover_image_url: coverImageUrl,
        display_order: Math.max(0, Number(displayOrder) || 1),
        projects_display_limit: Math.max(1, Number(projectsDisplayLimit) || 4),
        show_view_all: showViewAll,
        is_active: isActive,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        onNotify('success', `Updated category "${name}".`);
      } else {
        await createCategory(payload);
        onNotify('success', `Created category "${name}".`);
      }
      setShowForm(false);
      setEditingCategory(null);
      await onRefresh();
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to save category.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPatch = async (
    cat: Category,
    patch: Partial<{
      projects_display_limit: number;
      show_view_all: boolean;
      is_active: boolean;
      display_order: number;
    }>
  ) => {
    setUpdatingCardId(cat.id);
    try {
      await updateCategory(cat.id, {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        cover_image_url: cat.cover_image_url,
        display_order: patch.display_order ?? cat.display_order,
        projects_display_limit:
          patch.projects_display_limit ?? cat.projects_display_limit,
        show_view_all: patch.show_view_all ?? cat.show_view_all,
        is_active: patch.is_active ?? cat.is_active,
      });
      await onRefresh();
      onNotify('success', `Updated "${cat.name}" settings.`);
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to update category.'
      );
    } finally {
      setUpdatingCardId(null);
    }
  };

  const handleMoveOrder = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const current = categories[index];
    const neighbor = categories[targetIndex];
    setUpdatingCardId(current.id);
    try {
      const currentOrder = current.display_order || index + 1;
      const neighborOrder = neighbor.display_order || targetIndex + 1;
      const newCurrentOrder =
        currentOrder === neighborOrder
          ? targetIndex + 1
          : neighborOrder;
      const newNeighborOrder =
        currentOrder === neighborOrder ? index + 1 : currentOrder;

      await Promise.all([
        updateCategory(current.id, {
          name: current.name,
          slug: current.slug,
          description: current.description,
          cover_image_url: current.cover_image_url,
          display_order: newCurrentOrder,
          projects_display_limit: current.projects_display_limit,
          show_view_all: current.show_view_all,
          is_active: current.is_active,
        }),
        updateCategory(neighbor.id, {
          name: neighbor.name,
          slug: neighbor.slug,
          description: neighbor.description,
          cover_image_url: neighbor.cover_image_url,
          display_order: newNeighborOrder,
          projects_display_limit: neighbor.projects_display_limit,
          show_view_all: neighbor.show_view_all,
          is_active: neighbor.is_active,
        }),
      ]);
      await onRefresh();
      onNotify('success', `Reordered "${current.name}".`);
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to reorder category.'
      );
    } finally {
      setUpdatingCardId(null);
    }
  };

  const executeConfirmedDelete = async () => {
    if (!confirmDeleteCat) return;
    const { category } = confirmDeleteCat;
    setUpdatingCardId(category.id);
    try {
      await deleteCategory(category.id, true);
      onNotify('success', `Deleted category "${category.name}".`);
      setConfirmDeleteCat(null);
      await onRefresh();
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to delete category.'
      );
    } finally {
      setUpdatingCardId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            PORTFOLIO TAXONOMY & DISPLAY LIMITS
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900">
            Portfolio Categories ({categories.length})
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Manage category headers, display order, homepage project display limits, View All buttons, and active status.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] px-4 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category Header</span>
        </button>
      </div>

      {/* Add / Edit Category Modal or Panel */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
                {editingCategory ? 'UPDATE CATEGORY' : 'NEW CATEGORY HEADER'}
              </span>
              <h3 className="font-display text-lg font-black text-slate-900">
                {editingCategory
                  ? `Edit Category: ${editingCategory.name}`
                  : 'Create Portfolio Category'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugManuallyEdited) setSlug(slugify(e.target.value));
                }}
                placeholder="e.g. Motion Graphics"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Slug (URL Identifier) *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="motion-graphics"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 font-mono text-xs text-slate-800 focus:border-[#00685b] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Maximum Projects Displayed (Homepage) *
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={projectsDisplayLimit}
                onChange={(e) =>
                  setProjectsDisplayLimit(Math.max(1, Number(e.target.value)))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Display Order *
              </label>
              <input
                type="number"
                min={0}
                max={999}
                required
                value={displayOrder}
                onChange={(e) =>
                  setDisplayOrder(Math.max(0, Number(e.target.value)))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Show "View All" Button
              </label>
              <select
                value={showViewAll ? 'yes' : 'no'}
                onChange={(e) => setShowViewAll(e.target.value === 'yes')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
              >
                <option value="yes">Yes — Show View All Button</option>
                <option value="no">No — Hide View All Button</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Category Status
              </label>
              <select
                value={isActive ? 'active' : 'disabled'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
              >
                <option value="active">Active (Visible on Public Site)</option>
                <option value="disabled">Disabled (Hidden from Public Site)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
              Category Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of this creative discipline displayed under the category header..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Optional Category Cover Image Upload */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-[#00685b]">
                  STORAGE PATH: PORTFOLIO-IMAGES/CATEGORIES/
                </span>
                <h4 className="font-display text-xs font-black text-slate-900">
                  Category Cover Image (Optional)
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] hover:bg-[#005348] px-3 py-1.5 font-display text-xs font-bold text-white cursor-pointer">
                  {uploadingCover ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Uploading ({uploadProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      <span>
                        {coverImageUrl ? 'Replace Cover' : 'Upload Cover Image'}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                    className="hidden"
                  />
                </label>

                {coverImageUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl(null)}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 font-display text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-4">
                {coverImageUrl ? (
                  <img
                    src={coverImageUrl}
                    alt="Category cover preview"
                    className="w-full aspect-[16/9] object-cover rounded-lg border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="w-full aspect-[16/9] rounded-lg border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 space-y-1">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-[11px]">No cover image</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-8 space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-500">
                  Or Paste Category Cover Image URL
                </label>
                <input
                  type="url"
                  value={coverImageUrl || ''}
                  onChange={(e) => setCoverImageUrl(e.target.value || null)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#00685b] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-display text-xs font-bold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] hover:bg-[#005348] px-5 py-2 font-display text-xs font-bold text-white cursor-pointer"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {editingCategory ? 'Save Category Changes' : 'Create Category'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Dialog Modal */}
      {confirmDeleteCat && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-black text-slate-900">
                  Delete Category "{confirmDeleteCat.category.name}"?
                </h3>
                <p className="font-sans text-xs text-slate-600 leading-relaxed">
                  {confirmDeleteCat.linkedCount > 0
                    ? `This category currently has ${confirmDeleteCat.linkedCount} assigned project(s). Deleting the category will keep those projects safe and unassign them from this category.`
                    : 'Are you sure you want to permanently delete this portfolio category?'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteCat(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-display text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                disabled={updatingCardId === confirmDeleteCat.category.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 font-display text-xs font-bold text-white cursor-pointer"
              >
                {updatingCardId === confirmDeleteCat.category.id && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat, idx) => {
          const catProjects = projects.filter(
            (p) =>
              p.category_id === cat.id ||
              (p.category || '').toLowerCase() === cat.name.toLowerCase() ||
              slugify(p.category || '') === cat.slug
          );
          const publishedCount = catProjects.filter(
            (p) => p.status === 'published'
          ).length;
          const totalCount = catProjects.length;
          const isUpdating = updatingCardId === cat.id;

          return (
            <div
              key={cat.id}
              className={`bg-white border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs transition-all ${
                cat.is_active !== false
                  ? 'border-slate-200'
                  : 'border-slate-200/70 bg-slate-50/60 opacity-80'
              }`}
            >
              <div className="space-y-3">
                {/* Top Row: Order badge, Name, Status pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {cat.cover_image_url ? (
                      <img
                        src={cat.cover_image_url}
                        alt={cat.name}
                        className="h-10 w-14 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center shrink-0">
                        <Tags className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                          #{cat.display_order ?? idx + 1}
                        </span>
                        <h3 className="font-display text-base font-black text-slate-900 truncate">
                          {cat.name}
                        </h3>
                      </div>
                      <p className="font-mono text-[11px] text-slate-400">
                        /portfolio/category/{cat.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        handleQuickPatch(cat, {
                          is_active: cat.is_active === false,
                        })
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-tech text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                        cat.is_active !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                      }`}
                      title="Click to toggle Active / Disabled status"
                    >
                      {cat.is_active !== false ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {cat.description && (
                  <p className="font-sans text-xs text-slate-600 leading-relaxed">
                    {cat.description}
                  </p>
                )}

                {/* Category Configuration Summary Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs">
                  {/* Homepage Display Limit Control */}
                  <div className="space-y-1">
                    <span className="block font-tech text-[9px] font-bold uppercase text-slate-500">
                      Max Projects Displayed
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={
                          isUpdating || (cat.projects_display_limit || 4) <= 1
                        }
                        onClick={() =>
                          handleQuickPatch(cat, {
                            projects_display_limit: Math.max(
                              1,
                              (cat.projects_display_limit || 4) - 1
                            ),
                          })
                        }
                        className="h-6 w-6 rounded-md border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 disabled:opacity-40 cursor-pointer"
                        title="Decrease homepage project limit"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-sm font-black text-[#00685b] px-1.5">
                        {cat.projects_display_limit || 4}
                      </span>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleQuickPatch(cat, {
                            projects_display_limit:
                              (cat.projects_display_limit || 4) + 1,
                          })
                        }
                        className="h-6 w-6 rounded-md border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 disabled:opacity-40 cursor-pointer"
                        title="Increase homepage project limit"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Show View All Button Toggle */}
                  <div className="space-y-1">
                    <span className="block font-tech text-[9px] font-bold uppercase text-slate-500">
                      Show View All Button
                    </span>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        handleQuickPatch(cat, {
                          show_view_all: cat.show_view_all === false,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-2.5 py-1 font-display text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <Eye className="h-3 w-3 text-[#00685b]" />
                      <span>{cat.show_view_all !== false ? 'Yes' : 'No'}</span>
                    </button>
                  </div>

                  {/* Assigned Projects Count */}
                  <div className="space-y-1">
                    <span className="block font-tech text-[9px] font-bold uppercase text-slate-500">
                      Assigned Projects
                    </span>
                    <div className="font-mono text-xs font-bold text-slate-800 pt-0.5">
                      <span className="text-[#00685b]">{publishedCount}</span>{' '}
                      published / {totalCount} total
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0 || isUpdating}
                    onClick={() => handleMoveOrder(idx, -1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-35 cursor-pointer"
                    title="Move Category Up"
                  >
                    <ArrowUp className="h-3 w-3" />
                    <span>Up</span>
                  </button>
                  <button
                    type="button"
                    disabled={idx === categories.length - 1 || isUpdating}
                    onClick={() => handleMoveOrder(idx, 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-35 cursor-pointer"
                    title="Move Category Down"
                  >
                    <ArrowDown className="h-3 w-3" />
                    <span>Down</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#00685b] hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDeleteCat({
                        category: cat,
                        linkedCount: totalCount,
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
