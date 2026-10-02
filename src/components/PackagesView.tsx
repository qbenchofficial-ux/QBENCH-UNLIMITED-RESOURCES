import { useState, useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { 
  Compass, 
  Share2, 
  Video, 
  Target, 
  Layers, 
  Laptop, 
  Sparkles, 
  TrendingUp, 
  Check, 
  ChevronRight, 
  Calculator, 
  Clock, 
  Copy, 
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Award,
  Users,
  Timer,
  DollarSign,
  Grid,
  Sliders,
  X,
  Briefcase,
  MessageSquare
} from 'lucide-react';

interface FeatureRow {
  name: string;
  basic: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

interface ServiceData {
  id: string;
  name: string;
  description: string;
  iconName: string;
  prices: {
    basic: number;
    standard: number;
    premium: number | string; // numerical value for sum calculation (or handle Custom)
  };
  priceLabels: {
    basic: string;
    standard: string;
    premium: string;
  };
  features: FeatureRow[];
}

const SERVICES_DATA: ServiceData[] = [
  {
    id: 'branding',
    name: 'Branding',
    description: 'Explore logo designs, brand identities, visual systems, and creative concepts crafted to build memorable and impactful brands.',
    iconName: 'Compass',
    prices: { basic: 5000, standard: 12000, premium: 25000 },
    priceLabels: { basic: '₹5,000', standard: '₹12,000', premium: '₹25,000' },
    features: [
      { name: 'Logo Design', basic: true, standard: true, premium: true },
      { name: 'Brand Color Palette', basic: true, standard: true, premium: true },
      { name: 'Typography Guidelines', basic: true, standard: true, premium: true },
      { name: 'Brand Style Guide', basic: false, standard: true, premium: true },
      { name: 'Business Card Design', basic: true, standard: true, premium: true },
      { name: 'Social Media Brand Kit', basic: false, standard: true, premium: true },
      { name: 'Complete Brand Identity System', basic: false, standard: false, premium: true }
    ]
  },
  {
    id: 'social-media',
    name: 'Social Media Design',
    description: 'Capture instant digital attention and build consistent brand aesthetic across all social grids.',
    iconName: 'Share2',
    prices: { basic: 5000, standard: 12000, premium: 25000 },
    priceLabels: { basic: '₹5,000', standard: '₹12,000', premium: '₹25,000' },
    features: [
      { name: 'Static Post Designs', basic: '8 Posts', standard: '15 Posts', premium: '30 Posts' },
      { name: 'Story Designs', basic: '4 Stories', standard: '10 Stories', premium: '20 Stories' },
      { name: 'Custom Templates', basic: true, standard: true, premium: true },
      { name: 'Content Strategy Support', basic: false, standard: true, premium: true },
      { name: 'Monthly Design Calendar', basic: false, standard: true, premium: true },
      { name: 'Priority Support', basic: false, standard: false, premium: true }
    ]
  },
  {
    id: 'video-editing',
    name: 'Video Editing',
    description: 'Cinematic short films, motion animations, and ad creatives designed for peak retention.',
    iconName: 'Video',
    prices: { basic: 5000, standard: 15000, premium: 35000 },
    priceLabels: { basic: '₹5,000', standard: '₹15,000', premium: '₹35,000' },
    features: [
      { name: 'Short Form Videos', basic: '4 Videos', standard: '8 Videos', premium: '15 Videos' },
      { name: 'Motion Graphics', basic: 'Basic', standard: 'Advanced', premium: 'Premium' },
      { name: 'Transitions & Effects', basic: true, standard: true, premium: true },
      { name: 'Sound Design', basic: true, standard: true, premium: true },
      { name: 'Ad Creative Production', basic: false, standard: true, premium: true },
      { name: 'Multiple Revisions', basic: '1 Revision', standard: '3 Revisions', premium: 'Unlimited' }
    ]
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    description: 'Complete cross-channel management, semantic keyword optimization, and metric campaigns.',
    iconName: 'Target',
    prices: { basic: 5000, standard: 12000, premium: 22000 }, // treat custom as ₹22K in base calculator
    priceLabels: { basic: '₹5,000', standard: '₹12,000', premium: 'Custom' },
    features: [
      { name: 'Social Media Management', basic: true, standard: true, premium: true },
      { name: 'Content Planning', basic: true, standard: true, premium: true },
      { name: 'Monthly Reports', basic: true, standard: true, premium: true },
      { name: 'Ad Campaign Setup', basic: false, standard: true, premium: true },
      { name: 'SEO Optimization', basic: false, standard: true, premium: true },
      { name: 'Lead Generation Strategy', basic: false, standard: false, premium: true },
      { name: 'Performance Optimization', basic: false, standard: false, premium: true }
    ]
  },
  {
    id: 'uiux-design',
    name: 'UI/UX Design',
    description: 'High-craft interactive screen layouts and functional digital design systems in Figma.',
    iconName: 'Layers',
    prices: { basic: 15000, standard: 35000, premium: 75000 },
    priceLabels: { basic: '₹15,000', standard: '₹35,000', premium: '₹75,000+' },
    features: [
      { name: 'Wireframes', basic: true, standard: true, premium: true },
      { name: 'UI Design', basic: '5 Screens', standard: '15 Screens', premium: 'Unlimited' },
      { name: 'Interactive Prototype', basic: false, standard: true, premium: true },
      { name: 'Design System', basic: false, standard: true, premium: true },
      { name: 'Developer Handoff', basic: false, standard: true, premium: true },
      { name: 'User Testing Support', basic: false, standard: false, premium: true }
    ]
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Fast, responsive, full-stack website architectures built with production-ready code.',
    iconName: 'Laptop',
    prices: { basic: 25000, standard: 60000, premium: 120000 },
    priceLabels: { basic: '₹25,000', standard: '₹60,000', premium: '₹1,20,000+' },
    features: [
      { name: 'Responsive Website', basic: true, standard: true, premium: true },
      { name: 'Pages Included', basic: '5 Pages', standard: '10 Pages', premium: 'Unlimited' },
      { name: 'CMS Integration', basic: false, standard: true, premium: true },
      { name: 'Contact Forms', basic: true, standard: true, premium: true },
      { name: 'SEO Setup', basic: false, standard: true, premium: true },
      { name: 'E-Commerce Features', basic: false, standard: false, premium: true },
      { name: 'Custom Development', basic: false, standard: false, premium: true }
    ]
  },
  {
    id: 'motion-graphics',
    name: 'Motion Graphics',
    description: 'Liquid animations, cinematic titles, and storyboards tailored for elite digital engagement.',
    iconName: 'Sparkles',
    prices: { basic: 12000, standard: 30000, premium: 75000 },
    priceLabels: { basic: '₹12,000', standard: '₹30,000', premium: '₹75,000+' },
    features: [
      { name: 'Animated Graphics', basic: true, standard: true, premium: true },
      { name: 'Explainer Videos', basic: false, standard: true, premium: true },
      { name: 'Custom Illustrations', basic: false, standard: true, premium: true },
      { name: '2D Animation', basic: 'Basic', standard: 'Advanced', premium: 'Premium' },
      { name: 'Storyboarding', basic: false, standard: true, premium: true },
      { name: 'Campaign Assets', basic: false, standard: false, premium: true }
    ]
  },
  {
    id: 'digital-growth',
    name: 'Digital Growth',
    description: 'Aggressive marketing funnels, performance scaling strategy, and conversion growth audit.',
    iconName: 'TrendingUp',
    prices: { basic: 10000, standard: 25000, premium: 60000 },
    priceLabels: { basic: '₹10,000', standard: '₹25,000', premium: '₹60,000+' },
    features: [
      { name: 'Growth Audit', basic: true, standard: true, premium: true },
      { name: 'Competitor Analysis', basic: true, standard: true, premium: true },
      { name: 'SEO Strategy', basic: false, standard: true, premium: true },
      { name: 'Performance Marketing', basic: false, standard: true, premium: true },
      { name: 'Lead Funnel Setup', basic: false, standard: false, premium: true },
      { name: 'Conversion Optimization', basic: false, standard: false, premium: true },
      { name: 'Monthly Strategy Calls', basic: '1 Call', standard: '2 Calls', premium: '4 Calls' }
    ]
  },
  {
    id: 'business-support',
    name: 'Studio Support',
    description: 'Outsource premium copywriting, custom presentation decks, print coordination, and content operations to elevate your creative output.',
    iconName: 'Briefcase',
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
      { name: 'Priority Sprint Delivery', basic: false, standard: false, premium: true }
    ]
  }
];

interface PackagesViewProps {
  onNavigate: (section: 'home' | 'about' | 'services' | 'portfolio' | 'process' | 'contact' | 'packages') => void;
}

export default function PackagesView({ onNavigate }: PackagesViewProps) {
  const { packages: cmsPackages, businessSupport: cmsBs, websiteContent } = useProjects('public');
  const activePackagesList = cmsPackages && cmsPackages.length > 0 ? cmsPackages : SERVICES_DATA;

  // active service shown in pricing sheets
  const [selectedServiceId, setSelectedServiceId] = useState<string>('branding');
  const [showMatrix, setShowMatrix] = useState<boolean>(false);

  // blueprint calculator state
  const [calcTiers, setCalcTiers] = useState<Record<string, 'none' | 'basic' | 'standard' | 'premium'>>({
    branding: 'none',
    'social-media': 'none',
    'video-editing': 'none',
    'digital-marketing': 'none',
    'uiux-design': 'none',
    'web-development': 'none',
    'motion-graphics': 'none',
    'digital-growth': 'none',
    'business-support': 'none',
  });

  useEffect(() => {
    setCalcTiers((prev) => {
      const next = { ...prev };
      activePackagesList.forEach((pkg) => {
        if (!(pkg.id in next)) {
          next[pkg.id] = 'none';
        }
      });
      return next;
    });
  }, [activePackagesList]);

  const [masterTier, setMasterTier] = useState<'basic' | 'standard' | 'premium'>('standard');

  const [calcSpeed, setCalcSpeed] = useState<'standard' | 'fast' | 'extended'>('standard');
  const [prioritySupport, setPrioritySupport] = useState<boolean>(false);
  const [copiedEstimate, setCopiedEstimate] = useState<boolean>(false);

  const activeService = activePackagesList.find(s => s.id === selectedServiceId) || activePackagesList[0];

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass': return <Compass className="h-4 w-4" />;
      case 'Share2': return <Share2 className="h-4 w-4" />;
      case 'Video': return <Video className="h-4 w-4" />;
      case 'Target': return <Target className="h-4 w-4" />;
      case 'Layers': return <Layers className="h-4 w-4" />;
      case 'Laptop': return <Laptop className="h-4 w-4" />;
      case 'Sparkles': return <Sparkles className="h-4 w-4" />;
      case 'TrendingUp': return <TrendingUp className="h-4 w-4" />;
      case 'Briefcase': return <Briefcase className="h-4 w-4" />;
      default: return <Compass className="h-4 w-4" />;
    }
  };

  // calculate sum
  const getCalculateDetails = () => {
    let basePrice = 0;
    const selectedModules: string[] = [];

    activePackagesList.forEach(service => {
      const tier = calcTiers[service.id];
      if (tier && tier !== 'none') {
        const p = Number(service.prices[tier]) || 0;
        basePrice += p;
        selectedModules.push(`${service.name} (${tier.toUpperCase()})`);
      }
    });

    // Speed modifiers
    let multiplier = 1.0;
    let durationText = '4-6 Weeks';
    if (calcSpeed === 'fast') {
      multiplier = 1.35;
      durationText = '2-3 Weeks (Express)';
    } else if (calcSpeed === 'extended') {
      multiplier = 0.9;
      durationText = '8-12 Weeks (Extended)';
    }

    // priority support add-on
    let addOnPrice = 0;
    if (prioritySupport) {
      addOnPrice = 15000;
    }

    const totalPrice = Math.round((basePrice * multiplier) + addOnPrice);

    return {
      price: totalPrice,
      modules: selectedModules,
      duration: durationText
    };
  };

  const currentEstimate = getCalculateDetails();

  const handleCopyEstimate = () => {
    const modulesStr = currentEstimate.modules.length > 0 
      ? currentEstimate.modules.join(', ') 
      : 'Custom Workspace Formulation';
    const textToCopy = `Q BENCH Custom Proposal Specification:\n- Selected Frameworks: ${modulesStr}\n- Estimated Delivery: ${currentEstimate.duration}\n- Projected Value Estimate: ₹${currentEstimate.price.toLocaleString('en-IN')}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedEstimate(true);
    setTimeout(() => {
      setCopiedEstimate(false);
    }, 2500);
  };

  const handleApplyEstimateToContact = () => {
    const modulesStr = currentEstimate.modules.length > 0 
      ? currentEstimate.modules.join(', ') 
      : 'Custom Workspace Formulation';
      
    const descriptionText = `Hi Q BENCH team! I used your interactive specifications estimator on the website and configured a custom service roadmap:\n\n- Selected Frameworks: ${modulesStr}\n- Delivery Velocity: ${calcSpeed === 'fast' ? 'Express (Fast-Track)' : calcSpeed === 'extended' ? 'Extended Collaborative' : 'Standard Delivery'}\n- Priority Support Addon: ${prioritySupport ? 'Yes (Enabled)' : 'No (Standard Support)'}\n- Projected Value Quote: ₹${currentEstimate.price.toLocaleString('en-IN')}`;
    
    localStorage.setItem('qbench_prefilled_message', descriptionText);
    
    let budgetBucket = 'Under ₹15,000';
    if (currentEstimate.price < 15000) {
      budgetBucket = 'Under ₹15,000';
    } else if (currentEstimate.price >= 15000 && currentEstimate.price < 50000) {
      budgetBucket = '₹15,000 — ₹50,000';
    } else if (currentEstimate.price >= 50000 && currentEstimate.price < 150000) {
      budgetBucket = '₹50,000 — ₹1.5L';
    } else if (currentEstimate.price >= 150000 && currentEstimate.price < 300000) {
      budgetBucket = '₹1.5L — ₹3L';
    } else {
      budgetBucket = '₹3L+';
    }

    localStorage.setItem('qbench_prefilled_budget', budgetBucket);

    const calcOptions = [];
    if (currentEstimate.modules.length > 0) {
      calcOptions.push(`Frameworks: ${modulesStr}`);
    }
    calcOptions.push(`Velocity: ${calcSpeed === 'fast' ? 'Express (2-3 Weeks)' : calcSpeed === 'extended' ? 'Extended (8-12 Weeks)' : 'Standard (4-6 Weeks)'}`);
    calcOptions.push(`Priority Support: ${prioritySupport ? 'Enabled' : 'Disabled'}`);

    const packageObj = {
      packageName: 'Custom Multi-Service Formulation',
      packageId: 'custom_estimator_spec',
      packagePrice: `₹${currentEstimate.price.toLocaleString('en-IN')}`,
      packageCategory: 'Custom Multi-Service',
      duration: currentEstimate.duration,
      addonsOrOptions: calcOptions,
      totalAmount: `₹${currentEstimate.price.toLocaleString('en-IN')}`
    };
    localStorage.setItem('qbench_selected_package', JSON.stringify(packageObj));

    onNavigate('contact');
  };

  const handleSelectPackageCTA = (tierName: string, serviceName: string, priceStr: string) => {
    const textMsg = `Hi Q BENCH! I want to inquire about the "${serviceName}" - [${tierName.toUpperCase()} Package] (${priceStr}). Kindly provide me with information on how we can get started with this service block.`;
    
    localStorage.setItem('qbench_prefilled_message', textMsg);
    
    // Parse price string to match suitable budget option dynamically
    let numericPrice = 0;
    const cleaned = priceStr.replace(/[^\d]/g, '');
    if (cleaned) {
      numericPrice = parseInt(cleaned, 10);
    } else if (priceStr.toLowerCase().includes('custom')) {
      numericPrice = 300000; // treat custom as ₹3L+
    }
    
    let budgetBucket = 'Under ₹15,000';
    if (numericPrice >= 300000) {
      budgetBucket = '₹3L+';
    } else if (numericPrice >= 150000) {
      budgetBucket = '₹1.5L — ₹3L';
    } else if (numericPrice >= 50000) {
      budgetBucket = '₹50,000 — ₹1.5L';
    } else if (numericPrice >= 15000) {
      budgetBucket = '₹15,000 — ₹50,000';
    }
    
    localStorage.setItem('qbench_prefilled_budget', budgetBucket);

    let durationVal = 'approx. 3-4 Weeks';
    if (serviceName === 'Business Support') {
      durationVal = 'Monthly Service Block';
    } else {
      if (tierName.toLowerCase().includes('basic') || tierName.toLowerCase().includes('starter')) {
        durationVal = 'approx. 1-2 Weeks';
      } else if (tierName.toLowerCase().includes('standard') || tierName.toLowerCase().includes('growth')) {
        durationVal = 'approx. 3-4 Weeks';
      } else {
        durationVal = 'Continuous Sprint Delivery';
      }
    }

    const simpleId = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '_' + tierName.toLowerCase();

    const packageObj = {
      packageName: `${serviceName} — ${tierName} Package`,
      packageId: simpleId,
      packagePrice: priceStr,
      packageCategory: serviceName,
      duration: durationVal,
      addonsOrOptions: [],
      totalAmount: priceStr
    };
    localStorage.setItem('qbench_selected_package', JSON.stringify(packageObj));

    onNavigate('contact');
  };

  const handleWhatsAppPackageClick = (tierName: string, serviceName: string, priceStr: string) => {
    const pageUrl = `${window.location.origin}/packages?service=${encodeURIComponent(serviceName)}`;
    const referenceId = `#QBS-PKG-${serviceName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '')}-${tierName.toUpperCase().replace(/\s+/g, '')}`;

    const textMessage = `Hello Q BENCH Team,\n\nI am interested in exploring your package options! Here are the details:\n\n*Service Name*: ${serviceName}\n*Package Name*: ${tierName} Package\n*Project Name*: N/A\n*Reference ID*: ${referenceId}\n*Page URL*: ${pageUrl}\n\nPlease contact me to discuss how we can get started with this package. Thank you!`;

    const encoded = encodeURIComponent(textMessage);
    window.open(`https://wa.me/917356525932?text=${encoded}`, '_blank');
  };

  return (
    <div id="packages-view-viewport" className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
      
      {/* Title block segment */}
      <div id="packages-title-block" className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="font-tech text-xs tracking-widest text-[#00685b] font-bold bg-[#00685b]/10 px-4 py-1.5 rounded-full inline-block uppercase">
          {websiteContent?.packagesHero?.badge || 'PORTFOLIO COLLECTION'}
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-brand-text">
          {websiteContent?.packagesHero?.titleLine1 || 'Design with Purpose.'}<br />
          <span className="text-[#00685b] font-light italic tracking-normal">{websiteContent?.packagesHero?.titleHighlight || 'Built with Precision.'}</span>
        </h1>
        <p className="font-display text-sm text-brand-text-muted leading-relaxed max-w-2xl mx-auto">
          {websiteContent?.packagesHero?.description || 'Explore a curated collection of branding, web design, motion graphics, social media, and creative projects that reflect thoughtful design and attention to detail.'}
        </p>
      </div>

      {/* 9-Services Switchboard layout */}
      <div className="space-y-8 mb-16">
        <div className="flex flex-col space-y-2 text-center md:text-left">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-black uppercase">
            // PROJECT CATEGORIES
          </span>
          <h2 className="font-display text-lg font-bold text-brand-text">
            Explore pricing and inclusions across our {activePackagesList.length} core capabilities:
          </h2>
        </div>

        {/* Categories Tab selector bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 bg-brand-surface-low border border-brand-outline/20 p-2 rounded-2xl">
          {activePackagesList.map((service) => {
            const isSelected = selectedServiceId === service.id;
            return (
              <button
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                className={`flex items-center justify-center gap-1.5 py-3 px-2.5 rounded-xl font-display text-[11px] font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'bg-[#00685b] text-white shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-brand-surface border border-brand-outline/10 text-brand-text-muted hover:text-brand-text'
                }`}
              >
                <span className={isSelected ? 'text-white' : 'text-[#00685b]'}>
                  {getServiceIcon(service.iconName)}
                </span>
                <span className="truncate">{service.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Service Header Statement */}
        <div className="bg-white border border-brand-outline/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 md:max-w-xl">
            <span className="font-tech text-[9px] uppercase tracking-wider text-[#00685b] font-bold bg-[#00685b]/10 px-2 rounded-full py-0.5 inline-block">
              PROJECT OVERVIEW
            </span>
            <h3 className="font-display text-xl font-black text-brand-text">{activeService.name} Projects</h3>
            <p className="font-display text-xs text-brand-text-muted leading-relaxed">{activeService.description}</p>
          </div>

          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="flex items-center gap-1 text-xs font-semibold py-2.5 px-4 rounded-xl border border-brand-outline/40 hover:border-[#00685b] text-brand-text hover:text-[#00685b] transition-all bg-white cursor-pointer self-start md:self-auto shrink-0"
          >
            <Grid className="h-4 w-4 text-[#00685b]" />
            <span>{showMatrix ? "View Side-by-Side Cards" : "View Detailed Comparison Grid"}</span>
          </button>
        </div>
      </div>

      {/* Main pricing presentation */}
      {selectedServiceId === 'business-support' ? (
        /* Bespoke One-Page Business Support & Back Office Services Section */
        <div id="one-page-business-support" className="space-y-16 animate-fade-in relative z-20">
          
          {/* Subheading pitch & Services We Offer blocks */}
          <div className="bg-brand-surface-low border border-brand-outline/25 rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm">
            <div className="space-y-3 max-w-3xl">
              <span className="font-tech text-xs tracking-widest text-[#00685b] font-extrabold uppercase">
                // YOUR TRUSTED PARTNER FOR BUSINESS OPERATIONS
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
                Focus on growing your business while we handle the day-to-day operations.
              </h3>
              <p className="font-sans text-sm text-brand-text-muted leading-relaxed">
                At QBench, we help businesses streamline operations, improve productivity, and reduce administrative workload through professional business support services. From accounting and billing to customer support, data management, and reporting, our team acts as an extension of your business.
              </p>
              <p className="font-sans text-xs text-brand-text-muted leading-relaxed font-semibold italic">
                Whether you're a startup, SME, agency, retailer, consultant, or growing enterprise, we provide reliable support that allows you to focus on growth while we handle the operational details.
              </p>
            </div>

            {/* Services Grid representation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-brand-outline/10">
              {[
                {
                  title: "Accounts & Finance Support",
                  items: [
                    "Daily Bookkeeping",
                    "Accounts Payable & Receivable",
                    "Ledger Management",
                    "Bank Reconciliation",
                    "GST Documentation Support",
                    "Payroll Assistance",
                    "MIS Reports",
                    "Cash Flow Tracking"
                  ]
                },
                {
                  title: "Excel & Reporting Solutions",
                  items: [
                    "Advanced Excel Spreadsheets",
                    "Financial Dashboards",
                    "Business Reports",
                    "MIS Reporting",
                    "Data Analysis",
                    "Excel Automation",
                    "KPI Tracking Sheets",
                    "Inventory Reports"
                  ]
                },
                {
                  title: "Data Entry Services",
                  items: [
                    "Online & Offline Data Entry",
                    "CRM Data Updates",
                    "Invoice Data Entry",
                    "Database Management",
                    "Record Maintenance",
                    "Data Cleaning & Formatting",
                    "Document Digitization"
                  ]
                },
                {
                  title: "Billing & Administration",
                  items: [
                    "Invoice Creation",
                    "Quotation Preparation",
                    "Billing Management",
                    "Collection Tracking",
                    "Purchase Order Management",
                    "Vendor Documentation",
                    "Administrative Assistance"
                  ]
                },
                {
                  title: "Customer Support Services",
                  items: [
                    "Customer Handling",
                    "Email Support",
                    "WhatsApp Support",
                    "Lead Management",
                    "Appointment Scheduling",
                    "Customer Follow-Ups",
                    "CRM Management"
                  ]
                },
                {
                  title: "Travel & Itinerary Preparation",
                  items: [
                    "Business Travel Planning",
                    "Tour Itinerary Creation",
                    "Meeting Scheduling",
                    "Travel Documentation",
                    "Hotel & Transportation Coordination"
                  ]
                }
              ].map((sub, sIdx) => (
                <div key={sIdx} className="bg-white border border-brand-outline/15 rounded-2xl p-5 hover:border-[#00685b]/30 transition-colors">
                  <h4 className="font-display text-sm font-extrabold text-brand-text mb-3 border-b border-brand-outline/10 pb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#00685b]" />
                    {sub.title}
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {sub.items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-center gap-2 text-xs text-brand-text-muted font-sans leading-relaxed">
                        <Check className="h-3 w-3 text-[#00685b] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Service Package Pricing Cards */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="font-tech text-xs tracking-widest text-[#00685b] font-bold bg-[#00685b]/10 px-3 py-1 rounded-full">
                SERVICE TIERS & PACKAGES
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text">Select a Plan Tailored to Your Load</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              
              {/* Starter Package */}
              <div className="bg-white border border-brand-outline/25 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative shadow-sm hover:border-[#00685b] hover:shadow-md">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="font-tech text-[10px] uppercase tracking-widest text-[#00685b] font-bold bg-[#00685b]/10 px-3 py-1 rounded-full">
                      {cmsBs?.tiers?.[0]?.name || 'Starter'} Package
                    </span>
                    <p className="font-display text-xs text-brand-text-muted mt-2">
                      {cmsBs?.tiers?.[0]?.subtitle || 'Ideal for startups, freelancers, and small businesses.'}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-brand-outline/15">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-brand-text">
                      {cmsBs?.tiers?.[0]?.price || '₹4,999'}
                    </span>
                    <span className="text-brand-text-muted text-xs font-semibold block mt-1">{cmsBs?.tiers?.[0]?.period || '/ Month'}</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="font-tech text-[10px] uppercase font-bold text-brand-text-variant tracking-wider">Inclusions —</p>
                    <ul className="space-y-2.5">
                      {(cmsBs?.tiers?.[0]?.inclusions || [
                        "Data Entry Support",
                        "Billing & Invoice Management",
                        "Customer Inquiry Handling",
                        "Basic Excel Reports",
                        "Monthly MIS Report",
                        "Email Support"
                      ]).map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2.5 text-xs text-brand-text font-semibold font-display">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-brand-outline/15 space-y-4">
                  <a 
                    href="#business-support-comparison-grid"
                    className="text-center font-display text-[10px] font-bold text-brand-text-muted hover:text-[#00685b] flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <span>View comparison grid ↓</span>
                  </a>
                  <button
                    onClick={() => handleSelectPackageCTA(cmsBs?.tiers?.[0]?.name || 'Starter', 'Business Support', `${cmsBs?.tiers?.[0]?.price || '₹4,999'}${cmsBs?.tiers?.[0]?.period || '/Month'}`)}
                    className="w-full py-3 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-brand-dark text-white hover:bg-[#2d3030] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Select {cmsBs?.tiers?.[0]?.name || 'Starter'} Package</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleWhatsAppPackageClick(cmsBs?.tiers?.[0]?.name || 'Starter', 'Business Support', `${cmsBs?.tiers?.[0]?.price || '₹4,999'}${cmsBs?.tiers?.[0]?.period || '/Month'}`)}
                    className="w-full py-3 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-[#25D366] hover:bg-[#20ba5a] text-white cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Chat on WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Growth Package */}
              <div className="bg-white border-2 border-[#00685b] rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative shadow-md ring-4 ring-[#00685b]/10">
                <span className="absolute -top-3.5 right-6 bg-[#00685b] text-white text-[10px] font-tech font-extrabold uppercase py-1 px-3.5 rounded-full tracking-widest shadow-md">
                  {cmsBs?.tiers?.[1]?.badge || '★ RECOMMENDED SELECTION'}
                </span>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="font-tech text-[10px] uppercase tracking-widest text-emerald-800 font-bold bg-[#00685b]/10 px-3 py-1 rounded-full">
                      {cmsBs?.tiers?.[1]?.name || 'Growth'} Package
                    </span>
                    <p className="font-display text-xs text-brand-text-muted mt-2">
                      {cmsBs?.tiers?.[1]?.subtitle || 'Designed for growing businesses requiring regular operational support.'}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-brand-outline/15">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#00685b]">
                      {cmsBs?.tiers?.[1]?.price || '₹9,999'}
                    </span>
                    <span className="text-[#00685b] text-xs font-bold block mt-1">{cmsBs?.tiers?.[1]?.period || '/ Month'}</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="font-tech text-[10px] uppercase font-bold text-[#00685b] tracking-wider">Inclusions —</p>
                    <ul className="space-y-2.5">
                      {(cmsBs?.tiers?.[1]?.inclusions || [
                        "Everything in Starter",
                        "CRM Management",
                        "Customer Follow-Ups",
                        "Advanced Excel Dashboards",
                        "Weekly Reports",
                        "Itinerary Preparation",
                        "Appointment Scheduling",
                        "Business Reporting"
                      ]).map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2.5 text-xs text-brand-text font-bold text-[#00685b] font-display">
                          <CheckCircle2 className="h-4 w-4 text-[#00685b] mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-brand-outline/15 space-y-4">
                  <a 
                    href="#business-support-comparison-grid"
                    className="text-center font-display text-[10px] font-bold text-brand-text-muted hover:text-[#00685b] flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <span>View comparison grid ↓</span>
                  </a>
                  <button
                    onClick={() => handleSelectPackageCTA(cmsBs?.tiers?.[1]?.name || 'Growth', 'Business Support', `${cmsBs?.tiers?.[1]?.price || '₹9,999'}${cmsBs?.tiers?.[1]?.period || '/Month'}`)}
                    className="w-full py-3.5 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-[#00685b] text-white hover:bg-[#005a4e] cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>Select {cmsBs?.tiers?.[1]?.name || 'Growth'} Package</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleWhatsAppPackageClick(cmsBs?.tiers?.[1]?.name || 'Growth', 'Business Support', `${cmsBs?.tiers?.[1]?.price || '₹9,999'}${cmsBs?.tiers?.[1]?.period || '/Month'}`)}
                    className="w-full py-3.5 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-[#25D366] hover:bg-[#20ba5a] text-white cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Chat on WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Business Partner Package */}
              <div className="bg-white border border-brand-outline/25 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative shadow-sm hover:border-[#00685b] hover:shadow-md">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="font-tech text-[10px] uppercase tracking-widest text-[#178373] font-bold bg-[#178373]/10 px-3 py-1 rounded-full">
                      {cmsBs?.tiers?.[2]?.name || 'Business Partner'}
                    </span>
                    <p className="font-display text-xs text-brand-text-muted mt-2">
                      {cmsBs?.tiers?.[2]?.subtitle || 'Complete outsourced back-office solution for complete operations.'}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-brand-outline/15">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#178373]">
                      {cmsBs?.tiers?.[2]?.price || '₹19,999'}
                    </span>
                    <span className="text-[#178373] text-xs font-semibold block mt-1">{cmsBs?.tiers?.[2]?.period || '/ Month'}</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="font-tech text-[10px] uppercase font-bold text-brand-text-variant tracking-wider">Inclusions —</p>
                    <ul className="space-y-2.5">
                      {(cmsBs?.tiers?.[2]?.inclusions || [
                        "Everything in Growth",
                        "Accounts Management Support",
                        "Payroll Assistance",
                        "Bank Reconciliation Support",
                        "GST Documentation Support",
                        "Dedicated Support Executive",
                        "Daily Reporting",
                        "Priority Support"
                      ]).map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2.5 text-xs text-brand-text font-black text-[#178373] font-display">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-brand-outline/15 space-y-4">
                  <a 
                    href="#business-support-comparison-grid"
                    className="text-center font-display text-[10px] font-bold text-brand-text-muted hover:text-[#00685b] flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <span>View comparison grid ↓</span>
                  </a>
                  <button
                    onClick={() => handleSelectPackageCTA(cmsBs?.tiers?.[2]?.name || 'Business Partner', 'Business Support', `${cmsBs?.tiers?.[2]?.price || '₹19,999'}${cmsBs?.tiers?.[2]?.period || '/Month'}`)}
                    className="w-full py-3 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-gradient-to-r from-[#178373] to-[#00685b] text-white hover:opacity-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Deploy {cmsBs?.tiers?.[2]?.name || 'Partner'} Package</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleWhatsAppPackageClick(cmsBs?.tiers?.[2]?.name || 'Business Partner', 'Business Support', `${cmsBs?.tiers?.[2]?.price || '₹19,999'}${cmsBs?.tiers?.[2]?.period || '/Month'}`)}
                    className="w-full py-3 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-[#25D366] hover:bg-[#20ba5a] text-white cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Chat on WhatsApp</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Comparison Grid Table Anchor Row */}
          <div id="business-support-comparison-grid" className="scroll-mt-24 space-y-6">
            <div className="text-center space-y-2">
              <span className="font-tech text-xs tracking-widest text-[#00685b] font-bold bg-[#00685b]/10 px-3 py-1 rounded-full">
                COMPREHENSIVE SPECS COMPARISON
              </span>
              <h3 className="font-display text-2xl font-black text-brand-text">Detailed Comparison Grid</h3>
            </div>

            <div className="border border-brand-outline/25 rounded-3xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-brand-surface-low border-b border-brand-outline/20">
                      <th className="p-5 font-display text-[11px] font-bold uppercase tracking-wider text-brand-text-variant">Features</th>
                      <th className="p-5 font-display text-[11px] font-bold uppercase tracking-wider text-brand-text text-center bg-[#00685b]/5 border-x border-brand-outline/10">{cmsBs?.tiers?.[0]?.name || 'Starter'}</th>
                      <th className="p-5 font-display text-[11px] font-bold uppercase tracking-wider text-[#00685b] text-center bg-[#00685b]/10">{cmsBs?.tiers?.[1]?.name || 'Growth'}</th>
                      <th className="p-5 font-display text-[11px] font-bold uppercase tracking-wider text-brand-text text-center bg-brand-primary/5">{cmsBs?.tiers?.[2]?.name || 'Business Partner'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-outline/10">
                    {(cmsBs?.comparisonRows || [
                      { name: "Data Entry Support", starter: true, growth: true, partner: true },
                      { name: "Billing & Invoicing", starter: true, growth: true, partner: true },
                      { name: "Customer Handling", starter: true, growth: true, partner: true },
                      { name: "Email Support", starter: true, growth: true, partner: true },
                      { name: "Excel Reports", starter: true, growth: true, partner: true },
                      { name: "MIS Reports", starter: "Monthly", growth: "Weekly", partner: "Daily" },
                      { name: "CRM Management", starter: false, growth: true, partner: true },
                      { name: "Customer Follow-Ups", starter: false, growth: true, partner: true },
                      { name: "Appointment Scheduling", starter: false, growth: true, partner: true },
                      { name: "Itinerary Preparation", starter: false, growth: true, partner: true },
                      { name: "Dashboard Creation", starter: false, growth: true, partner: true },
                      { name: "Accounts Support", starter: false, growth: false, partner: true },
                      { name: "Payroll Assistance", starter: false, growth: false, partner: true },
                      { name: "Bank Reconciliation", starter: false, growth: false, partner: true },
                      { name: "GST Documentation Support", starter: false, growth: false, partner: true },
                      { name: "Dedicated Executive", starter: false, growth: false, partner: true },
                      { name: "Priority Support", starter: false, growth: false, partner: true }
                    ]).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-brand-surface-low/30 transition-colors">
                        <td className="p-4 sm:p-5 font-display text-xs font-semibold text-brand-text">{row.name}</td>
                        
                        {/* Starter */}
                        <td className="p-4 sm:p-5 text-center bg-[#00685b]/5 border-x border-brand-outline/10 text-xs">
                          {row.starter === true ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : row.starter === false ? (
                            <span className="text-gray-300 font-bold">—</span>
                          ) : (
                            <span className="font-display text-[11px] text-[#00685b] font-bold bg-[#00685b]/10 rounded px-2 py-0.5">{row.starter}</span>
                          )}
                        </td>

                        {/* Growth */}
                        <td className="p-4 sm:p-5 text-center bg-[#00685b]/10 text-xs">
                          {row.growth === true ? (
                            <Check className="h-4.5 w-4.5 text-[#00685b] mx-auto font-bold" />
                          ) : row.growth === false ? (
                            <span className="text-gray-300 font-bold">—</span>
                          ) : (
                            <span className="font-display text-[11px] text-white bg-[#00685b] font-extrabold rounded px-2 py-0.5">{row.growth}</span>
                          )}
                        </td>

                        {/* Business Partner */}
                        <td className="p-4 sm:p-5 text-center bg-brand-primary/5 text-xs">
                          {row.partner === true ? (
                            <Check className="h-4.5 w-4.5 text-[#178373] mx-auto font-black" />
                          ) : row.partner === false ? (
                            <span className="text-gray-300 font-bold">—</span>
                          ) : (
                            <span className="font-display text-[11px] text-white bg-[#178373] font-extrabold rounded px-2 py-0.5">{row.partner}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add-On Services Block */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="font-tech text-xs tracking-widest text-[#00685b] font-bold bg-[#00685b]/10 px-3 py-1 rounded-full">
                SELECTABLE ACCELERATORS
              </span>
              <h3 className="font-display text-2xl font-black text-brand-text">Add-On Services</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(cmsBs?.addOns || [
                { name: "Accounting & Tax Support", price: "Starting from ₹500" },
                { name: "GST Filing Assistance", price: "Starting from ₹500" },
                { name: "Payroll Processing", price: "Starting from ₹1,500/month" },
                { name: "Financial Dashboard Creation", price: "Starting from ₹3,000" },
                { name: "Loan Documentation Support", price: "Starting from ₹2,500" },
                { name: "Business Reports & MIS", price: "Starting from ₹2,000" },
                { name: "Custom Excel Automation", price: "Starting from ₹3,500" },
                { name: "Travel Itinerary Preparation", price: "Starting from ₹1,000" }
              ]).map((addon, aIdx) => (
                <div key={aIdx} className="bg-white border border-brand-outline/20 rounded-2xl p-5 flex flex-col justify-between hover:border-[#00685b]/40 transition-colors">
                  <h4 className="font-display text-xs font-black text-brand-text mb-2">{addon.name}</h4>
                  <div>
                    <span className="text-[#00685b] font-tech text-[10px] font-bold bg-[#00685b]/10 px-2 py-0.5 rounded-md block w-fit">
                      {addon.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose QBench Block */}
          <div className="bg-brand-surface-low border border-brand-outline/25 rounded-3xl p-6 sm:p-10 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="font-tech text-xs tracking-widest text-[#00c9a7] font-bold bg-[#00685b]/10 text-[#00685b] px-3.5 py-1 rounded-full inline-block">
                OPERATIONAL CONFIDENCE GUARANTEED
              </span>
              <h4 className="font-display text-2xl font-black text-brand-text">Why Choose QBench?</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Customer-Centric Approach", desc: "Your specific guidelines drive every ledger entry, call report, and document update." },
                { title: "Experienced Professionals", desc: "Expert bookkeeping executives, certified administrative staff, and Microsoft Excel masters." },
                { title: "Accurate & Confidential", desc: "Your operational integrity is locked key-in-hand under secure private cloud policies." },
                { title: "Cost-Effective Outsourcing", desc: "Ditch heavy full-time payroll, benefits, and office space overhead expenditures." },
                { title: "Fast Turnaround Time", desc: "Guaranteed SLA times met consistently, meaning zero business flow interruptions." },
                { title: "Customized Business Solutions", desc: "Flexible billing adjustments to scale support dynamically with monthly volume cycles." },
                { title: "Scalable Support Services", desc: "Instantly add support cells as your seasonal customer volumes peak and shift." },
                { title: "Long-Term Business Partnership", desc: "Dedicated relationship executives committed entirely to your small enterprise success." }
              ].map((reason, rIdx) => (
                <div key={rIdx} className="space-y-2 bg-white/50 p-4 rounded-xl border border-brand-outline/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <h5 className="font-display text-xs font-bold text-brand-text">{reason.title}</h5>
                  </div>
                  <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed pl-6">{reason.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Consultation CTA */}
          <div className="bg-gradient-to-br from-brand-dark to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-lg border border-white/10">
            <div className="absolute right-0 top-0 bottom-0 left-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,104,91,0.2),transparent_70%)] pointer-events-none" />
            
            <div className="space-y-3 relative z-10 max-w-2xl mx-auto">
              <span className="font-tech text-xs tracking-widest text-[#00c9a7] font-bold uppercase">
                // START STREAMLINING OPERATIONS TODAY
              </span>
              <h4 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Ready to Simplify Your Operations?
              </h4>
              <p className="font-sans text-sm text-white/80 leading-relaxed pt-2">
                Let QBench handle your accounting support, customer service, billing, reporting, data management, and administrative tasks while you focus on growing your business.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
              <button
                onClick={() => {
                  localStorage.setItem('qbench_prefilled_message', 'Hi QBench! I am looking to simplify our operations with your Business Support Services. Let us book a consultation. Thank you.');
                  localStorage.setItem('qbench_prefilled_budget', 'Under ₹15,000');
                  onNavigate('contact');
                }}
                className="w-full sm:w-auto py-3 px-6 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-[#00685b] text-white hover:bg-[#005a4e] cursor-pointer shadow-md"
              >
                Book a Free Consultation Today
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('qbench_prefilled_message', 'Hi QBench! I am looking for a custom price quote for structured excel/bookkeeping business services. Regards.');
                  onNavigate('contact');
                }}
                className="w-full sm:w-auto py-3 px-6 rounded-xl font-display text-[10px] font-black uppercase tracking-wider text-slate-800 tracking-widest text-center transition-all bg-white hover:bg-slate-100 cursor-pointer"
              >
                Get a Custom Quote
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="w-full sm:w-auto py-3 px-6 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-transparent text-slate-300 hover:text-white cursor-pointer"
              >
                Scale Your Business with Confidence
              </button>
            </div>
          </div>

        </div>
      ) : !showMatrix ? (
        /* Card Tiers list layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch mb-24 animate-fade-in relative z-20">
          
          {/* 1. BASIC CARD */}
          <div className="bg-white border border-brand-outline/25 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative shadow-sm hover:border-[#00685b] hover:shadow-md">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-tech text-[10px] uppercase tracking-widest text-[#00685b] font-bold bg-[#00685b]/10 px-3 py-1 rounded-full">
                  ENTRY / BASIC TIER
                </span>
                <span className="p-2.5 bg-brand-surface-low rounded-xl border border-brand-outline/10 text-[#00685b]">
                  {getServiceIcon(activeService.iconName)}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-2xl font-black text-brand-text tracking-tight uppercase">
                  {(activeService as any).tierNames?.basic || (activeService.id === 'branding' ? 'Starter' : 'Basic')} package
                </h3>
                <p className="font-display text-xs text-brand-text-muted">
                  {(activeService as any).tierDescriptions?.basic || (activeService.id === 'branding' ? 'Perfect for startups and personal brands.' : 'Essential tools designed to establish initial capability and structure.')}
                </p>
              </div>

              <div className="pb-4 border-b border-brand-outline/15">
                <span className="font-display text-3xl sm:text-4xl font-extrabold text-brand-text">
                  {activeService.priceLabels.basic}
                </span>
                <span className="font-display text-xs text-brand-text-muted font-medium block mt-1">
                  Single-project focus model
                </span>
              </div>

              {/* Basic Features Checklist */}
              <div className="space-y-3 pt-2">
                <p className="font-tech text-[10px] uppercase font-bold text-brand-text-variant tracking-wider">
                  Surgical Inclusions —
                </p>
                <ul className="space-y-2.5">
                  {activeService.features.map((feat, fIdx) => {
                    const inclusion = feat.basic;
                    const isIncluded = inclusion !== false && inclusion !== '—';
                    return (
                      <li key={fIdx} className="flex items-start space-x-2.5">
                        {isIncluded ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <span className="text-gray-300 font-bold text-center w-4 mt-0.5 shrink-0">—</span>
                        )}
                        <span className={`font-display text-xs leading-tight ${isIncluded ? 'text-brand-text font-semibold' : 'text-brand-text-muted/50 font-normal line-through'}`}>
                          {feat.name}
                          {typeof inclusion === 'string' && isIncluded && (
                            <span className="text-[#00685b] font-bold bg-[#00685b]/10 rounded px-1.5 py-0.5 text-[9px] ml-1">{inclusion}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-brand-outline/15 space-y-4">
              <span className="text-[10px] py-1 bg-brand-surface-low rounded px-2 font-mono text-brand-text-muted block text-center">
                Timeline Objective: {(activeService as any).tierTimelines?.basic || 'approx. 1-2 Weeks'}
              </span>
              <button
                onClick={() => handleSelectPackageCTA((activeService as any).tierNames?.basic || 'Basic', activeService.name, activeService.priceLabels.basic)}
                className="w-full py-3 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-brand-dark text-white hover:bg-[#2d3030] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Deploy {(activeService as any).tierNames?.basic || 'Basic'} Tier</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleWhatsAppPackageClick((activeService as any).tierNames?.basic || 'Basic', activeService.name, activeService.priceLabels.basic)}
                className="w-full py-3 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-[#25D366] hover:bg-[#20ba5a] text-white cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>
          </div>

          {/* 2. STANDARD CARD (POPULAR) */}
          <div className="bg-white border-2 border-[#00685b] rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative shadow-md ring-4 ring-[#00685b]/10">
            <span className="absolute -top-3.5 right-6 bg-[#00685b] text-white text-[10px] font-tech font-extrabold uppercase py-1 px-3.5 rounded-full tracking-widest shadow-md">
              ★ RECOMMEND SELECTION
            </span>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-tech text-[10px] uppercase tracking-widest text-emerald-800 font-bold bg-[#00685b]/10 px-3 py-1 rounded-full">
                  STANDARD / SCALE TIER
                </span>
                <span className="p-2.5 bg-brand-surface-low rounded-xl border border-brand-outline/10 text-[#00685b]">
                  {getServiceIcon(activeService.iconName)}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-2xl font-black text-brand-text tracking-tight uppercase">
                  {(activeService as any).tierNames?.standard || (activeService.id === 'branding' ? 'Professional ⭐' : 'Standard')} package
                </h3>
                <p className="font-display text-xs text-brand-text-muted">
                  {(activeService as any).tierDescriptions?.standard || (activeService.id === 'branding' ? 'For businesses ready to establish a strong brand.' : 'Fully featured setup delivering complete utility, design details, and workflow scaling tools.')}
                </p>
              </div>

              <div className="pb-4 border-b border-brand-outline/15">
                <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#00685b]">
                  {activeService.priceLabels.standard}
                </span>
                <span className="font-display text-xs text-[#00685b] font-bold block mt-1">
                  Complete ownership handoff suite
                </span>
              </div>

              {/* Standard Features Checklist */}
              <div className="space-y-3 pt-2">
                <p className="font-tech text-[10px] uppercase font-bold text-brand-text-variant tracking-wider">
                  Surgical Inclusions —
                </p>
                <ul className="space-y-2.5">
                  {activeService.features.map((feat, fIdx) => {
                    const inclusion = feat.standard;
                    const isIncluded = inclusion !== false && inclusion !== '—';
                    return (
                      <li key={fIdx} className="flex items-start space-x-2.5">
                        {isIncluded ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <span className="text-gray-300 font-bold text-center w-4 mt-0.5 shrink-0">—</span>
                        )}
                        <span className={`font-display text-xs leading-tight ${isIncluded ? 'text-brand-text font-bold text-[#00685b]' : 'text-brand-text-muted/55 font-normal line-through'}`}>
                          {feat.name}
                          {typeof inclusion === 'string' && isIncluded && (
                            <span className="text-white font-bold bg-[#00685b] rounded px-1.5 py-0.5 text-[9px] ml-1">{inclusion}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-brand-outline/15 space-y-4">
              <span className="text-[10px] py-1 bg-brand-surface-low rounded px-2 font-mono text-[#00685b] font-bold block text-center">
                Timeline Objective: {(activeService as any).tierTimelines?.standard || (activeService.id === 'branding' ? 'approx. 2-3 Weeks' : 'approx. 3-4 Weeks')}
              </span>
              <button
                onClick={() => handleSelectPackageCTA((activeService as any).tierNames?.standard || 'Standard', activeService.name, activeService.priceLabels.standard)}
                className="w-full py-3.5 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-[#00685b] text-white hover:bg-[#005a4e] cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Deploy {(activeService as any).tierNames?.standard || 'Standard'} Tier</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleWhatsAppPackageClick((activeService as any).tierNames?.standard || 'Standard', activeService.name, activeService.priceLabels.standard)}
                className="w-full py-3.5 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-[#25D366] hover:bg-[#20ba5a] text-white cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>
          </div>

          {/* 3. PREMIUM CARD */}
          <div className="bg-white border border-brand-outline/25 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative shadow-sm hover:border-[#00685b] hover:shadow-md">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-tech text-[10px] uppercase tracking-widest text-[#178373] font-bold bg-[#178373]/10 px-3 py-1 rounded-full">
                  PREMIUM / APEX TIER
                </span>
                <span className="p-2.5 bg-brand-surface-low rounded-xl border border-brand-outline/10 text-[#00685b]">
                  {getServiceIcon(activeService.iconName)}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-2xl font-black text-brand-text tracking-tight uppercase">
                  {(activeService as any).tierNames?.premium || (activeService.id === 'branding' ? 'Enterprise' : (activeService.id === 'video-editing' ? 'PREMIUM ADS' : 'PREMIUM'))} package
                </h3>
                <p className="font-display text-xs text-brand-text-muted">
                  {(activeService as any).tierDescriptions?.premium || (activeService.id === 'branding' ? 'A complete branding solution with premium support.' : 'Maximized capability targets, continuous priority iterations, and elite enterprise support.')}
                </p>
              </div>

              <div className="pb-4 border-b border-brand-outline/15">
                <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#178373]">
                  {activeService.priceLabels.premium}
                </span>
                <span className="font-display text-xs text-[#178373] font-bold block mt-1">
                  Unlimited potential & premium setups
                </span>
              </div>

              {/* Premium Features Checklist */}
              <div className="space-y-3 pt-2">
                <p className="font-tech text-[10px] uppercase font-bold text-brand-text-variant tracking-wider">
                  Surgical Inclusions —
                </p>
                <ul className="space-y-2.5">
                  {activeService.features.map((feat, fIdx) => {
                    const inclusion = feat.premium;
                    const isIncluded = inclusion !== false && inclusion !== '—';
                    return (
                      <li key={fIdx} className="flex items-start space-x-2.5">
                        {isIncluded ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <span className="text-gray-300 font-bold text-center w-4 mt-0.5 shrink-0">—</span>
                        )}
                        <span className={`font-display text-xs leading-tight ${isIncluded ? 'text-brand-text font-black text-[#178373]' : 'text-brand-text-muted/60 font-normal line-through'}`}>
                          {feat.name}
                          {typeof inclusion === 'string' && isIncluded && (
                            <span className="text-white font-bold bg-[#178373] rounded px-1.5 py-0.5 text-[9px] ml-1">{inclusion}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-brand-outline/15 space-y-4">
              <span className="text-[10px] py-1 bg-brand-surface-low rounded px-2 font-mono text-[#178373] font-bold block text-center">
                Timeline Objective: {(activeService as any).tierTimelines?.premium || (activeService.id === 'branding' ? 'approx. 3-4 Weeks' : 'Continuous Sprint Delivery')}
              </span>
              <button
                onClick={() => handleSelectPackageCTA((activeService as any).tierNames?.premium || 'Premium', activeService.name, activeService.priceLabels.premium)}
                className="w-full py-3 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-gradient-to-r from-[#178373] to-[#00685b] text-white hover:opacity-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Deploy {(activeService as any).tierNames?.premium || 'Premium'} Tier</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleWhatsAppPackageClick((activeService as any).tierNames?.premium || 'Premium', activeService.name, activeService.priceLabels.premium)}
                className="w-full py-3 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-center transition-all bg-[#25D366] hover:bg-[#20ba5a] text-white cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Grid Comparison Matrix layout */
        <div className="border border-brand-outline/25 rounded-3xl overflow-hidden mb-24 bg-white shadow-sm animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-brand-surface-low border-b border-brand-outline/20">
                  <th className="p-5 font-display text-[11px] font-bold uppercase tracking-wider text-brand-text-variant">Features Spec Matrix</th>
                  <th className="p-5 font-display text-[11px] font-bold uppercase tracking-wider text-brand-text text-center bg-[#00685b]/5 border-x border-brand-outline/10">BASIC package</th>
                  <th className="p-5 font-display text-[11px] font-bold uppercase tracking-wider text-[#00685b] text-center bg-[#00685b]/10">STANDARD package (REC)</th>
                  <th className="p-5 font-display text-[11px] font-bold uppercase tracking-wider text-brand-text text-center bg-brand-primary/5">PREMIUM package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-outline/10">
                {activeService.features.map((feat, fIdx) => (
                  <tr key={fIdx} className="hover:bg-brand-surface-low/30 transition-colors">
                    <td className="p-4 sm:p-5 font-display text-xs font-semibold text-brand-text">{feat.name}</td>
                    
                    {/* Basic */}
                    <td className="p-4 sm:p-5 text-center bg-[#00685b]/5 border-x border-brand-outline/10">
                      {feat.basic === true ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : feat.basic === false ? (
                        <span className="text-gray-300 font-bold">—</span>
                      ) : (
                        <span className="font-display text-[11px] text-[#00685b] font-bold bg-[#00685b]/10 rounded px-2 py-0.5">{feat.basic}</span>
                      )}
                    </td>

                    {/* Standard */}
                    <td className="p-4 sm:p-5 text-center bg-[#00685b]/10">
                      {feat.standard === true ? (
                        <Check className="h-4.5 w-4.5 text-emerald-500 mx-auto font-black" />
                      ) : feat.standard === false ? (
                        <span className="text-gray-300 font-bold">—</span>
                      ) : (
                        <span className="font-display text-[11px] text-white bg-[#00685b] font-extrabold rounded px-2 py-0.5">{feat.standard}</span>
                      )}
                    </td>

                    {/* Premium */}
                    <td className="p-4 sm:p-5 text-center bg-brand-primary/5">
                      {feat.premium === true ? (
                        <Check className="h-4.5 w-4.5 text-[#178373] mx-auto font-black" />
                      ) : feat.premium === false ? (
                        <span className="text-gray-300 font-bold">—</span>
                      ) : (
                        <span className="font-display text-[11px] text-white bg-[#178373] font-extrabold rounded px-2 py-0.5">{feat.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-brand-surface p-4 border-t border-brand-outline/20 text-center font-display text-xs text-brand-text-muted">
            Displayed criteria represent exact guaranteed deliverables. Select and configure custom modules below.
          </div>
        </div>
      )}

      {/* Dynamic interactive scope planner blueprint calculator */}
      <section 
        id="custom-estimator-block" 
        className="bg-brand-dark text-white rounded-3xl p-6 sm:p-10 border border-white/10 relative overflow-hidden shadow-xl mb-24"
      >
        <div id="calculator-bg-pattern animate-pulse" className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#00685b]/10 to-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch relative z-10">
          
          {/* Left Controls Column */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4.5 w-4.5 text-[#00c9a7]" />
                <span className="font-tech text-xs tracking-widest text-[#00c9a7] font-bold uppercase">
                  Simple Blueprint Planner
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Configure Your Project Budget
              </h2>
              <p className="font-sans text-xs text-white/70 max-w-lg leading-relaxed">
                Select your overall plan scale and tap any capabilities below to instantly estimate your budget.
              </p>
            </div>

            {/* Step 1: Master Tier Scale Select */}
            <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="font-tech text-[9px] text-[#00c9a7]/80 tracking-widest uppercase font-bold block mb-2">
                1. SELECT SERVICE RATIO & SCALE
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'basic', label: 'Basic Scale', desc: 'Core startup execution' },
                  { id: 'standard', label: 'Standard Scale', desc: 'Growth scale quality' },
                  { id: 'premium', label: 'Premium Scale', desc: 'Bespoke custom systems' }
                ] as const).map(opt => {
                  const isSelected = masterTier === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setMasterTier(opt.id);
                        setCalcTiers(prev => {
                          const updated = { ...prev };
                          Object.keys(updated).forEach(key => {
                            if (updated[key] !== 'none') {
                              updated[key] = opt.id;
                            }
                          });
                          return updated;
                        });
                      }}
                      className={`p-3 rounded-xl text-left transition-all duration-200 cursor-pointer border ${
                        isSelected
                          ? 'bg-[#00c9a7] text-black border-[#00c9a7] scale-[1.02]'
                          : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <p className="font-display text-[10px] font-black uppercase tracking-wider">{opt.label}</p>
                      <p className={`text-[8px] font-sans mt-0.5 ${isSelected ? 'text-black/60' : 'text-white/40'}`}>{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Grid of 9 toggle capsules */}
            <div className="space-y-2">
              <span className="font-tech text-[9px] text-[#00c9a7]/80 tracking-widest uppercase font-bold block">
                2. TOGGLE NEEDED CAPABILITIES
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activePackagesList.map((service) => {
                  const isActive = calcTiers[service.id] !== 'none';
                  const servicePrice = service.prices[masterTier as 'basic' | 'standard' | 'premium'];
                  
                  return (
                    <button
                      key={service.id}
                      onClick={() => {
                        setCalcTiers(prev => ({
                          ...prev,
                          [service.id]: isActive ? 'none' : masterTier
                        }));
                      }}
                      className={`p-3 rounded-xl border text-left transition-all duration-250 cursor-pointer flex flex-col justify-between h-20 ${
                        isActive
                          ? 'bg-[#00c9a7]/10 border-[#00c9a7]/75 text-white shadow-md shadow-[#00c9a7]/5 ring-1 ring-[#00c9a7]/20'
                          : 'bg-white/5 border-white/5 hover:border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`p-1 rounded-md shrink-0 ${isActive ? 'bg-[#00c9a7]/20 text-[#00c9a7]' : 'bg-white/5'}`}>
                          {getServiceIcon(service.iconName)}
                        </span>
                        <div className="truncate">
                          <p className={`font-display text-[9px] font-bold uppercase truncate tracking-tight ${isActive ? 'text-white' : 'text-white/70'}`}>
                            {service.name}
                          </p>
                          <p className="text-[8px] font-tech text-white/40 tracking-wider">
                            {isActive ? 'Included' : 'Tap to add'}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-baseline w-full pt-1">
                        <span className="text-[8px] font-tech text-white/30 uppercase">Est. Cost:</span>
                        <span className={`font-tech text-[9px] font-extrabold ${isActive ? 'text-[#00c9a7]' : 'text-white/50'}`}>
                          {service.priceLabels[masterTier]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Turnaround speed selectors and Priority checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              
              {/* Delivery Speed Selector */}
              <div className="space-y-1">
                <span className="font-tech text-[9px] text-white/50 tracking-wider uppercase block">
                  Delivery Speed:
                </span>
                <div className="flex bg-white/5 rounded-xl p-0.5 border border-white/5">
                  {[
                    { id: 'extended', label: 'Extended' },
                    { id: 'standard', label: 'Standard' },
                    { id: 'fast', label: 'Express (+35%)' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setCalcSpeed(opt.id as any)}
                      className={`flex-1 text-center font-display text-[8px] font-bold py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                        calcSpeed === opt.id 
                          ? 'bg-[#00c9a7] text-black font-bold' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Support */}
              <div className="space-y-1">
                <span className="font-tech text-[9px] text-white/50 tracking-wider uppercase block">
                  Support Level:
                </span>
                <div className="flex bg-white/5 rounded-xl p-0.5 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setPrioritySupport(false)}
                    className={`flex-1 text-center font-display text-[8px] font-bold py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      !prioritySupport
                        ? 'bg-[#00c9a7] text-black font-bold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrioritySupport(true)}
                    className={`flex-1 text-center font-display text-[8px] font-bold py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      prioritySupport
                        ? 'bg-[#00c9a7] text-black font-bold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Priority SLA
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Right Calculations Blueprint Output */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative">
            <div className="absolute right-4 top-4 bg-[#00c9a7]/15 border border-[#00c9a7]/25 rounded-md p-1">
              <Zap className="h-4.5 w-4.5 text-[#00c9a7] animate-pulse" />
            </div>

            <div className="space-y-6">
              <span className="font-tech text-[9px] uppercase tracking-widest text-[#00c9a7] font-bold block">
                Estimated Roadmap Specifications
              </span>

              {/* Selected modules list */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-2">
                  <span className="font-display text-xs text-white/70">Selected Framework Tiers:</span>
                  <span className="font-tech text-xs text-[#00c9a7] font-black">
                    {currentEstimate.modules.length} Active Nodes
                  </span>
                </div>
                {currentEstimate.modules.length > 0 ? (
                  <ul className="space-y-1.5 py-1.5 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                    {currentEstimate.modules.map((name, i) => (
                      <li key={i} className="flex items-center space-x-2 text-[11px] text-white/90 font-display">
                        <span className="h-1.5 w-1.5 bg-[#00c9a7] rounded-full shrink-0" />
                        <span>{name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-sans text-[11px] text-white/50 italic py-4">
                    No framework configurations toggled. Pick capability tiers to synthesize a custom estimate.
                  </p>
                )}
              </div>

              {/* Expected Delivery timelines output */}
              <div className="flex justify-between items-center border-b border-white/10 pb-2 text-xs">
                <span className="font-display text-white/70">Projected Run Duration:</span>
                <span className="font-tech font-bold text-white flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <Clock className="w-3.5 h-3.5 text-[#00c9a7]" /> {currentEstimate.duration}
                </span>
              </div>
            </div>

            {/* Budgets aggregate value and submission */}
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                <span className="font-tech text-[9px] uppercase text-white/60 tracking-wider block mb-1">
                  Estimated Project Valuation
                </span>
                <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#00c9a7]">
                  ₹{currentEstimate.price.toLocaleString('en-IN')}
                </span>
                <span className="font-display text-[9px] text-white/50 block mt-1">
                  Value-based deployment model • Inclusive of code handoff
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleCopyEstimate}
                  className="py-3 px-4 rounded-xl font-display text-[10px] font-black uppercase tracking-wider text-center border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {copiedEstimate ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-[#00c9a7]" />
                      <span>Copied spec!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Spec</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleApplyEstimateToContact}
                  className="py-3 px-4 rounded-xl font-display text-[10px] font-black uppercase tracking-wider text-center bg-[#00c9a7] hover:bg-[#16dab8] text-black transition-all font-extrabold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <span>Build This Plan</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={() => {
                  const moduleList = currentEstimate.modules.join(', ');
                  const priceStr = `₹${currentEstimate.price.toLocaleString('en-IN')}`;
                  const pageUrl = `${window.location.origin}/packages`;
                  const referenceId = `#QBS-PKG-CUSTOM-${currentEstimate.modules.length}NODES`;

                  const textMessage = `Hello Q BENCH Team,\n\nI just built a customized plan on your services comparison grid and would like to proceed with WhatsApp chat! Here are the specifications:\n\n*Service Name*: Custom Configuration\n*Package Name*: Custom Dynamic Plan\n*Project Name*: Custom Estimate (${currentEstimate.modules.length} capabilities selected: ${moduleList})\n*Reference ID*: ${referenceId}\n*Page URL*: ${pageUrl}\n*Price Quote*: ${priceStr}\n\nPlease contact me to initiate the modular setup. Thank you!`;

                  const encoded = encodeURIComponent(textMessage);
                  window.open(`https://wa.me/917356525932?text=${encoded}`, '_blank');
                }}
                className="w-full py-3 rounded-xl font-display text-[10px] font-black uppercase tracking-widest text-[#002f29] bg-[#25D366] hover:bg-[#20ba5a] text-white text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm mt-1"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Chat Spec on WhatsApp</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* WHY CHOOSE US GRID SECTION */}
      <section id="why-choose-us-section" className="bg-white border border-brand-outline/35 rounded-3xl p-6 sm:p-10 mb-8 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="font-tech text-xs tracking-widest text-[#00685b] font-bold bg-[#00685b]/10 px-3.5 py-1 rounded-full inline-block">
            STRICT COOPERATIVE ADVANTAGES
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
            Why Choose Us?
          </h2>
          <p className="font-display text-xs text-brand-text-muted">
            We operate under clear standards that ensure absolute engineering control and transparent client relations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Customer-Centric Approach",
              desc: "By aligning strictly with your functional guidelines and intent, we execute tailor-made strategy roadmaps that drive real-world metrics.",
              icon: <Users className="h-5 w-5 text-emerald-500" />
            },
            {
              title: "Creative & Strategic Thinking",
              desc: "We merge premium visual storytelling with robust full-stack TypeScript architectures to present highly distinct tech-forward assets.",
              icon: <Compass className="h-5 w-5 text-sky-500" />
            },
            {
              title: "Fast Turnaround Time",
              desc: "Rigorous 14-day execution sprint cycles. Avoid slow wait times and preview active staging endpoints instantly at every milestone.",
              icon: <Timer className="h-5 w-5 text-amber-500" />
            },
            {
              title: "Dedicated Support Team",
              desc: "Distributed group of specialists, design guides, and engineers available online for transparent collaboration and updates.",
              icon: <Award className="h-5 w-5 text-purple-500" />
            },
            {
              title: "Transparent Pricing",
              desc: "We pledge absolute honesty. Zero hidden retainer costs, no custom setup surcharges, and comprehensive project IP transfer on handoff.",
              icon: <DollarSign className="h-5 w-5 text-green-500" />
            },
            {
              title: "Results-Driven Execution",
              desc: "Our structural code rendering and content setups focus strictly on high-yield optimization performance score goals.",
              icon: <Zap className="h-5 w-5 text-rose-500" />
            }
          ].map((item, index) => (
            <div 
              key={index} 
              className="bg-brand-surface-low border border-brand-outline/20 rounded-2xl p-6 space-y-4 hover:border-[#00685b]/45 hover:shadow-sm transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <span className="p-2.5 bg-white border border-brand-outline/15 rounded-xl block shadow-inner">
                  {item.icon}
                </span>
                <h4 className="font-display text-sm font-black text-brand-text">{item.title}</h4>
              </div>
              <p className="font-display text-xs text-brand-text-muted leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
