import { useState, useEffect, useCallback } from 'react';
import {
  getAllProjects,
  getPublishedProjects,
  getCategories,
  getSiteSettings,
  getProjectInquiries,
  DEFAULT_SITE_SETTINGS,
} from '../services/projectService';
import type {
  Project,
  Category,
  SiteSettings,
  ProjectInquiry,
} from '../types/project';

export function useProjects(mode: 'public' | 'admin' = 'public') {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [inquiries, setInquiries] = useState<ProjectInquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projData, catData, settingsData, inquiriesData] = await Promise.all([
        mode === 'admin' ? getAllProjects() : getPublishedProjects(),
        getCategories(),
        getSiteSettings(),
        mode === 'admin' ? getProjectInquiries() : Promise.resolve([]),
      ]);
      setProjects(projData);
      setCategories(catData);
      setSettings(settingsData);
      setInquiries(inquiriesData);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load portfolio data.'
      );
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    refresh();
    const handleCmsUpdate = () => {
      refresh();
    };
    window.addEventListener('qbench-cms-updated', handleCmsUpdate);
    return () => {
      window.removeEventListener('qbench-cms-updated', handleCmsUpdate);
    };
  }, [refresh]);

  return {
    projects,
    categories,
    settings,
    inquiries,
    loading,
    error,
    refresh,
  };
}
