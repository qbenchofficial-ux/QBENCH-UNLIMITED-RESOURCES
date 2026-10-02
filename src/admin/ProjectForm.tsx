import React, { useState, useEffect } from 'react';
import { slugify, isValidUuid } from '../lib/supabase';
import { uploadPortfolioImage } from '../services/mediaService';
import type {
  Project,
  ProjectFormData,
  Category,
  ProjectStatus,
  GalleryImageInput,
} from '../types/project';
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
  Eye,
  RefreshCw,
  Wrench,
  Calendar,
  User,
  Layers,
  Video,
  ExternalLink,
} from 'lucide-react';

interface ProjectFormProps {
  initialProject?: Project | null;
  categories: Category[];
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
}

const SUGGESTED_TOOLS = [
  'After Effects',
  'Cinema 4D',
  'Premiere Pro',
  'Illustrator',
  'Photoshop',
  'Figma',
  'Blender',
  'DaVinci Resolve',
  'Octane Render',
  'Midjourney / AI',
];

function buildInitialGalleryItems(project?: Project | null): GalleryImageInput[] {
  if (!project) return [];
  if (project.portfolio_images && project.portfolio_images.length > 0) {
    return [...project.portfolio_images]
      .sort(
        (a, b) =>
          (a.display_order ?? a.sort_order ?? 0) -
          (b.display_order ?? b.sort_order ?? 0)
      )
      .map((img, idx) => ({
        id: isValidUuid(img.id) ? img.id : undefined,
        image_url: img.image_url,
        alt_text:
          img.alt_text ||
          `${project.title} — Image ${String(idx + 1).padStart(2, '0')}`,
        display_order: idx,
      }));
  }
  return (project.gallery || []).map((url, idx) => ({
    image_url: url,
    alt_text:
      idx === 0
        ? 'Main Cover Image'
        : `${project.title} — Image ${String(idx + 1).padStart(2, '0')}`,
    display_order: idx,
  }));
}

export default function ProjectForm({
  initialProject,
  categories,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [title, setTitle] = useState(initialProject?.title || '');
  const [slug, setSlug] = useState(initialProject?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(initialProject)
  );

  const initialCategoryObj =
    categories.find(
      (c) =>
        c.id === initialProject?.category_id ||
        c.name.toLowerCase() === (initialProject?.category || '').toLowerCase() ||
        c.slug === slugify(initialProject?.category || '')
    ) || categories[0];

  const [categoryId, setCategoryId] = useState<string>(
    initialProject?.category_id || initialCategoryObj?.id || ''
  );
  const [categoryName, setCategoryName] = useState<string>(
    initialProject?.category || initialCategoryObj?.name || 'Motion Graphics'
  );

  const [shortDescription, setShortDescription] = useState(
    initialProject?.short_description || ''
  );
  const [description, setDescription] = useState(
    initialProject?.description || ''
  );
  const [client, setClient] = useState(
    initialProject?.client_name || initialProject?.client || ''
  );
  const [year, setYear] = useState<number>(
    initialProject?.year || new Date().getFullYear()
  );
  const [projectDate, setProjectDate] = useState<string>(
    initialProject?.project_date ||
      String(initialProject?.year || new Date().getFullYear())
  );
  const [projectType, setProjectType] = useState<string>(
    initialProject?.project_type || ''
  );
  const [displayOrder, setDisplayOrder] = useState<number>(
    initialProject?.display_order ?? initialProject?.sort_order ?? 1
  );

  const [services, setServices] = useState<string[]>(
    initialProject?.services || []
  );
  const [serviceInput, setServiceInput] = useState('');

  const [softwareTools, setSoftwareTools] = useState<string[]>(
    initialProject?.software_tools || []
  );
  const [toolInput, setToolInput] = useState('');

  const [coverImage, setCoverImage] = useState<string | null>(
    initialProject?.cover_image_url || initialProject?.cover_image || null
  );
  const [galleryItems, setGalleryItems] = useState<GalleryImageInput[]>(() =>
    buildInitialGalleryItems(initialProject)
  );
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualImageAlt, setManualImageAlt] = useState('');

  const [behanceUrl, setBehanceUrl] = useState(
    initialProject?.behance_url || ''
  );
  const [videoUrl, setVideoUrl] = useState(
    initialProject?.video_url || initialProject?.youtube_url || ''
  );
  const [websiteUrl, setWebsiteUrl] = useState(
    initialProject?.website_url || ''
  );
  const [featured, setFeatured] = useState<boolean>(
    Boolean(initialProject?.is_featured ?? initialProject?.featured)
  );
  const [status, setStatus] = useState<ProjectStatus>(
    initialProject?.status || 'published'
  );

  // Upload & preview states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewActiveImage, setPreviewActiveImage] = useState<string | null>(
    null
  );

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title);
      setSlug(initialProject.slug);
      setSlugManuallyEdited(true);
      const matched =
        categories.find(
          (c) =>
            c.id === initialProject.category_id ||
            c.name.toLowerCase() ===
              (initialProject.category || '').toLowerCase() ||
            c.slug === slugify(initialProject.category || '')
        ) || categories[0];
      setCategoryId(initialProject.category_id || matched?.id || '');
      setCategoryName(
        initialProject.category || matched?.name || 'Motion Graphics'
      );
      setShortDescription(initialProject.short_description || '');
      setDescription(initialProject.description || '');
      setClient(initialProject.client_name || initialProject.client || '');
      setYear(initialProject.year || new Date().getFullYear());
      setProjectDate(
        initialProject.project_date ||
          String(initialProject.year || new Date().getFullYear())
      );
      setProjectType(initialProject.project_type || '');
      setDisplayOrder(
        initialProject.display_order ?? initialProject.sort_order ?? 1
      );
      setServices(initialProject.services || []);
      setSoftwareTools(initialProject.software_tools || []);
      setCoverImage(
        initialProject.cover_image_url || initialProject.cover_image || null
      );
      setGalleryItems(buildInitialGalleryItems(initialProject));
      setBehanceUrl(initialProject.behance_url || '');
      setVideoUrl(
        initialProject.video_url || initialProject.youtube_url || ''
      );
      setWebsiteUrl(initialProject.website_url || '');
      setFeatured(
        Boolean(initialProject.is_featured ?? initialProject.featured)
      );
      setStatus(initialProject.status || 'published');
    } else if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
      setCategoryName(categories[0].name);
    }
  }, [initialProject, categories]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleCategoryChange = (selectedVal: string) => {
    const found = categories.find(
      (c) => c.id === selectedVal || c.name === selectedVal
    );
    if (found) {
      setCategoryId(found.id);
      setCategoryName(found.name);
    } else {
      setCategoryId('');
      setCategoryName(selectedVal);
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

  const handleAddTool = (toolToAdd?: string) => {
    const clean = (toolToAdd ?? toolInput).trim();
    if (!clean) return;
    if (!softwareTools.includes(clean)) {
      setSoftwareTools([...softwareTools, clean]);
    }
    if (!toolToAdd) setToolInput('');
  };

  const handleRemoveTool = (tool: string) => {
    setSoftwareTools(softwareTools.filter((t) => t !== tool));
  };

  const projectStorageId =
    initialProject?.id && isValidUuid(initialProject.id)
      ? initialProject.id
      : slugify(slug || title) || 'draft-project';

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setUploadingCover(true);
    setCoverProgress(10);
    try {
      const uploaded = await uploadPortfolioImage(
        file,
        'projects',
        (pct) => setCoverProgress(pct),
        projectStorageId,
        `${title || 'Project'} — Main Cover Image`,
        0
      );
      setCoverImage(uploaded.url);
      if (galleryItems.length === 0) {
        setGalleryItems([
          {
            image_url: uploaded.url,
            alt_text: 'Main Cover Image',
            display_order: 0,
          },
        ]);
      }
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

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files: File[] = Array.from(fileList);
    setFormError(null);
    setUploadingGallery(true);
    setGalleryProgress(5);

    try {
      const uploadedItems: GalleryImageInput[] = [];
      for (let i = 0; i < files.length; i++) {
        const orderIndex = galleryItems.length + i;
        const defaultLabel =
          orderIndex === 0 && !coverImage
            ? 'Main Cover Image'
            : `Project Image ${String(orderIndex + 1).padStart(2, '0')}`;

        const uploaded = await uploadPortfolioImage(
          files[i],
          'projects',
          (pct) => {
            const overall = Math.round(((i + pct / 100) / files.length) * 100);
            setGalleryProgress(overall);
          },
          projectStorageId,
          defaultLabel,
          orderIndex
        );
        uploadedItems.push({
          id: uploaded.id,
          image_url: uploaded.url,
          alt_text: defaultLabel,
          display_order: orderIndex,
        });
      }

      const nextItems = [...galleryItems, ...uploadedItems].map((item, idx) => ({
        ...item,
        display_order: idx,
      }));
      setGalleryItems(nextItems);
      if (!coverImage && uploadedItems.length > 0) {
        setCoverImage(uploadedItems[0].image_url);
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

  const handleReplaceSingleGalleryImage = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setReplacingIndex(idx);
    try {
      const existingItem = galleryItems[idx];
      const uploaded = await uploadPortfolioImage(
        file,
        'projects',
        undefined,
        projectStorageId,
        existingItem?.alt_text || `Project Image ${idx + 1}`,
        idx
      );
      const wasCover = coverImage === existingItem?.image_url;
      const next = galleryItems.map((item, i) =>
        i === idx
          ? {
              ...item,
              image_url: uploaded.url,
              display_order: i,
            }
          : item
      );
      setGalleryItems(next);
      if (wasCover) {
        setCoverImage(uploaded.url);
      }
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to replace image.'
      );
    } finally {
      setReplacingIndex(null);
      e.target.value = '';
    }
  };

  const handleAddManualGalleryUrl = () => {
    const cleanUrl = manualImageUrl.trim();
    if (!cleanUrl) return;
    const label =
      manualImageAlt.trim() ||
      (galleryItems.length === 0
        ? 'Main Cover Image'
        : `Project Image ${String(galleryItems.length + 1).padStart(2, '0')}`);

    const next = [
      ...galleryItems,
      {
        image_url: cleanUrl,
        alt_text: label,
        display_order: galleryItems.length,
      },
    ];
    setGalleryItems(next);
    if (!coverImage) {
      setCoverImage(cleanUrl);
    }
    setManualImageUrl('');
    setManualImageAlt('');
  };

  const moveGalleryItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= galleryItems.length) return;
    const next = [...galleryItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setGalleryItems(
      next.map((item, idx) => ({
        ...item,
        display_order: idx,
      }))
    );
  };

  const updateGalleryItemAlt = (idx: number, altText: string) => {
    setGalleryItems(
      galleryItems.map((item, i) =>
        i === idx ? { ...item, alt_text: altText } : item
      )
    );
  };

  const removeGalleryItem = (idx: number) => {
    const removed = galleryItems[idx];
    const next = galleryItems
      .filter((_, i) => i !== idx)
      .map((item, i) => ({ ...item, display_order: i }));
    setGalleryItems(next);
    if (removed && coverImage === removed.image_url) {
      setCoverImage(next[0]?.image_url || null);
    }
  };

  const openLivePreview = () => {
    setPreviewActiveImage(
      coverImage || galleryItems[0]?.image_url || null
    );
    setShowPreviewModal(true);
  };

  const submitWithStatus = async (targetStatus: ProjectStatus) => {
    setFormError(null);
    const cleanTitle = title.trim();
    const cleanSlug = slugify(slug || cleanTitle);
    const cleanCategory = categoryName.trim();

    if (!cleanTitle) {
      setFormError('Project Title is required.');
      return;
    }
    if (!cleanSlug) {
      setFormError('A valid project slug is required.');
      return;
    }
    if (!cleanCategory && !categoryId) {
      setFormError('Category is required.');
      return;
    }

    const orderedGalleryItems = galleryItems.map((item, idx) => ({
      ...item,
      display_order: idx,
    }));
    const galleryUrls = orderedGalleryItems.map((item) => item.image_url);
    const resolvedCover = coverImage || galleryUrls[0] || null;

    setSaving(true);
    try {
      await onSubmit({
        title: cleanTitle,
        slug: cleanSlug,
        short_description:
          shortDescription.trim() ||
          description.trim().split('\n')[0].slice(0, 220),
        description: description.trim() || shortDescription.trim(),
        category_id: isValidUuid(categoryId) ? categoryId : null,
        category: cleanCategory,
        client: client.trim(),
        client_name: client.trim(),
        year: Number(year) || new Date().getFullYear(),
        project_date:
          projectDate.trim() || String(year || new Date().getFullYear()),
        project_type: projectType.trim(),
        services,
        software_tools: softwareTools,
        cover_image: resolvedCover,
        cover_image_url: resolvedCover,
        gallery: galleryUrls,
        gallery_items: orderedGalleryItems,
        behance_url: behanceUrl.trim(),
        youtube_url: videoUrl.trim(),
        video_url: videoUrl.trim(),
        website_url: websiteUrl.trim(),
        featured,
        is_featured: featured,
        status: targetStatus,
        sort_order: Number(displayOrder) || 1,
        display_order: Number(displayOrder) || 1,
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
            {initialProject
              ? 'EDIT PORTFOLIO PROJECT'
              : 'CREATE PORTFOLIO PROJECT'}
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900 mt-0.5">
            {initialProject ? initialProject.title : 'Add New Project'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            onClick={openLivePreview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#00685b]/30 bg-[#00685b]/5 hover:bg-[#00685b]/10 px-3.5 py-2 font-display text-xs font-bold text-[#00685b] cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview Project</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 font-display text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Projects</span>
          </button>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-1.5 lg:col-span-2">
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
            Category Assignment (Supabase) *
          </label>
          <select
            value={categoryId || categoryName}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
            {categoryName &&
              !categories.some(
                (c) => c.id === categoryId || c.name === categoryName
              ) && <option value={categoryName}>{categoryName}</option>}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Project Type
          </label>
          <input
            type="text"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            placeholder="e.g. 3D Luxury Motion Design, Brand Identity"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Client Name (Optional)
          </label>
          <input
            type="text"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="e.g. Luxury Jewellery Collective"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Project Date
          </label>
          <input
            type="text"
            value={projectDate}
            onChange={(e) => {
              setProjectDate(e.target.value);
              const matchedYear = e.target.value.match(/\b(20\d{2})\b/);
              if (matchedYear) {
                setYear(Number(matchedYear[1]));
              }
            }}
            placeholder="e.g. February 2026 or 2026-02-15"
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

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Display Order (Lower = First)
          </label>
          <input
            type="number"
            min={0}
            max={9999}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Short Description & Full Project Description */}
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Short Description (Card Summary)
          </label>
          <textarea
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Concise 1-2 sentence summary displayed on portfolio cards..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Full Project Description (Case Study Narrative)
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed project story, creative direction, process, storyboarding, and outcomes..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Software / Tools Used & Services Delivered */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Software / Tools Used */}
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Software / Tools Used
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTool();
                }
              }}
              placeholder="e.g. Cinema 4D, After Effects, Figma"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-[#00685b] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleAddTool()}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3.5 py-2 font-display text-xs font-bold text-slate-800 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGGESTED_TOOLS.map((preset) => {
              const active = softwareTools.includes(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    active ? handleRemoveTool(preset) : handleAddTool(preset)
                  }
                  className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#00685b] text-white border-[#00685b]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-[#00685b]/40'
                  }`}
                >
                  + {preset}
                </button>
              );
            })}
          </div>

          {softwareTools.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/70">
              {softwareTools.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#00685b]/10 border border-[#00685b]/20 px-2.5 py-1 text-xs font-bold text-[#00685b]"
                >
                  <Wrench className="h-3 w-3" />
                  <span>{tool}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTool(tool)}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Services Delivered */}
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Services / Deliverables
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
              placeholder="e.g. 3D Visualization, Storyboarding, Art Direction"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-[#00685b] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddService}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3.5 py-2 font-display text-xs font-bold text-slate-800 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>

          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {services.map((srv) => (
                <span
                  key={srv}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#00685b]/10 border border-[#00685b]/20 px-2.5 py-1 text-xs font-bold text-[#00685b]"
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
      </div>

      {/* Cover Image / Thumbnail Upload */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-[#00685b]">
              SUPABASE STORAGE: PORTFOLIO-IMAGES/PROJECTS/{projectStorageId.toUpperCase()}/
            </span>
            <h3 className="font-display text-sm font-black text-slate-900">
              Main Cover Image / Thumbnail
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
                  <span>
                    {coverImage ? 'Replace Cover Image' : 'Upload Cover Image'}
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

      {/* Multi-Image Gallery Manager (Upload, Preview, Replace, Reorder, Caption, Delete) */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-[#00685b]">
              MULTI-IMAGE PROJECT GALLERY ({galleryItems.length} IMAGES)
            </span>
            <h3 className="font-display text-sm font-black text-slate-900">
              Project Images — Upload, Preview, Replace, Reorder & Label
            </h3>
            <p className="font-sans text-[11px] text-slate-500">
              Drag cards or use arrows to reorder. Label each frame (e.g. Main Cover Image, Storyboard Image 01, Final Artwork).
            </p>
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

        {/* Add Image by URL Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
          <input
            type="url"
            value={manualImageUrl}
            onChange={(e) => setManualImageUrl(e.target.value)}
            placeholder="Or paste an image URL (https://...)"
            className="sm:col-span-6 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#00685b] focus:outline-none"
          />
          <input
            type="text"
            value={manualImageAlt}
            onChange={(e) => setManualImageAlt(e.target.value)}
            placeholder="Image label (e.g. Storyboard Image 01)"
            className="sm:col-span-4 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#00685b] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddManualGalleryUrl}
            className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3 py-2 font-display text-xs font-bold text-slate-800 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Image</span>
          </button>
        </div>

        {uploadingGallery && (
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-[#00685b] transition-all duration-300"
              style={{ width: `${galleryProgress}%` }}
            />
          </div>
        )}

        {galleryItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center space-y-1">
            <p className="font-display text-xs font-bold text-slate-600">
              No project gallery images added yet
            </p>
            <p className="font-sans text-[11px] text-slate-400">
              Upload multiple JPG, PNG, or WEBP files to build a multi-image showcase (e.g. Main Cover, Storyboards, Final Artwork).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryItems.map((item, idx) => {
              const isCurrentCover = coverImage === item.image_url;
              const isReplacing = replacingIndex === idx;
              return (
                <div
                  key={`${item.image_url}-${idx}`}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== idx) {
                      moveGalleryItem(dragIndex, idx);
                    }
                    setDragIndex(null);
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs"
                >
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={item.image_url}
                      alt={item.alt_text || `Gallery item ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded-md bg-slate-900/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                      #{idx + 1}
                    </span>
                    {isCurrentCover && (
                      <span className="absolute top-2 right-2 rounded-md bg-[#00685b] px-2 py-0.5 font-tech text-[9px] font-bold uppercase text-white">
                        Cover
                      </span>
                    )}
                  </div>

                  {/* Image Label / Alt Text Input */}
                  <input
                    type="text"
                    value={item.alt_text}
                    onChange={(e) => updateGalleryItemAlt(idx, e.target.value)}
                    placeholder="Image caption (e.g. Storyboard Image 01)"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-[#00685b] focus:bg-white focus:outline-none"
                  />

                  {/* Controls: Reorder, Replace, Set Cover, Delete */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveGalleryItem(idx, idx - 1)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="Move Earlier"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === galleryItems.length - 1}
                        onClick={() => moveGalleryItem(idx, idx + 1)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="Move Later"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <label
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-[#00685b] hover:bg-slate-50 cursor-pointer"
                        title="Replace this image"
                      >
                        {isReplacing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        <span>Replace</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          onChange={(e) =>
                            handleReplaceSingleGalleryImage(idx, e)
                          }
                          disabled={isReplacing}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setCoverImage(item.image_url)}
                        className={`rounded-lg border px-2 py-1 text-[10px] font-bold cursor-pointer ${
                          isCurrentCover
                            ? 'border-[#00685b] bg-[#00685b]/10 text-[#00685b]'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isCurrentCover ? 'Cover' : 'Set Cover'}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeGalleryItem(idx)}
                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 cursor-pointer"
                        title="Delete Image"
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

      {/* Optional Video URL, Behance URL & Live Website URL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Optional Project Video URL (YouTube / Vimeo / MP4)
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Behance Case Study URL (Optional)
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
            Live Project / Website URL (Optional)
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

      {/* Publishing & Featured Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Publish Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-[#00685b] focus:outline-none"
          >
            <option value="published">
              Published (Visible on public portfolio)
            </option>
            <option value="draft">Draft (Hidden from public visitors)</option>
          </select>
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
              <span>Featured Project (Highlight on Portfolio)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons: Cancel, Preview, Save Draft, Publish Project */}
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
          onClick={openLivePreview}
          className="inline-flex items-center gap-2 rounded-xl border border-[#00685b]/30 bg-[#00685b]/5 hover:bg-[#00685b]/10 px-5 py-2.5 font-display text-xs font-bold text-[#00685b] cursor-pointer"
        >
          <Eye className="h-4 w-4" />
          <span>Preview Before Publishing</span>
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
          <span>Save as Draft</span>
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

      {/* Live Project Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs overflow-y-auto p-4 sm:p-8">
          <div className="max-w-5xl mx-auto bg-[#faf9f9] border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-[#00685b]/10 text-[#00685b] px-3 py-1 font-tech text-[10px] font-extrabold uppercase tracking-wider">
                  LIVE PROJECT PREVIEW
                </span>
                <span className="font-mono text-xs text-slate-500">
                  /portfolio/{slug || slugify(title) || 'project-slug'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-display text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Close Preview</span>
              </button>
            </div>

            <div className="p-6 sm:p-10 space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-3">
                  <span className="font-tech text-[10px] tracking-wider text-[#00685b] font-bold uppercase bg-[#88f8c5]/30 border border-[#45b88a]/30 px-3 py-1 rounded-full inline-block">
                    {categoryName || 'Portfolio'}
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900">
                    {title || 'Untitled Project'}
                  </h1>
                  {(shortDescription || description) && (
                    <p className="font-sans text-sm text-slate-600 leading-relaxed">
                      {shortDescription || description.split('\n')[0]}
                    </p>
                  )}
                </div>

                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase text-slate-400">
                        <User className="h-3 w-3 text-[#00685b]" />
                        Client
                      </span>
                      <p className="font-display font-bold text-slate-900">
                        {client || 'QBENCH Partner'}
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase text-slate-400">
                        <Calendar className="h-3 w-3 text-[#00685b]" />
                        Date
                      </span>
                      <p className="font-display font-bold text-slate-900">
                        {projectDate || year}
                      </p>
                    </div>
                  </div>

                  {projectType && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="font-tech text-[10px] uppercase text-slate-400 block">
                        Project Type
                      </span>
                      <p className="font-display font-bold text-slate-900">
                        {projectType}
                      </p>
                    </div>
                  )}

                  {softwareTools.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase text-slate-400">
                        <Wrench className="h-3 w-3 text-[#00685b]" />
                        Software & Tools
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {softwareTools.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-slate-100 px-2 py-0.5 font-display text-[10px] font-bold text-slate-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {services.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase text-slate-400">
                        <Layers className="h-3 w-3 text-[#00685b]" />
                        Deliverables
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {services.map((s) => (
                          <span
                            key={s}
                            className="rounded-md bg-[#00685b]/10 px-2 py-0.5 font-display text-[10px] font-bold text-[#00685b]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(behanceUrl || videoUrl || websiteUrl) && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      {behanceUrl && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00685b]">
                          <ExternalLink className="h-3 w-3" />
                          Behance
                        </span>
                      )}
                      {videoUrl && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00685b]">
                          <Video className="h-3 w-3" />
                          Video Attached
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {(previewActiveImage || coverImage) && (
                <div className="space-y-3">
                  <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-200 bg-white">
                    <img
                      src={previewActiveImage || coverImage || ''}
                      alt={title || 'Preview'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {galleryItems.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                      {galleryItems.map((g, i) => (
                        <button
                          key={`prev-${i}`}
                          type="button"
                          onClick={() => setPreviewActiveImage(g.image_url)}
                          className={`aspect-[16/10] rounded-lg overflow-hidden border-2 cursor-pointer ${
                            previewActiveImage === g.image_url
                              ? 'border-[#00685b]'
                              : 'border-slate-200 opacity-75'
                          }`}
                        >
                          <img
                            src={g.image_url}
                            alt={g.alt_text}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {description && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
                  <span className="font-tech text-[10px] font-bold uppercase tracking-widest text-[#00685b]">
                    PROJECT OVERVIEW
                  </span>
                  <div className="font-sans text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
