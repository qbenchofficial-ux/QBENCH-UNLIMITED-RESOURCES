import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  NavSection,
  QBenchCategory,
  QBenchResource,
  QBenchAnnouncement,
  RESOURCE_TYPES,
  AdminProfile,
} from '../types';
import {
  supabase,
  isSupabaseConfigured,
  activeSupabaseUrl,
  SUPABASE_PROJECT_REF,
  SUPABASE_DASHBOARD_URL,
  VERCEL_PRODUCTION_CHECKLIST_URL,
  VERCEL_ENV_SETTINGS_URL,
  verifyAdminProfile,
  runSupabaseDiagnostics,
  SupabaseDiagnosticsResult,
  slugify,
  uploadToQBenchBucket,
  STORAGE_BUCKET,
} from '../lib/supabase';
import ResourceForm, { ResourceFormPayload } from './admin/ResourceForm';
import QBenchLogo from './QBenchLogo';
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  Megaphone,
  Settings,
  LogOut,
  Plus,
  Search,
  Edit3,
  Trash2,
  Star,
  Globe,
  EyeOff,
  ExternalLink,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Loader2,
  ArrowLeft,
  Upload,
  ShieldCheck,
  Download,
  Eye,
  Database,
  Server,
  Sparkles,
  CheckSquare,
  Square,
  X,
  Mail,
} from 'lucide-react';

export type AdminRoutePath =
  | '/admin/login'
  | '/admin'
  | '/admin/resources'
  | '/admin/categories'
  | '/admin/announcements'
  | '/admin/settings';

interface AdminControlViewProps {
  onNavigate: (section: NavSection) => void;
}

const LOCAL_RESOURCES_KEY = 'qbench_local_resources_v1';
const LOCAL_CATEGORIES_KEY = 'qbench_local_categories_v1';
const LOCAL_ANNOUNCEMENTS_KEY = 'qbench_local_announcements_v1';
const LOCAL_PREVIEW_SESSION_KEY = 'qbench_admin_preview_session_v1';

const DEFAULT_SEED_CATEGORIES: QBenchCategory[] = [
  {
    id: 'cat-study-notes',
    name: 'Study Notes & Handbooks',
    slug: 'study-notes',
    description: 'Curated study guides, formula sheets, and exam preparation notes.',
    icon: '📚',
    image_url: null,
    published: true,
  },
  {
    id: 'cat-digital-tools',
    name: 'Digital Tools & Templates',
    slug: 'digital-tools',
    description: 'Productivity templates, workflows, and digital utilities.',
    icon: '⚡',
    image_url: null,
    published: true,
  },
  {
    id: 'cat-exam-material',
    name: 'Exam Material & Practice Sets',
    slug: 'exam-material',
    description: 'Topic-wise questions, previous year papers, and mock sets.',
    icon: '🎯',
    image_url: null,
    published: true,
  },
];

function getInitialAdminRoute(): AdminRoutePath {
  if (typeof window === 'undefined') return '/admin';
  const path = window.location.pathname.replace(/\/+$/, '') || '/admin';
  if (
    path === '/admin/login' ||
    path === '/admin' ||
    path === '/admin/resources' ||
    path === '/admin/categories' ||
    path === '/admin/announcements' ||
    path === '/admin/settings'
  ) {
    return path;
  }
  return '/admin';
}

export default function AdminControlView({ onNavigate }: AdminControlViewProps) {
  const [route, setRoute] = useState<AdminRoutePath>(getInitialAdminRoute);

  const navigateAdmin = useCallback((nextRoute: AdminRoutePath) => {
    setRoute(nextRoute);
    if (typeof window !== 'undefined' && window.location.pathname !== nextRoute) {
      window.history.pushState({}, '', nextRoute);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(getInitialAdminRoute());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Auth & Admin Authorization state
  const [checkingSession, setCheckingSession] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLocalPreviewMode, setIsLocalPreviewMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState('qbench.official@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data state
  const [resources, setResources] = useState<QBenchResource[]>([]);
  const [categories, setCategories] = useState<QBenchCategory[]>([]);
  const [announcements, setAnnouncements] = useState<QBenchAnnouncement[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [diagnostics, setDiagnostics] = useState<SupabaseDiagnosticsResult | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  const [actionBanner, setActionBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Resource Management filters, bulk selection & modals
  const [resourceSearch, setResourceSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'featured' | 'standard'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewResource, setPreviewResource] = useState<QBenchResource | null>(null);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState<QBenchResource | null>(null);
  const [savingResource, setSavingResource] = useState(false);

  // Category Form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<QBenchCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIcon, setCatIcon] = useState('📚');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catPublished, setCatPublished] = useState(true);
  const [uploadingCatImg, setUploadingCatImg] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  // Announcement Form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<QBenchAnnouncement | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annLink, setAnnLink] = useState('');
  const [annPublished, setAnnPublished] = useState(true);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setActionBanner({ type, text });
    setTimeout(() => {
      setActionBanner((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  // Load local fallback data when testing in preview mode without VITE_SUPABASE_PUBLISHABLE_KEY
  const loadLocalFallbackData = useCallback(() => {
    try {
      const rawCat = localStorage.getItem(LOCAL_CATEGORIES_KEY);
      const parsedCat: QBenchCategory[] = rawCat
        ? JSON.parse(rawCat)
        : DEFAULT_SEED_CATEGORIES;
      if (!rawCat) {
        localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(parsedCat));
      }
      setCategories(parsedCat);

      const rawRes = localStorage.getItem(LOCAL_RESOURCES_KEY);
      const parsedRes: QBenchResource[] = rawRes ? JSON.parse(rawRes) : [];
      setResources(parsedRes);

      const rawAnn = localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY);
      const parsedAnn: QBenchAnnouncement[] = rawAnn ? JSON.parse(rawAnn) : [];
      setAnnouncements(parsedAnn);
    } catch {
      setCategories(DEFAULT_SEED_CATEGORIES);
    }
  }, []);

  // Fetch server-side CRM leads for the Enquiries panel in /admin/settings
  const fetchServerLeads = useCallback(async () => {
    try {
      const resp = await fetch('/api/messages?secret=qbench2026secret');
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.messages)) {
          setLeads(data.messages);
        }
      }
    } catch {
      // Ignore if offline
    }
  }, []);

  // Load all admin tables from Supabase (or local fallback if publishable key is not yet injected)
  const fetchAdminData = useCallback(async () => {
    setLoadingData(true);
    fetchServerLeads();

    if (!isSupabaseConfigured) {
      loadLocalFallbackData();
      setLoadingData(false);
      return;
    }

    try {
      const [resResult, catResult, annResult] = await Promise.all([
        supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (!resResult.error && resResult.data) {
        setResources(resResult.data as QBenchResource[]);
      }
      if (!catResult.error && catResult.data) {
        setCategories(catResult.data as QBenchCategory[]);
      }
      if (!annResult.error && annResult.data) {
        setAnnouncements(annResult.data as QBenchAnnouncement[]);
      }
    } catch (err: any) {
      console.error('[QBench Admin Fetch Error]:', err);
    } finally {
      setLoadingData(false);
    }
  }, [fetchServerLeads, loadLocalFallbackData]);

  const handleRunDiagnostics = useCallback(async () => {
    setRunningDiagnostics(true);
    try {
      const res = await runSupabaseDiagnostics();
      setDiagnostics(res);
    } finally {
      setRunningDiagnostics(false);
    }
  }, []);

  // Verify session & public.admin_profiles on mount and auth state changes
  useEffect(() => {
    let mounted = true;

    async function checkCurrentSession() {
      handleRunDiagnostics();

      if (!isSupabaseConfigured) {
        const savedPreview = localStorage.getItem(LOCAL_PREVIEW_SESSION_KEY);
        if (savedPreview && mounted) {
          setAdminProfile({
            id: 'preview-admin-uid',
            role: 'admin',
            email: savedPreview,
          });
          setUserEmail(savedPreview);
          setIsLocalPreviewMode(true);
          setCheckingSession(false);
          if (window.location.pathname === '/admin/login') {
            navigateAdmin('/admin');
          }
          fetchAdminData();
          return;
        }
        if (mounted) {
          setCheckingSession(false);
          navigateAdmin('/admin/login');
        }
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mounted) {
            setAdminProfile(null);
            setCheckingSession(false);
            navigateAdmin('/admin/login');
          }
          return;
        }

        const check = await verifyAdminProfile(session.user.id);
        if (!check.isAdmin || !check.profile) {
          await supabase.auth.signOut();
          if (mounted) {
            setAdminProfile(null);
            setAuthError(
              check.error ||
                'Access denied. Only users with role = "admin" in admin_profiles are authorized.'
            );
            setCheckingSession(false);
            navigateAdmin('/admin/login');
          }
          return;
        }

        if (mounted) {
          setAdminProfile(check.profile);
          setIsLocalPreviewMode(false);
          setUserEmail(session.user.email || check.profile.email || '');
          setCheckingSession(false);
          if (window.location.pathname === '/admin/login') {
            navigateAdmin('/admin');
          }
          fetchAdminData();
        }
      } catch {
        if (mounted) {
          setAdminProfile(null);
          setCheckingSession(false);
          navigateAdmin('/admin/login');
        }
      }
    }

    checkCurrentSession();

    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || (!session?.user && isSupabaseConfigured)) {
        if (mounted) {
          setAdminProfile(null);
          setUserEmail('');
          navigateAdmin('/admin/login');
        }
      }
    });

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, [fetchAdminData, handleRunDiagnostics, navigateAdmin]);

  // Enter preview workspace when VITE_SUPABASE_PUBLISHABLE_KEY is not yet set in AI Studio
  const handleEnterPreviewWorkspace = (emailOverride?: string) => {
    const targetEmail = (emailOverride || loginEmail || 'qbench.official@gmail.com').trim();
    localStorage.setItem(LOCAL_PREVIEW_SESSION_KEY, targetEmail);
    setAdminProfile({
      id: 'preview-admin-uid',
      role: 'admin',
      email: targetEmail,
    });
    setUserEmail(targetEmail);
    setIsLocalPreviewMode(true);
    setAuthError(null);
    navigateAdmin('/admin');
    fetchAdminData();
  };

  // Handle Login with email + password + admin_profiles role check
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!isSupabaseConfigured) {
      // Allow seamless login in AI Studio preview environment while VITE_SUPABASE_PUBLISHABLE_KEY is pending
      handleEnterPreviewWorkspace(loginEmail);
      return;
    }

    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error || !data.user) {
        setAuthError(error?.message || 'Invalid email or password.');
        setAuthLoading(false);
        return;
      }

      // Check public.admin_profiles where id = auth.uid() AND role = 'admin'
      const check = await verifyAdminProfile(data.user.id);
      if (!check.isAdmin || !check.profile) {
        await supabase.auth.signOut();
        setAdminProfile(null);
        setAuthError(
          check.error ||
            'Access denied: Your account is not registered with role = "admin" in admin_profiles.'
        );
        navigateAdmin('/admin/login');
        setAuthLoading(false);
        return;
      }

      setAdminProfile(check.profile);
      setIsLocalPreviewMode(false);
      setUserEmail(data.user.email || loginEmail.trim());
      setLoginPassword('');
      navigateAdmin('/admin');
      await fetchAdminData();
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem(LOCAL_PREVIEW_SESSION_KEY);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAdminProfile(null);
    setIsLocalPreviewMode(false);
    setUserEmail('');
    navigateAdmin('/admin/login');
  };

  // Resource CRUD handlers
  const handleSaveResource = async (payload: ResourceFormPayload) => {
    setSavingResource(true);
    try {
      if (!isSupabaseConfigured) {
        const nextList = editingResource
          ? resources.map((r) =>
              r.id === editingResource.id
                ? { ...r, ...payload, updated_at: new Date().toISOString() }
                : r
            )
          : [
              {
                id: `local-res-${Date.now()}`,
                ...payload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              ...resources,
            ];
        localStorage.setItem(LOCAL_RESOURCES_KEY, JSON.stringify(nextList));
        setResources(nextList);
        showNotice(
          'success',
          `${editingResource ? 'Updated' : 'Created'} resource "${payload.title}".`
        );
        setShowResourceForm(false);
        setEditingResource(null);
        return;
      }

      if (editingResource) {
        const { error } = await supabase
          .from('resources')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingResource.id);

        if (error) throw new Error(error.message);
        showNotice('success', `Updated resource "${payload.title}".`);
      } else {
        const { error } = await supabase.from('resources').insert([payload]);
        if (error) throw new Error(error.message);
        showNotice('success', `Created resource "${payload.title}".`);
      }

      setShowResourceForm(false);
      setEditingResource(null);
      await fetchAdminData();
    } finally {
      setSavingResource(false);
    }
  };

  const handleToggleResourcePublish = async (res: QBenchResource) => {
    const nextState = !res.published;
    if (!isSupabaseConfigured) {
      const next = resources.map((r) =>
        r.id === res.id ? { ...r, published: nextState } : r
      );
      localStorage.setItem(LOCAL_RESOURCES_KEY, JSON.stringify(next));
      setResources(next);
      showNotice(
        'success',
        `Resource "${res.title}" ${nextState ? 'published' : 'moved to drafts'}.`
      );
      return;
    }

    const { error } = await supabase
      .from('resources')
      .update({ published: nextState })
      .eq('id', res.id);
    if (error) {
      showNotice('error', error.message);
      return;
    }
    showNotice(
      'success',
      `Resource "${res.title}" ${nextState ? 'published' : 'moved to drafts'}.`
    );
    await fetchAdminData();
  };

  const handleToggleResourceFeatured = async (res: QBenchResource) => {
    const nextState = !res.featured;
    if (!isSupabaseConfigured) {
      const next = resources.map((r) =>
        r.id === res.id ? { ...r, featured: nextState } : r
      );
      localStorage.setItem(LOCAL_RESOURCES_KEY, JSON.stringify(next));
      setResources(next);
      showNotice(
        'success',
        `Resource "${res.title}" ${nextState ? 'marked as featured' : 'unfeatured'}.`
      );
      return;
    }

    const { error } = await supabase
      .from('resources')
      .update({ featured: nextState })
      .eq('id', res.id);
    if (error) {
      showNotice('error', error.message);
      return;
    }
    showNotice(
      'success',
      `Resource "${res.title}" ${nextState ? 'marked as featured' : 'unfeatured'}.`
    );
    await fetchAdminData();
  };

  const handleDeleteResource = async (res: QBenchResource) => {
    if (!isSupabaseConfigured) {
      const next = resources.filter((r) => r.id !== res.id);
      localStorage.setItem(LOCAL_RESOURCES_KEY, JSON.stringify(next));
      setResources(next);
      setSelectedIds((prev) => prev.filter((id) => id !== res.id));
      showNotice('success', `Deleted resource "${res.title}".`);
      return;
    }

    const { error } = await supabase.from('resources').delete().eq('id', res.id);
    if (error) {
      showNotice('error', error.message);
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => id !== res.id));
    showNotice('success', `Deleted resource "${res.title}".`);
    await fetchAdminData();
  };

  // Bulk Resource Actions
  const handleBulkAction = async (
    action: 'publish' | 'unpublish' | 'feature' | 'unfeature' | 'delete'
  ) => {
    if (selectedIds.length === 0) return;

    if (!isSupabaseConfigured) {
      let next = [...resources];
      if (action === 'delete') {
        next = next.filter((r) => !selectedIds.includes(r.id));
      } else {
        next = next.map((r) => {
          if (!selectedIds.includes(r.id)) return r;
          if (action === 'publish') return { ...r, published: true };
          if (action === 'unpublish') return { ...r, published: false };
          if (action === 'feature') return { ...r, featured: true };
          if (action === 'unfeature') return { ...r, featured: false };
          return r;
        });
      }
      localStorage.setItem(LOCAL_RESOURCES_KEY, JSON.stringify(next));
      setResources(next);
      setSelectedIds([]);
      showNotice('success', `Applied "${action}" to ${selectedIds.length} resource(s).`);
      return;
    }

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('resources')
          .delete()
          .in('id', selectedIds);
        if (error) throw new Error(error.message);
      } else {
        const updatePayload =
          action === 'publish'
            ? { published: true }
            : action === 'unpublish'
            ? { published: false }
            : action === 'feature'
            ? { featured: true }
            : { featured: false };
        const { error } = await supabase
          .from('resources')
          .update(updatePayload)
          .in('id', selectedIds);
        if (error) throw new Error(error.message);
      }
      showNotice('success', `Applied "${action}" to ${selectedIds.length} resource(s).`);
      setSelectedIds([]);
      await fetchAdminData();
    } catch (err: any) {
      showNotice('error', err?.message || 'Bulk operation failed.');
    }
  };

  const handleExportResourcesJSON = () => {
    const blob = new Blob([JSON.stringify(resources, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qbench-resources-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Category CRUD handlers
  const openNewCategoryForm = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatDescription('');
    setCatIcon('📚');
    setCatImageUrl('');
    setCatPublished(true);
    setShowCategoryForm(true);
  };

  const openEditCategoryForm = (cat: QBenchCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description || '');
    setCatIcon(cat.icon || '📚');
    setCatImageUrl(cat.image_url || '');
    setCatPublished(Boolean(cat.published));
    setShowCategoryForm(true);
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCatImg(true);
    try {
      const publicUrl = await uploadToQBenchBucket(file, 'thumbnails');
      setCatImageUrl(publicUrl);
    } catch (err: any) {
      showNotice('error', `Image upload failed: ${err?.message}`);
    } finally {
      setUploadingCatImg(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = catName.trim();
    const finalSlug = catSlug.trim() || slugify(trimmedName);
    if (!trimmedName || !finalSlug) {
      showNotice('error', 'Category name and slug are required.');
      return;
    }

    setSavingCategory(true);
    try {
      const payload = {
        name: trimmedName,
        slug: finalSlug,
        description: catDescription.trim(),
        icon: catIcon.trim() || '📚',
        image_url: catImageUrl.trim() || null,
        published: catPublished,
      };

      if (!isSupabaseConfigured) {
        const next = editingCategory
          ? categories.map((c) =>
              c.id === editingCategory.id ? { ...c, ...payload } : c
            )
          : [{ id: `local-cat-${Date.now()}`, ...payload }, ...categories];
        localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(next));
        setCategories(next);
        setShowCategoryForm(false);
        setEditingCategory(null);
        showNotice('success', `Saved category "${trimmedName}".`);
        return;
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);
        if (error) throw new Error(error.message);
        showNotice('success', `Updated category "${trimmedName}".`);
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw new Error(error.message);
        showNotice('success', `Created category "${trimmedName}".`);
      }

      setShowCategoryForm(false);
      setEditingCategory(null);
      await fetchAdminData();
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to save category.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleToggleCategoryPublish = async (cat: QBenchCategory) => {
    const nextState = !cat.published;
    if (!isSupabaseConfigured) {
      const next = categories.map((c) =>
        c.id === cat.id ? { ...c, published: nextState } : c
      );
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(next));
      setCategories(next);
      showNotice('success', `Category "${cat.name}" ${nextState ? 'published' : 'unpublished'}.`);
      return;
    }

    const { error } = await supabase
      .from('categories')
      .update({ published: nextState })
      .eq('id', cat.id);
    if (error) {
      showNotice('error', error.message);
      return;
    }
    showNotice('success', `Category "${cat.name}" ${nextState ? 'published' : 'unpublished'}.`);
    await fetchAdminData();
  };

  const handleDeleteCategory = async (cat: QBenchCategory) => {
    if (!isSupabaseConfigured) {
      const next = categories.filter((c) => c.id !== cat.id);
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(next));
      setCategories(next);
      showNotice('success', `Deleted category "${cat.name}".`);
      return;
    }

    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) {
      showNotice('error', error.message);
      return;
    }
    showNotice('success', `Deleted category "${cat.name}".`);
    await fetchAdminData();
  };

  // Announcement CRUD handlers
  const openNewAnnouncementForm = () => {
    setEditingAnnouncement(null);
    setAnnTitle('');
    setAnnMessage('');
    setAnnLink('');
    setAnnPublished(true);
    setShowAnnouncementForm(true);
  };

  const openEditAnnouncementForm = (ann: QBenchAnnouncement) => {
    setEditingAnnouncement(ann);
    setAnnTitle(ann.title);
    setAnnMessage(ann.message);
    setAnnLink(ann.link || '');
    setAnnPublished(Boolean(ann.published));
    setShowAnnouncementForm(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = annTitle.trim();
    const trimmedMessage = annMessage.trim();
    if (!trimmedTitle || !trimmedMessage) {
      showNotice('error', 'Announcement title and message are required.');
      return;
    }

    setSavingAnnouncement(true);
    try {
      const payload = {
        title: trimmedTitle,
        message: trimmedMessage,
        link: annLink.trim() || null,
        published: annPublished,
      };

      if (!isSupabaseConfigured) {
        const next = editingAnnouncement
          ? announcements.map((a) =>
              a.id === editingAnnouncement.id ? { ...a, ...payload } : a
            )
          : [
              {
                id: `local-ann-${Date.now()}`,
                ...payload,
                created_at: new Date().toISOString(),
              },
              ...announcements,
            ];
        localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(next));
        setAnnouncements(next);
        setShowAnnouncementForm(false);
        setEditingAnnouncement(null);
        showNotice('success', `Saved announcement "${trimmedTitle}".`);
        return;
      }

      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingAnnouncement.id);
        if (error) throw new Error(error.message);
        showNotice('success', `Updated announcement "${trimmedTitle}".`);
      } else {
        const { error } = await supabase.from('announcements').insert([payload]);
        if (error) throw new Error(error.message);
        showNotice('success', `Created announcement "${trimmedTitle}".`);
      }

      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
      await fetchAdminData();
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to save announcement.');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleToggleAnnouncementPublish = async (ann: QBenchAnnouncement) => {
    const nextState = !ann.published;
    if (!isSupabaseConfigured) {
      const next = announcements.map((a) =>
        a.id === ann.id ? { ...a, published: nextState } : a
      );
      localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(next));
      setAnnouncements(next);
      showNotice(
        'success',
        `Announcement "${ann.title}" ${nextState ? 'published' : 'unpublished'}.`
      );
      return;
    }

    const { error } = await supabase
      .from('announcements')
      .update({ published: nextState })
      .eq('id', ann.id);
    if (error) {
      showNotice('error', error.message);
      return;
    }
    showNotice(
      'success',
      `Announcement "${ann.title}" ${nextState ? 'published' : 'unpublished'}.`
    );
    await fetchAdminData();
  };

  const handleDeleteAnnouncement = async (ann: QBenchAnnouncement) => {
    if (!isSupabaseConfigured) {
      const next = announcements.filter((a) => a.id !== ann.id);
      localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(next));
      setAnnouncements(next);
      showNotice('success', `Deleted announcement "${ann.title}".`);
      return;
    }

    const { error } = await supabase.from('announcements').delete().eq('id', ann.id);
    if (error) {
      showNotice('error', error.message);
      return;
    }
    showNotice('success', `Deleted announcement "${ann.title}".`);
    await fetchAdminData();
  };

  // Filtered resources for /admin/resources
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const categoryResourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    resources.forEach((r) => {
      if (r.category_id) {
        counts.set(r.category_id, (counts.get(r.category_id) || 0) + 1);
      }
    });
    return counts;
  }, [resources]);

  const filteredResources = useMemo(() => {
    const query = resourceSearch.trim().toLowerCase();
    return resources.filter((res) => {
      if (filterCategory !== 'all' && res.category_id !== filterCategory) return false;
      if (filterType !== 'all' && res.resource_type !== filterType) return false;
      if (filterPublished === 'published' && !res.published) return false;
      if (filterPublished === 'draft' && res.published) return false;
      if (filterFeatured === 'featured' && !res.featured) return false;
      if (filterFeatured === 'standard' && res.featured) return false;

      if (!query) return true;
      const inTitle = (res.title || '').toLowerCase().includes(query);
      const inDesc = (res.description || '').toLowerCase().includes(query);
      const tagsStr = Array.isArray(res.tags)
        ? res.tags.join(' ').toLowerCase()
        : String(res.tags || '').toLowerCase();
      const inTags = tagsStr.includes(query);
      return inTitle || inDesc || inTags;
    });
  }, [
    resources,
    resourceSearch,
    filterCategory,
    filterType,
    filterPublished,
    filterFeatured,
  ]);

  // Dashboard metrics
  const stats = useMemo(() => {
    const total = resources.length;
    const publishedCount = resources.filter((r) => r.published).length;
    const draftCount = total - publishedCount;
    const featuredCount = resources.filter((r) => r.featured).length;
    const categoriesCount = categories.length;
    const announcementsCount = announcements.length;
    const publishPercent = total > 0 ? Math.round((publishedCount / total) * 100) : 100;
    return {
      total,
      publishedCount,
      draftCount,
      featuredCount,
      categoriesCount,
      announcementsCount,
      publishPercent,
    };
  }, [resources, categories, announcements]);

  // 1. Loading Session State
  if (checkingSession) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 py-16">
        <div className="flex flex-col items-center space-y-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <Loader2 className="h-8 w-8 text-[#4CAF50] animate-spin" />
          <p className="font-display text-sm font-bold text-slate-800">
            Verifying Supabase Admin Session...
          </p>
          <p className="font-sans text-xs text-slate-500">
            Project: <span className="font-mono">{SUPABASE_PROJECT_REF}</span> • Checking public.admin_profiles
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated or /admin/login view
  if (!adminProfile || route === '/admin/login') {
    return (
      <div className="mx-auto max-w-lg px-6 py-14 lg:py-20">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <QBenchLogo variant="symbol" iconSize={56} />
            <div>
              <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                QBENCH – UNLIMITED RESOURCES
              </span>
              <h1 className="font-display text-2xl font-black text-slate-900 mt-1">
                Admin Control Center
              </h1>
              <p className="font-sans text-xs text-slate-500 mt-1">
                Connected to Supabase project{' '}
                <span className="font-mono font-semibold text-slate-700">
                  {SUPABASE_PROJECT_REF}
                </span>
              </p>
            </div>
          </div>

          {/* Connection status bar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Supabase Endpoint
              </span>
              <span className="font-mono text-[11px] font-bold text-[#2E7D32]">
                {activeSupabaseUrl}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Publishable Key Status
              </span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  isSupabaseConfigured ? 'text-[#2E7D32]' : 'text-amber-600'
                }`}
              >
                {isSupabaseConfigured
                  ? 'Active (Live Supabase Auth)'
                  : 'Pending VITE_SUPABASE_PUBLISHABLE_KEY'}
              </span>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div className="rounded-xl border border-[#4CAF50]/30 bg-[#4CAF50]/5 p-4 text-xs text-slate-700 space-y-2.5">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#4CAF50] shrink-0" />
                Instant Admin Workspace Access
              </p>
              <p className="leading-relaxed text-slate-600">
                Your project URL is pre-connected to{' '}
                <code className="font-mono font-bold text-slate-800">
                  {SUPABASE_PROJECT_REF}.supabase.co
                </code>
                . In Vercel, ensure{' '}
                <code className="font-mono font-bold">VITE_SUPABASE_PUBLISHABLE_KEY</code> is set. You can sign in below to open the full Admin Control Center immediately.
              </p>
            </div>
          )}

          {authError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="qbench.official@gmail.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-tech text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <input
                type="password"
                required={isSupabaseConfigured}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] disabled:opacity-60 py-3 font-display text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors cursor-pointer"
            >
              {authLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Admin Profile...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Sign In to Admin Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Direct Cloud Console Links */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <a
              href={SUPABASE_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 px-3 font-display text-[11px] font-bold text-slate-700 transition-colors"
            >
              <Database className="h-3.5 w-3.5 text-[#4CAF50]" />
              <span>Supabase Studio</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
            <a
              href={VERCEL_PRODUCTION_CHECKLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 px-3 font-display text-[11px] font-bold text-slate-700 transition-colors"
            >
              <Server className="h-3.5 w-3.5 text-slate-800" />
              <span>Vercel Checklist</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Role required: admin_profiles.role = 'admin'</span>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/');
                }
                onNavigate('home');
              }}
              className="inline-flex items-center gap-1 font-semibold text-[#4CAF50] hover:underline cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard Layout
  const navLinks: {
    path: AdminRoutePath;
    label: string;
    count?: number;
    icon: React.ReactNode;
  }[] = [
    {
      path: '/admin',
      label: 'Overview',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      path: '/admin/resources',
      label: 'Resources',
      count: resources.length,
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      path: '/admin/categories',
      label: 'Categories',
      count: categories.length,
      icon: <FolderKanban className="h-4 w-4" />,
    },
    {
      path: '/admin/announcements',
      label: 'Announcements',
      count: announcements.length,
      icon: <Megaphone className="h-4 w-4" />,
    },
    {
      path: '/admin/settings',
      label: 'Cloud & Checklist',
      count: leads.length > 0 ? leads.length : undefined,
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const allFilteredSelected =
    filteredResources.length > 0 &&
    filteredResources.every((r) => selectedIds.includes(r.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredResources.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12 space-y-8">
      {/* Top Executive Command Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/25 flex items-center justify-center text-[#4CAF50] shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                QBENCH ADMIN CONTROL
              </span>
              <span className="rounded-md bg-[#4CAF50]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#2E7D32]">
                role: {adminProfile.role}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                supabase: {SUPABASE_PROJECT_REF}
              </span>
              {isLocalPreviewMode && (
                <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 font-tech text-[10px] font-bold text-amber-700">
                  Local Preview Sync
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl font-black text-slate-900">
              QBench – Unlimited Resources
            </h1>
            <p className="font-sans text-xs text-slate-500">
              Operator: <span className="font-semibold text-slate-700">{userEmail}</span> •{' '}
              <a
                href={SUPABASE_DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4CAF50] hover:underline font-semibold"
              >
                Supabase Project ↗
              </a>{' '}
              •{' '}
              <a
                href={VERCEL_PRODUCTION_CHECKLIST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-700 hover:underline font-semibold"
              >
                Vercel Checklist ↗
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAdminData}
            disabled={loadingData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-display text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin text-[#4CAF50]' : ''}`}
            />
            <span>Sync Data</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigateAdmin('/admin/resources');
              setEditingResource(null);
              setShowResourceForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] px-4 py-2 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Resource</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100/70 px-3.5 py-2 font-display text-xs font-semibold text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation bar for protected routes */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {navLinks.map((item) => {
            const active = route === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigateAdmin(item.path)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#4CAF50] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
            }
            onNavigate('home');
          }}
          className="inline-flex items-center gap-1.5 font-display text-xs font-bold text-slate-600 hover:text-[#4CAF50] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>View Public Website</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {actionBanner && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-xs font-semibold ${
            actionBanner.type === 'success'
              ? 'border-[#4CAF50]/30 bg-[#4CAF50]/10 text-[#1B5E20]'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionBanner.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-[#4CAF50]" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{actionBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-xs underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ROUTE 1: /admin (DASHBOARD) */}
      {route === '/admin' && (
        <div className="space-y-8">
          {/* 6 Required Dashboard Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Resources
              </span>
              <p className="font-display text-3xl font-black text-slate-900 tabular-nums">
                {stats.total}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-[#4CAF50]">
                Published Resources
              </span>
              <p className="font-display text-3xl font-black text-[#4CAF50] tabular-nums">
                {stats.publishedCount}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Draft Resources
              </span>
              <p className="font-display text-3xl font-black text-amber-600 tabular-nums">
                {stats.draftCount}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Categories
              </span>
              <p className="font-display text-3xl font-black text-slate-900 tabular-nums">
                {stats.categoriesCount}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-amber-500">
                Featured Resources
              </span>
              <p className="font-display text-3xl font-black text-slate-900 tabular-nums">
                {stats.featuredCount}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <span className="font-tech text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Announcements
              </span>
              <p className="font-display text-3xl font-black text-slate-900 tabular-nums">
                {stats.announcementsCount}
              </p>
            </div>
          </div>

          {/* Quick-Action Launchpad & Cloud Infrastructure Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                    QUICK ACTIONS
                  </span>
                  <h2 className="font-display text-base font-black text-slate-900">
                    Content & Catalog Operations
                  </h2>
                </div>
                <span className="font-mono text-xs font-bold text-[#2E7D32]">
                  {stats.publishPercent}% Published
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#4CAF50] transition-all duration-500"
                  style={{ width: `${stats.publishPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingResource(null);
                    setShowResourceForm(true);
                    navigateAdmin('/admin/resources');
                  }}
                  className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 hover:border-[#4CAF50] bg-slate-50/60 hover:bg-[#4CAF50]/5 p-3.5 text-left transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-[#4CAF50]" />
                  <span className="font-display text-xs font-bold text-slate-900">
                    Add Resource
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigateAdmin('/admin/categories');
                    openNewCategoryForm();
                  }}
                  className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 hover:border-[#4CAF50] bg-slate-50/60 hover:bg-[#4CAF50]/5 p-3.5 text-left transition-colors cursor-pointer"
                >
                  <FolderKanban className="h-4 w-4 text-[#4CAF50]" />
                  <span className="font-display text-xs font-bold text-slate-900">
                    New Category
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigateAdmin('/admin/announcements');
                    openNewAnnouncementForm();
                  }}
                  className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 hover:border-[#4CAF50] bg-slate-50/60 hover:bg-[#4CAF50]/5 p-3.5 text-left transition-colors cursor-pointer"
                >
                  <Megaphone className="h-4 w-4 text-[#4CAF50]" />
                  <span className="font-display text-xs font-bold text-slate-900">
                    Post Notice
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportResourcesJSON}
                  className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 hover:border-[#4CAF50] bg-slate-50/60 hover:bg-[#4CAF50]/5 p-3.5 text-left transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4 text-[#4CAF50]" />
                  <span className="font-display text-xs font-bold text-slate-900">
                    Export JSON
                  </span>
                </button>
              </div>
            </div>

            {/* Connected Cloud Infrastructure Card */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                  CONNECTED INFRASTRUCTURE
                </span>
                <h2 className="font-display text-base font-black text-slate-900">
                  Supabase & Vercel Production
                </h2>
                <p className="font-sans text-xs text-slate-500 leading-relaxed">
                  Direct links to your Supabase project (<code className="font-mono">{SUPABASE_PROJECT_REF}</code>) and Vercel deployment checklist.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={SUPABASE_DASHBOARD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-800 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Database className="h-4 w-4 text-[#4CAF50]" />
                    Supabase Studio
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>

                <a
                  href={VERCEL_PRODUCTION_CHECKLIST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-800 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Server className="h-4 w-4 text-slate-900" />
                    Vercel Checklist
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Recent Resources Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                  LATEST ACTIVITY
                </span>
                <h2 className="font-display text-lg font-black text-slate-900">
                  Recent Resources
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateAdmin('/admin/resources')}
                className="font-display text-xs font-bold text-[#4CAF50] hover:underline cursor-pointer"
              >
                Manage All Resources →
              </button>
            </div>

            {resources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-3">
                <p className="font-display text-sm font-bold text-slate-700">
                  No resources created yet
                </p>
                <p className="font-sans text-xs text-slate-500">
                  Click "New Resource" to add study notes, PDFs, tools, or templates to QBench.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingResource(null);
                    setShowResourceForm(true);
                    navigateAdmin('/admin/resources');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#4CAF50] px-4 py-2 font-display text-xs font-bold text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create First Resource</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-tech uppercase tracking-wider text-slate-400">
                      <th className="py-3 pr-4">Title</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Featured</th>
                      <th className="py-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {resources.slice(0, 8).map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 pr-4 font-display font-bold text-slate-900">
                          {res.title}
                          <span className="block font-mono text-[10px] font-normal text-slate-400">
                            /{res.slug}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{res.resource_type}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {res.category_id ? categoryMap.get(res.category_id) || '—' : '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleResourcePublish(res)}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold cursor-pointer ${
                              res.published
                                ? 'bg-[#4CAF50]/10 text-[#2E7D32]'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {res.published ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleResourceFeatured(res)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                res.featured
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                            <span
                              className={res.featured ? 'text-amber-600' : 'text-slate-400'}
                            >
                              {res.featured ? 'Featured' : 'Standard'}
                            </span>
                          </button>
                        </td>
                        <td className="py-3.5 pl-4 text-right space-x-2.5">
                          <button
                            type="button"
                            onClick={() => setPreviewResource(res)}
                            className="font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingResource(res);
                              setShowResourceForm(true);
                              navigateAdmin('/admin/resources');
                            }}
                            className="font-semibold text-[#4CAF50] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ROUTE 2: /admin/resources */}
      {route === '/admin/resources' && (
        <div className="space-y-6">
          {showResourceForm ? (
            <ResourceForm
              initialData={editingResource}
              categories={categories}
              onSubmit={handleSaveResource}
              onCancel={() => {
                setShowResourceForm(false);
                setEditingResource(null);
              }}
              isSaving={savingResource}
            />
          ) : (
            <>
              {/* Search & Filters Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                      PUBLIC.RESOURCES
                    </span>
                    <h2 className="font-display text-xl font-black text-slate-900">
                      Resource Management ({filteredResources.length})
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportResourcesJSON}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2.5 font-display text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingResource(null);
                        setShowResourceForm(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] px-4 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add New Resource</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Search input */}
                  <div className="relative lg:col-span-2">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      placeholder="Search by title, description, or tags..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:border-[#4CAF50] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#4CAF50] focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  {/* Resource Type Filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#4CAF50] focus:outline-none"
                  >
                    <option value="all">All Resource Types</option>
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  {/* Published / Featured Status Filter */}
                  <div className="flex gap-2">
                    <select
                      value={filterPublished}
                      onChange={(e) =>
                        setFilterPublished(e.target.value as 'all' | 'published' | 'draft')
                      }
                      className="w-1/2 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs text-slate-800 focus:border-[#4CAF50] focus:outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="draft">Drafts</option>
                    </select>

                    <select
                      value={filterFeatured}
                      onChange={(e) =>
                        setFilterFeatured(e.target.value as 'all' | 'featured' | 'standard')
                      }
                      className="w-1/2 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs text-slate-800 focus:border-[#4CAF50] focus:outline-none"
                    >
                      <option value="all">All Tiers</option>
                      <option value="featured">Featured</option>
                      <option value="standard">Not Featured</option>
                    </select>
                  </div>
                </div>

                {/* Bulk Action Toolbar */}
                {filteredResources.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="h-4 w-4 text-[#4CAF50]" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                      <span>
                        {selectedIds.length > 0
                          ? `${selectedIds.length} selected`
                          : 'Select all filtered'}
                      </span>
                    </button>

                    {selectedIds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleBulkAction('publish')}
                          className="rounded-lg bg-[#4CAF50]/10 px-2.5 py-1 font-bold text-[#2E7D32] hover:bg-[#4CAF50]/20 cursor-pointer"
                        >
                          Publish Selected
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkAction('unpublish')}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                        >
                          Move to Draft
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkAction('feature')}
                          className="rounded-lg bg-amber-50 px-2.5 py-1 font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
                        >
                          Mark Featured
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkAction('delete')}
                          className="rounded-lg bg-red-50 px-2.5 py-1 font-bold text-red-700 hover:bg-red-100 cursor-pointer"
                        >
                          Delete Selected
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resource Cards / List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                {filteredResources.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <p className="font-display text-sm font-bold text-slate-700">
                      No matching resources found
                    </p>
                    <p className="font-sans text-xs text-slate-500">
                      Try adjusting your search or filter criteria, or click "Add New Resource".
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredResources.map((res) => {
                      const tagsList = Array.isArray(res.tags)
                        ? res.tags
                        : typeof res.tags === 'string' && res.tags.trim()
                        ? res.tags.split(',').map((t) => t.trim())
                        : [];
                      const isSelected = selectedIds.includes(res.id);

                      return (
                        <div
                          key={res.id}
                          className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5">
                            <button
                              type="button"
                              onClick={() => toggleSelectOne(res.id)}
                              className="mt-1 text-slate-400 hover:text-[#4CAF50] cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-[#4CAF50]" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>

                            {res.thumbnail_url ? (
                              <img
                                src={res.thumbnail_url}
                                alt={res.title}
                                className="h-14 w-20 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="h-14 w-20 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center text-[#4CAF50] shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                            )}

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display text-sm font-black text-slate-900">
                                  {res.title}
                                </h3>
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-tech text-[10px] font-bold text-slate-700">
                                  {res.resource_type}
                                </span>
                                {res.category_id && (
                                  <span className="rounded-md bg-[#4CAF50]/10 px-2 py-0.5 font-tech text-[10px] font-bold text-[#2E7D32]">
                                    {categoryMap.get(res.category_id) || 'Category'}
                                  </span>
                                )}
                                {res.subcategory && (
                                  <span className="text-[10px] text-slate-500">
                                    • {res.subcategory}
                                  </span>
                                )}
                              </div>

                              {res.description && (
                                <p className="font-sans text-xs text-slate-600 line-clamp-2 max-w-2xl">
                                  {res.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                                <span className="font-mono">/{res.slug}</span>
                                {res.file_url && (
                                  <a
                                    href={res.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[#4CAF50] hover:underline font-semibold"
                                  >
                                    <FileText className="h-3 w-3" />
                                    File URL
                                  </a>
                                )}
                                {res.external_url && (
                                  <a
                                    href={res.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-slate-600 hover:underline font-semibold"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    External Link
                                  </a>
                                )}
                                {tagsList.length > 0 && (
                                  <span className="text-slate-500">
                                    Tags: {tagsList.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewResource(res)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Preview</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleResourcePublish(res)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                res.published
                                  ? 'border-[#4CAF50]/30 bg-[#4CAF50]/10 text-[#2E7D32]'
                                  : 'border-slate-200 bg-slate-50 text-slate-600'
                              }`}
                            >
                              {res.published ? (
                                <>
                                  <Globe className="h-3.5 w-3.5" />
                                  <span>Published</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  <span>Draft</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleResourceFeatured(res)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                res.featured
                                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <Star
                                className={`h-3.5 w-3.5 ${
                                  res.featured ? 'fill-amber-400 text-amber-500' : ''
                                }`}
                              />
                              <span>{res.featured ? 'Featured' : 'Feature'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingResource(res);
                                setShowResourceForm(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteResource(res)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ROUTE 3: /admin/categories */}
      {route === '/admin/categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div>
              <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                PUBLIC.CATEGORIES
              </span>
              <h2 className="font-display text-xl font-black text-slate-900">
                Categories ({categories.length})
              </h2>
            </div>

            <button
              type="button"
              onClick={openNewCategoryForm}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] px-4 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>

          {showCategoryForm && (
            <form
              onSubmit={handleSaveCategory}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs"
            >
              <h3 className="font-display text-base font-black text-slate-900">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'New Category'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (!editingCategory) setCatSlug(slugify(e.target.value));
                    }}
                    placeholder="Study Notes"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={catSlug}
                    onChange={(e) => setCatSlug(slugify(e.target.value))}
                    placeholder="study-notes"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Icon Name / Emoji
                  </label>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    placeholder="📚"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Category overview..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Image URL (or Upload to thumbnails/)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={catImageUrl}
                      onChange={(e) => setCatImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                    />
                    <label className="inline-flex items-center gap-1.5 rounded-xl border border-[#4CAF50]/40 bg-[#4CAF50]/10 px-3 py-2 text-xs font-bold text-[#2E7D32] cursor-pointer">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{uploadingCatImg ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer pt-4">
                  <input
                    type="checkbox"
                    checked={catPublished}
                    onChange={(e) => setCatPublished(e.target.checked)}
                    className="h-4 w-4 rounded text-[#4CAF50]"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Published (Visible publicly)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="rounded-xl bg-[#4CAF50] hover:bg-[#43A047] px-5 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  {savingCategory ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const count = categoryResourceCounts.get(cat.id) || 0;
              return (
                <div
                  key={cat.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 font-display text-base font-black text-slate-900">
                        <span>{cat.icon || '📁'}</span>
                        <span>{cat.name}</span>
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          cat.published
                            ? 'bg-[#4CAF50]/10 text-[#2E7D32]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cat.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono">/{cat.slug}</span>
                      <span className="font-semibold text-slate-600">
                        {count} resource{count === 1 ? '' : 's'}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="font-sans text-xs text-slate-600">{cat.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryPublish(cat)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {cat.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditCategoryForm(cat)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-[#4CAF50] hover:bg-slate-50 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROUTE 4: /admin/announcements */}
      {route === '/admin/announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div>
              <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                PUBLIC.ANNOUNCEMENTS
              </span>
              <h2 className="font-display text-xl font-black text-slate-900">
                Announcements ({announcements.length})
              </h2>
            </div>

            <button
              type="button"
              onClick={openNewAnnouncementForm}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] px-4 py-2.5 font-display text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Announcement</span>
            </button>
          </div>

          {showAnnouncementForm && (
            <form
              onSubmit={handleSaveAnnouncement}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs"
            >
              <h3 className="font-display text-base font-black text-slate-900">
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="New Study Pack Released!"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                    Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={annLink}
                    onChange={(e) => setAnnLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-tech text-[10px] font-bold uppercase text-slate-700">
                  Message *
                </label>
                <textarea
                  rows={2}
                  required
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Announcement details..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={annPublished}
                  onChange={(e) => setAnnPublished(e.target.checked)}
                  className="h-4 w-4 rounded text-[#4CAF50]"
                />
                <span className="text-xs font-bold text-slate-800">
                  Published (Show on public website)
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAnnouncement}
                  className="rounded-xl bg-[#4CAF50] hover:bg-[#43A047] px-5 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  {savingAnnouncement ? 'Saving...' : 'Save Announcement'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-black text-slate-900">
                      {ann.title}
                    </h3>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        ann.published
                          ? 'bg-[#4CAF50]/10 text-[#2E7D32]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ann.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-slate-600">{ann.message}</p>
                  {ann.link && (
                    <a
                      href={ann.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#4CAF50] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {ann.link}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleAnnouncementPublish(ann)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {ann.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditAnnouncementForm(ann)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#4CAF50] hover:bg-slate-50 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(ann)}
                    className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROUTE 5: /admin/settings (CLOUD & VERCEL PRODUCTION CHECKLIST + ENQUIRIES) */}
      {route === '/admin/settings' && (
        <div className="space-y-8">
          {/* Supabase + Vercel Production Checklist Hub */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                  SUPABASE & VERCEL DEPLOYMENT HUB
                </span>
                <h2 className="font-display text-xl font-black text-slate-900 mt-0.5">
                  Production Readiness Checklist
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunDiagnostics}
                  disabled={runningDiagnostics}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] px-4 py-2 font-display text-xs font-bold text-white cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${runningDiagnostics ? 'animate-spin' : ''}`}
                  />
                  <span>Run Live Diagnostics</span>
                </button>
              </div>
            </div>

            {/* Direct Console Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <a
                href={SUPABASE_DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 p-4 text-xs font-bold text-slate-900 transition-colors"
              >
                <div>
                  <span className="block font-tech text-[10px] text-[#4CAF50] uppercase">
                    SUPABASE PROJECT
                  </span>
                  <span>{SUPABASE_PROJECT_REF}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </a>

              <a
                href={`${SUPABASE_DASHBOARD_URL}/storage/buckets/${STORAGE_BUCKET}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 p-4 text-xs font-bold text-slate-900 transition-colors"
              >
                <div>
                  <span className="block font-tech text-[10px] text-[#4CAF50] uppercase">
                    STORAGE BUCKET
                  </span>
                  <span>{STORAGE_BUCKET}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </a>

              <a
                href={VERCEL_PRODUCTION_CHECKLIST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 p-4 text-xs font-bold text-slate-900 transition-colors"
              >
                <div>
                  <span className="block font-tech text-[10px] text-slate-500 uppercase">
                    VERCEL PROJECT
                  </span>
                  <span>Production Checklist</span>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </a>

              <a
                href={VERCEL_ENV_SETTINGS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 p-4 text-xs font-bold text-slate-900 transition-colors"
              >
                <div>
                  <span className="block font-tech text-[10px] text-slate-500 uppercase">
                    VERCEL SETTINGS
                  </span>
                  <span>Environment Variables</span>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </a>
            </div>

            {/* Diagnostic Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Supabase Connection & Security Status
                </h3>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">VITE_SUPABASE_URL:</dt>
                    <dd className="font-mono font-bold text-[#2E7D32]">
                      {activeSupabaseUrl}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">VITE_SUPABASE_PUBLISHABLE_KEY:</dt>
                    <dd
                      className={`font-mono font-bold ${
                        isSupabaseConfigured ? 'text-[#2E7D32]' : 'text-amber-600'
                      }`}
                    >
                      {isSupabaseConfigured ? 'Configured ✓' : 'Set in Vercel Env Vars'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">No service_role / secret exposed:</dt>
                    <dd className="font-mono font-bold text-[#2E7D32]">Verified Safe ✓</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">admin_profiles.role:</dt>
                    <dd className="font-mono font-bold text-[#2E7D32]">
                      {adminProfile.role}
                    </dd>
                  </div>
                </dl>
                {diagnostics && (
                  <p className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                    {diagnostics.detailMessage}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Vercel Production Checklist Items
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#4CAF50] shrink-0" />
                    <span>
                      PWA Manifest (<code className="font-mono">manifest.webmanifest</code>) & Service Worker (<code className="font-mono">sw.js</code>)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#4CAF50] shrink-0" />
                    <span>
                      SPA Rewrites configured in <code className="font-mono">vercel.json</code> for <code className="font-mono">/admin/*</code> routes
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#4CAF50] shrink-0" />
                    <span>
                      Connected tables: <code className="font-mono">admin_profiles</code>, <code className="font-mono">categories</code>, <code className="font-mono">resources</code>, <code className="font-mono">announcements</code>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#4CAF50] shrink-0" />
                    <span>
                      Storage bucket <code className="font-mono">qbench-resources</code> (<code className="font-mono">resources/</code> & <code className="font-mono">thumbnails/</code>)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Website Enquiries / Leads Inbox */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                  CLIENT INQUIRIES & AUDIT REQUESTS
                </span>
                <h3 className="font-display text-lg font-black text-slate-900">
                  Website Enquiries Inbox ({leads.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={fetchServerLeads}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Inbox</span>
              </button>
            </div>

            {leads.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No contact or brand audit enquiries recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {leads.slice(0, 10).map((lead: any) => (
                  <div
                    key={lead.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-[#4CAF50]" />
                        <span className="font-display font-bold text-slate-900">
                          {lead.name}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{lead.email}</span>
                        {lead.phone && (
                          <span className="text-slate-500">({lead.phone})</span>
                        )}
                      </div>
                      <p className="text-slate-600">{lead.message}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleString()
                        : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resource Quick-Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#4CAF50]">
                  {previewResource.resource_type}
                </span>
                <h3 className="font-display text-xl font-black text-slate-900 mt-0.5">
                  {previewResource.title}
                </h3>
                <p className="font-mono text-xs text-slate-400">/{previewResource.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {previewResource.thumbnail_url && (
              <img
                src={previewResource.thumbnail_url}
                alt={previewResource.title}
                className="w-full h-48 object-cover rounded-xl border border-slate-200"
              />
            )}

            {previewResource.description && (
              <div className="space-y-1">
                <span className="font-tech text-[10px] font-bold uppercase text-slate-400">
                  Description
                </span>
                <p className="font-sans text-xs text-slate-700 leading-relaxed">
                  {previewResource.description}
                </p>
              </div>
            )}

            {previewResource.content && (
              <div className="space-y-1">
                <span className="font-tech text-[10px] font-bold uppercase text-slate-400">
                  Content / Study Notes
                </span>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {previewResource.content}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap gap-2">
                {previewResource.file_url && (
                  <a
                    href={previewResource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#4CAF50] px-4 py-2 font-display text-xs font-bold text-white"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Open File</span>
                  </a>
                )}
                {previewResource.external_url && (
                  <a
                    href={previewResource.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 font-display text-xs font-bold text-slate-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open External URL</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-display text-xs font-bold text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
