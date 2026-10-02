import { supabase, ensureSupabaseConfig } from '../lib/supabase';
import { TEAM_MEMBERS, PROCESS_STEPS, STUDIO_LOCATIONS } from '../data';
import type { ServiceTab, ProcessStep, TeamMember, StudioLocation } from '../types';

export interface PackageFeatureRow {
  name: string;
  basic: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

export interface CmsPackageCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  tierNames?: {
    basic: string;
    standard: string;
    premium: string;
  };
  tierDescriptions?: {
    basic: string;
    standard: string;
    premium: string;
  };
  tierTimelines?: {
    basic: string;
    standard: string;
    premium: string;
  };
  prices: {
    basic: number;
    standard: number;
    premium: number;
  };
  priceLabels: {
    basic: string;
    standard: string;
    premium: string;
  };
  features: PackageFeatureRow[];
}

export interface CmsBusinessSupportConfig {
  badge: string;
  headline: string;
  description: string;
  subnote: string;
  starterName: string;
  starterSubtitle: string;
  starterPriceLabel: string;
  starterInclusions: string[];
  growthName: string;
  growthSubtitle: string;
  growthPriceLabel: string;
  growthInclusions: string[];
  partnerName: string;
  partnerSubtitle: string;
  partnerPriceLabel: string;
  partnerInclusions: string[];
  addons: { name: string; price: string }[];
}

export interface CmsServiceItem {
  id: ServiceTab;
  title: string;
  label: string;
  emoji: string;
  iconName: string;
  desc: string;
  startingPrice?: string;
  deliverables?: string[];
}

export interface CmsWebsiteContent {
  // Home Hero
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleHighlight: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTrustNote: string;
  homeWhyChoose: { title: string; desc: string }[];
  homeProcessSteps: { num: string; title: string; desc: string }[];

  // Services Page Hero & Why Choose
  servicesHeroBadge: string;
  servicesHeroTitleLine1: string;
  servicesHeroTitleLine2: string;
  servicesHeroTitleHighlight: string;
  servicesHeroDescription: string;
  servicesWhyChoose: { title: string; desc: string }[];

  // Packages Page Header
  packagesBadge: string;
  packagesTitleLine1: string;
  packagesTitleHighlight: string;
  packagesDescription: string;

  // Process Page (/process)
  processBadge: string;
  processTitlePrefix: string;
  processTitleHighlight: string;
  processDescription: string;
  processSteps: ProcessStep[];
  processMetrics: { value: string; label: string; description: string }[];

  // Team & Studio Locations
  teamMembers: TeamMember[];
  studioLocations: StudioLocation[];
}

export const DEFAULT_PACKAGES_DATA: CmsPackageCategory[] = [
  {
    id: 'branding',
    name: 'Branding',
    description:
      'Explore logo designs, brand identities, visual systems, and creative concepts crafted to build memorable and impactful brands.',
    iconName: 'Compass',
    tierNames: {
      basic: 'Starter',
      standard: 'Professional ⭐',
      premium: 'Enterprise',
    },
    tierDescriptions: {
      basic: 'Perfect for startups and personal brands.',
      standard: 'For businesses ready to establish a strong brand.',
      premium: 'A complete branding solution with premium support.',
    },
    tierTimelines: {
      basic: 'approx. 1-2 Weeks',
      standard: 'approx. 2-3 Weeks',
      premium: 'approx. 3-4 Weeks',
    },
    prices: { basic: 5000, standard: 12000, premium: 25000 },
    priceLabels: { basic: '₹5,000', standard: '₹12,000', premium: '₹25,000' },
    features: [
      { name: 'Logo Design', basic: true, standard: true, premium: true },
      { name: 'Brand Color Palette', basic: true, standard: true, premium: true },
      { name: 'Typography Guidelines', basic: true, standard: true, premium: true },
      { name: 'Brand Style Guide', basic: false, standard: true, premium: true },
      { name: 'Business Card Design', basic: true, standard: true, premium: true },
      { name: 'Social Media Brand Kit', basic: false, standard: true, premium: true },
      { name: 'Complete Brand Identity System', basic: false, standard: false, premium: true },
    ],
  },
  {
    id: 'social-media',
    name: 'Social Media Design',
    description:
      'Capture instant digital attention and build consistent brand aesthetic across all social grids.',
    iconName: 'Share2',
    tierNames: {
      basic: 'Basic',
      standard: 'Standard',
      premium: 'Premium',
    },
    tierDescriptions: {
      basic: 'Essential tools designed to establish initial capability and structure.',
      standard: 'Fully featured setup delivering complete utility, design details, and workflow scaling tools.',
      premium: 'Maximized capability targets, continuous priority iterations, and elite enterprise support.',
    },
    tierTimelines: {
      basic: 'approx. 1-2 Weeks',
      standard: 'approx. 3-4 Weeks',
      premium: 'Continuous Sprint Delivery',
    },
    prices: { basic: 5000, standard: 12000, premium: 25000 },
    priceLabels: { basic: '₹5,000', standard: '₹12,000', premium: '₹25,000' },
    features: [
      { name: 'Static Post Designs', basic: '8 Posts', standard: '15 Posts', premium: '30 Posts' },
      { name: 'Story Designs', basic: '4 Stories', standard: '10 Stories', premium: '20 Stories' },
      { name: 'Custom Templates', basic: true, standard: true, premium: true },
      { name: 'Content Strategy Support', basic: false, standard: true, premium: true },
      { name: 'Monthly Design Calendar', basic: false, standard: true, premium: true },
      { name: 'Priority Support', basic: false, standard: false, premium: true },
    ],
  },
  {
    id: 'video-editing',
    name: 'Video Editing',
    description:
      'Cinematic short films, motion animations, and ad creatives designed for peak retention.',
    iconName: 'Video',
    tierNames: {
      basic: 'Basic',
      standard: 'Standard',
      premium: 'PREMIUM ADS',
    },
    tierDescriptions: {
      basic: 'Essential tools designed to establish initial capability and structure.',
      standard: 'Fully featured setup delivering complete utility, design details, and workflow scaling tools.',
      premium: 'Maximized capability targets, continuous priority iterations, and elite enterprise support.',
    },
    tierTimelines: {
      basic: 'approx. 1-2 Weeks',
      standard: 'approx. 3-4 Weeks',
      premium: 'Continuous Sprint Delivery',
    },
    prices: { basic: 5000, standard: 15000, premium: 35000 },
    priceLabels: { basic: '₹5,000', standard: '₹15,000', premium: '₹35,000' },
    features: [
      { name: 'Short Form Videos', basic: '4 Videos', standard: '8 Videos', premium: '15 Videos' },
      { name: 'Motion Graphics', basic: 'Basic', standard: 'Advanced', premium: 'Premium' },
      { name: 'Transitions & Effects', basic: true, standard: true, premium: true },
      { name: 'Sound Design', basic: true, standard: true, premium: true },
      { name: 'Ad Creative Production', basic: false, standard: true, premium: true },
      { name: 'Multiple Revisions', basic: '1 Revision', standard: '3 Revisions', premium: 'Unlimited' },
    ],
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    description:
      'Complete cross-channel management, semantic keyword optimization, and metric campaigns.',
    iconName: 'Target',
    tierNames: {
      basic: 'Basic',
      standard: 'Standard',
      premium: 'Premium',
    },
    tierDescriptions: {
      basic: 'Essential tools designed to establish initial capability and structure.',
      standard: 'Fully featured setup delivering complete utility, design details, and workflow scaling tools.',
      premium: 'Maximized capability targets, continuous priority iterations, and elite enterprise support.',
    },
    tierTimelines: {
      basic: 'approx. 1-2 Weeks',
      standard: 'approx. 3-4 Weeks',
      premium: 'Continuous Sprint Delivery',
    },
    prices: { basic: 5000, standard: 12000, premium: 22000 },
    priceLabels: { basic: '₹5,000', standard: '₹12,000', premium: 'Custom' },
    features: [
      { name: 'Social Media Management', basic: true, standard: true, premium: true },
      { name: 'Content Planning', basic: true, standard: true, premium: true },
      { name: 'Monthly Reports', basic: true, standard: true, premium: true },
      { name: 'Ad Campaign Setup', basic: false, standard: true, premium: true },
      { name: 'SEO Optimization', basic: false, standard: true, premium: true },
      { name: 'Lead Generation Strategy', basic: false, standard: false, premium: true },
      { name: 'Performance Optimization', basic: false, standard: false, premium: true },
    ],
  },
  {
    id: 'uiux-design',
    name: 'UI/UX Design',
    description:
      'High-craft interactive screen layouts and functional digital design systems in Figma.',
    iconName: 'Layers',
    tierNames: {
      basic: 'Basic',
      standard: 'Standard',
      premium: 'Premium',
    },
    tierDescriptions: {
      basic: 'Essential tools designed to establish initial capability and structure.',
      standard: 'Fully featured setup delivering complete utility, design details, and workflow scaling tools.',
      premium: 'Maximized capability targets, continuous priority iterations, and elite enterprise support.',
    },
    tierTimelines: {
      basic: 'approx. 1-2 Weeks',
      standard: 'approx. 3-4 Weeks',
      premium: 'Continuous Sprint Delivery',
    },
    prices: { basic: 15000, standard: 35000, premium: 75000 },
    priceLabels: { basic: '₹15,000', standard: '₹35,000', premium: '₹75,000+' },
    features: [
      { name: 'Wireframes', basic: true, standard: true, premium: true },
      { name: 'UI Design', basic: '5 Screens', standard: '15 Screens', premium: 'Unlimited' },
      { name: 'Interactive Prototype', basic: false, standard: true, premium: true },
      { name: 'Design System', basic: false, standard: true, premium: true },
      { name: 'Developer Handoff', basic: false, standard: true, premium: true },
      { name: 'User Testing Support', basic: false, standard: false, premium: true },
    ],
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description:
      'Fast, responsive, full-stack website architectures built with production-ready code.',
    iconName: 'Laptop',
    tierNames: {
      basic: 'Basic',
      standard: 'Standard',
      premium: 'Premium',
    },
    tierDescriptions: {
      basic: 'Essential tools designed to establish initial capability and structure.',
      standard: 'Fully featured setup delivering complete utility, design details, and workflow scaling tools.',
      premium: 'Maximized capability targets, continuous priority iterations, and elite enterprise support.',
    },
    tierTimelines: {
      basic: 'approx. 1-2 Weeks',
      standard: 'approx. 3-4 Weeks',
      premium: 'Continuous Sprint Delivery',
    },
    prices: { basic: 25000, standard: 60000, premium: 120000 },
    priceLabels: { basic: '₹25,000', standard: '₹60,000', premium: '₹1,20,000+' },
    features: [
      { name: 'Responsive Website', basic: true, standard: true, premium: true },
      { name: 'Pages Included', basic: '5 Pages', standard: '10 Pages', premium: 'Unlimited' },
      { name: 'CMS Integration', basic: false, standard: true, premium: true },
      { name: 'Contact Forms', basic: true, standard: true, premium: true },
      { name: 'SEO Setup', basic: false, standard: true, premium: true },
      { name: 'E-Commerce Features', basic: false, standard: false, premium: true },
      { name: 'Custom Development', basic: false, standard: false, premium: true },
    ],
  },
  {
    id: 'motion-graphics',
    name: 'Motion Graphics',
    description:
      'Liquid animations, cinematic titles, and storyboards tailored for elite digital engagement.',
    iconName: 'Sparkles',
    tierNames: {
      basic: 'Basic',
      standard: 'Standard',
      premium: 'Premium',
    },
    tierDescriptions: {
      basic: 'Essential tools designed to establish initial capability and structure.',
      standard: 'Fully featured setup delivering complete utility, design details, and workflow scaling tools.',
      premium: 'Maximized capability targets, continuous priority iterations, and elite enterprise support.',
    },
    tierTimelines: {
      basic: 'approx. 1-2 Weeks',
      standard: 'approx. 3-4 Weeks',
      premium: 'Continuous Sprint Delivery',
    },
    prices: { basic: 12000, standard: 30000, premium: 75000 },
    priceLabels: { basic: '₹12,000', standard: '₹30,000', premium: '₹75,000+' },
    features: [
      { name: 'Animated Graphics', basic: true, standard: true, premium: true },
      { name: 'Explainer Videos', basic: false, standard: true, premium: true },
      { name: 'Custom Illustrations', basic: false, standard: true, premium: true },
      { name: '2D Animation', basic: 'Basic', standard: 'Advanced', premium: 'Premium' },
      { name: 'Storyboarding', basic: false, standard: true, premium: true },
      { name: 'Campaign Assets', basic: false, standard: false, premium: true },
    ],
  },
  {
    id: 'digital-growth',
    name: 'Digital Growth',
    description:
      'Aggressive marketing funnels, performance scaling strategy, and conversion growth audit.',
    iconName: 'TrendingUp',
    tierNames: {
      basic: 'Basic',
      standard: 'Standard',
      premium: 'Premium',
    },
    tierDescriptions: {
      basic: 'Essential tools designed to establish initial capability and structure.',
      standard: 'Fully featured setup delivering complete utility, design details, and workflow scaling tools.',
      premium: 'Maximized capability targets, continuous priority iterations, and elite enterprise support.',
    },
    tierTimelines: {
      basic: 'approx. 1-2 Weeks',
      standard: 'approx. 3-4 Weeks',
      premium: 'Continuous Sprint Delivery',
    },
    prices: { basic: 10000, standard: 25000, premium: 60000 },
    priceLabels: { basic: '₹10,000', standard: '₹25,000', premium: '₹60,000+' },
    features: [
      { name: 'Growth Audit', basic: true, standard: true, premium: true },
      { name: 'Competitor Analysis', basic: true, standard: true, premium: true },
      { name: 'SEO Strategy', basic: false, standard: true, premium: true },
      { name: 'Performance Marketing', basic: false, standard: true, premium: true },
      { name: 'Lead Funnel Setup', basic: false, standard: false, premium: true },
      { name: 'Conversion Optimization', basic: false, standard: false, premium: true },
      { name: 'Monthly Strategy Calls', basic: '1 Call', standard: '2 Calls', premium: '4 Calls' },
    ],
  },
  {
    id: 'business-support',
    name: 'Studio Support',
    description:
      'Outsource premium copywriting, custom presentation decks, print coordination, and content operations to elevate your creative output.',
    iconName: 'Briefcase',
    tierNames: {
      basic: 'Starter',
      standard: 'Growth',
      premium: 'Business Partner',
    },
    tierDescriptions: {
      basic: 'Ideal for startups, freelancers, and small businesses.',
      standard: 'Designed for growing businesses requiring regular operational support.',
      premium: 'Complete outsourced back-office solution for complete operations.',
    },
    tierTimelines: {
      basic: 'Monthly Service Block',
      standard: 'Monthly Service Block',
      premium: 'Monthly Service Block',
    },
    prices: { basic: 8000, standard: 18000, premium: 35000 },
    priceLabels: { basic: '₹8,000', standard: '₹18,000', premium: '₹35,000' },
    features: [
      { name: 'Copywriting & Editing', basic: '5 Pieces', standard: '12 Pieces', premium: 'Unlimited' },
      { name: 'Pitch & Presentation Decks', basic: '1 Deck', standard: '3 Decks', premium: 'Unlimited' },
      { name: 'Print Production Specs', basic: true, standard: true, premium: true },
      { name: 'Design Asset Optimization', basic: true, standard: true, premium: true },
      { name: 'Digital Asset Management', basic: true, standard: true, premium: true },
      { name: 'Media Resizing & Formats', basic: true, standard: true, premium: true },
      { name: 'Brand PR & Media Kits', basic: false, standard: true, premium: true },
      { name: 'Influencer Seeding Outlines', basic: false, standard: true, premium: true },
      { name: 'Campaign Launch Calendars', basic: false, standard: true, premium: true },
      { name: 'Product Release Checklists', basic: false, standard: true, premium: true },
      { name: 'Trademark Assets Prep', basic: false, standard: true, premium: true },
      { name: 'Licensing & Font Audits', basic: false, standard: false, premium: true },
      { name: 'Brand Partnership Templates', basic: false, standard: false, premium: true },
      { name: 'Dedicated Creative Ops Exec', basic: false, standard: false, premium: true },
      { name: 'Priority Sprint Delivery', basic: false, standard: false, premium: true },
    ],
  },
];

export const DEFAULT_BUSINESS_SUPPORT_CONFIG: CmsBusinessSupportConfig = {
  badge: '// YOUR TRUSTED PARTNER FOR BUSINESS OPERATIONS',
  headline: 'Focus on growing your business while we handle the day-to-day operations.',
  description:
    'At QBench, we help businesses streamline operations, improve productivity, and reduce administrative workload through professional business support services. From accounting and billing to customer support, data management, and reporting, our team acts as an extension of your business.',
  subnote:
    "Whether you're a startup, SME, agency, retailer, consultant, or growing enterprise, we provide reliable support that allows you to focus on growth while we handle the operational details.",
  starterName: 'Starter Package',
  starterSubtitle: 'Ideal for startups, freelancers, and small businesses.',
  starterPriceLabel: '₹4,999',
  starterInclusions: [
    'Data Entry Support',
    'Billing & Invoice Management',
    'Customer Inquiry Handling',
    'Basic Excel Reports',
    'Monthly MIS Report',
    'Email Support',
  ],
  growthName: 'Growth Package',
  growthSubtitle: 'Designed for growing businesses requiring regular operational support.',
  growthPriceLabel: '₹9,999',
  growthInclusions: [
    'Everything in Starter',
    'CRM Management',
    'Customer Follow-Ups',
    'Advanced Excel Dashboards',
    'Weekly Reports',
    'Itinerary Preparation',
    'Appointment Scheduling',
    'Business Reporting',
  ],
  partnerName: 'Business Partner',
  partnerSubtitle: 'Complete outsourced back-office solution for complete operations.',
  partnerPriceLabel: '₹19,999',
  partnerInclusions: [
    'Everything in Growth',
    'Accounts Management Support',
    'Payroll Assistance',
    'Bank Reconciliation Support',
    'GST Documentation Support',
    'Dedicated Support Executive',
    'Daily Reporting',
    'Priority Support',
  ],
  addons: [
    { name: 'Accounting & Tax Support', price: 'Starting from ₹500' },
    { name: 'GST Filing Assistance', price: 'Starting from ₹500' },
    { name: 'Payroll Processing', price: 'Starting from ₹1,500/month' },
    { name: 'Financial Dashboard Creation', price: 'Starting from ₹3,000' },
    { name: 'Loan Documentation Support', price: 'Starting from ₹2,500' },
    { name: 'Business Reports & MIS', price: 'Starting from ₹2,000' },
    { name: 'Custom Excel Automation', price: 'Starting from ₹3,500' },
    { name: 'Travel Itinerary Preparation', price: 'Starting from ₹1,000' },
  ],
};

export const DEFAULT_SERVICES_DATA: CmsServiceItem[] = [
  {
    id: 'branding',
    title: 'Branding & Identity',
    label: 'Branding & Identity',
    emoji: '🎨',
    iconName: 'Layers',
    desc: 'Logos, brand identity systems, visual guidelines, and brand assets that create a lasting impression.',
    startingPrice: '₹5,000',
    deliverables: [
      'Logo Design & Variations',
      'Color Palette & Typography',
      'Brand Style Guidelines',
      'Stationery & Social Brand Kit',
    ],
  },
  {
    id: 'social-media',
    title: 'Social Media Design',
    label: 'Social Media Design',
    emoji: '📱',
    iconName: 'MessageSquare',
    desc: 'Creative social media designs that strengthen your brand across every platform.',
    startingPrice: '₹5,000',
    deliverables: [
      'Custom Feed & Grid Posts',
      'Engaging Stories & Carousels',
      'Branded Social Templates',
      'Monthly Content Visuals',
    ],
  },
  {
    id: 'video-editing',
    title: 'Video Editing',
    label: 'Video Editing',
    emoji: '🎬',
    iconName: 'Video',
    desc: 'Professional editing for promotional videos, product showcases, reels, and brand stories.',
    startingPrice: '₹5,000',
    deliverables: [
      'Reels & Short-Form Cuts',
      'Promotional & Product Videos',
      'Color Grading & Sound Design',
      'High-Retention Ad Creatives',
    ],
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing',
    label: 'Digital Marketing',
    emoji: '📈',
    iconName: 'Target',
    desc: 'Creative campaigns and digital solutions that help brands build a stronger online presence.',
    startingPrice: '₹5,000',
    deliverables: [
      'Social Media Management',
      'Performance Ad Campaigns',
      'Search & Content Optimization',
      'Monthly Analytics Reports',
    ],
  },
  {
    id: 'uiux',
    title: 'UI/UX Design',
    label: 'UI/UX Design',
    emoji: '🖥️',
    iconName: 'Layers',
    desc: 'User-centered interfaces designed for intuitive, engaging, and seamless digital experiences.',
    startingPrice: '₹15,000',
    deliverables: [
      'User Flows & Wireframing',
      'High-Fidelity Figma Interfaces',
      'Interactive Prototypes',
      'Scalable Design Systems',
    ],
  },
  {
    id: 'webdev',
    title: 'Website Development',
    label: 'Website Development',
    emoji: '🌐',
    iconName: 'Code',
    desc: 'Modern, responsive websites designed for performance, usability, and great user experiences.',
    startingPrice: '₹25,000',
    deliverables: [
      'Responsive Web Architecture',
      'CMS & Dynamic Portfolio Setup',
      'Technical SEO & Speed Optimization',
      'Lead Capture & CRM Integration',
    ],
  },
  {
    id: 'motion',
    title: 'Motion Graphics',
    label: 'Motion Graphics',
    emoji: '✨',
    iconName: 'Sparkles',
    desc: 'Eye-catching animations and motion visuals that bring ideas to life.',
    startingPrice: '₹12,000',
    deliverables: [
      '2D & 3D Brand Animations',
      'Logo Reveals & Title Sequences',
      'Explainer & Product Motion',
      'Storyboarding & Visual Direction',
    ],
  },
  {
    id: 'growth',
    title: 'Creative Strategy',
    label: 'Creative Strategy',
    emoji: '🚀',
    iconName: 'TrendingUp',
    desc: 'Creative direction and digital solutions that help brands communicate with clarity and confidence.',
    startingPrice: '₹10,000',
    deliverables: [
      'Brand Positioning & Audit',
      'Competitor & Market Analysis',
      'Conversion Funnel Architecture',
      'Quarterly Growth Roadmaps',
    ],
  },
  {
    id: 'business-support',
    title: 'Creative Support',
    label: 'Creative Support',
    emoji: '💼',
    iconName: 'Briefcase',
    desc: 'Ongoing design support for presentations, marketing materials, print media, and creative content.',
    startingPrice: '₹4,999/mo',
    deliverables: [
      'Pitch Decks & Presentations',
      'Print & Packaging Collateral',
      'Back-Office & MIS Reporting',
      'Dedicated Creative Operations',
    ],
  },
];

export const DEFAULT_WEBSITE_CONTENT: CmsWebsiteContent = {
  heroBadge: 'WE DESIGN BRANDS THAT PEOPLE REMEMBER',
  heroTitleLine1: 'We Design Brands',
  heroTitleHighlight: 'People Remember',
  heroDescription:
    'QBench is a creative agency specializing in branding, web design, social media, video production, and digital marketing. We create thoughtful visual experiences that help businesses grow and stand out.',
  heroPrimaryCta: 'Start a Project',
  heroSecondaryCta: 'View Portfolio',
  heroTrustNote: 'Building creative solutions with passion, precision, and purpose.',
  homeWhyChoose: [
    {
      title: 'Strategic Thinking',
      desc: 'We focus on business outcomes, not just design.',
    },
    {
      title: 'End-to-End Solutions',
      desc: "From branding to business support, we've got you covered.",
    },
    {
      title: 'Growth Focused',
      desc: 'Everything we do is built around visibility, leads and growth.',
    },
    {
      title: 'Scalable Partnership',
      desc: 'Solutions that grow with your business.',
    },
  ],
  homeProcessSteps: [
    {
      num: '01',
      title: 'Discover',
      desc: 'We learn about your goals, audience, and vision.',
    },
    {
      num: '02',
      title: 'Create',
      desc: 'We design and iterate until it is perfect.',
    },
    {
      num: '03',
      title: 'Deliver',
      desc: 'We hand over the final files and assets.',
    },
    {
      num: '04',
      title: 'Support',
      desc: 'We help you launch and grow your brand.',
    },
  ],
  servicesHeroBadge: 'Our Services',
  servicesHeroTitleLine1: 'Creative Solutions That Build',
  servicesHeroTitleLine2: 'Brands, Generate Leads',
  servicesHeroTitleHighlight: '& Drive Growth.',
  servicesHeroDescription:
    'We deliver end-to-end creative, branding, web, and digital marketing solutions that help businesses stand out, connect with the right audience, and achieve measurable growth. From strategy to execution, every solution is designed to elevate your brand and drive lasting results.',
  servicesWhyChoose: [
    {
      title: 'Built to Scale',
      desc: 'Future-ready digital solutions that grow alongside your business.',
    },
    {
      title: 'User-Centered by Design',
      desc: 'Intuitive experiences that increase engagement and improve conversions.',
    },
    {
      title: 'Performance-Driven',
      desc: 'Fast, secure, and optimized platforms designed to generate leads and support long-term growth.',
    },
  ],
  packagesBadge: 'PORTFOLIO COLLECTION & PACKAGES',
  packagesTitleLine1: 'Design with Purpose.',
  packagesTitleHighlight: 'Built with Precision.',
  packagesDescription:
    'Explore transparent service packages, deliverables matrices, and our interactive budget calculator across branding, web design, motion graphics, social media, and business operations.',
  processBadge: 'OUR TIMELINE',
  processTitlePrefix: 'The',
  processTitleHighlight: 'Precision Path',
  processDescription:
    'A mathematical approach to digital artistry. We navigate through ambiguity with a structured 5-step framework designed to deliver elite creative solutions.',
  processSteps: PROCESS_STEPS,
  processMetrics: [
    {
      value: '99.8%',
      label: 'Uptime Reliability',
      description:
        'Hardened nodes hosted across redundant edge proxies with automated rollback systems.',
    },
    {
      value: '0.02s',
      label: 'Interactive Latency',
      description:
        'Vercel Edge-powered dynamic rendering keeping core response cycles optimized globally.',
    },
    {
      value: '12+',
      label: 'Creative Awards',
      description:
        'Recognized globally for blending high-tech architecture with clean layout patterns.',
    },
  ],
  teamMembers: TEAM_MEMBERS,
  studioLocations: STUDIO_LOCATIONS,
};

const STORAGE_KEYS = {
  packages: 'qbench_cms_packages_data',
  businessSupport: 'qbench_cms_business_support_config',
  services: 'qbench_cms_services_data',
  websiteContent: 'qbench_cms_website_content',
};

const DB_KEYS = {
  packages: 'cms_packages_data',
  businessSupport: 'cms_business_support_config',
  services: 'cms_services_data',
  websiteContent: 'cms_website_content',
};

function readLocalCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocalCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

async function upsertSiteSettingKey(settingKey: string, valueObj: unknown): Promise<void> {
  await ensureSupabaseConfig();
  const serialized = JSON.stringify(valueObj);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('site_settings')
    .select('id')
    .eq('setting_key', settingKey)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from('site_settings')
      .update({ setting_value: serialized, updated_at: now })
      .eq('id', existing.id);

    if (error) {
      const retry = await supabase
        .from('site_settings')
        .update({ setting_value: serialized })
        .eq('id', existing.id);
      if (retry.error) {
        throw new Error(retry.error.message);
      }
    }
  } else {
    const { error } = await supabase
      .from('site_settings')
      .insert([{ setting_key: settingKey, setting_value: serialized }]);
    if (error) {
      throw new Error(error.message);
    }
  }
}

export function getCachedPackagesData(): {
  packages: CmsPackageCategory[];
  businessSupport: CmsBusinessSupportConfig;
} {
  return {
    packages: readLocalCache<CmsPackageCategory[]>(
      STORAGE_KEYS.packages,
      DEFAULT_PACKAGES_DATA
    ),
    businessSupport: readLocalCache<CmsBusinessSupportConfig>(
      STORAGE_KEYS.businessSupport,
      DEFAULT_BUSINESS_SUPPORT_CONFIG
    ),
  };
}

export function getCachedServicesData(): CmsServiceItem[] {
  return readLocalCache<CmsServiceItem[]>(
    STORAGE_KEYS.services,
    DEFAULT_SERVICES_DATA
  );
}

export function getCachedWebsiteContent(): CmsWebsiteContent {
  const cached = readLocalCache<Partial<CmsWebsiteContent>>(
    STORAGE_KEYS.websiteContent,
    {}
  );
  return {
    ...DEFAULT_WEBSITE_CONTENT,
    ...cached,
  };
}

export async function fetchAllCmsSiteContent(): Promise<{
  packages: CmsPackageCategory[];
  businessSupport: CmsBusinessSupportConfig;
  services: CmsServiceItem[];
  websiteContent: CmsWebsiteContent;
}> {
  await ensureSupabaseConfig();

  let packages = getCachedPackagesData().packages;
  let businessSupport = getCachedPackagesData().businessSupport;
  let services = getCachedServicesData();
  let websiteContent = getCachedWebsiteContent();

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        DB_KEYS.packages,
        DB_KEYS.businessSupport,
        DB_KEYS.services,
        DB_KEYS.websiteContent,
      ]);

    if (!error && data) {
      for (const row of data as Array<{
        setting_key?: string;
        setting_value?: string | null;
      }>) {
        if (!row.setting_key || !row.setting_value) continue;
        try {
          const parsed = JSON.parse(row.setting_value);
          if (row.setting_key === DB_KEYS.packages && Array.isArray(parsed) && parsed.length > 0) {
            packages = parsed;
            writeLocalCache(STORAGE_KEYS.packages, packages);
          } else if (row.setting_key === DB_KEYS.businessSupport && parsed && typeof parsed === 'object') {
            businessSupport = { ...DEFAULT_BUSINESS_SUPPORT_CONFIG, ...parsed };
            writeLocalCache(STORAGE_KEYS.businessSupport, businessSupport);
          } else if (row.setting_key === DB_KEYS.services && Array.isArray(parsed) && parsed.length > 0) {
            services = parsed;
            writeLocalCache(STORAGE_KEYS.services, services);
          } else if (row.setting_key === DB_KEYS.websiteContent && parsed && typeof parsed === 'object') {
            websiteContent = { ...DEFAULT_WEBSITE_CONTENT, ...parsed };
            writeLocalCache(STORAGE_KEYS.websiteContent, websiteContent);
          }
        } catch {
          // Ignore malformed JSON row
        }
      }
    }
  } catch {
    // Use local cache / defaults if offline
  }

  return { packages, businessSupport, services, websiteContent };
}

export async function saveCmsPackagesData(
  packages: CmsPackageCategory[],
  businessSupport?: CmsBusinessSupportConfig
): Promise<void> {
  writeLocalCache(STORAGE_KEYS.packages, packages);
  await upsertSiteSettingKey(DB_KEYS.packages, packages);

  if (businessSupport) {
    writeLocalCache(STORAGE_KEYS.businessSupport, businessSupport);
    await upsertSiteSettingKey(DB_KEYS.businessSupport, businessSupport);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}

export async function saveCmsServicesData(
  services: CmsServiceItem[]
): Promise<void> {
  writeLocalCache(STORAGE_KEYS.services, services);
  await upsertSiteSettingKey(DB_KEYS.services, services);
  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}

export async function saveCmsWebsiteContent(
  content: CmsWebsiteContent
): Promise<void> {
  writeLocalCache(STORAGE_KEYS.websiteContent, content);
  await upsertSiteSettingKey(DB_KEYS.websiteContent, content);
  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}
