export type ProjectStatus = 'draft' | 'published';

export interface PortfolioImage {
  id: string;
  project_id: string | null;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  category: string | null;
  client: string | null;
  year: number | null;
  services: string[];
  cover_image: string | null;
  gallery: string[];
  behance_url: string | null;
  youtube_url: string | null;
  video_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  featured: boolean;
  status: ProjectStatus;
  sort_order: number;
  portfolio_images?: PortfolioImage[];
  created_at: string;
  updated_at: string;
}

export interface ProjectFormData {
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  category_id?: string | null;
  category: string;
  client: string;
  year: number;
  services: string[];
  cover_image: string | null;
  gallery: string[];
  behance_url: string;
  youtube_url: string;
  video_url?: string;
  instagram_url?: string;
  website_url?: string;
  featured: boolean;
  status: ProjectStatus;
  sort_order?: number;
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

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  created_at?: string;
  updated_at?: string;
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
  alt_text?: string | null;
  sort_order?: number;
  created_at: string;
  size: number | null;
  project_id?: string | null;
}

export type InquiryStatus = 'new' | 'contacted' | 'closed';

export interface ProjectInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  service: string;
  budget: string | null;
  message: string | null;
  status: InquiryStatus;
  created_at: string;
  updated_at?: string;
}

export interface ProjectInquiryInput {
  name: string;
  email: string;
  phone: string;
  company?: string;
  service: string;
  budget?: string;
  timeline?: string;
  project_description?: string;
  reference_url?: string;
  message?: string;
}
