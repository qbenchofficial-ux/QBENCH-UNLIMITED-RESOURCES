import { useState, useEffect, useCallback } from 'react';
import {
  getAllProjects,
  getPublishedProjects,
  getCategories,
  getSiteSettings,
  getProjectInquiries,
  DEFAULT_SITE_SETTINGS,
} from '../services/projectService';
import {
  fetchAllCmsSiteContent,
  getCachedPackagesData,
  getCachedServicesData,
  getCachedWebsiteContent,
  type CmsPackageCategory,
  type CmsBusinessSupportConfig,
  type CmsServiceItem,
  type CmsWebsiteContent,
} from '../services/siteContentService';
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
  const [packages, setPackages] = useState<CmsPackageCategory[]>(
    () => getCachedPackagesData().packages
  );
  const [businessSupport, setBusinessSupport] =
    useState<CmsBusinessSupportConfig>(
      () => getCachedPackagesData().businessSupport
    );
  const [services, setServices] = useState<CmsServiceItem[]>(
    () => getCachedServicesData()
  );
  const [websiteContent, setWebsiteContent] = useState<CmsWebsiteContent>(
    () => getCachedWebsiteContent()
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projData, catData, settingsData, inquiriesData, cmsContent] =
        await Promise.all([
          mode === 'admin' ? getAllProjects() : getPublishedProjects(),
          getCategories(),
          getSiteSettings(),
          mode === 'admin' ? getProjectInquiries() : Promise.resolve([]),
          fetchAllCmsSiteContent(),
        ]);
      setProjects(projData);
      setCategories(catData);
      setSettings(settingsData);
      setInquiries(inquiriesData);
      setPackages(cmsContent.packages);
      setBusinessSupport(cmsContent.businessSupport);
      setServices(cmsContent.services);
      setWebsiteContent(cmsContent.websiteContent);
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
    packages,
    businessSupport,
    services,
    websiteContent,
    loading,
    error,
    refresh,
  };
}
