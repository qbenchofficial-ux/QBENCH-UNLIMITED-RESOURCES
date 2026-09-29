import { PROCESS_STEPS } from '../data';
import { NavSection } from '../types';
import { 
  Compass, Milestone, PenTool, Code, Rocket, Check, ArrowRight 
} from 'lucide-react';
import { useState } from 'react';

interface ProcessViewProps {
  onNavigate: (section: NavSection) => void;
}

export default function ProcessView({ onNavigate }: ProcessViewProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Helper to map icon names to actual Lucide component nodes
  const renderStepIcon = (name: string, className: string) => {
    switch (name) {
      case 'Search':
        return <Compass className={className} />;
      case 'Milestone':
        return <Milestone className={className} />;
      case 'PenTool':
        return <PenTool className={className} />;
      case 'Code':
        return <Code className={className} />;
      case 'Rocket':
        return <Rocket className={className} />;
      default:
        return <Compass className={className} />;
    }
  };

  return (
    <div id="process-view" className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16 space-y-16">
      
      {/* Title Segment */}
      <div id="process-headline-segment" className="space-y-4 max-w-3xl">
        <span className="font-tech text-xs tracking-widest text-brand-primary font-bold uppercase">
          OUR TIMELINE
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-text">
          The <span className="text-brand-primary">Precision Path</span>
        </h1>
        <p className="font-display text-sm sm:text-base text-brand-text-muted leading-relaxed">
          A mathematical approach to digital artistry. We navigate through ambiguity with a structured 5-step framework designed to deliver elite creative solutions.
        </p>
      </div>

      {/* Dynamic Interactive Timeline Steps List */}
      <div id="process-timeline-list" className="space-y-12 relative before:absolute before:inset-0 before:left-4 sm:before:left-1/2 before:w-0.5 before:bg-brand-outline/15 before:pointer-events-none">
        
        {PROCESS_STEPS.map((step, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div 
              id={`process-row-${idx}`}
              key={idx}
              className={`flex flex-col sm:flex-row items-start justify-between relative gap-6 sm:gap-12 outline-none`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Timeline Center Node Badge */}
              <div className="absolute left-4 sm:left-1/2 transform -translate-x-1/2 bg-brand-background border-2 border-brand-primary h-8 w-8 rounded-full flex items-center justify-center z-10 font-tech text-xs font-bold text-brand-primary select-none shadow-sm">
                {step.number}
              </div>

              {/* Left Content Card Side - Only visible on Left/Right matching even/odd */}
              <div 
                id={`process-card-a-${idx}`}
                className={`w-full sm:w-[46%] pl-12 sm:pl-0 space-y-6 bg-white border border-brand-outline/25 hover:border-brand-primary rounded-2xl p-6 shadow-sm transition-all duration-300 ${
                  isEven ? 'sm:order-1' : 'sm:order-2'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="p-2 rounded-lg bg-brand-primary/5 text-brand-primary">
                      {renderStepIcon(step.iconName, 'h-5 w-5')}
                    </span>
                    <h3 className="font-display text-lg font-extrabold text-brand-text">
                      {step.title}
                    </h3>
                  </div>
                  <span className="font-tech text-xs text-brand-text-muted font-semibold uppercase">
                    STAGE {step.number}
                  </span>
                </div>

                <p className="font-display text-xs text-brand-text-variant leading-relaxed">
                  {step.description}
                </p>

                {/* Bullet activities checklist items */}
                <div className="space-y-2 pt-2 border-t border-brand-outline/10">
                  <h4 className="font-display text-[10px] font-bold text-brand-primary uppercase tracking-widest pl-0.5">Execution Actions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.activities.map((act, actIdx) => (
                      <div key={actIdx} className="flex items-center space-x-2">
                        <Check className="h-3 w-3 text-brand-accent flex-shrink-0" />
                        <span className="font-display text-[10px] text-brand-text-muted font-medium">{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Content Custom Illustration Side */}
              <div 
                id={`process-card-b-${idx}`}
                className={`w-full sm:w-[46%] pl-12 sm:pl-0 flex flex-col justify-center relative rounded-2xl overflow-hidden shadow-sm group border border-brand-outline/20 bg-brand-surface-low ${
                  isEven ? 'sm:order-2' : 'sm:order-1'
                }`}
              >
                <div className="aspect-[16/9] overflow-hidden rounded-xl">
                  <img
                    src={step.imageUrl}
                    alt={step.title}
                    className="w-full h-full object-cover grayscale brightness-95 transition-all duration-500 group-hover:scale-102 group-hover:grayscale-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-primary/5 group-hover:bg-transparent transition-all duration-300 pointer-events-none" />
                </div>
              </div>

            </div>
          );
        })}

      </div>

      {/* Metrics Banner */}
      <section id="process-metrics" className="bg-brand-dark rounded-3xl p-8 lg:p-12 text-white border border-white/10 relative overflow-hidden">
        <div className="absolute -left-16 -top-16 w-40 h-40 rounded-full bg-brand-primary/10 blur-[45px] pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-40 h-40 rounded-full bg-brand-accent/10 blur-[45px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center items-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="space-y-2 py-4 md:py-0">
            <h4 id="reliability-metric-val" className="font-tech text-4xl lg:text-5xl font-extrabold text-brand-accent">99.8%</h4>
            <p className="font-display text-xs text-white/60 uppercase tracking-widest font-semibold">Uptime Reliability</p>
            <p className="font-display text-[10px] text-white/40 max-w-xs mx-auto">Hardened nodes hosted across redundant edge proxies with automated rollback systems.</p>
          </div>

          <div className="space-y-2 py-4 md:py-0">
            <h4 id="latency-metric-val" className="font-tech text-4xl lg:text-5xl font-extrabold text-brand-accent">0.02s</h4>
            <p className="font-display text-xs text-white/60 uppercase tracking-widest font-semibold">Interactive Latency</p>
            <p className="font-display text-[10px] text-white/40 max-w-xs mx-auto">Vercel Edge-powered dynamic rendering keeping core response cycles optimized globally.</p>
          </div>

          <div className="space-y-2 py-4 md:py-0">
            <h4 id="awards-metric-val" className="font-tech text-4xl lg:text-5xl font-extrabold text-brand-accent">12+</h4>
            <p className="font-display text-xs text-white/60 uppercase tracking-widest font-semibold">Creative Awards</p>
            <p className="font-display text-[10px] text-white/40 max-w-xs mx-auto">Recognized globally for blending high-tech architecture with clean layout patterns.</p>
          </div>
        </div>
      </section>

      {/* Start Project CTA */}
      <div id="process-footer-cta" className="text-center space-y-6 pt-4">
        <h3 className="font-display text-2xl font-black text-brand-text">Ready to experience precision?</h3>
        <p className="font-display text-xs text-brand-text-muted max-w-md mx-auto">Book an introductory systems briefing with our Founding Director to review your specifications profile.</p>
        <button
          id="process-cta-btn"
          onClick={() => onNavigate('contact')}
          className="inline-flex items-center space-x-2 rounded-xl bg-brand-primary px-6 py-3 font-display text-xs font-bold text-white hover:bg-brand-primary-light transition-all duration-300 cursor-pointer shadow-sm"
        >
          <span>Schedule Briefing</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
