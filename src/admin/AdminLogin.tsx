import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import QBenchLogo from '../components/QBenchLogo';
import { supabase } from '../lib/supabase';
import {
  Lock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface AdminLoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  onBackToSite: () => void;
}

export default function AdminLogin({
  onLogin,
  loading,
  error,
  onBackToSite,
}: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password request states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('qbench.official@gmail.com');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Password Recovery Mode (user clicked reset link in email)
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    return hash.includes('type=recovery') || search.includes('type=recovery');
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Listen for Supabase PASSWORD_RECOVERY event
  useEffect(() => {
    // Check initial hash/search
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        setIsRecoveryMode(true);
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);
    const target = resetEmail.trim() || email.trim() || 'qbench.official@gmail.com';

    setResetLoading(true);
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/admin/login`
          : 'https://qbench-unlimited-resources-qbench2.vercel.app/admin/login';

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        target,
        {
          redirectTo: redirectUrl,
        }
      );

      if (resetErr) {
        throw resetErr;
      }

      setResetSuccess(
        `A password recovery email has been dispatched to ${target}. Please check your Gmail inbox (and Spam/Promotions folder) and click the link to choose a new password.`
      );
    } catch (err: unknown) {
      setResetError(
        err instanceof Error
          ? err.message
          : 'Failed to send password reset email.'
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);

    if (newPassword.length < 6) {
      setUpdateError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setUpdateError('Passwords do not match. Please re-enter.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        throw updateErr;
      }

      setUpdateSuccess(
        'Admin password successfully updated! You can now access QBENCH CMS.'
      );

      // Clean the recovery token from the URL hash
      if (typeof window !== 'undefined' && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      // Automatically reload / enter admin after short pause
      setTimeout(() => {
        window.location.assign('/admin');
      }, 1500);
    } catch (err: unknown) {
      setUpdateError(
        err instanceof Error ? err.message : 'Failed to update admin password.'
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f9] flex flex-col justify-center items-center px-4 py-12">
      <Helmet>
        <title>Admin Access | QBENCH CMS — Creative Management System</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <QBenchLogo variant="stacked" />
          <div className="space-y-1 pt-1">
            <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b] block">
              Admin Portal
            </span>
            <p className="font-sans text-xs text-slate-500">
              {isRecoveryMode
                ? 'Create a new password for your admin account'
                : 'Sign in with your authorized administrator credentials'}
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && !showForgotPassword && !isRecoveryMode && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
          >
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="leading-relaxed block">{error}</span>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email || 'qbench.official@gmail.com');
                  setShowForgotPassword(true);
                }}
                className="font-tech text-[11px] font-bold text-[#00685b] underline cursor-pointer"
              >
                Forgot your password? Click here to reset it.
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: RECOVERY MODE (Opened via email link) */}
        {isRecoveryMode ? (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00685b]">
                <KeyRound className="h-4 w-4" />
                <span>Password Recovery Link Verified</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Please enter your new administrator password below. It will immediately replace your forgotten password.
              </p>
            </div>

            {updateSuccess && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">{updateSuccess}</span>
              </div>
            )}

            {updateError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{updateError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-11 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-11 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] disabled:opacity-60 py-3 font-display text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer"
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Set New Password & Enter Admin</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRecoveryMode(false);
                if (typeof window !== 'undefined' && window.history.replaceState) {
                  window.history.replaceState(null, '', window.location.pathname);
                }
              }}
              className="w-full text-center font-tech text-[11px] text-slate-500 hover:text-slate-700 pt-1 cursor-pointer"
            >
              Return to standard sign in
            </button>
          </form>
        ) : !showForgotPassword ? (
          /* VIEW 2: STANDARD ADMIN LOGIN */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
              >
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="qbench.official@gmail.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-password"
                  className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email.trim() || 'qbench.official@gmail.com');
                    setShowForgotPassword(true);
                  }}
                  className="font-tech text-[11px] text-[#00685b] hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-11 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] disabled:opacity-60 py-3 font-display text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Sign In to QBENCH CMS</span>
                </>
              )}
            </button>

            {/* Quick helper for password reset */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email.trim() || 'qbench.official@gmail.com');
                  setShowForgotPassword(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#00685b] transition-colors cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                <span>Forgot your password? Send reset link to email</span>
              </button>
            </div>
          </form>
        ) : (
          /* VIEW 3: FORGOT PASSWORD REQUEST FORM */
          <form onSubmit={handleRequestPasswordReset} className="space-y-4">
            <div className="space-y-1 text-left">
              <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-[#00685b]" />
                <span>Reset Admin Password</span>
              </h3>
              <p className="font-sans text-xs text-slate-500 leading-relaxed">
                Enter your admin email address to receive an official password reset link. Clicking the link will let you choose a new password.
              </p>
            </div>

            {resetSuccess && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{resetSuccess}</span>
              </div>
            )}

            {resetError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{resetError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reset-email"
                  className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
                >
                  Admin Email Address
                </label>
                <button
                  type="button"
                  onClick={() => setResetEmail('qbench.official@gmail.com')}
                  className="text-[10px] text-[#00685b] hover:underline font-semibold cursor-pointer"
                >
                  Use qbench.official@gmail.com
                </button>
              </div>
              <input
                id="reset-email"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="qbench.official@gmail.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={resetLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#005348] disabled:opacity-60 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Reset Email</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSuccess(null);
                  setResetError(null);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 font-display text-xs font-bold text-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Protected by Supabase Auth</span>
          <button
            type="button"
            onClick={onBackToSite}
            className="inline-flex items-center gap-1 font-semibold text-[#00685b] hover:underline cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Website</span>
          </button>
        </div>
      </div>
    </div>
  );
}
