import { useState, useEffect } from 'react';
import { ServiceTab, NavSection } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  MessageSquare, 
  Video, 
  Target, 
  Code, 
  Sparkles, 
  TrendingUp, 
  Briefcase, 
  ArrowRight, 
  PhoneCall, 
  Check, 
  ChevronRight,
  Laptop,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

import BrandingService from './BrandingService';
import SocialMediaService from './SocialMediaService';
import VideoService from './VideoService';
import DigitalMarketingService from './DigitalMarketingService';
import UiUxService from './UiUxService';
import WebDevService from './WebDevService';
import MotionService from './MotionService';
import GrowthService from './GrowthService';
import BusinessSupportService from './BusinessSupportService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      mass: 0.8
    }
  }
};

interface ServicesViewProps {
  initialTab?: ServiceTab;
  onNavigate?: (section: NavSection, tab?: ServiceTab) => void;
}

export default function ServicesView({ initialTab, onNavigate }: ServicesViewProps) {
  const [activeTab, setActiveTab] = useState<ServiceTab>(initialTab || 'branding');
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>('prop');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSelect = (tabId: ServiceTab) => {
    setActiveTab(tabId);
    // Smooth scroll down to the deep dive section
    const elem = document.getElementById('deep-dive-explorer');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const servicesList: { 
    id: ServiceTab; 
    icon: any; 
    title: string; 
    desc: string; 
  }[] = [
    {
      id: 'branding',
      icon: Layers,
      title: 'Branding & Identity',
      desc: 'Logos, brand identity systems, visual guidelines, and brand assets that create a lasting impression.'
    },
    {
      id: 'social-media',
      icon: MessageSquare,
      title: 'Social Media Design',
      desc: 'Creative social media designs that strengthen your brand across every platform.'
    },
    {
      id: 'video-editing',
      icon: Video,
      title: 'Video Editing',
      desc: 'Professional editing for promotional videos, product showcases, reels, and brand stories.'
    },
    {
      id: 'digital-marketing',
      icon: Target,
      title: 'Digital Marketing',
      desc: 'Creative campaigns and digital solutions that help brands build a stronger online presence.'
    },
    {
      id: 'uiux',
      icon: Layers,
      title: 'UI/UX Design',
      desc: 'User-centered interfaces designed for intuitive, engaging, and seamless digital experiences.'
    },
    {
      id: 'webdev',
      icon: Code,
      title: 'Website Development',
      desc: 'Modern, responsive websites designed for performance, usability, and great user experiences.'
    },
    {
      id: 'motion',
      icon: Sparkles,
      title: 'Motion Graphics',
      desc: 'Eye-catching animations and motion visuals that bring ideas to life.'
    },
    {
      id: 'growth',
      icon: TrendingUp,
      title: 'Creative Strategy',
      desc: 'Creative direction and digital solutions that help brands communicate with clarity and confidence.'
    },
    {
      id: 'business-support',
      icon: Briefcase,
      title: 'Creative Support',
      desc: 'Ongoing design support for presentations, marketing materials, print media, and creative content.'
    }
  ];

  const explorerTabs: { id: ServiceTab; label: string }[] = [
    { id: 'branding', label: 'Branding & Identity' },
    { id: 'social-media', label: 'Social Media Design' },
    { id: 'video-editing', label: 'Video Editing' },
    { id: 'digital-marketing', label: 'Digital Marketing' },
    { id: 'uiux', label: 'UI/UX Design' },
    { id: 'webdev', label: 'Website Development' },
    { id: 'motion', label: 'Motion Graphics' },
    { id: 'growth', label: 'Creative Strategy' },
    { id: 'business-support', label: 'Creative Support' }
  ];

  const whyChooseItems = [
    {
      title: 'Built to Scale',
      desc: 'Future-ready digital solutions that grow alongside your business.'
    },
    {
      title: 'User-Centered by Design',
      desc: 'Intuitive experiences that increase engagement and improve conversions.'
    },
    {
      title: 'Performance-Driven',
      desc: 'Fast, secure, and optimized platforms designed to generate leads and support long-term growth.'
    }
  ];

  const handleToggleAccordion = (key: string) => {
    setExpandedAccordion(expandedAccordion === key ? null : key);
  };

  const handleCtaClick = () => {
    if (onNavigate) {
      onNavigate('contact');
    } else {
      const contactSection = document.getElementById('ready-to-grow-section');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleBuildSomethingGreatClick = () => {
    if (onNavigate) {
      onNavigate('packages');
    }
  };

  return (
    <div id="services-view-root" className="w-full">
      
      {/* 1. HERO SECTION */}
      <section id="services-hero" className="mx-auto max-w-7xl px-6 pt-12 pb-20 lg:px-12 lg:pt-20 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Details */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <span id="services-hero-badge" className="font-tech text-xs tracking-widest text-[#00685b] font-extrabold uppercase flex items-center gap-2 bg-[#00685b]/10 w-fit px-3 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00685b] animate-pulse" /> Our Services
            </span>
            
            <h1 id="services-hero-title" className="font-display text-4xl sm:text-5xl lg:text-[44px] xl:text-[50px] font-black text-brand-text leading-[1.12] tracking-tight">
              Creative Solutions That Build<br />
              Brands, Generate Leads<br />
              <span className="text-[#00685b]">& Drive Growth.</span>
            </h1>
            
            <p id="services-hero-desc" className="font-sans text-sm sm:text-base text-brand-text-muted leading-relaxed max-w-xl">
              We deliver end-to-end creative, branding, web, and digital marketing solutions that help businesses stand out, connect with the right audience, and achieve measurable growth. From strategy to execution, every solution is designed to elevate your brand and drive lasting results.
            </p>
            
            <div id="services-hero-action">
              <button
                id="services-hero-cta"
                onClick={handleBuildSomethingGreatClick}
                className="rounded-xl bg-[#00685b] text-white px-7 py-3.5 font-display text-sm font-bold hover:bg-[#178373] transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Let's Build Something Great</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
          
          {/* Right Visual Graphic - Custom Laptop Display with iPhone mockup */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end py-6 select-none">
            {/* Custom Interactive Mockup Laptop */}
            <div id="services-laptop" className="relative w-full max-w-[480px] sm:max-w-[520px] aspect-[16/10] bg-zinc-800 rounded-3xl p-3 shadow-2xl border border-zinc-700/60 transform hover:scale-[1.01] transition-transform duration-300">
              
              {/* Laptop Screen Area */}
              <div className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between p-4 sm:p-5 text-white">
                
                {/* Visual Ambient radial glow */}
                <div className="absolute top-[10%] right-[10%] w-48 h-48 bg-[#00685b]/30 rounded-full blur-[40px] pointer-events-none" />
                
                {/* Top header status */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-tech text-white/40 ml-2 font-bold tracking-wider uppercase">Business Growth Strategy</span>
                  </div>
                  <span className="text-[8px] font-tech bg-white/10 px-2.5 py-0.5 rounded text-white/80 font-bold uppercase tracking-wider">active</span>
                </div>
                
                {/* Laptop inner core content */}
                <div className="space-y-4 my-auto">
                  <h3 className="font-display text-lg sm:text-2xl font-black text-white/95 leading-snug tracking-tight max-w-[280px]">
                    Grow Your Business With the Right Strategy
                  </h3>
                  
                  {/* Strategy Row layout cards */}
                  <div className="grid grid-cols-3 gap-2 py-1">
                    <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col items-center text-center space-y-1">
                      <TrendingUp className="h-4 w-4 text-[#88f8c5]" />
                      <span className="text-[9px] font-tech text-white/75 font-semibold">Visibility</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col items-center text-center space-y-1">
                      <Target className="h-4 w-4 text-emerald-400" />
                      <span className="text-[9px] font-tech text-white/75 font-semibold">Leads</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col items-center text-center space-y-1">
                      <Briefcase className="h-4 w-4 text-[#88f8c5]" />
                      <span className="text-[9px] font-tech text-white/75 font-semibold">Growth</span>
                    </div>
                  </div>
                </div>
                
                {/* Visual Chart line path */}
                <div className="h-10 relative flex items-end">
                  <svg className="w-full h-full stroke-[1.5] stroke-emerald-500 fill-none" viewBox="0 0 100 20">
                    <path 
                      d="M0,18 C15,14 30,5 50,11 C70,17 80,4 100,2" 
                      className="stroke-[#45b88a]"
                    />
                    <path 
                      d="M0,18 C15,14 30,5 50,11 C70,17 80,4 100,2 L100,20 L0,20 Z" 
                      fill="url(#strategy-grad)" 
                      className="opacity-10"
                    />
                    <defs>
                      <linearGradient id="strategy-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#45b88a" />
                        <stop offset="100%" stopColor="#45b88a" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
              </div>
              
              {/* Hardware elements */}
              <div className="absolute -bottom-2 -left-6 -right-6 h-3 bg-zinc-700/95 rounded-b-xl border-t border-zinc-600 shadow-xl" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 bg-zinc-950 rounded-b-md" />
            </div>
            
            {/* Overlay mobile mock on right side */}
            <div id="services-phone" className="absolute bottom-[-16px] right-2 md:right-8 w-[140px] sm:w-[150px] aspect-[9/18] bg-zinc-900 rounded-[28px] p-2 shadow-2xl border-2 border-zinc-700/80 transform hover:translate-y-[-5px] transition-transform duration-300 hidden sm:block">
              <div className="relative w-full h-full bg-[#002f29] rounded-[22px] overflow-hidden p-3.5 text-white flex flex-col justify-between">
                
                {/* Speaker pill notch */}
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-zinc-950 rounded-full" />
                
                <div className="pt-2 text-center">
                  <h4 className="font-display font-black text-xs tracking-wider">
                    <span className="text-[#aacd61]">Q</span> BENCH
                  </h4>
                  <span className="text-[6px] font-sans text-white/45 tracking-widest block uppercase leading-none">Unlimited Resources</span>
                </div>
                
                <div className="space-y-2.5 my-auto">
                  <div className="bg-white/10 rounded-lg p-2 border border-white/5 space-y-1">
                    <div className="h-1 w-6 bg-[#45b88a] rounded" />
                    <h6 className="text-[8px] font-display font-bold text-white/90">Marketing Channels</h6>
                    <span className="text-[10px] font-mono text-emerald-400 font-extrabold leading-none">+180% Leads</span>
                  </div>

                  <ul className="text-[7.5px] space-y-1.5 text-white/80 font-display font-semibold pl-1">
                    <li className="flex items-center gap-1">
                      <Check className="h-2 w-2 text-emerald-400 shrink-0" />
                      <span>Increase Visibility</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <Check className="h-2 w-2 text-emerald-400 shrink-0" />
                      <span>Generate Leads</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <Check className="h-2 w-2 text-emerald-400 shrink-0" />
                      <span>Drive Growth</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-[#45b88a] rounded-lg p-1 text-center select-none cursor-pointer">
                  <span className="text-[7px] font-display font-bold text-slate-900 uppercase">Consult Now</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 2. WHAT WE DO (OUR SERVICE OFFERINGS) GRID */}
      <section id="services-offerings" className="bg-white border-y border-brand-outline/20 py-20 px-6 lg:px-12">
        <div className="mx-auto max-w-7xl">
          
          <div className="space-y-3.5 text-center max-w-3xl mx-auto mb-16">
            <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-extrabold uppercase bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
              WHAT WE DO
            </span>
            <h2 id="services-offerings-title" className="font-display text-4xl sm:text-5xl font-black text-brand-text tracking-tight">
              Our Service Offerings
            </h2>
            <p className="font-sans text-sm sm:text-base text-brand-text-muted leading-relaxed">
              We combine creativity, technology and strategy to deliver solutions that help your business grow in the digital world.
            </p>
          </div>
          
          {/* Service Boxes 3x3 Grid mirroring the exact template columns */}
          <motion.div 
            id="services-grid" 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {servicesList.map((srv) => {
              const IconComp = srv.icon;
              return (
                <motion.div
                  id={`srv-card-${srv.id}`}
                  key={srv.id}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                  onClick={() => handleTabSelect(srv.id)}
                  className="group bg-[#faf9f9]/50 border border-brand-outline/15 rounded-2xl p-6 transition-all duration-300 hover:bg-white hover:border-[#00685b]/35 hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <span className="p-2.5 bg-[#00685b]/5 text-[#00685b] rounded-xl flex items-center justify-center w-fit transition-colors group-hover:bg-[#00685b] group-hover:text-white shrink-0">
                      <IconComp className="h-5 w-5" />
                    </span>
                    <h4 className="font-display text-base font-bold text-brand-text tracking-tight">{srv.title}</h4>
                    <p className="font-sans text-xs text-brand-text-muted leading-relaxed">{srv.desc}</p>
                  </div>
                  
                  <div className="flex items-center text-[#00685b] text-[10px] font-tech font-bold uppercase tracking-wider pt-6 transition-all duration-300">
                    <span>Learn More</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          
        </div>
      </section>

      {/* 3. DEEP DIVE INTERACTIVE EXPLORER WORKSPACE */}
      <section id="deep-dive-explorer" className="mx-auto max-w-7xl px-6 py-20 lg:px-12 scroll-mt-24">
        
        {/* Workspace banner heading */}
        <div className="space-y-3.5 text-center max-w-2xl mx-auto mb-12">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-extrabold uppercase bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
            CAPABILITIES
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-brand-text tracking-tight">
            Interactive Service Deep-Dive
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-text-muted">
            Explore active workflows, deliverables checklists, raw project files, and simulations for each core capability.
          </p>
        </div>
        
        {/* Interactive Workspace Hub structure */}
        <div id="services-hub" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Menu Sidebar */}
          <div id="services-sidebar" className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-r border-brand-outline/20 gap-2 lg:gap-3 lg:sticky lg:top-24 z-20">
            {explorerTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  id={`service-tab-btn-${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-3 px-4.5 text-left text-xs font-bold tracking-wide font-display rounded-xl transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-low/80'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-[#00685b]"
                      style={{ borderRadius: '12px' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 block transition-transform duration-200 ${isActive ? 'lg:translate-x-1' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Workspace interactive section */}
          <div id="services-main-body" className="lg:col-span-9 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full"
              >
                {activeTab === 'branding' && <BrandingService />}
                {activeTab === 'social-media' && <SocialMediaService />}
                {activeTab === 'video-editing' && <VideoService />}
                {activeTab === 'digital-marketing' && <DigitalMarketingService />}
                {activeTab === 'uiux' && (
                  <UiUxService 
                    expandedAccordion={expandedAccordion} 
                    handleToggleAccordion={handleToggleAccordion} 
                  />
                )}
                {activeTab === 'webdev' && <WebDevService />}
                {activeTab === 'motion' && <MotionService />}
                {activeTab === 'growth' && <GrowthService />}
                {activeTab === 'business-support' && <BusinessSupportService />}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* 4. READY TO GROW? CALL TO ACTION (WITH TARGET GRAPHIC) */}
      <section id="ready-to-grow-section" className="mx-auto max-w-7xl px-6 pb-20 lg:px-12">
        <div id="ready-to-grow-card" className="bg-[#05211c] border border-brand-outline/20 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden select-none">
          
          {/* Glow circle background */}
          <div className="absolute top-[-50px] right-[-50px] w-80 h-80 rounded-full bg-[#00685b]/20 blur-[80px]" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 md:gap-12">
            
            {/* Left informational segment with SVG Targets */}
            <div className="flex items-start md:items-center gap-6 max-w-2xl">
              
              {/* Circular Targets graphic */}
              <div id="cta-target-container" className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <svg className="h-10 w-10 sm:h-12 sm:w-12 text-white/40 fill-none stroke-[1.5]" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" className="opacity-30" />
                  <circle cx="12" cy="12" r="7" stroke="currentColor" className="opacity-60" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" />
                  <line x1="12" y1="1" x2="12" y2="23" stroke="#45b88a" strokeDasharray="3 3" />
                  <line x1="1" y1="12" x2="23" y2="12" stroke="#45b88a" strokeDasharray="3 3" />
                  <circle cx="12" cy="12" r="1" fill="#45b88a" className="animate-ping" />
                </svg>
              </div>
              
              <div className="space-y-2">
                <span className="font-tech text-xs tracking-widest text-[#88f8c5] font-bold uppercase block">
                  Let's Build Something Great Together.
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black leading-snug tracking-tight">
                  Transform your ideas into impactful digital experiences with QBench.
                </h3>
              </div>
            </div>
            
            {/* Right side CTA actions column */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 shrink-0 justify-start">
              <button
                id="cta-ready-start"
                onClick={handleBuildSomethingGreatClick}
                className="rounded-xl bg-[#00685b] text-white px-6 py-3.5 font-display text-xs font-bold uppercase tracking-wider hover:bg-[#178373] transition-all cursor-pointer flex items-center justify-center gap-2 group shadow-sm text-center"
              >
                <span>Let's Build Something Great</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              
              <button
                id="cta-ready-consult"
                onClick={handleCtaClick}
                className="rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-white/95 px-6 py-3.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
              >
                <PhoneCall className="h-4 w-4 text-[#88f8c5]" />
                <span>Book a Free Consultation</span>
              </button>

              <button
                id="cta-ready-whatsapp"
                onClick={() => {
                  const activeTabInfo = explorerTabs.find(tab => tab.id === activeTab);
                  const serviceName = activeTabInfo ? activeTabInfo.label : 'General Inquiry';
                  const pageUrl = `${window.location.origin}/services?tab=${activeTab}`;
                  const referenceId = `#QBS-SRV-${activeTab.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
                  
                  const textMessage = `Hello Q BENCH Team,\n\nI am interested in discussing your services! Here are the details:\n\n*Service Name*: ${serviceName}\n*Package Name*: N/A\n*Project Name*: N/A\n*Reference ID*: ${referenceId}\n*Page URL*: ${pageUrl}\n\nPlease contact me to discuss my requirements and suggest suitable options. Thank you!`;

                  const encoded = encodeURIComponent(textMessage);
                  window.open(`https://wa.me/917356525932?text=${encoded}`, '_blank');
                }}
                className="rounded-xl bg-[#25D366] text-white hover:bg-[#20ba5a] px-6 py-3.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 text-center shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>
            
          </div>
        </div>
      </section>

      {/* 5. DESIGN AS AN ECOSYSTEM & WHY CHOOSE Q BENCH SECTION */}
      <section id="services-why-choose" className="mx-auto max-w-7xl px-6 pb-24 lg:px-12">
        <div className="space-y-16">
          
          {/* Design as an Ecosystem layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-8 border-t border-brand-outline/15">
            <div className="lg:col-span-5 space-y-3">
              <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-extrabold uppercase bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
                SYSTEMS THOUGHTS
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-brand-text tracking-tight">
                Design as an Ecosystem
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-6">
              <p className="font-sans text-sm sm:text-base text-brand-text-muted leading-relaxed">
                Your digital presence should do more than look impressive—it should evolve with your business. At QBench, we design websites and digital experiences as connected ecosystems that adapt, scale, and perform as your company grows.
              </p>
              <p className="font-sans text-sm sm:text-base text-brand-text-muted leading-relaxed">
                From landing pages and business websites to enterprise portals and digital platforms, every solution is strategically crafted to deliver exceptional user experiences, strengthen your brand, and drive measurable business results.
              </p>
            </div>
          </div>

          {/* Why Businesses Choose QBench */}
          <div className="space-y-10 pt-10 border-t border-brand-outline/10">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-extrabold uppercase bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
                FOUNDATION PRINCIPLES
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text tracking-tight">
                Why Businesses Choose QBench
              </h3>
            </div>
            
            <motion.div 
              id="why-choose-cols" 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
            >
              {whyChooseItems.map((item, idx) => (
                <motion.div 
                  id={`why-item-service-${idx}`}
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.22, ease: 'easeOut' } }}
                  className="bg-brand-surface-low border border-brand-outline/15 rounded-2xl p-6 hover:border-[#00685b]/25 transition-all duration-300 shadow-sm flex flex-col justify-start"
                >
                  <span className="h-7 w-7 rounded-lg bg-[#00685b]/5 text-[#00685b] font-display text-xs font-black flex items-center justify-center mb-4 shrink-0">
                    0{idx+1}
                  </span>
                  
                  <h4 className="font-display text-sm font-extrabold text-brand-text mb-2 tracking-tight">
                    {item.title}
                  </h4>
                  
                  <p className="font-sans text-xs text-brand-text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
        </div>
      </section>

    </div>
  );
}
