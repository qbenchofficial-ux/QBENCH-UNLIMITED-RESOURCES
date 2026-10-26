export interface ZohoCatalogItem {
  itemId: string;
  name: string;
  description: string;
  deliverables?: string[];
  rate: number;
  rateFormatted: string;
  unit: 'Package' | 'Project' | 'Each';
  productType: 'service' | 'goods';
  itemType: string;
  category: 'package' | 'video' | 'design';
  categoryLabel: string;
  badge?: string;
  popular?: boolean;
}

export const ZOHO_CONFIG = {
  orgId: '60072580070',
  orgName: 'QBENCH',
  portalUrl: 'https://books.zoho.in/app/60072580070',
  variantsUrl: 'https://books.zoho.in/app/60072580070#/inventory/product/variantslist?filter_by=Status.All&per_page=25&sort_column=name&sort_order=A',
  itemsListUrl: 'https://books.zoho.in/app/60072580070#/inventory/items',
  getItemUrl: (itemId: string) => `https://books.zoho.in/app/60072580070#/inventory/items/${itemId}`,
  exportFileName: 'Item_665fb8db.csv',
  currency: 'INR',
  currencySymbol: '₹',
};

export const ZOHO_CATALOG_ITEMS: ZohoCatalogItem[] = [
  // Packages
  {
    itemId: '3835950000000037292',
    name: 'Award Night Package',
    description: 'Comprehensive media and visual graphics production package tailored for grand award ceremonies, stage LED backdrops, and live event presentations.',
    deliverables: [
      'Award Screen Designs',
      'Winner Animation',
      'Lucky Draw Video',
      'LED Screen Motion Graphics',
      'Stage Visual Package',
      'Event Presentation Videos'
    ],
    rate: 40000,
    rateFormatted: '₹40,000',
    unit: 'Package',
    productType: 'service',
    itemType: 'Sales',
    category: 'package',
    categoryLabel: 'Event & Award Package',
    badge: 'Flagship Event Suite',
    popular: true
  },
  {
    itemId: '3835950000000037308',
    name: 'Premium Branding Package',
    description: 'End-to-end brand identity architecture featuring logo craft, comprehensive brand book, promotional identity video, and cohesive digital social media kit.',
    deliverables: [
      'Logo Design',
      'Brand Identity Guidelines',
      'Promo Video',
      'Social Media Kit'
    ],
    rate: 35000,
    rateFormatted: '₹35,000',
    unit: 'Package',
    productType: 'service',
    itemType: 'Sales',
    category: 'package',
    categoryLabel: 'Brand Identity Package',
    badge: 'Most Popular',
    popular: true
  },
  {
    itemId: '3835950000000037300',
    name: 'Event Media Package',
    description: 'High-impact multimedia production package for conferences, launch events, expos, and festivals.',
    deliverables: [
      'Cinematic Highlights',
      'Promotional Reels',
      'Event Posters & Teasers',
      'Event Montage'
    ],
    rate: 25000,
    rateFormatted: '₹25,000',
    unit: 'Package',
    productType: 'service',
    itemType: 'Sales',
    category: 'package',
    categoryLabel: 'Event Media Package',
    popular: false
  },
  {
    itemId: '3835950000000037284',
    name: 'Jewellery Promotion Campaign',
    description: 'Luxury marketing and visual campaign designed specifically for fine jewellery houses and high-end luxury retailers.',
    deliverables: [
      'Luxury Jewellery Creative Direction',
      'Macro Product Motion Graphics',
      'Social Showcase Reels & Stills',
      'Campaign Retargeting Assets'
    ],
    rate: 18000,
    rateFormatted: '₹18,000',
    unit: 'Package',
    productType: 'service',
    itemType: 'Sales',
    category: 'package',
    categoryLabel: 'Luxury Retail Campaign',
    badge: 'Specialized Niche',
    popular: false
  },
  {
    itemId: '3835950000000037227',
    name: 'Social Media Campaign Package',
    description: 'Strategic monthly campaign bundle including bespoke social creatives, reels, story sequences, and brand assets.',
    deliverables: [
      'Custom Social Creatives',
      'High-Retention Reels',
      'Story Sets & Engagement Cards',
      'Campaign Management Assets'
    ],
    rate: 10000,
    rateFormatted: '₹10,000',
    unit: 'Package',
    productType: 'service',
    itemType: 'Sales',
    category: 'package',
    categoryLabel: 'Social Media Bundle',
    badge: 'Best Value',
    popular: true
  },

  // Video & Motion Services
  {
    itemId: '3835950000000037194',
    name: 'Cinematic Event Highlights',
    description: 'Premium cinematic event coverage and highlight editing service with dynamic color grading, pacing, and sound mastering.',
    deliverables: ['Full HD / 4K Edit', 'Cinematic Color Grade', 'Licensed Music Sync', 'Dynamic Transitions'],
    rate: 10000,
    rateFormatted: '₹10,000',
    unit: 'Project',
    productType: 'service',
    itemType: 'Sales',
    category: 'video',
    categoryLabel: 'Video Production',
    popular: true
  },
  {
    itemId: '3835950000000037202',
    name: 'Highlight Reel',
    description: 'Short-form cinematic reel crafted specifically for Instagram, LinkedIn, and YouTube Shorts promotions.',
    deliverables: ['9:16 Vertical Cut', 'Hook-Optimized Editing', 'Animated Subtitles', 'Sound Design'],
    rate: 5000,
    rateFormatted: '₹5,000',
    unit: 'Project',
    productType: 'service',
    itemType: 'Sales',
    category: 'video',
    categoryLabel: 'Short-Form Reel',
    popular: true
  },
  {
    itemId: '3835950000000037178',
    name: 'Montage Video',
    description: 'Cinematic montage video with rhythmic transitions, multi-clip narrative pacing, and music sync.',
    deliverables: ['Rhythmic Cut', 'Audio-reactive Timing', 'Pacing Architecture', 'Final High-Res Master'],
    rate: 3000,
    rateFormatted: '₹3,000',
    unit: 'Project',
    productType: 'service',
    itemType: 'Sales',
    category: 'video',
    categoryLabel: 'Video Montage',
    popular: false
  },
  {
    itemId: '3835950000000037186',
    name: 'Animation Video',
    description: 'Creative 2D/3D motion graphics and animation production service for explainer videos and visual storytelling.',
    deliverables: ['Custom Vector Animation', 'Kinetic Typography', 'Sound FX Layering', 'Rendered MP4 Deliverables'],
    rate: 3000,
    rateFormatted: '₹3,000',
    unit: 'Project',
    productType: 'service',
    itemType: 'Sales',
    category: 'video',
    categoryLabel: 'Motion Graphics',
    popular: false
  },
  {
    itemId: '3835950000000037218',
    name: 'Award Presentation Video',
    description: 'Professional award ceremony presentation video editing, category reveal stings, and nominee showcases.',
    deliverables: ['Nominee Stingers', 'Winner Reveal Sequence', 'Broadcast Safe Lower-Thirds', 'Synchronized Fanfare'],
    rate: 3000,
    rateFormatted: '₹3,000',
    unit: 'Project',
    productType: 'service',
    itemType: 'Sales',
    category: 'video',
    categoryLabel: 'Ceremony Video',
    popular: false
  },
  {
    itemId: '3835950000000037210',
    name: 'Promotional Reel Production',
    description: 'Short-form cinematic promotional reel for events, corporate launches, and high-velocity social media campaigns.',
    deliverables: ['Social Reel Format', 'Dynamic Typography', 'Fast Turnaround', 'Platform Optimized'],
    rate: 2000,
    rateFormatted: '₹2,000',
    unit: 'Project',
    productType: 'service',
    itemType: 'Sales',
    category: 'video',
    categoryLabel: 'Promo Reel',
    popular: false
  },
  {
    itemId: '3835950000000037268',
    name: 'Lucky Draw Animation',
    description: 'Animated lucky draw visual video and randomized counter sequence for stage presentations and live event draws.',
    deliverables: ['Stage Display Animation', 'Suspense Audio FX', 'Winner Display Graphic', 'Operator Ready Video'],
    rate: 2000,
    rateFormatted: '₹2,000',
    unit: 'Project',
    productType: 'service',
    itemType: 'Sales',
    category: 'video',
    categoryLabel: 'Stage Interactive Video',
    popular: false
  },
  {
    itemId: '3835950000000037316',
    name: '30-Second Award Reel Production',
    description: 'Fast-paced, high-energy 30-second award highlight reel tailored for rapid post-event social distribution.',
    deliverables: ['30s Condensed Highlight', 'Music Sync', 'Vertical & Horizontal Formats'],
    rate: 1200,
    rateFormatted: '₹1,200',
    unit: 'Project',
    productType: 'goods',
    itemType: 'Sales',
    category: 'video',
    categoryLabel: 'Quick Reel',
    popular: false
  },
  {
    itemId: '3835950000000037324',
    name: 'Lucky Drow Video',
    description: 'Standard lucky draw reveal video animation sequence for community events and stage programs.',
    deliverables: ['Random Draw Graphic', 'Reveal Sequence', 'Stage Resolution Master'],
    rate: 800,
    rateFormatted: '₹800',
    unit: 'Project',
    productType: 'goods',
    itemType: 'Sales',
    category: 'video',
    categoryLabel: 'Draw Graphic',
    popular: false
  },

  // Design, Branding & Stage Visuals
  {
    itemId: '3835950000000037276',
    name: 'Logo Design',
    description: 'Professional custom logo design with premium branding style, vector source assets, and usage guidelines.',
    deliverables: ['3 Concept Directions', 'Vector AI, SVG, PNG', 'Monochrome & Color Variants', 'Commercial License'],
    rate: 5000,
    rateFormatted: '₹5,000',
    unit: 'Each',
    productType: 'service',
    itemType: 'Sales',
    category: 'design',
    categoryLabel: 'Branding & Identity',
    badge: 'Core Identity',
    popular: true
  },
  {
    itemId: '3835950000000037260',
    name: 'Award Screen Design',
    description: 'Premium LED award screen visual design calibrated for stage backdrops, multi-screen LED walls, and auditoriums.',
    deliverables: ['Stage LED Wall Resolution', 'High Contrast Stage Palette', 'Nominee & Category Templates', 'Zero-Lag Formats'],
    rate: 2000,
    rateFormatted: '₹2,000',
    unit: 'Each',
    productType: 'service',
    itemType: 'Sales',
    category: 'design',
    categoryLabel: 'Stage LED Visuals',
    popular: false
  },
  {
    itemId: '3835950000000037236',
    name: 'Digital Poster Design',
    description: 'Creative digital poster design for digital promotions, billboards, and campaign announcements.',
    deliverables: ['Print & Web Resolution', 'Modern Editorial Typography', 'Source Design Assets'],
    rate: 500,
    rateFormatted: '₹500',
    unit: 'Each',
    productType: 'service',
    itemType: 'Sales',
    category: 'design',
    categoryLabel: 'Poster Design',
    popular: false
  },
  {
    itemId: '3835950000000037244',
    name: 'Social Media Poster',
    description: 'Modern social media creative poster design optimized for feed engagement, stories, and carousel covers.',
    deliverables: ['Square & Story Formats', 'High Engagement Layout', 'Export Ready PNG/JPG'],
    rate: 500,
    rateFormatted: '₹500',
    unit: 'Each',
    productType: 'service',
    itemType: 'Sales',
    category: 'design',
    categoryLabel: 'Social Media Creative',
    popular: false
  },
  {
    itemId: '3835950000000037252',
    name: 'Award Screen Images',
    description: 'High-resolution backdrop images and static visual assets formatted for stage screens and venue monitors.',
    deliverables: ['16:9 & Ultra-wide Backdrops', 'High DPI Output', 'Color Corrected for Stage Lights'],
    rate: 500,
    rateFormatted: '₹500',
    unit: 'Each',
    productType: 'service',
    itemType: 'Sales',
    category: 'design',
    categoryLabel: 'Stage Backdrop Asset',
    popular: false
  },
  {
    itemId: '3835950000000046138',
    name: 'AWARD SCREEN DESIGN',
    description: 'Essential LED award screen graphic design template for events on streamlined timelines.',
    deliverables: ['Standard LED Resolution Template', 'Quick Turnaround', 'Stage Ready JPG/PNG'],
    rate: 250,
    rateFormatted: '₹250',
    unit: 'Each',
    productType: 'goods',
    itemType: 'Sales',
    category: 'design',
    categoryLabel: 'Standard Screen Asset',
    popular: false
  }
];

export const ZOHO_PACKAGES = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'package');
export const ZOHO_VIDEO_SERVICES = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'video');
export const ZOHO_DESIGN_SERVICES = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'design');

export function getZohoItemById(itemId: string): ZohoCatalogItem | undefined {
  return ZOHO_CATALOG_ITEMS.find((item) => item.itemId === itemId);
}

export function formatINR(val: number): string {
  return '₹' + val.toLocaleString('en-IN');
}
