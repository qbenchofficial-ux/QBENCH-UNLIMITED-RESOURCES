import React, { useState, useEffect } from 'react';
import { saveSiteSettings } from '../services/projectService';
import { supabase } from '../lib/supabase';
import {
  sendEmailJSDiagnosticTest,
  type EmailJSDiagnosticTestResult,
} from '../lib/emailService';
import type { SiteSettings } from '../types/project';
import {
  Save,
  Loader2,
  MailCheck,
  AlertCircle,
  CheckCircle2,
  Send,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
} from 'lucide-react';

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
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] =
    useState<EmailJSDiagnosticTestResult | null>(null);

  // Password Management States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

  // Password Reset Email States
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailSuccess, setResetEmailSuccess] = useState<string | null>(null);
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMessage(null);
    setPasswordSuccessMessage(null);

    if (newPassword.length < 8) {
      const err = 'New password must be at least 8 characters long.';
      setPasswordErrorMessage(err);
      onNotify('error', err);
      return;
    }

    if (newPassword !== confirmPassword) {
      const err = 'New password and confirmation do not match.';
      setPasswordErrorMessage(err);
      onNotify('error', err);
      return;
    }

    setUpdatingPassword(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      const successMsg = 'Admin password updated successfully. Your new credentials are now active.';
      setPasswordSuccessMessage(successMsg);
      setNewPassword('');
      setConfirmPassword('');
      onNotify('success', successMsg);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update admin password.';
      setPasswordErrorMessage(errMsg);
      onNotify('error', errMsg);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    setResetEmailError(null);
    setResetEmailSuccess(null);
    setSendingResetEmail(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetEmail = (user?.email || form.email || 'qbench.official@gmail.com').trim();

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/admin/settings`
        : 'https://qbench-unlimited-resources-qbench2.vercel.app/admin/settings';

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      const msg = `Password recovery link dispatched to ${targetEmail}. Check your inbox to complete the reset.`;
      setResetEmailSuccess(msg);
      onNotify('success', msg);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send password reset email.';
      setResetEmailError(errMsg);
      onNotify('error', errMsg);
    } finally {
      setSendingResetEmail(false);
    }
  };

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

  const handleRunEmailDiagnostic = async () => {
    setRunningDiagnostic(true);
    setDiagnosticResult(null);
    try {
      const targetEmail = (form.email || 'qbench.official@gmail.com').trim();
      const result = await sendEmailJSDiagnosticTest({
        adminEmail: targetEmail,
        includeCustomerTemplate: true,
      });
      setDiagnosticResult(result);
      if (result.success) {
        onNotify('success', result.message);
      } else {
        onNotify('error', result.message);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'EmailJS diagnostic test failed.';
      onNotify('error', msg);
    } finally {
      setRunningDiagnostic(false);
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

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
              EMAIL DELIVERY DIAGNOSTICS
            </span>
            <h3 className="font-display text-lg font-black text-slate-900 mt-0.5">
              EmailJS Service &amp; Template Verification
            </h3>
            <p className="font-sans text-xs text-slate-500 mt-1">
              Send a dummy diagnostic email to the administrator ({form.email || 'qbench.official@gmail.com'}) to verify that the EmailJS Service ID and Template IDs are configured and reachable.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunEmailDiagnostic}
            disabled={runningDiagnostic}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#00685b] bg-[#00685b]/5 hover:bg-[#00685b] hover:text-white disabled:opacity-60 px-5 py-2.5 font-display text-xs font-bold text-[#00685b] transition-colors cursor-pointer shrink-0"
          >
            {runningDiagnostic ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Testing EmailJS...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Diagnostic Test Email</span>
              </>
            )}
          </button>
        </div>

        {diagnosticResult && (
          <div
            className={`rounded-xl border p-4 space-y-3 text-xs ${
              diagnosticResult.success
                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                : 'border-amber-200 bg-amber-50/70 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {diagnosticResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-display font-bold">
                  {diagnosticResult.message}
                </p>
                <p className="text-[11px] opacity-80">
                  Target Recipient: <strong>{diagnosticResult.recipientEmail}</strong> · Tested at{' '}
                  {new Date(diagnosticResult.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-black/5">
              <div className="rounded-lg bg-white/80 p-3 border border-black/5">
                <span className="font-tech text-[10px] font-bold uppercase text-slate-400 block">
                  Service ID
                </span>
                <span className="font-mono text-xs font-bold text-slate-800">
                  {diagnosticResult.config.serviceId || 'Missing'}
                </span>
              </div>

              <div className="rounded-lg bg-white/80 p-3 border border-black/5">
                <span className="font-tech text-[10px] font-bold uppercase text-slate-400 block">
                  Admin Template ({diagnosticResult.config.adminTemplateId || 'Missing'})
                </span>
                <span
                  className={`font-semibold ${
                    diagnosticResult.adminTemplateTest.success
                      ? 'text-emerald-700'
                      : 'text-red-600'
                  }`}
                >
                  {diagnosticResult.adminTemplateTest.success
                    ? `REACHABLE (HTTP ${diagnosticResult.adminTemplateTest.status} via ${diagnosticResult.adminTemplateTest.via})`
                    : `FAILED (${diagnosticResult.adminTemplateTest.error || 'Error'})`}
                </span>
              </div>

              {diagnosticResult.customerTemplateTest && (
                <div className="rounded-lg bg-white/80 p-3 border border-black/5">
                  <span className="font-tech text-[10px] font-bold uppercase text-slate-400 block">
                    Customer Template ({diagnosticResult.config.customerTemplateId || 'Missing'})
                  </span>
                  <span
                    className={`font-semibold ${
                      diagnosticResult.customerTemplateTest.success
                        ? 'text-emerald-700'
                        : 'text-red-600'
                    }`}
                  >
                    {diagnosticResult.customerTemplateTest.success
                      ? `REACHABLE (HTTP ${diagnosticResult.customerTemplateTest.status} via ${diagnosticResult.customerTemplateTest.via})`
                      : `FAILED (${diagnosticResult.customerTemplateTest.error || 'Error'})`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECURITY & ADMIN PASSWORD RESET MENU */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
            SECURITY &amp; ACCESS CONTROL
          </span>
          <h3 className="font-display text-lg font-black text-slate-900 mt-0.5 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#00685b]" />
            <span>Admin Password Reset &amp; Credentials</span>
          </h3>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Update your QBENCH CMS administrator password or trigger a secure recovery link via email.
          </p>
        </div>

        {passwordSuccessMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{passwordSuccessMessage}</span>
          </div>
        )}

        {passwordErrorMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{passwordErrorMessage}</span>
          </div>
        )}

        {/* Change Password Direct Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-admin-password"
                className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-11 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-admin-password"
                className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-11 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-[#00685b]" />
              <span>Password updates directly synchronize with Supabase Auth.</span>
            </div>

            <button
              type="submit"
              disabled={updatingPassword || !newPassword || !confirmPassword}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] disabled:opacity-60 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer"
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Alternative: Password Reset Email Dispatch */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="font-display text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-slate-500" />
                <span>Send Password Reset Recovery Email</span>
              </h4>
              <p className="font-sans text-[11px] text-slate-500">
                Dispatches a password reset link to <strong>{form.email || 'qbench.official@gmail.com'}</strong> via Supabase Auth.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSendResetEmail}
              disabled={sendingResetEmail}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-60 px-4 py-2 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer shrink-0"
            >
              {sendingResetEmail ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Dispatching Link...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 text-slate-500" />
                  <span>Send Recovery Email</span>
                </>
              )}
            </button>
          </div>

          {resetEmailSuccess && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{resetEmailSuccess}</span>
            </div>
          )}

          {resetEmailError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{resetEmailError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

