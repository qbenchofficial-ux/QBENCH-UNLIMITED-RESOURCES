import React, { useState, useEffect, useRef } from 'react';
import {
  saveCmsServicesData,
  DEFAULT_SERVICES_DATA,
  type CmsServiceItem,
} from '../services/siteContentService';
import type { ServiceTab } from '../types';
import { uploadPortfolioImage } from '../services/mediaService';
import {
  Save,
  RotateCcw,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface ServicesManagerProps {
  services: CmsServiceItem[];
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const ICON_OPTIONS = [
  'Layers',
  'MessageSquare',
  'Video',
  'Target',
  'Code',
  'Sparkles',
  'Palette',
  'TrendingUp',
  'Briefcase',
  'Laptop',
];

const TAB_ID_OPTIONS: { id: ServiceTab; label: string }[] = [
  { id: 'branding', label: 'branding (Branding & Identity)' },
  { id: 'social-media', label: 'social-media (Social Media Design)' },
  { id: 'video-editing', label: 'video-editing (Video Editing)' },
  { id: 'digital-marketing', label: 'digital-marketing (Digital Marketing)' },
  { id: 'webdev', label: 'webdev (Website Development)' },
  { id: 'motion', label: 'motion (Motion Graphics)' },
  { id: 'creative-design', label: 'creative-design (Creative Design)' },
  { id: 'uiux', label: 'uiux (UI/UX Design)' },
  { id: 'growth', label: 'growth (Creative Strategy)' },
  { id: 'business-support', label: 'business-support (Creative Support)' },
];

export default function ServicesManager({
  services: initialServices,
  onRefresh,
  onNotify,
}: ServicesManagerProps) {
  const [servicesList, setServicesList] = useState<CmsServiceItem[]>(
    initialServices && initialServices.length > 0 ? initialServices : DEFAULT_SERVICES_DATA
  );
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [newServiceNameInputs, setNewServiceNameInputs] = useState<{ [key: number]: string }>({});
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (initialServices && initialServices.length > 0) {
      setServicesList(initialServices);
    }
  }, [initialServices]);

  const handleUpdateItem = (
    idx: number,
    patch: Partial<CmsServiceItem>
  ) => {
    setServicesList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const handleMoveCategory = (idx: number, dir: -1 | 1) => {
    setServicesList((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleAddCategory = () => {
    setServicesList((prev) => [
      ...prev,
      {
        id: 'branding',
        title: 'New Service Category',
        label: 'New Service Category',
        emoji: '✨',
        iconName: 'Sparkles',
        deliverables: ['First Service Name'],
      },
    ]);
  };

  const handleDeleteCategory = (idx: number) => {
    if (servicesList.length <= 1) {
      onNotify('error', 'At least one category must remain.');
      return;
    }
    const cat = servicesList[idx];
    if (window.confirm(`Delete the "${cat.title}" category and its services?`)) {
      setServicesList((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  // Service Name Operations under Category
  const handleAddServiceToCategory = (catIdx: number) => {
    const rawName = (newServiceNameInputs[catIdx] || '').trim();
    if (!rawName) return;

    setServicesList((prev) =>
      prev.map((cat, i) => {
        if (i !== catIdx) return cat;
        const currentList = cat.deliverables || [];
        return {
          ...cat,
          deliverables: [...currentList, rawName],
        };
      })
    );

    setNewServiceNameInputs((prev) => ({ ...prev, [catIdx]: '' }));
  };

  const handleEditServiceName = (catIdx: number, serviceIdx: number, newName: string) => {
    setServicesList((prev) =>
      prev.map((cat, i) => {
        if (i !== catIdx) return cat;
        const currentList = [...(cat.deliverables || [])];
        currentList[serviceIdx] = newName;
        return { ...cat, deliverables: currentList };
      })
    );
  };

  const handleMoveServiceInCat = (catIdx: number, serviceIdx: number, dir: -1 | 1) => {
    setServicesList((prev) =>
      prev.map((cat, i) => {
        if (i !== catIdx) return cat;
        const list = [...(cat.deliverables || [])];
        const target = serviceIdx + dir;
        if (target < 0 || target >= list.length) return cat;
        const temp = list[serviceIdx];
        list[serviceIdx] = list[target];
        list[target] = temp;
        return { ...cat, deliverables: list };
      })
    );
  };

  const handleDeleteServiceFromCat = (catIdx: number, serviceIdx: number) => {
    setServicesList((prev) =>
      prev.map((cat, i) => {
        if (i !== catIdx) return cat;
        const currentList = cat.deliverables || [];
        return {
          ...cat,
          deliverables: currentList.filter((_, sIdx) => sIdx !== serviceIdx),
        };
      })
    );
  };

  // Image / Animation Media Upload Handlers
  const handleTriggerUpload = (idx: number) => {
    const el = fileInputRefs.current[idx];
    if (el) {
      el.click();
    }
  };

  const handleFileSelected = async (catIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 20MB for images/video)
    if (file.size > 20 * 1024 * 1024) {
      onNotify('error', 'File size exceeds 20MB limit.');
      return;
    }

    setUploadingIndex(catIdx);
    try {
      const isVideo = file.type.startsWith('video/');
      const media = await uploadPortfolioImage(file, 'categories');
      if (isVideo) {
        handleUpdateItem(catIdx, { videoUrl: media.url, imageUrl: undefined });
      } else {
        handleUpdateItem(catIdx, { imageUrl: media.url, videoUrl: undefined });
      }
      onNotify('success', `Uploaded visual for ${servicesList[catIdx]?.title}`);
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to upload category visual.'
      );
    } finally {
      setUploadingIndex(null);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRemoveMedia = (catIdx: number) => {
    handleUpdateItem(catIdx, { imageUrl: undefined, videoUrl: undefined });
    onNotify('success', 'Restored default animated motion graphics visual.');
  };

  // Save changes to Supabase
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCmsServicesData(servicesList);
      await onRefresh();
      onNotify(
        'success',
        'Service categories & service names saved to Supabase and published.'
      );
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to save services.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        'Reset service offerings to the default 7 QBENCH categories & services catalogue?'
      )
    ) {
      setServicesList(DEFAULT_SERVICES_DATA);
      setSaving(true);
      try {
        await saveCmsServicesData(DEFAULT_SERVICES_DATA);
        await onRefresh();
        onNotify('success', 'Restored default QBENCH service offerings.');
      } catch (err: unknown) {
        onNotify(
          'error',
          err instanceof Error ? err.message : 'Failed to reset services.'
        );
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            SERVICE CATALOGUE &amp; MOTION VISUALS CMS
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900 mt-0.5">
            Service Categories ({servicesList.length})
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1 max-w-2xl">
            Manage the seven main service categories, service names, and custom 16:9 visuals. Each category features a unique animated motion visual by default or your custom uploaded media.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2.5 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleAddCategory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#00685b] bg-[#00685b]/5 hover:bg-[#00685b]/10 px-3.5 py-2.5 font-display text-xs font-bold text-[#00685b] transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#178373] disabled:opacity-60 px-5 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* Services Categories Editor List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {servicesList.map((category, catIdx) => {
          const hasCustomVisual = !!(category.imageUrl || category.videoUrl);
          const isUploadingThis = uploadingIndex === catIdx;

          return (
            <div
              key={`${category.id}-${catIdx}`}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Category Header Row */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-9 w-9 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center text-base shrink-0 font-bold">
                      0{catIdx + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-black text-slate-900 leading-tight">
                        {category.title}
                      </h3>
                      <span className="font-mono text-[10px] text-slate-400">
                        Tab ID: {category.id} · {category.deliverables?.length || 0} Services
                      </span>
                    </div>
                  </div>

                  {/* Move Up, Down, Delete buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveCategory(catIdx, -1)}
                      disabled={catIdx === 0}
                      title="Move Category Up"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCategory(catIdx, 1)}
                      disabled={catIdx === servicesList.length - 1}
                      title="Move Category Down"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(catIdx)}
                      title="Delete Category"
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* 16:9 Category Visual Management Area */}
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-tech text-[10px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-[#00685b]" />
                      Category Visual (16:9 Standard)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {hasCustomVisual ? 'Custom Media Active' : 'Unique Animated Visual Active'}
                    </span>
                  </div>

                  {/* Visual Preview / Status Banner */}
                  <div className="relative aspect-[16/9] max-h-[140px] rounded-lg overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                    {category.videoUrl ? (
                      <video
                        src={category.videoUrl}
                        muted
                        loop
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center space-y-1">
                        <Sparkles className="h-6 w-6 text-[#88f8c5] animate-pulse" />
                        <span className="font-display font-black text-xs text-white">
                          Built-in 2D/3D Animated Motion Visual
                        </span>
                        <span className="font-mono text-[9px] text-[#88f8c5]">
                          Active on public website (16:9 · 60 FPS)
                        </span>
                      </div>
                    )}

                    {isUploadingThis && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center gap-2 text-white font-mono text-xs">
                        <Loader2 className="h-4 w-4 animate-spin text-[#88f8c5]" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[catIdx] = el;
                    }}
                    onChange={(e) => handleFileSelected(catIdx, e)}
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm"
                    className="hidden"
                  />

                  {/* Visual Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload(catIdx)}
                        disabled={isUploadingThis}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold font-display shadow-2xs cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#00685b]" />
                        <span>{hasCustomVisual ? 'Replace Visual' : 'Upload Custom Visual'}</span>
                      </button>

                      {hasCustomVisual && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(catIdx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer"
                          title="Restore default animation"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reset to Motion Visual</span>
                        </button>
                      )}
                    </div>

                    <span className="font-mono text-[9px] text-slate-400">
                      1920×1080 recommended (max 20MB)
                    </span>
                  </div>

                  {/* Manual URL Input Option */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={category.imageUrl || category.videoUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val.match(/\.(mp4|webm)$/i)) {
                          handleUpdateItem(catIdx, { videoUrl: val, imageUrl: undefined });
                        } else {
                          handleUpdateItem(catIdx, { imageUrl: val || undefined, videoUrl: undefined });
                        }
                      }}
                      placeholder="Or paste image/video URL directly..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-mono text-slate-700 focus:border-[#00685b] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category Settings Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={category.title}
                      onChange={(e) =>
                        handleUpdateItem(catIdx, {
                          title: e.target.value,
                          label: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                      Interactive Tab ID
                    </label>
                    <select
                      value={category.id}
                      onChange={(e) =>
                        handleUpdateItem(catIdx, { id: e.target.value as ServiceTab })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                    >
                      {TAB_ID_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                      Category Icon
                    </label>
                    <select
                      value={category.iconName}
                      onChange={(e) =>
                        handleUpdateItem(catIdx, { iconName: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900"
                    >
                      {ICON_OPTIONS.map((ic) => (
                        <option key={ic} value={ic}>
                          {ic}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                      Icon Emoji
                    </label>
                    <input
                      type="text"
                      value={category.emoji || '✨'}
                      onChange={(e) =>
                        handleUpdateItem(catIdx, { emoji: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-center"
                    />
                  </div>
                </div>

                {/* Services under this Category (Service Names ONLY - Rule 9) */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                      Services under {category.title} ({category.deliverables?.length || 0})
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Service Name Only</span>
                  </div>

                  {/* Quick Add Service Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newServiceNameInputs[catIdx] || ''}
                      onChange={(e) =>
                        setNewServiceNameInputs((prev) => ({
                          ...prev,
                          [catIdx]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddServiceToCategory(catIdx);
                        }
                      }}
                      placeholder="Add new service name (e.g. 2D Animation)..."
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#00685b] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddServiceToCategory(catIdx)}
                      className="px-3 py-1.5 rounded-xl bg-[#00685b] hover:bg-[#178373] text-white font-display text-xs font-bold cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  </div>

                  {/* Service Names Reorderable List */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {(category.deliverables || []).map((serviceName, srvIdx) => (
                      <div
                        key={srvIdx}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-mono text-[10px] font-bold text-slate-400 w-5">
                            {srvIdx + 1 < 10 ? `0${srvIdx + 1}` : srvIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={serviceName}
                            onChange={(e) =>
                              handleEditServiceName(catIdx, srvIdx, e.target.value)
                            }
                            className="flex-1 bg-transparent border-none text-slate-800 font-semibold focus:outline-none focus:bg-white px-1 py-0.5 rounded"
                          />
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveServiceInCat(catIdx, srvIdx, -1)}
                            disabled={srvIdx === 0}
                            title="Move service up"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveServiceInCat(catIdx, srvIdx, 1)}
                            disabled={srvIdx === (category.deliverables?.length || 0) - 1}
                            title="Move service down"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteServiceFromCat(catIdx, srvIdx)}
                            title="Remove service"
                            className="p-1 rounded text-red-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
