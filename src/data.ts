import { TeamMember, StrengthCard, PortfolioProject, ProcessStep, StudioLocation } from './types';

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Akhil Suresh',
    role: 'FOUNDING DIRECTOR',
    roleBadge: 'Director of Identity, QBench',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&h=800&q=80'
  },
  {
    id: '2',
    name: 'Shalumol Varghese',
    role: 'CHIEF TECHNOLOGIST',
    roleBadge: 'Chief Systems Architect, QBench',
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&h=800&q=80'
  },
  {
    id: '3',
    name: 'Jobin Jose',
    role: 'LEAD DESIGNER',
    roleBadge: 'Design Director, QBench',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&h=800&q=80'
  }
];

export const STRENGTH_CARDS: StrengthCard[] = [
  {
    icon: 'compass',
    title: 'Strategy',
    description: "We map the technological landscape to find the optimal path for your brand's evolution.",
    bullets: ['MARKET ANALYSIS', 'BRAND ARCHITECTURE', 'GROWTH MAPPING'],
    bgClass: 'bg-white border border-brand-outline/40',
    textClass: 'text-brand-text'
  },
  {
    icon: 'layout',
    title: 'Technology',
    description: 'Robust, scalable foundations built with the latest in sustainable digital infrastructure.',
    tags: ['REACT', 'AWS', 'PYTHON'],
    bgClass: 'bg-brand-primary text-white border border-brand-primary',
    textClass: 'text-white'
  },
  {
    icon: 'sparkles',
    title: 'Innovation',
    description: 'Pushing boundaries through R&D in AI and immersive experiences.',
    bgClass: 'bg-brand-accent-light/60 border border-brand-accent/30',
    textClass: 'text-brand-secondary'
  }
];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: '1',
    title: 'QBench Brand Identity',
    subtitle: 'A complete brand identity featuring logo design, color palette, typography, and visual guidelines.',
    category: 'branding',
    categoryLabel: 'Branding',
    imageUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&h=500&q=80',
    year: '2025'
  },
  {
    id: '2',
    title: 'Luxury Jewellery Campaign',
    subtitle: 'A collection of premium social media creatives designed to showcase fine jewellery through elegant visuals and consistent brand storytelling.',
    category: 'social_media',
    categoryLabel: 'Social Media Design',
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&h=500&q=80',
    year: '2026'
  },
  {
    id: '3',
    title: 'Product Launch Reel',
    subtitle: 'Professional video editing for promotional content, product showcases, and digital storytelling.',
    category: 'video_edition',
    categoryLabel: 'Video Editing',
    imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&h=500&q=80',
    year: '2026'
  },
  {
    id: '4',
    title: 'Corporate Brand Refresh',
    subtitle: 'Custom motion graphics and animations created to enhance digital content and visual communication.',
    category: 'motion_graphics',
    categoryLabel: 'Motion Graphics',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&h=500&q=80',
    year: '2025'
  },
  {
    id: '5',
    title: 'The Journey of a Ring — Luxury Jewellery Motion Design',
    subtitle: 'Cinematic luxury jewellery motion design exploring the craftsmanship, brilliance, and timeless elegance of a fine diamond ring.',
    category: 'motion_graphics',
    categoryLabel: 'Motion Graphics',
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&h=500&q=80',
    year: '2026',
    externalUrl: 'https://www.behance.net/gallery/253620337/The-Journey-of-a-Ring-Luxury-Jewellery-Motion-Design?platform=direct'
  }
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: '01',
    title: 'Understand the Business',
    description: 'We begin by understanding the client\'s goals, challenges, target audience, and market position.',
    activities: ['Client Consultation', 'Requirement Gathering', 'Market Research', 'Competitor Analysis'],
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    iconName: 'Search'
  },
  {
    number: '02',
    title: 'Build the Roadmap',
    description: 'We create a customized strategy aligned with business objectives and measurable outcomes.',
    activities: ['Brand Strategy', 'Marketing Planning', 'Project Scope Definition', 'Timeline & Budget Planning'],
    imageUrl: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80',
    iconName: 'Milestone'
  },
  {
    number: '03',
    title: 'Transform Ideas into Concepts',
    description: 'Our team develops creative solutions and innovative approaches that differentiate the brand.',
    activities: ['Creative Concepts', 'Visual Design', 'Content Planning', 'Experience Design'],
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    iconName: 'PenTool'
  },
  {
    number: '04',
    title: 'Bring the Vision to Life',
    description: 'Using technology and expertise, we execute the project with precision and quality.',
    activities: ['Website Development', 'Digital Campaigns', 'Media Production', 'Event Execution'],
    imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80',
    iconName: 'Code'
  },
  {
    number: '05',
    title: 'Deliver with Confidence',
    description: 'The final solution is deployed, tested, and launched to the target audience.',
    activities: ['Quality Assurance', 'Performance Testing', 'Go-Live Support', 'Launch Monitoring'],
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    iconName: 'Rocket'
  }
];

export const STUDIO_LOCATIONS: StudioLocation[] = [
  {
    name: 'Studio Kochi',
    addressLine1: '22 Bishopsgate, Kochi',
    addressLine2: 'Ernakulam, EC2N 4AJ',
    hours: 'Open: 09:00 — 18:00 GMT',
    isHQ: true,
    imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Studio NYC',
    addressLine1: 'One World Trade Center, Suite 85',
    addressLine2: 'New York, NY 10007, USA',
    hours: 'Open: 09:00 — 18:00 EST',
    isHQ: false,
    imageUrl: 'https://images.unsplash.com/photo-1546706887-b347a5542bb0?auto=format&fit=crop&w=800&q=80'
  }
];
