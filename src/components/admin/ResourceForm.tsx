import React, { useState, useEffect } from 'react';
import {
  QBenchCategory,
  QBenchResource,
  RESOURCE_TYPES,
  ResourceType,
} from '../../types';
import { slugify, uploadToQBenchBucket } from '../../lib/supabase';
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  FileText,
  Star,
  Globe,
  X,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export interface ResourceFormPayload {
  title: string;
  slug: string;
  description: string;
  category_id: string | null;
  subcategory: string;
  resource_type: ResourceType | string;
  content: string;
  file_url: string;
  external_url: string;
  thumbnail_url: string;
  tags: string[];
  featured: boolean;
  published: boolean;
}

interface ResourceFormProps {
  initialData?: QBenchResource | null;
  categories: QBenchCategory[];
  onSubmit: (payload: ResourceFormPayload) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function ResourceForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isSaving = false,
}: ResourceFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialData?.slug));
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState<string>(initialData?.category_id || '');
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || '');
  const [resourceType, setResourceType] = useState<string>(
    initialData?.resource_type || RESOURCE_TYPES[0]
  );
  const [content, setContent] = useState(initialData?.content || '');
  const [tagsInput, setTagsInput] = useState(() => {
    if (!initialData?.tags) return '';
    if (Array.isArray(initialData.tags)) return initialData.tags.join(', ');
    return String(initialData.tags);
  });
  const [externalUrl, setExternalUrl] = useState(initialData?.external_url || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url || '');
  const [fileUrl, setFileUrl] = useState(initialData?.file_url || '');
  const [featured, setFeatured] = useState(Boolean(initialData?.featured));
  const [published, setPublished] = useState(
    initialData ? Boolean(initialData.published) : true
  );

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  const handleResourceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setError(null);
    try {
      const publicUrl = await uploadToQBenchBucket(file, 'resources');
      setFileUrl(publicUrl);
    } catch (err: any) {
      setError(`File upload failed: ${err?.message || 'Unable to upload to qbench-resources'}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    setError(null);
    try {
      const publicUrl = await uploadToQBenchBucket(file, 'thumbnails');
      setThumbnailUrl(publicUrl);
    } catch (err: any) {
      setError(`Thumbnail upload failed: ${err?.message || 'Unable to upload to qbench-resources'}`);
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const finalSlug = slug.trim() || slugify(trimmedTitle);
    if (!trimmedTitle) {
      setError('Resource title is required.');
      return;
    }
    if (!finalSlug) {
      setError('Resource slug is required.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await onSubmit({
        title: trimmedTitle,
        slug: finalSlug,
        description: description.trim(),
        category_id: categoryId || null,
        subcategory: subcategory.trim(),
        resource_type: resourceType,
        content: content.trim(),
        file_url: fileUrl.trim(),
        external_url: externalUrl.trim(),
        thumbnail_url: thumbnailUrl.trim(),
        tags: parsedTags,
        featured,
        published,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save resource.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
            {initialData ? 'EDIT RESOURCE' : 'NEW RESOURCE'}
          </span>
          <h3 className="font-display text-xl font-black text-slate-900 mt-0.5">
            {initialData ? `Edit: ${initialData.title}` : 'Create QBench Resource'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          title="Close form"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Title & Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Complete Quantitative Aptitude Formula Handbook"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Slug *
          </label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="complete-quantitative-aptitude-formula-handbook"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 font-mono text-xs text-slate-800 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Category, Subcategory, Resource Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} {!cat.published ? '(Draft)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Subcategory
          </label>
          <input
            type="text"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="e.g., SSC CGL / Tier 1 / Productivity"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Resource Type *
          </label>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
          >
            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
          Short Description
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Concise summary shown on resource cards and search results..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
        />
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
          Detailed Content / Study Notes
        </label>
        <textarea
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Full study notes, instructions, key takeaways, or embedded article content..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
        />
      </div>

      {/* Tags & External URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Tags (Comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="study, math, pdf, toolkit, exam-2026"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            External URL
          </label>
          <div className="relative">
            <LinkIcon className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://example.com/resource-link"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Supabase Storage Uploads: Resource File & Thumbnail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {/* Resource File Upload -> resources/ folder */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#4CAF50]" />
              Resource File (Bucket: qbench-resources/resources/)
            </span>
            {uploadingFile && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4CAF50]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </span>
            )}
          </div>

          <input
            type="url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="Public file URL or upload below..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#4CAF50] focus:outline-none"
          />

          <label className="inline-flex items-center gap-2 rounded-lg border border-[#4CAF50]/40 bg-[#4CAF50]/10 hover:bg-[#4CAF50]/15 px-3.5 py-2 text-xs font-semibold text-[#2E7D32] cursor-pointer transition-colors">
            <Upload className="h-3.5 w-3.5" />
            <span>{uploadingFile ? 'Uploading to Supabase...' : 'Upload Resource File'}</span>
            <input
              type="file"
              onChange={handleResourceFileUpload}
              disabled={uploadingFile}
              className="hidden"
            />
          </label>
        </div>

        {/* Thumbnail File Upload -> thumbnails/ folder */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-[#4CAF50]" />
              Thumbnail (Bucket: qbench-resources/thumbnails/)
            </span>
            {uploadingThumb && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4CAF50]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </span>
            )}
          </div>

          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Public thumbnail URL or upload below..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#4CAF50] focus:outline-none"
          />

          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-[#4CAF50]/40 bg-[#4CAF50]/10 hover:bg-[#4CAF50]/15 px-3.5 py-2 text-xs font-semibold text-[#2E7D32] cursor-pointer transition-colors">
              <Upload className="h-3.5 w-3.5" />
              <span>{uploadingThumb ? 'Uploading Thumbnail...' : 'Upload Thumbnail'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                disabled={uploadingThumb}
                className="hidden"
              />
            </label>
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt="Thumbnail preview"
                className="h-9 w-14 rounded object-cover border border-slate-200"
              />
            )}
          </div>
        </div>
      </div>

      {/* Toggles: Featured & Published */}
      <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100">
        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#4CAF50] focus:ring-[#4CAF50]"
          />
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Globe className="h-3.5 w-3.5 text-[#4CAF50]" />
            Published (Visible on public website)
          </span>
        </label>

        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#4CAF50] focus:ring-[#4CAF50]"
          />
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            Featured Resource (Highlighted on homepage)
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-display text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || uploadingFile || uploadingThumb}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] disabled:opacity-60 px-6 py-2.5 font-display text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>{initialData ? 'Update Resource' : 'Create Resource'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
