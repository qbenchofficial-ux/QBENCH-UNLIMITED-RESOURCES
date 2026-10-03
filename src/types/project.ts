export type ProjectStatus = 'draft' | 'published';

export type ProjectThumbnailMode = 'cover_image' | 'video_thumbnail';

export interface PortfolioImage {
  id: string;
  project_id: string | null;
  image_url: string;
  storage_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  alt_text: string | null;
  sort_order: number;
  display_order: number;
  created_at: string;
}

export interface GalleryImageInput {
  id?: string;
  image_url: string;
  storage_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  alt_text: string;
  display_order: number;
}

export interface ProjectVideo {
  id: string;
  project_id: string | null;
  video_url: string;
  storage_path: string | null;
  video_title: string | null;
  video_description: string | null;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  file_size?: number | null;
}

export interface ProjectVideoInput {
  id?: string;
  video_url: string;
  storage_path?: string | null;
  video_title: string;
  video_description: string;
  display_order: number;
  is_featured: boolean;
  file_size?: number | null;
  file_name?: string | null;
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
  client_name: string | null;
  year: number | null;
  project_date: string | null;
  project_type: string | null;
  services: string[];
  software_tools: string[];
  cover_image: string | null;
  cover_image_url: string | null;
  thumbnail_mode?: ProjectThumbnailMode;
  gallery: string[];
  behance_url: string | null;
  youtube_url: string | null;
  video_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  featured: boolean;
  is_featured: boolean;
  status: ProjectStatus;
  sort_order: number;
  display_order: number;
  portfolio_images?: PortfolioImage[];
  project_videos?: ProjectVideo[];
  is_seed?: boolean;
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
  client_name?: string;
  year: number;
  project_date?: string;
  project_type?: string;
  services: string[];
  software_tools?: string[];
  cover_image: string | null;
  cover_image_url?: string | null;
  thumbnail_mode?: ProjectThumbnailMode;
  gallery: string[];
  gallery_items?: GalleryImageInput[];
  video_items?: ProjectVideoInput[];
  behance_url: string;
  youtube_url: string;
  video_url?: string;
  instagram_url?: string;
  website_url?: string;
  featured: boolean;
  is_featured?: boolean;
  status: ProjectStatus;
  sort_order?: number;
  display_order?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  display_order: number;
  projects_display_limit: number;
  show_view_all: boolean;
  is_active: boolean;
  is_seed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryFormData {
  name: string;
  slug?: string;
  description?: string | null;
  cover_image_url?: string | null;
  display_order?: number;
  projects_display_limit?: number;
  show_view_all?: boolean;
  is_active?: boolean;
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
  display_order?: number;
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
  package?: string | null;
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
  package?: string;
  budget?: string;
  timeline?: string;
  project_description?: string;
  reference_url?: string;
  message?: string;
}
