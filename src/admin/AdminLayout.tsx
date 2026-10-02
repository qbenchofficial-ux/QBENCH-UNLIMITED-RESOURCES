import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import QBenchLogo from '../components/QBenchLogo';
import type { AdminProfile } from '../types/project';
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Tags,
  Image as ImageIcon,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Package,
  Briefcase,
  FileText,
} from 'lucide-react';

export type AdminCmsSection =
  | 'overview'
  | 'projects'
  | 'add-project'
  | 'edit-project'
  | 'packages'
  | 'services'
  | 'site-content'
  | 'categories'
  | 'media'
  | 'inquiries'
  | 'settings';

interface AdminLayoutProps {
  activeSection: AdminCmsSection;
  adminProfile: AdminProfile;
  onNavigateRoute: (path: string) => void;
  onLogout: () => Promise<void>;
  onExitToPublicSite: () => void;
  toast: { type: 'success' | 'error'; message: string } | null;
  onDismissToast: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  activeSection,
  adminProfile,
  onNavigateRoute,
  onLogout,
  onExitToPublicSite,
  toast,
  onDismissToast,
  children,
}: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: {
    id: AdminCmsSection;
    label: string;
    path: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      path: '/admin',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'projects',
      label: 'Portfolio Projects',
      path: '/admin/projects',
      icon: <FolderKanban className="h-4 w-4" />,
    },
    {
      id: 'add-project',
      label: 'Add Project',
      path: '/admin/projects/new',
      icon: <PlusCircle className="h-4 w-4" />,
    },
    {
      id: 'categories',
      label: 'Portfolio Categories',
      path: '/admin/categories',
      icon: <Tags className="h-4 w-4" />,
    },
    {
      id: 'packages',
      label: 'Packages & Pricing',
      path: '/admin/packages',
      icon: <Package className="h-4 w-4" />,
    },
    {
      id: 'services',
      label: 'Services & Capabilities',
      path: '/admin/services',
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      id: 'site-content',
      label: 'Website Content',
      path: '/admin/content',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'media',
      label: 'Media Library',
      path: '/admin/media',
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      id: 'inquiries',
      label: 'Client Inquiries',
      path: '/admin/inquiries',
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: 'settings',
      label: 'Agency Settings',
      path: '/admin/settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    onNavigateRoute(path);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f6] text-slate-900 flex flex-col lg:flex-row font-sans">
      <Helmet>
        <title>QBENCH CMS — Creative Management System</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30 justify-between overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <QBenchLogo variant="symbol" iconSize={38} />
            <div className="min-w-0">
              <span className="font-display text-base font-black tracking-tight text-slate-900 block leading-none">
                QBENCH
              </span>
              <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-[#00685b] block mt-1">
                Creative Management System
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                activeSection === item.id ||
                (item.id === 'projects' && activeSection === 'edit-project');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-display text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00685b] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-5 border-t border-slate-100 space-y-3">
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs">
            <span className="font-tech text-[10px] font-bold uppercase text-[#00685b] block">
              ADMIN SESSION
            </span>
            <p className="font-semibold text-slate-800 truncate mt-0.5">
              {adminProfile.email}
            </p>
            <span className="font-mono text-[10px] text-slate-500">
              Role: {adminProfile.role}
            </span>
          </div>

          <button
            type="button"
            onClick={onExitToPublicSite}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 px-3 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View Public Website</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 py-2 px-3 font-display text-xs font-bold text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle CMS Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b] block">
                QBENCH CMS
              </span>
              <h1 className="font-display text-base sm:text-lg font-black text-slate-900">
                Creative Management System
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleNavClick('/admin/packages')}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <Package className="h-3.5 w-3.5 text-[#00685b]" />
              <span>Packages</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('/admin/services')}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <Briefcase className="h-3.5 w-3.5 text-[#00685b]" />
              <span>Services</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('/admin/projects/new')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] hover:bg-[#005348] px-3.5 py-2 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Project</span>
              <span className="sm:hidden">New</span>
            </button>

            <button
              type="button"
              onClick={onExitToPublicSite}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Public Site</span>
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-1.5 shadow-md">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 font-display text-xs font-bold ${
                    isActive
                      ? 'bg-[#00685b] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 truncate">
                {adminProfile.email}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="px-4 sm:px-8 pt-4">
            <div
              role="status"
              className={`flex items-center justify-between rounded-xl border p-4 text-xs font-semibold shadow-xs ${
                toast.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={onDismissToast}
                className="text-xs underline opacity-75 hover:opacity-100 ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
