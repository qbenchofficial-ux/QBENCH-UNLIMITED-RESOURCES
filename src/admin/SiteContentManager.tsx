import React, { useState, useEffect } from 'react';
import {
  saveCmsWebsiteContent,
  DEFAULT_WEBSITE_CONTENT,
  type CmsWebsiteContent,
} from '../services/siteContentService';
import { uploadPortfolioImage } from '../services/mediaService';
import {
  Save,
  RotateCcw,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Home,
  GitBranch,
  Users,
  Sparkles,
} from 'lucide-react';

interface SiteContentManagerProps {
  websiteContent: CmsWebsiteContent;
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function SiteContentManager({
  websiteContent: initialContent,
  onRefresh,
  onNotify,
}: SiteContentManagerProps) {
  const [content, setContent] = useState<CmsWebsiteContent>(
    initialContent || DEFAULT_WEBSITE_CONTENT
  );
  const [activeTab, setActiveTab] = useState<
    'home' | 'headers' | 'process' | 'team'
  >('home');
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCmsWebsiteContent(content);
      await onRefresh();
      onNotify(
        'success',
        'Website content, process timeline, team members, and section headers saved to Supabase.'
      );
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to save website content.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setContent(DEFAULT_WEBSITE_CONTENT);
    setSaving(true);
    try {
      await saveCmsWebsiteContent(DEFAULT_WEBSITE_CONTENT);
      await onRefresh();
      onNotify('success', 'Restored default QBENCH website copy and sections.');
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to reset website content.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (
    file: File,
    keyId: string,
    onUrlReady: (url: string) => void
  ) => {
    setUploadingKey(keyId);
    try {
      const uploaded = await uploadPortfolioImage(file, 'library');
      onUrlReady(uploaded.url);
      onNotify('success', 'Image uploaded to Supabase Storage.');
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Image upload failed.'
      );
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            WEBSITE CONTENT & SECTIONS CMS
          </span>
          <h2 className="font-display text-2xl font-black text-slate-900 mt-0.5">
            Edit Hero, Process Steps, Team & Page Copy
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Customize headlines, descriptions, process stages, metrics, team members, and studio locations across the website.
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
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] disabled:opacity-60 px-5 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Website Content'}</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-[#00685b] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Home className="h-4 w-4" />
          <span>Homepage Hero & Highlights</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('headers')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'headers'
              ? 'bg-[#00685b] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Services & Packages Page Copy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('process')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'process'
              ? 'bg-[#00685b] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          <span>Process Timeline & Metrics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'bg-[#00685b] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Team & Studio Locations</span>
        </button>
      </div>

      {/* TAB 1: HOMEPAGE */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="font-display text-base font-black text-slate-900">
              Homepage Hero Section
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Hero Top Badge
                </label>
                <input
                  type="text"
                  value={content.heroBadge}
                  onChange={(e) =>
                    setContent({ ...content, heroBadge: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Headline Line 1
                </label>
                <input
                  type="text"
                  value={content.heroTitleLine1}
                  onChange={(e) =>
                    setContent({ ...content, heroTitleLine1: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Highlighted Phrase (Teal)
                </label>
                <input
                  type="text"
                  value={content.heroTitleHighlight}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      heroTitleHighlight: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-bold text-[#00685b]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Hero Intro Paragraph
              </label>
              <textarea
                rows={3}
                value={content.heroDescription}
                onChange={(e) =>
                  setContent({ ...content, heroDescription: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Primary CTA Button Text
                </label>
                <input
                  type="text"
                  value={content.heroPrimaryCta}
                  onChange={(e) =>
                    setContent({ ...content, heroPrimaryCta: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Secondary CTA Button Text
                </label>
                <input
                  type="text"
                  value={content.heroSecondaryCta}
                  onChange={(e) =>
                    setContent({ ...content, heroSecondaryCta: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Trust Bar Tagline
                </label>
                <input
                  type="text"
                  value={content.heroTrustNote}
                  onChange={(e) =>
                    setContent({ ...content, heroTrustNote: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Why Choose QBench on Home */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="font-display text-base font-black text-slate-900">
              Homepage — Why Choose QBench Pillars
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {content.homeWhyChoose.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50/40"
                >
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const next = [...content.homeWhyChoose];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setContent({ ...content, homeWhyChoose: next });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
                  />
                  <textarea
                    rows={2}
                    value={item.desc}
                    onChange={(e) => {
                      const next = [...content.homeWhyChoose];
                      next[idx] = { ...next[idx], desc: e.target.value };
                      setContent({ ...content, homeWhyChoose: next });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES & PACKAGES HEADERS */}
      {activeTab === 'headers' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="font-display text-base font-black text-slate-900">
              Services Page (/services) Hero Copy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Badge
                </label>
                <input
                  type="text"
                  value={content.servicesHeroBadge}
                  onChange={(e) =>
                    setContent({ ...content, servicesHeroBadge: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Headline Line 1
                </label>
                <input
                  type="text"
                  value={content.servicesHeroTitleLine1}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      servicesHeroTitleLine1: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Headline Line 2
                </label>
                <input
                  type="text"
                  value={content.servicesHeroTitleLine2}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      servicesHeroTitleLine2: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Highlighted Line 3 (Teal)
                </label>
                <input
                  type="text"
                  value={content.servicesHeroTitleHighlight}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      servicesHeroTitleHighlight: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold text-[#00685b]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Services Hero Description
              </label>
              <textarea
                rows={3}
                value={content.servicesHeroDescription}
                onChange={(e) =>
                  setContent({
                    ...content,
                    servicesHeroDescription: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="font-display text-base font-black text-slate-900">
              Packages Page (/packages) Header Copy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Badge
                </label>
                <input
                  type="text"
                  value={content.packagesBadge}
                  onChange={(e) =>
                    setContent({ ...content, packagesBadge: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Headline Line 1
                </label>
                <input
                  type="text"
                  value={content.packagesTitleLine1}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      packagesTitleLine1: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Highlighted Line 2
                </label>
                <input
                  type="text"
                  value={content.packagesTitleHighlight}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      packagesTitleHighlight: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold text-[#00685b]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                Packages Header Description
              </label>
              <textarea
                rows={2}
                value={content.packagesDescription}
                onChange={(e) =>
                  setContent({
                    ...content,
                    packagesDescription: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROCESS TIMELINE & METRICS */}
      {activeTab === 'process' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-black text-slate-900">
                Process Timeline Stages ({content.processSteps.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    processSteps: [
                      ...content.processSteps,
                      {
                        number: `0${content.processSteps.length + 1}`,
                        title: 'New Process Stage',
                        description: 'Describe this stage in the workflow.',
                        activities: ['Action 1', 'Action 2', 'Action 3', 'Action 4'],
                        imageUrl:
                          'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
                        iconName: 'Search',
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] px-3.5 py-2 font-display text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Stage</span>
              </button>
            </div>

            <div className="space-y-4">
              {content.processSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-slate-50/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-tech text-xs font-extrabold uppercase text-[#00685b]">
                      Stage {step.number} — {step.title}
                    </span>
                    {content.processSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setContent({
                            ...content,
                            processSteps: content.processSteps.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={step.number}
                      onChange={(e) => {
                        const next = [...content.processSteps];
                        next[idx] = { ...next[idx], number: e.target.value };
                        setContent({ ...content, processSteps: next });
                      }}
                      placeholder="01"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const next = [...content.processSteps];
                        next[idx] = { ...next[idx], title: e.target.value };
                        setContent({ ...content, processSteps: next });
                      }}
                      placeholder="Stage Title"
                      className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
                    />
                  </div>

                  <textarea
                    rows={2}
                    value={step.description}
                    onChange={(e) => {
                      const next = [...content.processSteps];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setContent({ ...content, processSteps: next });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-tech text-[10px] font-bold uppercase text-slate-600">
                        Execution Actions (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={step.activities.join(', ')}
                        onChange={(e) => {
                          const next = [...content.processSteps];
                          next[idx] = {
                            ...next[idx],
                            activities: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          };
                          setContent({ ...content, processSteps: next });
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-tech text-[10px] font-bold uppercase text-slate-600">
                        Stage Image URL or Upload
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={step.imageUrl}
                          onChange={(e) => {
                            const next = [...content.processSteps];
                            next[idx] = {
                              ...next[idx],
                              imageUrl: e.target.value,
                            };
                            setContent({ ...content, processSteps: next });
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs"
                        />
                        <label className="inline-flex items-center gap-1 rounded-lg bg-[#00685b]/10 px-2.5 py-1.5 text-xs font-bold text-[#00685b] hover:bg-[#00685b]/20 cursor-pointer shrink-0">
                          {uploadingKey === `proc-${idx}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadImage(file, `proc-${idx}`, (url) => {
                                  const next = [...content.processSteps];
                                  next[idx] = { ...next[idx], imageUrl: url };
                                  setContent({
                                    ...content,
                                    processSteps: next,
                                  });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Process Metrics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="font-display text-base font-black text-slate-900">
              Process Page KPI Metrics Banner
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {content.processMetrics.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50/40"
                >
                  <input
                    type="text"
                    value={m.value}
                    onChange={(e) => {
                      const next = [...content.processMetrics];
                      next[idx] = { ...next[idx], value: e.target.value };
                      setContent({ ...content, processMetrics: next });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm font-black text-[#00685b]"
                  />
                  <input
                    type="text"
                    value={m.label}
                    onChange={(e) => {
                      const next = [...content.processMetrics];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setContent({ ...content, processMetrics: next });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
                  />
                  <textarea
                    rows={2}
                    value={m.description}
                    onChange={(e) => {
                      const next = [...content.processMetrics];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setContent({ ...content, processMetrics: next });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TEAM & STUDIO LOCATIONS */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-black text-slate-900">
                Leadership & Team Members ({content.teamMembers.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    teamMembers: [
                      ...content.teamMembers,
                      {
                        id: `team-${Date.now()}`,
                        name: 'New Team Member',
                        role: 'CREATIVE DIRECTOR',
                        roleBadge: 'Creative Lead, QBench',
                        imageUrl:
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=800&q=80',
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] px-3.5 py-2 font-display text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Team Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {content.teamMembers.map((member, idx) => (
                <div
                  key={member.id || idx}
                  className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs font-bold text-slate-800">
                      {member.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setContent({
                          ...content,
                          teamMembers: content.teamMembers.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="p-1 rounded border border-red-200 bg-red-50 text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => {
                      const next = [...content.teamMembers];
                      next[idx] = { ...next[idx], name: e.target.value };
                      setContent({ ...content, teamMembers: next });
                    }}
                    placeholder="Full Name"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={member.role}
                    onChange={(e) => {
                      const next = [...content.teamMembers];
                      next[idx] = { ...next[idx], role: e.target.value };
                      setContent({ ...content, teamMembers: next });
                    }}
                    placeholder="ROLE"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-tech text-xs text-[#00685b] font-bold"
                  />
                  <input
                    type="text"
                    value={member.roleBadge}
                    onChange={(e) => {
                      const next = [...content.teamMembers];
                      next[idx] = { ...next[idx], roleBadge: e.target.value };
                      setContent({ ...content, teamMembers: next });
                    }}
                    placeholder="Role Subtitle"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={member.imageUrl}
                      onChange={(e) => {
                        const next = [...content.teamMembers];
                        next[idx] = { ...next[idx], imageUrl: e.target.value };
                        setContent({ ...content, teamMembers: next });
                      }}
                      placeholder="Photo URL"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-[11px]"
                    />
                    <label className="inline-flex items-center gap-1 rounded-lg bg-[#00685b]/10 px-2.5 py-1.5 text-xs font-bold text-[#00685b] cursor-pointer shrink-0">
                      {uploadingKey === `team-${idx}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadImage(file, `team-${idx}`, (url) => {
                              const next = [...content.teamMembers];
                              next[idx] = { ...next[idx], imageUrl: url };
                              setContent({ ...content, teamMembers: next });
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
