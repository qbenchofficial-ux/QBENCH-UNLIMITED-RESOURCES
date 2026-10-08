export type NavSection = 'home' | 'about' | 'services' | 'portfolio' | 'process' | 'contact' | 'packages' | 'admin';

export type ServiceTab = 'branding' | 'social-media' | 'video-editing' | 'digital-marketing' | 'uiux' | 'webdev' | 'motion' | 'growth' | 'business-support';

export type ResourceType =
  | 'Study Notes'
  | 'PDF'
  | 'Questions & Answers'
  | 'Exam Material'
  | 'Video'
  | 'Website'
  | 'Tool'
  | 'Template'
  | 'Article'
  | 'Other';

export const RESOURCE_TYPES: ResourceType[] = [
  'Study Notes',
  'PDF',
  'Questions & Answers',
  'Exam Material',
  'Video',
  'Website',
  'Tool',
  'Template',
  'Article',
  'Other',
];

export interface AdminProfile {
  id: string;
  role: string;
  email?: string;
  full_name?: string;
  created_at?: string;
}

export interface QBenchCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QBenchResource {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  subcategory: string | null;
  resource_type: ResourceType | string;
  content: string | null;
  file_url: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  tags: string[] | string | null;
  featured: boolean;
  published: boolean;
  created_at?: string;
  updated_at?: string;
  categories?: QBenchCategory | null;
}

export interface QBenchAnnouncement {
  id: string;
  title: string;
  message: string;
  link: string | null;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  roleBadge: string;
  imageUrl: string;
}

export interface StrengthCard {
  icon: string;
  title: string;
  description: string;
  bullets?: string[];
  tags?: string[];
  bgClass: string;
  textClass: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  subtitle: string;
  category: 'branding' | 'social_media' | 'video_edition' | 'motion_graphics';
  categoryLabel: string;
  imageUrl: string;
  year: string;
  externalUrl?: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  activities: string[];
  imageUrl: string;
  iconName: string;
}

export interface StudioLocation {
  name: string;
  addressLine1: string;
  addressLine2: string;
  hours: string;
  isHQ: boolean;
  imageUrl: string;
}
