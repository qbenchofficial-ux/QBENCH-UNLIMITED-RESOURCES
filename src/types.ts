export type NavSection = 'home' | 'about' | 'services' | 'portfolio' | 'process' | 'contact' | 'packages';

export type ServiceTab = 'branding' | 'social-media' | 'video-editing' | 'digital-marketing' | 'uiux' | 'webdev' | 'motion' | 'growth' | 'business-support';

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
