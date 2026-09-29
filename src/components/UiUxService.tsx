import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Workflow, Layers, BookOpen, Trophy, CheckCircle2, Play, Sliders } from 'lucide-react';

interface UiUxServiceProps {
  expandedAccordion: string | null;
  handleToggleAccordion: (key: string) => void;
}

export default function UiUxService({ expandedAccordion, handleToggleAccordion }: UiUxServiceProps) {
  const [bounceKey, setBounceKey] = useState(0);
  const [stiffness, setStiffness] = useState(250);
  const [damping, setDamping] = useState(15);
  const [activeLayoutRatio, setActiveLayoutRatio] = useState<'linear' | 'golden'>('golden');

  return (
    <div id="tab-uiux-content" className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 animate-fade-in w-full">
      <div className="md:col-span-7 space-y-8">
        <div className="space-y-4">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-bold uppercase flex items-center gap-1.5 bg-[#00685b]/10 w-fit px-2.5 py-1 rounded-full">
            <Layers className="h-3.5 w-3.5" /> UI/UX DESIGN
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
            Intuitive Interface Design<span className="text-brand-accent">.</span>
          </h3>
          <p className="font-sans text-xs text-brand-text-variant leading-relaxed">
            Beautiful, clear, and high-fidelity figma layouts built to simplify user interactions.
          </p>
        </div>

        {/* Left sub sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex space-x-3 items-start bg-white/50 border border-brand-outline/15 rounded-xl p-3.5 transition-all duration-300 hover:border-[#00685b]/40 hover:shadow-sm">
            <span className="bg-[#00685b]/5 text-[#00685b] rounded-lg p-2 flex items-center justify-center shrink-0">
              <Workflow className="h-4.5 w-4.5" />
            </span>
            <div className="space-y-0.5">
              <h4 className="font-display text-xs font-bold text-brand-text">01 / Wireframe Flow</h4>
              <p className="font-sans text-[11px] text-brand-text-variant leading-relaxed">
                Clear hierarchy and user paths mapped directly to conversion goals.
              </p>
            </div>
          </div>

          <div className="flex space-x-3 items-start bg-white/50 border border-brand-outline/15 rounded-xl p-3.5 transition-all duration-300 hover:border-[#00685b]/40 hover:shadow-sm">
            <span className="bg-[#00685b]/5 text-[#00685b] rounded-lg p-2 flex items-center justify-center shrink-0">
              <Layers className="h-4.5 w-4.5" />
            </span>
            <div className="space-y-0.5">
              <h4 className="font-display text-xs font-bold text-brand-text">02 / Figma High-Fi</h4>
              <p className="font-sans text-[11px] text-brand-text-variant leading-relaxed">
                Beautiful color pallets, clean grid structures, and developer-ready specs.
              </p>
            </div>
          </div>
        </div>

        {/* Method Accordion with custom heights */}
        <div className="space-y-3 pt-4 border-t border-brand-outline/20">
          <h4 className="font-display text-xs font-bold text-[#00685b] uppercase tracking-widest flex items-center gap-1.5 pl-1">
            <BookOpen className="h-3.5 w-3.5" /> Designing by Rules
          </h4>

          {/* Acc 1 */}
          <div className="border border-brand-outline/35 rounded-xl overflow-hidden bg-brand-surface">
            <button 
              type="button"
              onClick={() => handleToggleAccordion('prop')}
              className="w-full flex items-center justify-between px-4 py-3 text-left font-display text-xs font-bold text-brand-text select-none cursor-pointer hover:bg-brand-surface-low transition-colors duration-200"
            >
              <span>01. The Rule of Proportions</span>
              <span className="text-[#00685b] text-sm font-mono">{expandedAccordion === 'prop' ? '—' : '+'}</span>
            </button>
            <AnimatePresence initial={false}>
              {expandedAccordion === 'prop' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 font-display text-xs text-brand-text-muted leading-relaxed border-t border-brand-outline/10 pt-2 bg-white/30">
                    Utilizing golden section matrices to position controls and establish natural weight hierarchy. Every gap and element adheres strictly to root layout grids.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Acc 2 */}
          <div className="border border-brand-outline/35 rounded-xl overflow-hidden bg-brand-surface">
            <button 
              type="button"
              onClick={() => handleToggleAccordion('load')}
              className="w-full flex items-center justify-between px-4 py-3 text-left font-display text-xs font-bold text-brand-text select-none cursor-pointer hover:bg-brand-surface-low transition-colors duration-200"
            >
              <span>02. Cognitive Load Reduction</span>
              <span className="text-[#00685b] text-sm font-mono">{expandedAccordion === 'load' ? '—' : '+'}</span>
            </button>
            <AnimatePresence initial={false}>
              {expandedAccordion === 'load' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 font-display text-xs text-brand-text-muted leading-relaxed border-t border-brand-outline/10 pt-2 bg-white/30">
                    We actively purge clutter. Every button, tooltip, and line must earn its place by resolving a direct active user goal within split seconds.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Acc 3 */}
          <div className="border border-brand-outline/35 rounded-xl overflow-hidden bg-brand-surface">
            <button 
              type="button"
              onClick={() => handleToggleAccordion('move')}
              className="w-full flex items-center justify-between px-4 py-3 text-left font-display text-xs font-bold text-brand-text select-none cursor-pointer hover:bg-brand-surface-low transition-colors duration-200"
            >
              <span>03. Organic Feedback Animations</span>
              <span className="text-[#00685b] text-sm font-mono">{expandedAccordion === 'move' ? '—' : '+'}</span>
            </button>
            <AnimatePresence initial={false}>
              {expandedAccordion === 'move' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 font-display text-xs text-brand-text-muted leading-relaxed border-t border-brand-outline/10 pt-2 bg-white/30">
                    Interface updates respond like natural physical structures. Using dampening coefficients and spring equations instead of rigid linear timelines.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Customer-Ready Deliverables Package Checklist */}
        <div id="uiux-deliverables-checklist" className="bg-brand-surface-low border border-brand-outline/20 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-outline/10 pb-2.5 gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-[#00685b]" />
              <h4 className="font-display text-[10px] font-bold text-brand-text uppercase tracking-wider">
                UI/UX Deliverables
              </h4>
            </div>
            <span className="font-tech text-[9px] text-[#00685b] font-bold bg-[#00685b]/10 px-2.5 py-0.5 rounded-full">Duration: 5-8 Weeks</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Research & Journey Boards</p>
                <p className="font-sans text-[10px] text-brand-text-muted">User mappings and audited behavioral trees</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Blueprints & Wireframes</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Responsive low-fi grid structures and layout flows</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Aesthetic UI Mockups</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Full mockup screens styled following modern guidelines</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Interactive Figma Prototypes</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Direct clickable links exhibiting active micro-transitions</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-display pt-2.5 border-t border-brand-outline/10 text-brand-text-muted">
            <span className="font-tech font-bold uppercase">TERMS //</span>
            <span className="font-semibold text-brand-text">Direct Figma link handoff with clean dev spec sheet</span>
          </div>
        </div>
      </div>

      {/* Right Side Card Panel - Physics & Grid Sandbox */}
      <div className="md:col-span-5 bg-brand-dark rounded-2xl p-6 text-white flex flex-col justify-between space-y-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-brand-accent/20 blur-[30px] pointer-events-none" />
        
        <div className="space-y-4 relative z-10 w-full">
          <div className="flex items-center justify-between">
            <span className="font-tech text-[10px] tracking-wider text-brand-accent uppercase font-bold">Tactile Physics Lab</span>
            <span className="bg-brand-accent/20 text-brand-accent-light text-[8px] font-bold px-2 py-0.5 rounded-full font-tech uppercase">Tactile UI</span>
          </div>

          {/* Interactive controls */}
          <div className="bg-white/5 rounded-xl p-3.5 space-y-4 border border-white/10">
            <div>
              <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Sliders className="h-3 w-3 text-brand-accent" /> Spring Dynamics Adjusters
              </p>
              
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between items-center text-[8px] text-white/50 mb-0.5">
                    <span>Stiffness (Force)</span>
                    <span className="text-brand-accent font-mono">{stiffness}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={stiffness}
                    onChange={(e) => setStiffness(Number(e.target.value))}
                    className="w-full accent-brand-accent cursor-pointer h-1 bg-white/20 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[8px] text-white/50 mb-0.5">
                    <span>Damping (Friction)</span>
                    <span className="text-brand-accent font-mono">{damping}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={damping}
                    onChange={(e) => setDamping(Number(e.target.value))}
                    className="w-full accent-brand-accent cursor-pointer h-1 bg-white/20 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Layout proportions preview */}
            <div className="border-t border-white/10 pt-3">
              <span className="text-[9px] text-white/50 uppercase tracking-widest block mb-2 font-bold">Grid Layout System</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveLayoutRatio('linear')}
                  className={`py-1 rounded text-[8px] font-bold uppercase cursor-pointer transition-all duration-200 ${
                    activeLayoutRatio === 'linear' ? 'bg-white text-brand-dark' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Standard (Linear)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLayoutRatio('golden')}
                  className={`py-1 rounded text-[8px] font-bold uppercase cursor-pointer transition-all duration-200 ${
                    activeLayoutRatio === 'golden' ? 'bg-[#0aebd5] text-brand-dark' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Golden (1.618)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive display area */}
          <div className="bg-black/25 rounded-xl p-4 border border-white/5 h-44 flex flex-col justify-between relative overflow-hidden">
            {/* Real-time spring node */}
            <div className="flex justify-between items-center text-[8px] text-white/40">
              <span>ACTIVE SPRING NODE</span>
              <button
                type="button"
                onClick={() => setBounceKey(prev => prev + 1)}
                className="flex items-center gap-1 text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full hover:bg-brand-accent/20 transition-all cursor-pointer font-bold uppercase"
              >
                <Play className="h-2 w-2 fill-brand-accent" /> Bounce
              </button>
            </div>

            <div className="relative flex-grow flex items-center justify-center">
              <motion.div
                key={bounceKey}
                initial={{ scale: 0.4, rotate: -45, y: -40, opacity: 0.5 }}
                animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: stiffness,
                  damping: damping,
                }}
                className="h-10 w-10 bg-gradient-to-tr from-brand-accent to-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-brand-accent/25 relative"
              >
                <div className="h-3 w-3 bg-white rounded-full opacity-60 absolute top-2 left-2" />
              </motion.div>
            </div>

            {/* Dynamic layout proportions preview rendering */}
            <div className="flex gap-2.5 items-end justify-center w-full">
              <motion.div
                layout
                className="bg-white/20 rounded-lg"
                style={{
                  width: activeLayoutRatio === 'golden' ? '38.2%' : '50%',
                  height: '14px',
                }}
              />
              <motion.div
                layout
                className="bg-white/40 border border-brand-accent rounded-lg"
                style={{
                  width: activeLayoutRatio === 'golden' ? '61.8%' : '50%',
                  height: '14px',
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-center relative z-10 font-bold">
          <div>
            <h5 className="font-tech text-lg font-bold text-[#0aebd5]">180%</h5>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Engagement Boost</p>
          </div>
          <div>
            <h5 className="font-tech text-lg font-bold text-[#0aebd5]">0.2s</h5>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Response Latency</p>
          </div>
        </div>
      </div>
    </div>
  );
}
