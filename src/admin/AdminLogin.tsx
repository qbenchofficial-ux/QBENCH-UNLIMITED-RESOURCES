import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import QBenchLogo from '../components/QBenchLogo';
import { Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-[#faf9f9] flex flex-col justify-center items-center px-4 py-12">
      <Helmet>
        <title>Login | QBENCH CMS — Creative Management System</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <QBenchLogo variant="symbol" iconSize={52} />
          <div className="space-y-1">
            <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b] block">
              QBENCH CMS
            </span>
            <h1 className="font-display text-2xl font-black text-slate-900">
              Creative Management System
            </h1>
            <p className="font-sans text-xs text-slate-500">
              Sign in with your authorized administrator credentials
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
          >
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
            >
              Email
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
            <label
              htmlFor="admin-password"
              className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none transition-colors"
            />
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
        </form>

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
