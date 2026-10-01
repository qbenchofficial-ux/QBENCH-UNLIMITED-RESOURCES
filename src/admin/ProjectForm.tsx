import React, { useState, useEffect } from 'react';
import { slugify } from '../lib/supabase';
import { uploadPortfolioImage } from '../services/mediaService';
import type { Project, ProjectFormData, Category, ProjectStatus } from '../types/project';
import {
  Upload,
  Trash2,
  Star,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Image as ImageIcon,
  Save,
  Globe,
} from 'lucide-react';

interface ProjectFormProps {
  initialProject?: Project | null;
  categories: Category[];
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ProjectForm({
  initialProject,
  categories,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [title, setTitle] = useState(initialProject?.title || '');
  const [slug, setSlug] = useState(initialProject?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialProject));
  const [category, setCategory] = useState(
    initialProject?.category || categories[0]?.name || 'Branding'
  );
  const [client, setClient] = useState(initialProject?.client || '');
  const [year, setYear] = useState<number>(
    initialProject?.year || new Date().getFullYear()
  );
  const [shortDescription, setShortDescription] = useState(
    initialProject?.short_description || ''
  );
  const [description, setDescription] = useState(initialProject?.description || '');
  const [services, setServices] = useState<string[]>(initialProject?.services || []);
  const [serviceInput, setServiceInput] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(
    initialProject?.cover_image || null
  );
  const [gallery, setGallery] = useState<string[]>(initialProject?.gallery || []);
  const [videoUrl, setVideoUrl] = useState(initialProject?.video_url || '');
  const [behanceUrl, setBehanceUrl] = useState(initialProject?.behance_url || '');
  const [instagramUrl, setInstagramUrl] = useState(
    initialProject?.instagram_url || ''
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialProject?.website_url || '');
  const [featured, setFeatured] = useState<boolean>(
    Boolean(initialProject?.featured)
  );
  const [status, setStatus] = useState<ProjectStatus>(
    initialProject?.status || 'draft'
  );
  const [sortOrder, setSortOrder] = useState<number>(
    initialProject?.sort_order ?? 0
  );

  // Upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title);
      setSlug(initialProject.slug);
      setSlugManuallyEdited(true);
      setCategory(initialProject.category || categories[0]?.name || 'Branding');
      setClient(initialProject.client || '');
      setYear(initialProject.year || new Date().getFullYear());
      setShortDescription(initialProject.short_description || '');
      setDescription(initialProject.description || '');
      setServices(initialProject.services || []);
      setCoverImage(initialProject.cover_image || null);
      setGallery(initialProject.gallery || []);
      setVideoUrl(initialProject.video_url || '');
      setBehanceUrl(initialProject.behance_url || '');
      setInstagramUrl(initialProject.instagram_url || '');
      setWebsiteUrl(initialProject.website_url || '');
      setFeatured(Boolean(initialProject.featured));
      setStatus(initialProject.status || 'draft');
      setSortOrder(initialProject.sort_order ?? 0);
    }
  }, [initialProject, categories]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleAddService = () => {
    const clean = serviceInput.trim();
    if (!clean) return;
    if (!services.includes(clean)) {
      setServices([...services, clean]);
    }
    setServiceInput('');
  };

  const handleRemoveService = (srv: string) => {
    setServices(services.filter((s) => s !== srv));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setUploadingCover(true);
    setCoverProgress(10);
    try {
      const uploaded = await uploadPortfolioImage(
        file,
        'covers',
        (pct) => setCoverProgress(pct),
        initialProject?.id || null
      );
      setCoverImage(uploaded.url);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Cover image upload failed.'
      );
    } finally {
      setUploadingCover(false);
      setCoverProgress(0);
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files: File[] = Array.from(fileList);
    setFormError(null);
    setUploadingGallery(true);
    setGalleryProgress(5);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const uploaded = await uploadPortfolioImage(
          files[i],
          'gallery',
          (pct) => {
            const overall = Math.round(((i + pct / 100) / files.length) * 100);
            setGalleryProgress(overall);
          },
          initialProject?.id || null
        );
        uploadedUrls.push(uploaded.url);
      }

      const nextGallery = [...gallery, ...uploadedUrls];
      setGallery(nextGallery);
      if (!coverImage && uploadedUrls.length > 0) {
        setCoverImage(uploadedUrls[0]);
      }
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Gallery image upload failed.'
      );
    } finally {
      setUploadingGallery(false);
      setGalleryProgress(0);
      e.target.value = '';
    }
  };

  const moveGalleryItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= gallery.length) return;
    const next = [...gallery];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setGallery(next);
  };

  const removeGalleryItem = (idx: number) => {
    setGallery(gallery.filter((_, i) => i !== idx));
  };

  const submitWithStatus = async (targetStatus: ProjectStatus) => {
    setFormError(null);
    const cleanTitle = title.trim();
    const cleanSlug = slugify(slug || cleanTitle);
    const cleanCategory = category.trim();

    if (!cleanTitle) {
      setFormError('Project Title is required.');
      return;
    }
    if (!cleanSlug) {
      setFormError('A valid project slug is required.');
      return;
    }
    if (!cleanCategory) {
      setFormError('Category is required.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: cleanTitle,
        slug: cleanSlug,
        short_description: shortDescription.trim(),
        description: description.trim(),
        category: cleanCategory,
        client: client.trim(),
        year: Number(year) || new Date().getFullYear(),
        services,
        cover_image: coverImage,
        gallery,
        video_url: videoUrl.trim(),
        behance_url: behanceUrl.trim(),
        instagram_url: instagramUrl.trim(),
        website_url: websiteUrl.trim(),
        featured,
        status: targetStatus,
        sort_order: Number(sortOrder) || 0,
      });
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to save project.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-8">
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            {initialProject ? 'EDIT PORTFOLIO PROJECT' : 'CREATE PORTFOLIO PROJECT'}
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900 mt-0.5">
            {initialProject ? initialProject.title : 'Add New Project'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 font-display text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer self-start"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </button>
      </div>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700"
        >
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Primary Project Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Project Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. The Journey of a Ring"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Slug (URL Path) *
          </label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="the-journey-of-a-ring"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 font-mono text-xs text-slate-800 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
            {category && !categories.some((c) => c.name === category) && (
              <option value={category}>{category}</option>
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Client
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Client or Brand Name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Year
            </label>
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Descriptions */}
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Short Description (Card Summary)
          </label>
          <textarea
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Concise 1–2 sentence overview displayed on portfolio cards..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Full Description (Case Study Narrative)
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed project story, creative direction, process, and outcomes..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Services Delivered */}
      <div className="space-y-2">
        <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
          Services Provided
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={serviceInput}
            onChange={(e) => setServiceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddService();
              }
            }}
            placeholder="e.g. Motion Graphics, 3D Visualization, Branding (press Enter to add)"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddService}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2 font-display text-xs font-bold text-slate-800 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>

        {services.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {services.map((srv) => (
              <span
                key={srv}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00685b]/10 border border-[#00685b]/20 px-3 py-1 text-xs font-bold text-[#00685b]"
              >
                <span>{srv}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(srv)}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cover Image Upload */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-[#00685b]">
              SUPABASE STORAGE (BUCKET: PORTFOLIO)
            </span>
            <h3 className="font-display text-sm font-black text-slate-900">
              Cover Image (JPG, JPEG, PNG, WEBP)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] hover:bg-[#005348] px-3.5 py-2 font-display text-xs font-bold text-white cursor-pointer">
              {uploadingCover ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading ({coverProgress}%)</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>{coverImage ? 'Replace Cover Image' : 'Upload Cover Image'}</span>
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

            {coverImage && (
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-display text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {uploadingCover && (
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-[#00685b] transition-all duration-300"
              style={{ width: `${coverProgress}%` }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5">
            {coverImage ? (
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-full aspect-[16/10] object-cover rounded-xl border border-slate-200 bg-white"
              />
            ) : (
              <div className="w-full aspect-[16/10] rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 space-y-1">
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">No cover image selected</span>
              </div>
            )}
          </div>

          <div className="md:col-span-7 space-y-2">
            <label className="block font-tech text-[10px] font-bold uppercase text-slate-500">
              Or Paste Cover Image URL Directly
            </label>
            <input
              type="url"
              value={coverImage || ''}
              onChange={(e) => setCoverImage(e.target.value || null)}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#00685b] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Multi-Image Gallery Manager */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-[#00685b]">
              GALLERY MANAGEMENT ({gallery.length} IMAGES)
            </span>
            <h3 className="font-display text-sm font-black text-slate-900">
              Project Gallery Images (Drag or use arrows to reorder)
            </h3>
          </div>

          <label className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] hover:bg-[#005348] px-3.5 py-2 font-display text-xs font-bold text-white cursor-pointer self-start">
            {uploadingGallery ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Uploading ({galleryProgress}%)</span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Multiple Images</span>
              </>
            )}
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleGalleryUpload}
              disabled={uploadingGallery}
              className="hidden"
            />
          </label>
        </div>

        {uploadingGallery && (
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-[#00685b] transition-all duration-300"
              style={{ width: `${galleryProgress}%` }}
            />
          </div>
        )}

        {gallery.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center space-y-1">
            <p className="font-display text-xs font-bold text-slate-600">
              No gallery images uploaded yet
            </p>
            <p className="font-sans text-[11px] text-slate-400">
              Upload multiple JPG, PNG, or WEBP images to build a rich project gallery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((imgUrl, idx) => {
              const isCurrentCover = coverImage === imgUrl;
              return (
                <div
                  key={`${imgUrl}-${idx}`}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== idx) {
                      moveGalleryItem(dragIndex, idx);
                    }
                    setDragIndex(null);
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2.5 shadow-2xs"
                >
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={imgUrl}
                      alt={`Gallery item ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded-md bg-slate-900/75 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                      #{idx + 1}
                    </span>
                    {isCurrentCover && (
                      <span className="absolute top-2 right-2 rounded-md bg-[#00685b] px-2 py-0.5 font-tech text-[9px] font-bold uppercase text-white">
                        Cover
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveGalleryItem(idx, idx - 1)}
                        className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="Move Left"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === gallery.length - 1}
                        onClick={() => moveGalleryItem(idx, idx + 1)}
                        className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="Move Right"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCoverImage(imgUrl)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Set Cover
                    </button>

                    <button
                      type="button"
                      onClick={() => removeGalleryItem(idx)}
                      className="rounded-lg border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 cursor-pointer"
                      title="Remove Image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* External Project Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Video URL (YouTube / Vimeo / MP4)
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Behance URL
          </label>
          <input
            type="url"
            value={behanceUrl}
            onChange={(e) => setBehanceUrl(e.target.value)}
            placeholder="https://www.behance.net/gallery/..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Instagram URL
          </label>
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Website / Live Project URL
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Publishing, Featured & Sort Order Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-[#00685b] focus:outline-none"
          >
            <option value="draft">Draft (Hidden from public)</option>
            <option value="published">Published (Visible on public portfolio)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Sort Order
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:outline-none"
          />
        </div>

        <div className="flex items-end pb-2">
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#00685b] focus:ring-[#00685b]"
            />
            <span className="inline-flex items-center gap-1.5 font-display text-xs font-bold text-slate-800">
              <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
              <span>Feature on Homepage Portfolio</span>
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons: Cancel, Save Draft, Publish Project */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 font-display text-xs font-bold text-slate-700 cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => submitWithStatus('draft')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 font-display text-xs font-bold text-slate-800 cursor-pointer"
        >
          {saving && status === 'draft' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => submitWithStatus('published')}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] px-6 py-2.5 font-display text-xs font-bold text-white shadow-xs cursor-pointer"
        >
          {saving && status === 'published' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span>Publish Project</span>
        </button>
      </div>
    </div>
  );
}
