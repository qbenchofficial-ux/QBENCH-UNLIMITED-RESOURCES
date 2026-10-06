import React, { useState, useEffect } from 'react';
import {
  saveCmsPackagesData,
  DEFAULT_PACKAGES_DATA,
  DEFAULT_BUSINESS_SUPPORT_CONFIG,
  type CmsPackageCategory,
  type CmsBusinessSupportConfig,
  type PackageFeatureRow,
} from '../services/siteContentService';
import { slugify } from '../lib/supabase';
import {
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Loader2,
  Package,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface PackagesManagerProps {
  packages: CmsPackageCategory[];
  businessSupport: CmsBusinessSupportConfig;
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const ICON_OPTIONS = [
  'Compass',
  'Share2',
  'Video',
  'Target',
  'Layers',
  'Laptop',
  'Sparkles',
  'TrendingUp',
  'Briefcase',
];

function formatFeatureInput(val: string | boolean): string {
  if (val === true) return 'true';
  if (val === false) return 'false';
  return String(val);
}

function parseFeatureInput(raw: string): string | boolean {
  const trimmed = raw.trim();
  if (trimmed.toLowerCase() === 'true' || trimmed === '✓') return true;
  if (trimmed.toLowerCase() === 'false' || trimmed === '' || trimmed === '—') {
    return false;
  }
  return trimmed;
}

export default function PackagesManager({
  packages: initialPackages,
  businessSupport: initialBusinessSupport,
  onRefresh,
  onNotify,
}: PackagesManagerProps) {
  const [packagesList, setPackagesList] = useState<CmsPackageCategory[]>(
    initialPackages.length > 0 ? initialPackages : DEFAULT_PACKAGES_DATA
  );
  const [bsConfig, setBsConfig] = useState<CmsBusinessSupportConfig>(
    initialBusinessSupport || DEFAULT_BUSINESS_SUPPORT_CONFIG
  );
  const [selectedId, setSelectedId] = useState<string>(
    initialPackages[0]?.id || 'branding'
  );
  const [activeMode, setActiveMode] = useState<'categories' | 'business-support'>(
    'categories'
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialPackages && initialPackages.length > 0) {
      setPackagesList(initialPackages);
    }
  }, [initialPackages]);

  useEffect(() => {
    if (initialBusinessSupport) {
      setBsConfig(initialBusinessSupport);
    }
  }, [initialBusinessSupport]);

  const currentPkg =
    packagesList.find((p) => p.id === selectedId) || packagesList[0];

  const updateCurrentPkg = (updater: (pkg: CmsPackageCategory) => CmsPackageCategory) => {
    setPackagesList((prev) =>
      prev.map((p) => (p.id === currentPkg.id ? updater(p) : p))
    );
  };

  const handleAddCategory = () => {
    const newId = `custom-pkg-${Date.now().toString(36)}`;
    const newCat: CmsPackageCategory = {
      id: newId,
      name: 'New Service Package',
      description: 'Custom package description and deliverables.',
      iconName: 'Sparkles',
      tierNames: {
        basic: 'Basic',
        standard: 'Standard',
        premium: 'Premium',
      },
      tierDescriptions: {
        basic: 'Essential starter deliverables for new projects.',
        standard: 'Recommended full-featured package for growing brands.',
        premium: 'Complete end-to-end solution with priority support.',
      },
      tierTimelines: {
        basic: 'approx. 1-2 Weeks',
        standard: 'approx. 3-4 Weeks',
        premium: 'Continuous Sprint Delivery',
      },
      prices: { basic: 5000, standard: 15000, premium: 35000 },
      priceLabels: { basic: '₹5,000', standard: '₹15,000', premium: '₹35,000' },
      features: [
        { name: 'Core Deliverable 1', basic: true, standard: true, premium: true },
        { name: 'Revision Rounds', basic: '2 Rounds', standard: '4 Rounds', premium: 'Unlimited' },
        { name: 'Priority Support', basic: false, standard: true, premium: true },
      ],
    };
    setPackagesList((prev) => [...prev, newCat]);
    setSelectedId(newId);
    setActiveMode('categories');
  };

  const handleDeleteCategory = (id: string) => {
    if (packagesList.length <= 1) {
      onNotify('error', 'At least one package category must remain.');
      return;
    }
    const next = packagesList.filter((p) => p.id !== id);
    setPackagesList(next);
    if (selectedId === id && next[0]) {
      setSelectedId(next[0].id);
    }
  };

  const handleFeatureChange = (
    idx: number,
    field: keyof PackageFeatureRow,
    value: string | boolean
  ) => {
    updateCurrentPkg((pkg) => {
      const nextFeatures = [...pkg.features];
      nextFeatures[idx] = {
        ...nextFeatures[idx],
        [field]: value,
      };
      return { ...pkg, features: nextFeatures };
    });
  };

  const handleAddFeatureRow = () => {
    updateCurrentPkg((pkg) => ({
      ...pkg,
      features: [
        ...pkg.features,
        {
          name: 'New Deliverable / Feature',
          basic: false,
          standard: true,
          premium: true,
        },
      ],
    }));
  };

  const handleDeleteFeatureRow = (idx: number) => {
    updateCurrentPkg((pkg) => ({
      ...pkg,
      features: pkg.features.filter((_, i) => i !== idx),
    }));
  };

  const handleMoveFeatureRow = (idx: number, dir: -1 | 1) => {
    updateCurrentPkg((pkg) => {
      const next = [...pkg.features];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return pkg;
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return { ...pkg, features: next };
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveCmsPackagesData(packagesList, bsConfig);
      await onRefresh();
      onNotify(
        'success',
        'Packages, pricing tiers, comparison matrix, and calculator settings saved to Supabase.'
      );
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to save packages.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setPackagesList(DEFAULT_PACKAGES_DATA);
    setBsConfig(DEFAULT_BUSINESS_SUPPORT_CONFIG);
    setSelectedId(DEFAULT_PACKAGES_DATA[0].id);
    setSaving(true);
    try {
      await saveCmsPackagesData(
        DEFAULT_PACKAGES_DATA,
        DEFAULT_BUSINESS_SUPPORT_CONFIG
      );
      await onRefresh();
      onNotify('success', 'Restored default QBENCH packages and pricing.');
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to reset packages.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            PACKAGES & PRICING CMS
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900 mt-0.5">
            Manage Packages, Tiers & Calculator ({packagesList.length} Categories)
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Edit prices, tier names, timelines, deliverables matrices, and Business Support plans shown on /packages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
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
            <span>Add Package Category</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] disabled:opacity-60 px-5 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2">
        <button
          type="button"
          onClick={() => setActiveMode('categories')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'categories'
              ? 'bg-[#00685b] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Service Package Tiers & Matrix ({packagesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('business-support')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'business-support'
              ? 'bg-[#00685b] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Business Support Plans & Add-Ons</span>
        </button>
      </div>

      {activeMode === 'categories' && currentPkg && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Category Selector */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Select Package Category
            </span>
            <div className="space-y-1">
              {packagesList.map((pkg) => {
                const isSelected = pkg.id === currentPkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-display font-bold transition-all ${
                      isSelected
                        ? 'bg-[#00685b] text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(pkg.id)}
                      className="flex-1 text-left truncate cursor-pointer"
                    >
                      {pkg.name}
                    </button>
                    {packagesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(pkg.id)}
                        title="Delete package category"
                        className={`ml-2 p-1 rounded hover:bg-red-500/20 cursor-pointer ${
                          isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-red-600'
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Package Editor */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1. Category Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-display text-base font-black text-slate-900">
                  Category Details: {currentPkg.name}
                </h3>
                <span className="font-mono text-[11px] text-slate-400">
                  ID: {currentPkg.id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={currentPkg.name}
                    onChange={(e) =>
                      updateCurrentPkg((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Slug / ID
                  </label>
                  <input
                    type="text"
                    value={currentPkg.id}
                    onChange={(e) => {
                      const nextId = slugify(e.target.value) || currentPkg.id;
                      updateCurrentPkg((p) => ({ ...p, id: nextId }));
                      setSelectedId(nextId);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 font-mono text-xs text-slate-700 focus:border-[#00685b] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Icon
                  </label>
                  <select
                    value={currentPkg.iconName}
                    onChange={(e) =>
                      updateCurrentPkg((p) => ({ ...p, iconName: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Category Overview Description
                </label>
                <textarea
                  rows={2}
                  value={currentPkg.description}
                  onChange={(e) =>
                    updateCurrentPkg((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Three Pricing Tiers (Basic / Standard / Premium) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="font-display text-base font-black text-slate-900">
                  Pricing Tiers & Calculator Values
                </h3>
                <p className="font-sans text-xs text-slate-500">
                  Set both the formatted display price (e.g. ₹12,000 or Custom) and the numeric value used in the Interactive Blueprint Calculator.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  [
                    { key: 'basic', label: 'Tier 1 — Basic / Starter' },
                    { key: 'standard', label: 'Tier 2 — Standard (Recommended)' },
                    { key: 'premium', label: 'Tier 3 — Premium / Enterprise' },
                  ] as const
                ).map((tier) => (
                  <div
                    key={tier.key}
                    className={`rounded-2xl border p-4 space-y-3 ${
                      tier.key === 'standard'
                        ? 'border-[#00685b] bg-[#00685b]/[0.03]'
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <span className="font-tech text-[10px] font-extrabold uppercase tracking-wider text-[#00685b] block">
                      {tier.label}
                    </span>

                    <div className="space-y-1">
                      <label className="block font-tech text-[10px] font-bold uppercase text-slate-600">
                        Tier Display Title
                      </label>
                      <input
                        type="text"
                        value={
                          currentPkg.tierNames?.[tier.key] ??
                          (tier.key === 'basic'
                            ? 'Basic'
                            : tier.key === 'standard'
                            ? 'Standard'
                            : 'Premium')
                        }
                        onChange={(e) =>
                          updateCurrentPkg((p) => ({
                            ...p,
                            tierNames: {
                              basic: p.tierNames?.basic || 'Basic',
                              standard: p.tierNames?.standard || 'Standard',
                              premium: p.tierNames?.premium || 'Premium',
                              [tier.key]: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-[#00685b] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-tech text-[10px] font-bold uppercase text-slate-600">
                        Display Price Label (e.g. ₹12,000)
                      </label>
                      <input
                        type="text"
                        value={currentPkg.priceLabels[tier.key]}
                        onChange={(e) =>
                          updateCurrentPkg((p) => ({
                            ...p,
                            priceLabels: {
                              ...p.priceLabels,
                              [tier.key]: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-extrabold text-[#00685b] focus:border-[#00685b] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-tech text-[10px] font-bold uppercase text-slate-600">
                        Numeric Price for Calculator (INR)
                      </label>
                      <input
                        type="number"
                        value={Number(currentPkg.prices[tier.key]) || 0}
                        onChange={(e) =>
                          updateCurrentPkg((p) => ({
                            ...p,
                            prices: {
                              ...p.prices,
                              [tier.key]: Number(e.target.value) || 0,
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-800 focus:border-[#00685b] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-tech text-[10px] font-bold uppercase text-slate-600">
                        Timeline Objective
                      </label>
                      <input
                        type="text"
                        value={
                          currentPkg.tierTimelines?.[tier.key] ??
                          (tier.key === 'basic'
                            ? 'approx. 1-2 Weeks'
                            : tier.key === 'standard'
                            ? 'approx. 3-4 Weeks'
                            : 'Continuous Sprint Delivery')
                        }
                        onChange={(e) =>
                          updateCurrentPkg((p) => ({
                            ...p,
                            tierTimelines: {
                              basic: p.tierTimelines?.basic || 'approx. 1-2 Weeks',
                              standard: p.tierTimelines?.standard || 'approx. 3-4 Weeks',
                              premium:
                                p.tierTimelines?.premium ||
                                'Continuous Sprint Delivery',
                              [tier.key]: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[11px] text-slate-700 focus:border-[#00685b] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-tech text-[10px] font-bold uppercase text-slate-600">
                        Tier Subtitle
                      </label>
                      <textarea
                        rows={2}
                        value={
                          currentPkg.tierDescriptions?.[tier.key] ??
                          'Deliverables tailored to your project stage.'
                        }
                        onChange={(e) =>
                          updateCurrentPkg((p) => ({
                            ...p,
                            tierDescriptions: {
                              basic:
                                p.tierDescriptions?.basic ||
                                'Essential tools designed to establish initial capability.',
                              standard:
                                p.tierDescriptions?.standard ||
                                'Fully featured setup delivering complete utility.',
                              premium:
                                p.tierDescriptions?.premium ||
                                'Maximized capability targets and enterprise support.',
                              [tier.key]: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-[#00685b] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Deliverables & Comparison Matrix Editor */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-black text-slate-900">
                    Deliverables & Features Matrix ({currentPkg.features.length} rows)
                  </h3>
                  <p className="font-sans text-xs text-slate-500">
                    Enter <code className="bg-slate-100 px-1 rounded">true</code> for Included (✓),{' '}
                    <code className="bg-slate-100 px-1 rounded">false</code> for Not Included (—), or any custom badge text like{' '}
                    <code className="bg-slate-100 px-1 rounded">8 Posts</code> or{' '}
                    <code className="bg-slate-100 px-1 rounded">Unlimited</code>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddFeatureRow}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] hover:bg-[#005348] px-3.5 py-2 font-display text-xs font-bold text-white cursor-pointer self-start"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Feature Row</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 font-tech text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 pr-3">Deliverable / Feature Name</th>
                      <th className="py-2.5 px-2">Basic Value</th>
                      <th className="py-2.5 px-2">Standard Value</th>
                      <th className="py-2.5 px-2">Premium Value</th>
                      <th className="py-2.5 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {currentPkg.features.map((feat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 pr-3">
                          <input
                            type="text"
                            value={feat.name}
                            onChange={(e) =>
                              handleFeatureChange(idx, 'name', e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-900 focus:border-[#00685b] focus:outline-none"
                          />
                        </td>
                        {(['basic', 'standard', 'premium'] as const).map(
                          (tierKey) => (
                            <td key={tierKey} className="py-2.5 px-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={formatFeatureInput(feat[tierKey])}
                                  onChange={(e) =>
                                    handleFeatureChange(
                                      idx,
                                      tierKey,
                                      parseFeatureInput(e.target.value)
                                    )
                                  }
                                  placeholder="true / false / 8 Posts"
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800 focus:border-[#00685b] focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleFeatureChange(
                                      idx,
                                      tierKey,
                                      feat[tierKey] === false ? true : false
                                    )
                                  }
                                  title="Toggle Included / Excluded"
                                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer shrink-0 ${
                                    feat[tierKey] !== false
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {feat[tierKey] !== false ? '✓' : '—'}
                                </button>
                              </div>
                            </td>
                          )
                        )}
                        <td className="py-2.5 pl-2 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            onClick={() => handleMoveFeatureRow(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFeatureRow(idx, 1)}
                            disabled={idx === currentPkg.features.length - 1}
                            className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeatureRow(idx)}
                            className="p-1 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'business-support' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="font-display text-base font-black text-slate-900">
              Business Support Operations Header
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={bsConfig.badge}
                  onChange={(e) =>
                    setBsConfig({ ...bsConfig, badge: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={bsConfig.headline}
                  onChange={(e) =>
                    setBsConfig({ ...bsConfig, headline: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Description
              </label>
              <textarea
                rows={2}
                value={bsConfig.description}
                onChange={(e) =>
                  setBsConfig({ ...bsConfig, description: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900"
              />
            </div>
          </div>

          {/* 3 Business Support Monthly Packages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Starter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <span className="font-tech text-[10px] font-extrabold uppercase text-[#00685b]">
                Plan 1 — Starter
              </span>
              <input
                type="text"
                value={bsConfig.starterName}
                onChange={(e) =>
                  setBsConfig({ ...bsConfig, starterName: e.target.value })
                }
                placeholder="Starter Package"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold"
              />
              <input
                type="text"
                value={bsConfig.starterPriceLabel}
                onChange={(e) =>
                  setBsConfig({ ...bsConfig, starterPriceLabel: e.target.value })
                }
                placeholder="₹4,999"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-extrabold text-[#00685b]"
              />
              <textarea
                rows={2}
                value={bsConfig.starterSubtitle}
                onChange={(e) =>
                  setBsConfig({ ...bsConfig, starterSubtitle: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              />
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-600">
                  Inclusions (one per line)
                </label>
                <textarea
                  rows={6}
                  value={bsConfig.starterInclusions.join('\n')}
                  onChange={(e) =>
                    setBsConfig({
                      ...bsConfig,
                      starterInclusions: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            {/* Growth */}
            <div className="bg-white border-2 border-[#00685b] rounded-2xl p-5 space-y-3 shadow-2xs">
              <span className="font-tech text-[10px] font-extrabold uppercase text-[#00685b]">
                Plan 2 — Growth (Recommended)
              </span>
              <input
                type="text"
                value={bsConfig.growthName}
                onChange={(e) =>
                  setBsConfig({ ...bsConfig, growthName: e.target.value })
                }
                placeholder="Growth Package"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold"
              />
              <input
                type="text"
                value={bsConfig.growthPriceLabel}
                onChange={(e) =>
                  setBsConfig({ ...bsConfig, growthPriceLabel: e.target.value })
                }
                placeholder="₹9,999"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-extrabold text-[#00685b]"
              />
              <textarea
                rows={2}
                value={bsConfig.growthSubtitle}
                onChange={(e) =>
                  setBsConfig({ ...bsConfig, growthSubtitle: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              />
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-600">
                  Inclusions (one per line)
                </label>
                <textarea
                  rows={6}
                  value={bsConfig.growthInclusions.join('\n')}
                  onChange={(e) =>
                    setBsConfig({
                      ...bsConfig,
                      growthInclusions: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            {/* Business Partner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <span className="font-tech text-[10px] font-extrabold uppercase text-[#00685b]">
                Plan 3 — Business Partner
              </span>
              <input
                type="text"
                value={bsConfig.partnerName}
                onChange={(e) =>
                  setBsConfig({ ...bsConfig, partnerName: e.target.value })
                }
                placeholder="Business Partner"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold"
              />
              <input
                type="text"
                value={bsConfig.partnerPriceLabel}
                onChange={(e) =>
                  setBsConfig({ ...bsConfig, partnerPriceLabel: e.target.value })
                }
                placeholder="₹19,999"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-extrabold text-[#00685b]"
              />
              <textarea
                rows={2}
                value={bsConfig.partnerSubtitle}
                onChange={(e) =>
                  setBsConfig({ ...bsConfig, partnerSubtitle: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              />
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-600">
                  Inclusions (one per line)
                </label>
                <textarea
                  rows={6}
                  value={bsConfig.partnerInclusions.join('\n')}
                  onChange={(e) =>
                    setBsConfig({
                      ...bsConfig,
                      partnerInclusions: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Add-on services */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-black text-slate-900">
                Business Support Add-On Services ({bsConfig.addons.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  setBsConfig({
                    ...bsConfig,
                    addons: [
                      ...bsConfig.addons,
                      { name: 'New Add-On Service', price: 'Starting from ₹1,000' },
                    ],
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] px-3.5 py-2 font-display text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Add-On</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bsConfig.addons.map((addon, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 bg-slate-50/40"
                >
                  <input
                    type="text"
                    value={addon.name}
                    onChange={(e) => {
                      const next = [...bsConfig.addons];
                      next[idx] = { ...next[idx], name: e.target.value };
                      setBsConfig({ ...bsConfig, addons: next });
                    }}
                    placeholder="Service Name"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={addon.price}
                    onChange={(e) => {
                      const next = [...bsConfig.addons];
                      next[idx] = { ...next[idx], price: e.target.value };
                      setBsConfig({ ...bsConfig, addons: next });
                    }}
                    placeholder="Starting from ₹500"
                    className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-[#00685b] font-bold"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setBsConfig({
                        ...bsConfig,
                        addons: bsConfig.addons.filter((_, i) => i !== idx),
                      })
                    }
                    className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
