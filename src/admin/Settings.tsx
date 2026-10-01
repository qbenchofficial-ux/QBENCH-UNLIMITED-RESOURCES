import React, { useState, useEffect } from 'react';
import { saveSiteSettings } from '../services/projectService';
import type { SiteSettings } from '../types/project';
import { Save, Loader2 } from 'lucide-react';

interface SettingsProps {
  settings: SiteSettings;
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function Settings({
  settings,
  onRefresh,
  onNotify,
}: SettingsProps) {
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSiteSettings(form);
      onNotify('success', 'QBENCH agency settings saved to Supabase.');
      await onRefresh();
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to save agency settings.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
          AGENCY CONFIGURATION
        </span>
        <h2 className="font-display text-2xl font-black text-slate-900 mt-0.5">
          QBENCH Website Settings
        </h2>
        <p className="font-sans text-xs text-slate-500 mt-1">
          Edit basic QBENCH agency details, contact channels, and social links stored in Supabase.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Agency Name
            </label>
            <input
              type="text"
              required
              value={form.agency_name}
              onChange={(e) => setForm({ ...form, agency_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Phone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
              WhatsApp Number
            </label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Agency Description
          </label>
          <textarea
            rows={3}
            value={form.agency_description}
            onChange={(e) =>
              setForm({ ...form, agency_description: e.target.value })
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Instagram URL
            </label>
            <input
              type="url"
              value={form.instagram_url}
              onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
              placeholder="https://www.instagram.com/..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              placeholder="https://www.linkedin.com/..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Behance URL
            </label>
            <input
              type="url"
              value={form.behance_url}
              onChange={(e) => setForm({ ...form, behance_url: e.target.value })}
              placeholder="https://www.behance.net/..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Website URL
            </label>
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              placeholder="https://qbench.agency"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] disabled:opacity-60 px-6 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Agency Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
