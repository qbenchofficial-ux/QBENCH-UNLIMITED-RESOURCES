import { useState } from 'react';
import { motion } from 'motion/react';
import { PORTFOLIO_PROJECTS } from '../data';
import { NavSection } from '../types';
import { ArrowUpRight, MessageSquare } from 'lucide-react';

interface PortfolioViewProps {
  onNavigate: (section: NavSection) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(4px)' },
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

export default function PortfolioView({ onNavigate }: PortfolioViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'branding' | 'social_media' | 'video_edition' | 'motion_graphics'>('all');

  const filters: { id: 'all' | 'branding' | 'social_media' | 'video_edition' | 'motion_graphics'; label: string }[] = [
    { id: 'all', label: 'All Works' },
    { id: 'branding', label: 'Branding' },
    { id: 'social_media', label: 'Social Media Design' },
    { id: 'video_edition', label: 'Video Editing' },
    { id: 'motion_graphics', label: 'Motion Graphics' }
  ];

  const filteredProjects = activeFilter === 'all'
    ? PORTFOLIO_PROJECTS
    : PORTFOLIO_PROJECTS.filter(project => project.category === activeFilter);

  return (
    <div id="portfolio-view" className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16 space-y-16">
      
      {/* Title + Filter Chips Bar */}
      <div id="portfolio-headline-segment" className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-2 border-b border-brand-outline/20">
        <div className="space-y-4 max-w-2xl">
          <span className="font-tech text-xs tracking-widest text-brand-primary font-bold uppercase">
            PORTFOLIO
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-text">
            Selected <span className="text-brand-primary">Projects</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
            A collection of branding, web design, motion graphics, and creative work crafted with purpose and attention to detail.
          </p>
        </div>

        {/* Filter chips list */}
        <div id="portfolio-filters" className="flex flex-wrap gap-2 pt-2 lg:pt-0">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                id={`filter-chip-${filter.id}`}
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 font-display text-xs font-bold rounded-lg tracking-wide border transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-brand-primary text-white border-brand-primary shadow-sm scale-102'
                    : 'bg-white border-brand-outline/30 text-brand-text-muted hover:text-brand-text hover:border-brand-outline/65'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid Display */}
      {filteredProjects.length > 0 ? (
        <motion.div 
          id="portfolio-projects-grid" 
          key={activeFilter}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
        >
          {filteredProjects.map((project) => (
            <motion.div 
              id={`portfolio-card-${project.id}`}
              key={project.id}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
              className="group flex flex-col justify-between space-y-4 bg-white border border-brand-outline/25 hover:border-brand-outline rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Image panel with zoom scale on hover */}
                {project.externalUrl ? (
                  <a
                    href={project.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-[16/10] w-full rounded-xl overflow-hidden relative border border-brand-outline/10 bg-brand-surface-low"
                  >
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover grayscale brightness-95 contrast-102 group-hover:grayscale-0 group-hover:scale-103 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </a>
                ) : (
                  <div className="aspect-[16/10] w-full rounded-xl overflow-hidden relative border border-brand-outline/10 bg-brand-surface-low">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover grayscale brightness-95 contrast-102 group-hover:grayscale-0 group-hover:scale-103 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="font-tech text-[10px] tracking-wider text-brand-primary font-bold uppercase bg-brand-accent-light/50 border border-brand-accent/20 px-2.5 py-0.5 rounded-full">
                    {project.categoryLabel}
                  </span>
                  <span className="font-tech text-[10px] text-brand-text-muted font-bold">
                    {project.year}
                  </span>
                </div>

                <div className="space-y-2">
                  {project.externalUrl ? (
                    <a
                      href={project.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-display text-2xl font-black text-brand-text group-hover:text-brand-primary transition-colors duration-200"
                    >
                      {project.title}
                    </a>
                  ) : (
                    <h3 className="font-display text-2xl font-black text-brand-text group-hover:text-brand-primary transition-colors duration-200">
                      {project.title}
                    </h3>
                  )}
                  <p className="font-sans text-xs sm:text-sm text-brand-text-variant leading-relaxed">
                    {project.subtitle}
                  </p>
                </div>
              </div>

              {/* Read study CTA */}
              <div className="pt-4 border-t border-brand-outline/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {project.externalUrl ? (
                  <a
                    id={`read-study-btn-${project.id}`}
                    href={project.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display text-xs font-bold text-brand-primary hover:text-brand-primary-light flex items-center justify-center sm:justify-start gap-1 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-brand-primary/5 transition-colors shrink-0"
                  >
                    <span>View on Behance</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <button
                    id={`read-study-btn-${project.id}`}
                    onClick={() => {
                      // Estimate customized budget ranges
                      let budget = 'Contact for Custom Quote';
                      if (project.id === '1') budget = '₹45,000 — ₹75,000';
                      else if (project.id === '2') budget = '₹15,000 — ₹35,000';
                      else if (project.id === '3') budget = '₹60,000 — ₹1,20,000';
                      else if (project.id === '4') budget = '₹80,000 — ₹1,50,000';
                      else if (project.id === '5') budget = '₹75,000 — ₹1,40,000';

                      // Derive unique portfolio references
                      const referenceNumber = `#QBP-2026-${project.id.padStart(3, '0')}`;
                      const projectUrl = `${window.location.origin}/portfolio/${project.id}`;
                      
                      const blueprintObj = {
                        projectName: project.title,
                        projectCategory: project.categoryLabel,
                        designType: project.subtitle,
                        projectId: project.id,
                        portfolioReference: referenceNumber,
                        estimatedBudget: budget,
                        projectUrl: projectUrl
                      };

                      // Save blueprint to local persistence & clear concurrent bookings
                      localStorage.setItem('qbench_selected_portfolio_blueprint', JSON.stringify(blueprintObj));
                      localStorage.removeItem('qbench_selected_package');
                      localStorage.removeItem('qbench_prefilled_message');
                      localStorage.removeItem('qbench_prefilled_budget');
                      
                      onNavigate('contact');
                    }}
                    className="font-display text-xs font-bold text-brand-primary hover:text-brand-primary-light flex items-center justify-center sm:justify-start gap-1 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-brand-primary/5 transition-colors shrink-0"
                  >
                    <span>View Project</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}

                <a
                  id={`whatsapp-portfolio-btn-${project.id}`}
                  href={`https://wa.me/917356525932?text=${encodeURIComponent(
                    `Hello Q BENCH Team,\n\nI am interested in discussing a project similar to your portfolio project: ${project.title} (${project.categoryLabel}).\n\nReference ID: #QBP-2026-${project.id.padStart(3, '0')}\nPage URL: ${project.externalUrl || `${window.location.origin}/portfolio/${project.id}`}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white hover:bg-[#20ba5a] font-display text-[10px] font-black uppercase tracking-wider py-2 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>Contact Me</span>
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div id="no-projects-view" className="text-center py-20 border border-dashed border-brand-outline/30 rounded-2xl bg-white space-y-4">
          <span className="text-brand-text-muted font-sans text-sm">No specific works fit this dynamic criteria yet.</span>
          <br />
          <button 
            onClick={() => setActiveFilter('all')}
            className="rounded-xl px-4 py-2 font-display text-xs font-semibold bg-brand-primary text-white hover:bg-brand-primary-light cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Philosophy: Design with Purpose */}
      <section id="ecosystem-manifesto" className="bg-brand-surface-low border border-brand-outline/25 rounded-3xl p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h2 id="manifesto-title" className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-text">
              Design with <span className="text-brand-primary">Purpose<span className="text-brand-accent">.</span></span>
            </h2>
            <p id="manifesto-desc" className="font-sans text-sm sm:text-base text-brand-text-variant leading-relaxed">
              Every project begins with an idea and is shaped through thoughtful design, creativity, and attention to detail. My focus is on creating work that is clean, functional, and built to leave a lasting impression.
            </p>
            
            <div className="space-y-4 pt-5 border-t border-brand-outline/15">
              <h3 className="font-tech text-xs tracking-widest text-[#00685b] font-extrabold uppercase">
                DESIGN PRINCIPLES
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
                    <span className="font-display text-xs font-bold text-brand-text">Creative Thinking</span>
                  </div>
                  <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
                    Every design starts with a clear idea and a meaningful purpose.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
                    <span className="font-display text-xs font-bold text-brand-text">Attention to Detail</span>
                  </div>
                  <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
                    Carefully crafted visuals that balance creativity, consistency, and usability.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
                    <span className="font-display text-xs font-bold text-brand-text">Continuous Learning</span>
                  </div>
                  <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
                    Always exploring new tools, techniques, and creative possibilities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative overflow-hidden rounded-2xl border border-brand-outline/25 bg-white shadow-sm group">
            <img
              src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80"
              alt="Minimalist design workspace with keyboard and screen"
              className="w-full aspect-[4/3] object-cover grayscale brightness-95 group-hover:scale-103 group-hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>
    </div>
  );
}
