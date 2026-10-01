export type ProjectStatus = 'draft' | 'published';

export interface Project {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category: string | null;
  client: string | null;
  year: number | null;
  services: string[];
  cover_image: string | null;
  gallery: string[];
  video_url: string | null;
  behance_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  featured: boolean;
  status: ProjectStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectFormData {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  client: string;
  year: number;
  services: string[];
  cover_image: string | null;
  gallery: string[];
  video_url: string;
  behance_url: string;
  instagram_url: string;
  website_url: string;
  featured: boolean;
  status: ProjectStatus;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at?: string;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | string;
  created_at?: string;
}

export interface SiteSettings {
  id?: string;
  agency_name: string;
  agency_description: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram_url: string;
  linkedin_url: string;
  behance_url: string;
  website_url: string;
  updated_at?: string;
}

export interface MediaFile {
  id?: string;
  name: string;
  path: string;
  url: string;
  created_at: string;
  size: number | null;
  project_id?: string | null;
}

export type InquiryStatus = 'new' | 'in_review' | 'contacted' | 'archived';

export interface ProjectInquiry {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  service: string;
  budget: string | null;
  timeline: string | null;
  project_description: string | null;
  reference_url: string | null;
  message: string | null;
  status: InquiryStatus;
  created_at: string;
}

export interface ProjectInquiryInput {
  name: string;
  company?: string;
  email: string;
  phone: string;
  service: string;
  budget?: string;
  timeline?: string;
  project_description?: string;
  reference_url?: string;
  message?: string;
}
