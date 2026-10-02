import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import {
  createProject,
  updateProject,
  patchProjectFlags,
  deleteProject,
  getProjectById,
} from '../services/projectService';
import AdminLogin from '../admin/AdminLogin';
import AdminLayout, { AdminCmsSection } from '../admin/AdminLayout';
import AdminDashboard from '../admin/AdminDashboard';
import ProjectList from '../admin/ProjectList';
import ProjectForm from '../admin/ProjectForm';
import PackagesManager from '../admin/PackagesManager';
import ServicesManager from '../admin/ServicesManager';
import SiteContentManager from '../admin/SiteContentManager';
import CategoriesManager from '../admin/CategoriesManager';
import MediaLibrary from '../admin/MediaLibrary';
import InquiriesManager from '../admin/InquiriesManager';
import Settings from '../admin/Settings';
import type { Project, ProjectFormData } from '../types/project';
import type { NavSection } from '../types';
import { Loader2 } from 'lucide-react';

interface AdminControlViewProps {
  onNavigate: (section: NavSection) => void;
  onOpenPublicPath?: (path: string) => void;
}

interface ParsedAdminRoute {
  section: AdminCmsSection | 'login';
  projectId?: string;
}

function parseAdminPathname(pathname: string): ParsedAdminRoute {
  const clean = pathname.replace(/\/+$/, '') || '/admin';
  if (clean === '/admin/login') {
    return { section: 'login' };
  }
  if (clean === '/admin/projects/new') {
    return { section: 'add-project' };
  }
  const editMatch = clean.match(/^\/admin\/projects\/([^/]+)\/edit$/);
  if (editMatch) {
    return { section: 'edit-project', projectId: decodeURIComponent(editMatch[1]) };
  }
  if (clean === '/admin/projects') {
    return { section: 'projects' };
  }
  if (clean === '/admin/packages') {
    return { section: 'packages' };
  }
  if (clean === '/admin/services') {
    return { section: 'services' };
  }
  if (clean === '/admin/content') {
    return { section: 'site-content' };
  }
  if (clean === '/admin/categories') {
    return { section: 'categories' };
  }
  if (clean === '/admin/media') {
    return { section: 'media' };
  }
  if (clean === '/admin/inquiries') {
    return { section: 'inquiries' };
  }
  if (clean === '/admin/settings') {
    return { section: 'settings' };
  }
  return { section: 'overview' };
}

export default function AdminControlView({
  onNavigate,
  onOpenPublicPath,
}: AdminControlViewProps) {
  const { adminProfile, loading: authLoading, authError, signIn, signOut } = useAuth();
  const {
    projects,
    categories,
    settings,
    inquiries,
    packages,
    businessSupport,
    services,
    websiteContent,
    loading: dataLoading,
    refresh,
  } = useProjects('admin');

  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/admin'
  );
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loadingEditProject, setLoadingEditProject] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  }, []);

  const navigateRoute = useCallback(
    (nextPath: string) => {
      if (nextPath.startsWith('/portfolio')) {
        if (onOpenPublicPath) {
          onOpenPublicPath(nextPath);
          return;
        }
      }
      setCurrentPath(nextPath);
      if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [onOpenPublicPath]
  );

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const parsedRoute = parseAdminPathname(currentPath);

  // Enforce route protection: redirect unauthenticated users visiting protected /admin/* routes to /admin/login
  useEffect(() => {
    if (authLoading) return;
    if (!adminProfile && parsedRoute.section !== 'login') {
      navigateRoute('/admin/login');
    } else if (adminProfile && parsedRoute.section === 'login') {
      navigateRoute('/admin');
    }
  }, [authLoading, adminProfile, parsedRoute.section, navigateRoute]);

  // Load selected project when visiting /admin/projects/:id/edit
  useEffect(() => {
    let mounted = true;
    async function loadProjectForEdit(id: string) {
      setLoadingEditProject(true);
      try {
        const found = await getProjectById(id);
        if (mounted) {
          setEditingProject(found);
          if (!found) {
            notify('error', 'The requested project could not be found.');
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          notify(
            'error',
            err instanceof Error ? err.message : 'Failed to load project.'
          );
        }
      } finally {
        if (mounted) {
          setLoadingEditProject(false);
        }
      }
    }

    if (parsedRoute.section === 'edit-project' && parsedRoute.projectId) {
      loadProjectForEdit(parsedRoute.projectId);
    } else {
      setEditingProject(null);
    }
    return () => {
      mounted = false;
    };
  }, [parsedRoute.section, parsedRoute.projectId, notify]);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const ok = await signIn(email, password);
    if (ok) {
      navigateRoute('/admin');
      await refresh();
    }
    return ok;
  };

  const handleLogout = async () => {
    await signOut();
    navigateRoute('/admin/login');
  };

  const handleExitToPublicSite = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    onNavigate('home');
  };

  const handleCreateProject = async (data: ProjectFormData) => {
    const created = await createProject(data);
    notify(
      'success',
      `Project "${created.title}" ${
        created.status === 'published' ? 'published' : 'saved as draft'
      }.`
    );
    await refresh();
    navigateRoute('/admin/projects');
  };

  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!parsedRoute.projectId) return;
    const updated = await updateProject(parsedRoute.projectId, data);
    notify('success', `Updated project "${updated.title}".`);
    await refresh();
    navigateRoute('/admin/projects');
  };

  const handleToggleStatus = async (project: Project) => {
    const nextStatus = project.status === 'published' ? 'draft' : 'published';
    try {
      await patchProjectFlags(project.id, { status: nextStatus });
      notify(
        'success',
        `Project "${project.title}" ${
          nextStatus === 'published' ? 'published' : 'moved to draft'
        }.`
      );
      await refresh();
    } catch (err: unknown) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Failed to update project status.'
      );
    }
  };

  const handleToggleFeatured = async (project: Project) => {
    const nextFeatured = !project.featured;
    try {
      await patchProjectFlags(project.id, { featured: nextFeatured });
      notify(
        'success',
        `Project "${project.title}" ${
          nextFeatured ? 'marked as featured' : 'removed from featured'
        }.`
      );
      await refresh();
    } catch (err: unknown) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Failed to update featured flag.'
      );
    }
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProject(project);
      notify('success', `Deleted project "${project.title}".`);
      await refresh();
    } catch (err: unknown) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Failed to delete project.'
      );
    }
  };

  if (authLoading && !adminProfile) {
    return (
      <div className="min-h-screen bg-[#faf9f9] flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs flex flex-col items-center space-y-3">
          <Loader2 className="h-7 w-7 text-[#00685b] animate-spin" />
          <p className="font-display text-xs font-bold text-slate-700">
            Verifying QBENCH CMS Session...
          </p>
        </div>
      </div>
    );
  }

  if (!adminProfile || parsedRoute.section === 'login') {
    return (
      <AdminLogin
        onLogin={handleLogin}
        loading={authLoading}
        error={authError}
        onBackToSite={handleExitToPublicSite}
      />
    );
  }

  return (
    <AdminLayout
      activeSection={parsedRoute.section}
      adminProfile={adminProfile}
      onNavigateRoute={navigateRoute}
      onLogout={handleLogout}
      onExitToPublicSite={handleExitToPublicSite}
      toast={toast}
      onDismissToast={() => setToast(null)}
    >
      {parsedRoute.section === 'overview' && (
        <AdminDashboard
          projects={projects}
          categories={categories}
          packages={packages}
          services={services}
          inquiries={inquiries}
          loading={dataLoading}
          onNavigateRoute={navigateRoute}
          onToggleStatus={handleToggleStatus}
          onToggleFeatured={handleToggleFeatured}
        />
      )}

      {parsedRoute.section === 'projects' && (
        <ProjectList
          projects={projects}
          categories={categories}
          loading={dataLoading}
          onNavigateRoute={navigateRoute}
          onToggleStatus={handleToggleStatus}
          onToggleFeatured={handleToggleFeatured}
          onDeleteProject={handleDeleteProject}
        />
      )}

      {parsedRoute.section === 'add-project' && (
        <ProjectForm
          initialProject={null}
          categories={categories}
          onSubmit={handleCreateProject}
          onCancel={() => navigateRoute('/admin/projects')}
        />
      )}

      {parsedRoute.section === 'edit-project' && (
        <>
          {loadingEditProject ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-7 w-7 text-[#00685b] animate-spin" />
              <p className="font-display text-xs font-bold text-slate-600">
                Loading project details...
              </p>
            </div>
          ) : editingProject ? (
            <ProjectForm
              initialProject={editingProject}
              categories={categories}
              onSubmit={handleUpdateProject}
              onCancel={() => navigateRoute('/admin/projects')}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
              <p className="font-display text-base font-bold text-slate-800">
                Project not found
              </p>
              <button
                type="button"
                onClick={() => navigateRoute('/admin/projects')}
                className="rounded-xl bg-[#00685b] px-4 py-2 font-display text-xs font-bold text-white cursor-pointer"
              >
                Return to Projects
              </button>
            </div>
          )}
        </>
      )}

      {parsedRoute.section === 'packages' && (
        <PackagesManager
          packages={packages}
          businessSupport={businessSupport}
          onRefresh={refresh}
          onNotify={notify}
        />
      )}

      {parsedRoute.section === 'services' && (
        <ServicesManager
          services={services}
          onRefresh={refresh}
          onNotify={notify}
        />
      )}

      {parsedRoute.section === 'site-content' && (
        <SiteContentManager
          websiteContent={websiteContent}
          onRefresh={refresh}
          onNotify={notify}
        />
      )}

      {parsedRoute.section === 'categories' && (
        <CategoriesManager
          categories={categories}
          projects={projects}
          onRefresh={refresh}
          onNotify={notify}
        />
      )}

      {parsedRoute.section === 'media' && <MediaLibrary onNotify={notify} />}

      {parsedRoute.section === 'inquiries' && (
        <InquiriesManager
          inquiries={inquiries}
          onRefresh={refresh}
          onNotify={notify}
        />
      )}

      {parsedRoute.section === 'settings' && (
        <Settings settings={settings} onRefresh={refresh} onNotify={notify} />
      )}
    </AdminLayout>
  );
}
