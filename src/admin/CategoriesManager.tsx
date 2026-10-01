import React, { useState } from 'react';
import { slugify } from '../lib/supabase';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categoryService';
import type { Category, Project } from '../types/project';
import { Plus, Edit3, Trash2, Tags, Loader2, X } from 'lucide-react';

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
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const openNew = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name, slug, description });
        onNotify('success', `Updated category "${name}".`);
      } else {
        await createCategory({ name, slug, description });
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

  const handleDelete = async (cat: Category, linkedCount: number) => {
    if (linkedCount > 0) {
      onNotify(
        'error',
        `Cannot delete "${cat.name}" while ${linkedCount} project(s) are assigned to it. Reassign those projects first.`
      );
      return;
    }
    try {
      await deleteCategory(cat.id);
      onNotify('success', `Deleted category "${cat.name}".`);
      await onRefresh();
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to delete category.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            PORTFOLIO TAXONOMY
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900">
            Project Categories ({categories.length})
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Dynamic categories loaded on the public QBENCH portfolio filter bar.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] px-4 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-black text-slate-900">
              {editingCategory
                ? `Edit Category: ${editingCategory.name}`
                : 'Create New Category'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingCategory) setSlug(slugify(e.target.value));
                }}
                placeholder="e.g. Motion Graphics"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="motion-graphics"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 font-mono text-xs text-slate-800 focus:border-[#00685b] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of this creative discipline..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
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
              <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const count = projects.filter(
            (p) =>
              p.category_id === cat.id ||
              (p.category || '').toLowerCase() === cat.name.toLowerCase() ||
              slugify(p.category || '') === cat.slug
          ).length;

          return (
            <div
              key={cat.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tags className="h-4 w-4 text-[#00685b] shrink-0" />
                    <h3 className="font-display text-base font-black text-slate-900 truncate">
                      {cat.name}
                    </h3>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 shrink-0">
                    {count} {count === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                <p className="font-mono text-[11px] text-slate-400">/{cat.slug}</p>
                {cat.description && (
                  <p className="font-sans text-xs text-slate-600 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                  onClick={() => handleDelete(cat, count)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
