import React, { useState, useEffect, useMemo } from 'react';
import { ServiceTab, NavSection } from '../types';
import { useProjects } from '../hooks/useProjects';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  MessageSquare, 
  Video, 
  Target, 
  Code, 
  Sparkles, 
  Palette,
  ArrowRight, 
  PhoneCall, 
  CheckCircle2, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { DEFAULT_SERVICES_DATA, type CmsServiceItem } from '../services/siteContentService';
import CategoryVisualRenderer from './serviceVisuals/CategoryVisualRenderer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 140,
      damping: 18,
    }
  }
};

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 18,
    }
  }
};

interface ServicesViewProps {
  initialTab?: ServiceTab;
  onNavigate?: (section: NavSection, tab?: ServiceTab) => void;
}

export default function ServicesView({ initialTab, onNavigate }: ServicesViewProps) {
  const { services: cmsServices } = useProjects('public');
  const [activeTab, setActiveTab] = useState<ServiceTab>(initialTab || 'branding');
  const [expandedCategory, setExpandedCategory] = useState<ServiceTab | null>(initialTab || 'branding');
  const [hoveredCategory, setHoveredCategory] = useState<ServiceTab | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setExpandedCategory(initialTab);
    }
  }, [initialTab]);

  const resolveIcon = (iconName: string): LucideIcon => {
    switch (iconName) {
      case 'Layers': return Layers;
      case 'MessageSquare': return MessageSquare;
      case 'Video': return Video;
      case 'Target': return Target;
      case 'Code': return Code;
      case 'Sparkles': return Sparkles;
      case 'Palette': return Palette;
      default: return Layers;
    }
  };

  const servicesList: CmsServiceItem[] = useMemo(() => {
    if (cmsServices && cmsServices.length > 0) {
      return cmsServices.map((s) => ({
        id: s.id,
        title: s.title,
        label: s.label || s.title,
        emoji: s.emoji || '✨',
        iconName: s.iconName,
        deliverables: s.deliverables || [],
        imageUrl: s.imageUrl,
        videoUrl: s.videoUrl,
      }));
    }
    return DEFAULT_SERVICES_DATA;
  }, [cmsServices]);

  const activeCategory = useMemo(() => {
    return servicesList.find((s) => s.id === activeTab) || servicesList[0];
  }, [servicesList, activeTab]);

  const handleCategoryToggle = (tabId: ServiceTab) => {
    setActiveTab(tabId);
    setExpandedCategory((prev) => (prev === tabId ? null : tabId));
  };

  const handleSelectDeepDive = (tabId: ServiceTab) => {
    setActiveTab(tabId);
    setExpandedCategory(tabId);
    const elem = document.getElementById('services-detail-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInquireService = (serviceName: string, categoryTitle: string) => {
    try {
      const packagePayload = {
        serviceId: 'qbench-' + activeTab,
        serviceName: serviceName,
        tier: 'Standard Service',
        tierName: serviceName,
        duration: 'Standard Turnaround',
        packageCategory: categoryTitle,
        addonsOrOptions: [],
        features: [serviceName],
      };
      localStorage.setItem('qbench_selected_package', JSON.stringify(packagePayload));
      localStorage.removeItem('qbench_prefilled_budget');
      localStorage.setItem(
        'qbench_prefilled_message',
        `Hello QBENCH, I would like to inquire about the "${serviceName}" service (${categoryTitle}). Please share scope details and turnaround timeline.`
      );
    } catch (e) {
      console.error('Error saving inquiry payload', e);
    }

    if (onNavigate) {
      onNavigate('contact');
    } else {
      const contactElem = document.getElementById('ready-to-grow-section');
      if (contactElem) {
        contactElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleWhatsAppService = (serviceName: string, categoryTitle: string) => {
    const textMessage = `Hello QBENCH Team,\n\nI am interested in inquiring about the following service:\n• *Service*: ${serviceName}\n• *Category*: ${categoryTitle}\n\nPlease share scope details and availability. Thank you!`;
    const encoded = encodeURIComponent(textMessage);
    window.open(`https://wa.me/917356525932?text=${encoded}`, '_blank');
  };

  const ActiveIcon = activeCategory ? resolveIcon(activeCategory.iconName) : Layers;

  return (
    <div id="services-view-root" className="w-full">
      {/* 1. SERVICES HERO */}
      <section id="services-hero" className="mx-auto max-w-7xl px-6 pt-12 pb-12 lg:px-12 lg:pt-16 lg:pb-16 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span
            id="services-hero-badge"
            className="font-tech text-xs tracking-widest text-[#00685b] font-extrabold uppercase inline-flex items-center gap-2 bg-[#00685b]/10 px-3.5 py-1 rounded-full"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#00685b] animate-pulse" />
            Our Services
          </span>

          <h1
            id="services-hero-title"
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-brand-text tracking-tight"
          >
            Services &amp; Capabilities
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                const elem = document.getElementById('services-offerings');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-xl bg-[#00685b] text-white px-6 py-3 font-display text-xs font-bold uppercase tracking-wider hover:bg-[#178373] transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore All 7 Categories</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('contact');
              }}
              className="rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 px-5 py-3 font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhoneCall className="h-3.5 w-3.5 text-[#00685b]" />
              <span>Contact Us</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. OUR SERVICE OFFERINGS – INTERACTIVE EXPANDABLE CARDS WITH UNIQUE MOTION VISUALS */}
      <section id="services-offerings" className="bg-white border-y border-brand-outline/20 py-16 px-6 lg:px-12 scroll-mt-16">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-extrabold uppercase bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
              WHAT WE DO
            </span>
            <h2 id="services-offerings-title" className="font-display text-3xl sm:text-4xl font-black text-brand-text tracking-tight">
              Our Service Offerings
            </h2>
          </div>

          {/* 7 Categories Grid with Expandable Service Names */}
          <motion.div
            id="services-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {servicesList.map((category, idx) => {
              const IconComp = resolveIcon(category.iconName);
              const isSelected = activeTab === category.id;
              const isExpanded = expandedCategory === category.id;
              const serviceCount = category.deliverables?.length || 0;
              const isHovered = hoveredCategory === category.id;

              return (
                <motion.div
                  id={`srv-card-${category.id}`}
                  key={category.id}
                  layout
                  variants={itemVariants}
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`group rounded-2xl bg-white border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'border-[#00685b] ring-2 ring-[#00685b]/20'
                      : 'border-brand-outline/20 hover:border-[#00685b]/50'
                  }`}
                >
                  {/* Category Visual Container (16:9 Standard Dimensions) */}
                  <div
                    onClick={() => handleCategoryToggle(category.id)}
                    className="cursor-pointer"
                  >
                    <CategoryVisualRenderer
                      categoryId={category.id}
                      imageUrl={category.imageUrl}
                      videoUrl={category.videoUrl}
                      isHovered={isHovered}
                    />
                  </div>

                  {/* Card Content Area */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Category Title & Badge Header */}
                    <div
                      onClick={() => handleCategoryToggle(category.id)}
                      className="cursor-pointer flex items-center justify-between gap-3 border-b border-brand-outline/10 pb-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-[#00685b]/10 text-[#00685b] shrink-0">
                          <IconComp className="h-4 w-4" />
                        </span>
                        <div>
                          <span className="font-mono text-[10px] text-slate-400 font-bold block">
                            0{idx + 1}
                          </span>
                          <h3 className="font-display text-base font-bold text-brand-text leading-tight group-hover:text-[#00685b] transition-colors">
                            {category.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {serviceCount} Services
                        </span>
                        <span
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isExpanded
                              ? 'bg-[#00685b] text-white border-[#00685b]'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Services List (Only actual service names) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden space-y-2"
                        >
                          <motion.div
                            variants={listContainerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-1.5 pt-1"
                          >
                            {(category.deliverables || []).map((serviceName, sIdx) => (
                              <motion.div
                                key={sIdx}
                                variants={listItemVariants}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-[#00685b]/5 border border-slate-200/60 hover:border-[#00685b]/30 transition-all text-xs group/item"
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <span className="font-mono text-[10px] text-[#00685b] font-bold shrink-0">
                                    {sIdx + 1 < 10 ? `0${sIdx + 1}` : sIdx + 1}
                                  </span>
                                  <span className="font-display font-bold text-brand-text truncate">
                                    {serviceName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInquireService(serviceName, category.title);
                                    }}
                                    title={`Inquire about ${serviceName}`}
                                    className="px-2 py-1 rounded-md bg-[#00685b] hover:bg-[#178373] text-white text-[10px] font-display font-bold transition-colors cursor-pointer"
                                  >
                                    Inquire
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleWhatsAppService(serviceName, category.title);
                                    }}
                                    title="Inquire on WhatsApp"
                                    className="p-1 rounded-md bg-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-800 transition-colors cursor-pointer"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Card Footer Action */}
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleCategoryToggle(category.id)}
                        className="font-display text-xs font-bold text-[#00685b] hover:text-[#178373] flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Collapse Services' : 'Expand Services'}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectDeepDive(category.id)}
                        className="font-mono text-[10px] text-slate-500 hover:text-[#00685b] flex items-center gap-0.5 cursor-pointer uppercase"
                      >
                        <span>Deep Dive</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 3. INTERACTIVE CATEGORY DEEP-DIVE WORKSPACE */}
      <section
        id="services-detail-section"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-12 scroll-mt-20"
      >
        <div className="space-y-4 text-center max-w-2xl mx-auto mb-12">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-extrabold uppercase bg-[#00685b]/10 px-3 py-1 rounded-full inline-block">
            CAPABILITIES SHOWCASE
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-brand-text tracking-tight">
            Interactive Category Explorer
          </h2>
        </div>

        <div id="services-hub" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Category Navigation Sidebar */}
          <div
            id="services-sidebar"
            className="lg:col-span-4 flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-r border-brand-outline/20 gap-2 lg:sticky lg:top-24 z-10"
          >
            <div className="hidden lg:block pb-2 mb-1">
              <span className="font-tech text-[10px] tracking-widest text-slate-400 font-extrabold uppercase">
                CATEGORIES ({servicesList.length})
              </span>
            </div>

            {servicesList.map((category) => {
              const isActive = activeTab === category.id;
              const IconComp = resolveIcon(category.iconName);
              const serviceCount = category.deliverables?.length || 0;

              return (
                <button
                  id={`service-tab-btn-${category.id}`}
                  key={category.id}
                  onClick={() => {
                    setActiveTab(category.id);
                    setExpandedCategory(category.id);
                  }}
                  className={`relative py-3 px-4 text-left text-xs font-bold font-display rounded-xl transition-all duration-200 flex items-center justify-between shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#00685b] text-white shadow-sm'
                      : 'text-brand-text-muted hover:text-brand-text hover:bg-slate-100/80 bg-white border border-brand-outline/10 lg:border-none'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#00685b]'}`} />
                    <span>{category.title}</span>
                  </div>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {serviceCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Area: Displays Motion Visual + Corresponding Service Names Only */}
          <div id="services-main-body" className="lg:col-span-8 min-h-[440px]">
            <AnimatePresence mode="wait">
              {activeCategory && (
                <motion.div
                  key={activeCategory.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-outline/20 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 rounded-xl bg-[#00685b] text-white shrink-0">
                        <ActiveIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
                          {activeCategory.title}
                        </h2>
                        <span className="font-mono text-xs text-brand-text-muted">
                          {activeCategory.deliverables?.length || 0} Services in this Category
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleInquireService(activeCategory.title, activeCategory.title)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00685b] hover:bg-[#178373] text-white font-display text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
                    >
                      <span>Inquire Category</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* 16:9 Animated Motion Graphics Visual Showcase */}
                  <div className="w-full">
                    <CategoryVisualRenderer
                      categoryId={activeCategory.id}
                      imageUrl={activeCategory.imageUrl}
                      videoUrl={activeCategory.videoUrl}
                    />
                  </div>

                  {/* Staggered Service Names Only List */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                        SERVICE DELIVERABLES
                      </span>
                      <span className="font-mono text-[10px] text-[#00685b] font-bold">
                        {activeCategory.deliverables?.length || 0} STANDARD OFFERINGS
                      </span>
                    </div>

                    <motion.div
                      variants={listContainerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      {(activeCategory.deliverables || []).map((serviceName, idx) => (
                        <motion.div
                          id={`deep-dive-service-${activeCategory.id}-${idx}`}
                          key={idx}
                          variants={listItemVariants}
                          className="bg-white border border-brand-outline/15 hover:border-[#00685b]/40 rounded-xl p-4 transition-all duration-200 hover:shadow-sm flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-xs font-bold text-[#00685b] bg-[#00685b]/10 rounded-lg h-7 w-7 flex items-center justify-center shrink-0">
                              {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                            </span>
                            <span className="font-display text-sm font-bold text-brand-text truncate">
                              {serviceName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleInquireService(serviceName, activeCategory.title)}
                              title={`Inquire about ${serviceName}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#00685b] hover:text-white text-slate-700 text-xs font-bold font-display transition-colors cursor-pointer"
                            >
                              <span>Inquire</span>
                              <Send className="h-3 w-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleWhatsAppService(serviceName, activeCategory.title)}
                              title={`WhatsApp inquiry for ${serviceName}`}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* 4. READY TO GROW CALL TO ACTION */}
      <section id="ready-to-grow-section" className="mx-auto max-w-7xl px-6 pb-20 lg:px-12">
        <div
          id="ready-to-grow-card"
          className="bg-[#05211c] border border-brand-outline/20 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden select-none"
        >
          <div className="absolute top-[-50px] right-[-50px] w-80 h-80 rounded-full bg-[#00685b]/20 blur-[80px]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 md:gap-12">
            <div className="flex items-start md:items-center gap-6 max-w-2xl">
              <div
                id="cta-target-container"
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0"
              >
                <CheckCircle2 className="h-8 w-8 text-[#88f8c5]" />
              </div>

              <div className="space-y-2">
                <span className="font-tech text-xs tracking-widest text-[#88f8c5] font-bold uppercase block">
                  QBENCH CREATIVE AGENCY
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black leading-snug tracking-tight">
                  Start a project across any of our 7 service categories.
                </h3>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                id="cta-ready-consult"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('contact');
                  }
                }}
                className="rounded-xl bg-[#00685b] text-white px-6 py-3 font-display text-xs font-bold uppercase tracking-wider hover:bg-[#178373] transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Contact Us</span>
              </button>

              <button
                id="cta-ready-whatsapp"
                onClick={() => {
                  const textMessage = `Hello QBENCH Team,\n\nI would like to inquire about your services.`;
                  const encoded = encodeURIComponent(textMessage);
                  window.open(`https://wa.me/917356525932?text=${encoded}`, '_blank');
                }}
                className="rounded-xl bg-[#25D366] text-white hover:bg-[#20ba5a] px-6 py-3 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 text-center shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
