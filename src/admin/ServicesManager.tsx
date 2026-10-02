import React, { useState, useEffect } from 'react';
import {
  saveCmsServicesData,
  DEFAULT_SERVICES_DATA,
  type CmsServiceItem,
} from '../services/siteContentService';
import type { ServiceTab } from '../types';
import {
  Save,
  RotateCcw,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
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
  'TrendingUp',
  'Briefcase',
  'Laptop',
];

const TAB_ID_OPTIONS: { id: ServiceTab; label: string }[] = [
  { id: 'branding', label: 'branding (Branding & Identity)' },
  { id: 'social-media', label: 'social-media (Social Media Design)' },
  { id: 'video-editing', label: 'video-editing (Video Editing)' },
  { id: 'digital-marketing', label: 'digital-marketing (Digital Marketing)' },
  { id: 'uiux', label: 'uiux (UI/UX Design)' },
  { id: 'webdev', label: 'webdev (Website Development)' },
  { id: 'motion', label: 'motion (Motion Graphics)' },
  { id: 'growth', label: 'growth (Creative Strategy)' },
  { id: 'business-support', label: 'business-support (Creative Support)' },
];

export default function ServicesManager({
  services: initialServices,
  onRefresh,
  onNotify,
}: ServicesManagerProps) {
  const [servicesList, setServicesList] = useState<CmsServiceItem[]>(
    initialServices.length > 0 ? initialServices : DEFAULT_SERVICES_DATA
  );
  const [saving, setSaving] = useState(false);

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

  const handleMove = (idx: number, dir: -1 | 1) => {
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

  const handleAddService = () => {
    setServicesList((prev) => [
      ...prev,
      {
        id: 'branding',
        title: 'New Creative Service',
        label: 'New Creative Service',
        emoji: '✨',
        iconName: 'Sparkles',
        desc: 'Describe how this capability helps brands grow and stand out.',
        startingPrice: '₹5,000',
        deliverables: ['Custom Strategy', 'Creative Execution', 'Quality Handoff'],
      },
    ]);
  };

  const handleDeleteService = (idx: number) => {
    if (servicesList.length <= 1) {
      onNotify('error', 'At least one service must remain.');
      return;
    }
    setServicesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCmsServicesData(servicesList);
      await onRefresh();
      onNotify(
        'success',
        'Services & capabilities saved to Supabase and updated across the website.'
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            SERVICES & CAPABILITIES CMS
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900 mt-0.5">
            Service Offerings ({servicesList.length})
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Edit the service cards, descriptions, icons, emojis, starting prices, and deliverables shown on the Home page and /services page.
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
            onClick={handleAddService}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#00685b] bg-[#00685b]/5 hover:bg-[#00685b]/10 px-3.5 py-2.5 font-display text-xs font-bold text-[#00685b] transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Service Card</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] disabled:opacity-60 px-5 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Services'}</span>
          </button>
        </div>
      </div>

      {/* Services Cards Editor List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {servicesList.map((srv, idx) => (
          <div
            key={`${srv.id}-${idx}`}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-9 w-9 rounded-xl bg-[#00685b]/10 text-[#00685b] flex items-center justify-center text-base">
                    {srv.emoji || '✨'}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-black text-slate-900">
                      {srv.title}
                    </h3>
                    <span className="font-mono text-[10px] text-slate-400">
                      Deep-Dive Tab: {srv.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === servicesList.length - 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(idx)}
                    className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Service Title
                  </label>
                  <input
                    type="text"
                    value={srv.title}
                    onChange={(e) =>
                      handleUpdateItem(idx, {
                        title: e.target.value,
                        label: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Deep-Dive Interactive Module
                  </label>
                  <select
                    value={srv.id}
                    onChange={(e) =>
                      handleUpdateItem(idx, { id: e.target.value as ServiceTab })
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

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Emoji (Home Grid)
                  </label>
                  <input
                    type="text"
                    value={srv.emoji}
                    onChange={(e) =>
                      handleUpdateItem(idx, { emoji: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Icon (Services Grid)
                  </label>
                  <select
                    value={srv.iconName}
                    onChange={(e) =>
                      handleUpdateItem(idx, { iconName: e.target.value })
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
                    Starting Price
                  </label>
                  <input
                    type="text"
                    value={srv.startingPrice || ''}
                    onChange={(e) =>
                      handleUpdateItem(idx, { startingPrice: e.target.value })
                    }
                    placeholder="₹5,000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-xs text-[#00685b] font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Service Description
                </label>
                <textarea
                  rows={2}
                  value={srv.desc}
                  onChange={(e) =>
                    handleUpdateItem(idx, { desc: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:border-[#00685b] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Key Deliverables / Highlights (comma-separated)
                </label>
                <input
                  type="text"
                  value={(srv.deliverables || []).join(', ')}
                  onChange={(e) =>
                    handleUpdateItem(idx, {
                      deliverables: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Logo Design, Brand Guidelines, Social Kit"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-700 focus:border-[#00685b] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
