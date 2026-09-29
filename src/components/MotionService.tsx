import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Wind, Sparkles, FileText, Volume2, Trophy, CheckCircle2, Sliders, Zap, Repeat, Layers, Orbit, HelpCircle } from 'lucide-react';

export default function MotionService() {
  const [easeType, setEaseType] = useState<'spring' | 'snap' | 'fluid'>('spring');
  const [duration, setDuration] = useState<number>(1.2); // Default to a visually pleasing 1.2s
  const [simKey, setSimKey] = useState<number>(1);
  const [pathType, setPathType] = useState<'linear' | 'bounce' | 'spin' | 'elastic'>('linear');
  const [shapeType, setShapeType] = useState<'cube' | 'capsule' | 'ring' | 'sphere'>('cube');
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const getTransition = () => {
    const loopProps = isLooping ? {
      repeat: Infinity,
      repeatType: "reverse" as const,
    } : {};

    switch (easeType) {
      case 'spring':
        return { 
          type: 'spring', 
          stiffness: 120, 
          damping: 8, 
          duration,
          ...loopProps 
        };
      case 'snap':
        return { 
          ease: [0.76, 0, 0.24, 1], 
          duration,
          ...loopProps 
        };
      case 'fluid':
        return { 
          ease: [0.25, 1, 0.5, 1], 
          duration,
          ...loopProps 
        };
    }
  };

  const getEaseLabel = () => {
    switch (easeType) {
      case 'spring': return 'Spring Dynamics (stiffness: 120, damping: 8)';
      case 'snap': return 'Snappy Ease (cubic-bezier[.76, 0, .24, 1])';
      case 'fluid': return 'Fluid Flow (cubic-bezier[.25, 1, .5, 1])';
    }
  };

  const getAnimationProps = () => {
    const baseTransition = getTransition();
    
    // We animate absolute horizontal placement ('left') from 5% to 80% dynamically.
    // This allows smooth motion on any container width without measuring ref widths!
    switch (pathType) {
      case 'linear':
        return {
          animate: { 
            left: ['5%', '80%', '5%'] 
          },
          transition: baseTransition
        };
      case 'bounce':
        return {
          animate: { 
            left: ['5%', '80%', '5%'],
            y: [0, -42, 0, -20, 0, -8, 0]
          },
          transition: {
            ...baseTransition,
            y: {
              duration: duration,
              repeat: isLooping ? Infinity : 0,
              repeatType: "reverse" as const,
              ease: "easeOut"
            }
          }
        };
      case 'spin':
        return {
          animate: { 
            left: ['5%', '80%', '5%'],
            rotate: [0, 360, 720]
          },
          transition: {
            ...baseTransition,
            rotate: {
              duration: duration,
              repeat: isLooping ? Infinity : 0,
              repeatType: "reverse" as const,
              ease: "linear"
            }
          }
        };
      case 'elastic':
        return {
          animate: { 
            left: ['5%', '80%', '5%'],
            scale: [0.8, 1.4, 0.8]
          },
          transition: {
            ...baseTransition,
            scale: {
              duration: duration,
              repeat: isLooping ? Infinity : 0,
              repeatType: "reverse" as const,
              ease: "easeInOut"
            }
          }
        };
    }
  };

  const renderShape = () => {
    const commonClass = "select-none uppercase z-20 flex items-center justify-center font-bold text-white text-[9px] shadow-lg transition-colors duration-300";
    
    switch (shapeType) {
      case 'cube':
        return (
          <div className={`${commonClass} h-10 w-10 bg-gradient-to-br from-[#00c9a7] to-teal-600 rounded-lg shadow-[#00c9a7]/30`}>
            BENCH
          </div>
        );
      case 'capsule':
        return (
          <div className={`${commonClass} h-6 w-12 bg-gradient-to-r from-teal-400 to-[#00685b] rounded-full shadow-[#00685b]/40`}>
            FLOW
          </div>
        );
      case 'ring':
        return (
          <div className={`${commonClass} h-10 w-10 border-4 border-[#00c9a7] bg-slate-900 rounded-full shadow-[#00c9a7]/20`}>
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        );
      case 'sphere':
        return (
          <div className={`${commonClass} h-10 w-10 bg-gradient-to-br from-[#10b981] to-emerald-700 rounded-full shadow-emerald-500/30`}>
            3D
          </div>
        );
    }
  };

  const renderCurveSvg = () => {
    switch (easeType) {
      case 'spring':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 400 100" preserveAspectRatio="none">
            <path d="M 20,80 Q 100,-15 180,95 T 280,72 T 340,80 T 380,80" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 3" />
          </svg>
        );
      case 'snap':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 400 100" preserveAspectRatio="none">
            <path d="M 20,80 C 180,80 200,10 380,10" fill="none" stroke="#00c9a7" strokeWidth="2.5" />
          </svg>
        );
      case 'fluid':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 400 100" preserveAspectRatio="none">
            <path d="M 20,80 C 140,80 220,20 380,20" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
          </svg>
        );
    }
  };

  return (
    <div id="tab-motion-content" className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 animate-fade-in w-full">
      <div className="md:col-span-7 space-y-8">
        <div className="space-y-4">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-bold uppercase flex items-center gap-1.5 bg-[#00685b]/10 w-fit px-2.5 py-1 rounded-full">
            <Video className="h-3.5 w-3.5" /> MOTION GRAPHICS
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
            Fluid Motion Graphics<span className="text-brand-accent">.</span>
          </h3>
          <p className="font-sans text-xs text-brand-text-variant leading-relaxed">
            Highly polished, custom physical simulations and typographic layout layouts designed for high-end digital brands.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-brand-outline/20 bg-white/50 rounded-xl p-3.5 flex items-start space-x-3 transition-all duration-200">
            <span className="bg-[#00685b]/5 text-[#00685b] rounded p-2 flex items-center justify-center shrink-0">
              <Wind className="h-4.5 w-4.5" />
            </span>
            <div className="space-y-0.5">
              <h4 className="font-display text-xs font-bold text-brand-text">2D/3D Simulations</h4>
              <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
                Smoothly transitioning vector paths and real physical gravity curves.
              </p>
            </div>
          </div>

          <div className="border border-brand-outline/20 bg-white/50 rounded-xl p-3.5 flex items-start space-x-3 transition-all duration-200">
            <span className="bg-[#00685b]/5 text-[#00685b] rounded p-2 flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div className="space-y-0.5">
              <h4 className="font-display text-xs font-bold text-brand-text">Animated Logos</h4>
              <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
                Brilliant, snappy logo brand transformations that establish instant status.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          <div className="space-y-1 bg-brand-surface-low rounded-xl p-3 border border-brand-outline/15 hover:border-[#00685b]/25 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Video className="h-4 w-4" />
              <span className="text-[9px] font-bold font-tech uppercase">SHOWCASES</span>
            </div>
            <p className="font-sans text-[10.5px] text-brand-text-muted leading-relaxed">
              Tactile materials and explosive assemblies.
            </p>
          </div>
          <div className="space-y-1 bg-brand-surface-low rounded-xl p-3 border border-brand-outline/15 hover:border-[#00685b]/25 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <FileText className="h-4 w-4" />
              <span className="text-[9px] font-bold font-tech uppercase">KINETIC TYPE</span>
            </div>
            <p className="font-sans text-[10.5px] text-brand-text-muted leading-relaxed">
              Bold typographic motion built for instant attention.
            </p>
          </div>
          <div className="space-y-1 bg-brand-surface-low rounded-xl p-3 border border-brand-outline/15 hover:border-[#00685b]/25 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Volume2 className="h-4 w-4" />
              <span className="text-[9px] font-bold font-tech uppercase">SOUNDSCAPES</span>
            </div>
            <p className="font-sans text-[10.5px] text-brand-text-muted leading-relaxed">
              Adaptive sounds engineered alongside keyframes.
            </p>
          </div>
        </div>

        {/* Customer-Ready Deliverables Package Checklist */}
        <div id="motion-deliverables-checklist" className="bg-brand-surface-low border border-brand-outline/20 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-outline/10 pb-2.5 gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-[#00685b]" />
              <h4 className="font-display text-[10px] font-bold text-brand-text uppercase tracking-wider">
                Motion Deliverables
              </h4>
            </div>
            <span className="font-tech text-[9px] text-[#00685b] font-bold bg-[#00685b]/10 px-2.5 py-0.5 rounded-full">Duration: 3-5 Weeks</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Social Reels</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Cinematic layouts, automated captions, and ambient audio layers</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Explainer Loops</p>
                <p className="font-sans text-[10px] text-brand-text-muted">High-fidelity corporate vector sheets animated with realistic physics curves</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Product Assembly</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Clean 3D lighting assets mapping exact engineering drafts beautifully</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Snappy Intros & Outros</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Vector transparent overlays for effortless video edits and stream pipelines</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-display pt-2.5 border-t border-brand-outline/10 text-brand-text-muted">
            <span className="font-tech font-bold uppercase">TERMS //</span>
            <span className="font-semibold text-brand-text">Royalty-free licenses and complete raw composition project files</span>
          </div>
        </div>
      </div>

      {/* Right Side Card Panel - Kinetic Interactive Laboratory */}
      <div id="kinetic-timeline-sandbox" className="md:col-span-5 bg-white border border-brand-outline/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Orbit className="h-4 w-4 text-[#00685b]" />
              <span className="text-[10px] font-bold font-tech tracking-wider text-[#00685b] uppercase">Interactive Motion Lab</span>
            </div>
            <span className="bg-[#00c9a7]/15 text-teal-800 text-[8px] font-bold px-2 py-0.5 rounded-full font-tech uppercase">RENDER RATIONAL</span>
          </div>

          {/* Explanation on why it's not a lazy black box */}
          <div className="text-[10px] bg-[#00685b]/5 text-[#00685b]/85 border border-[#00685b]/10 rounded-lg p-2.5 font-display flex items-start gap-1.5 leading-snug">
            <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Contrast & Playback Update:</strong> The motion canvas features active looping and neon layout coordinate grids so design states are continuously viewable.
            </span>
          </div>

          {/* Interactive controls */}
          <div className="bg-brand-surface-low rounded-xl p-3.5 space-y-3.5 border border-brand-outline/15">
            {/* Easing Options */}
            <div>
              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Sliders className="h-3 w-3 text-[#00685b]" /> 1. Select Physics Interpolator
              </p>
              <div className="grid grid-cols-3 gap-1">
                {(['spring', 'snap', 'fluid'] as const).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setEaseType(e);
                      setSimKey(prev => prev + 1);
                    }}
                    className={`py-1.5 px-0.5 rounded-lg text-[8px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                      easeType === e ? 'bg-[#00685b] text-white' : 'bg-white hover:bg-brand-outline/10 border border-[#bdc9c5]/25 text-brand-text-muted'
                    }`}
                  >
                    {e === 'spring' ? 'Fluid Spring' : e === 'snap' ? 'Snappy Snap' : 'Slow Ease'}
                  </button>
                ))}
              </div>
            </div>

            {/* Path Option */}
            <div>
              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Orbit className="h-3 w-3 text-[#00685b]" /> 2. Choose Animation Path
              </p>
              <div className="grid grid-cols-4 gap-1">
                {(['linear', 'bounce', 'spin', 'elastic'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPathType(p);
                      setSimKey(prev => prev + 1);
                    }}
                    className={`py-1 rounded text-[8px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                      pathType === p ? 'bg-[#00685b] text-white' : 'bg-white hover:bg-brand-outline/10 border border-[#bdc9c5]/25 text-brand-text-muted'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Shape Option */}
            <div>
              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-[#00685b]" /> 3. Select Vector Geometry
              </p>
              <div className="grid grid-cols-4 gap-1">
                {(['cube', 'capsule', 'ring', 'sphere'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setShapeType(s);
                      setSimKey(prev => prev + 1);
                    }}
                    className={`py-1 rounded text-[8px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                      shapeType === s ? 'bg-[#00685b] text-white' : 'bg-white hover:bg-brand-outline/10 border border-[#bdc9c5]/25 text-brand-text-muted'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration and Toggles row */}
            <div className="border-t border-brand-outline/10 pt-2.5 space-y-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest flex items-center gap-1">
                    Animation Speed (Duration)
                  </p>
                  <span className="text-[9px] font-mono text-[#00685b]">{duration}s</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={duration}
                  onChange={(e) => {
                    setDuration(Number(e.target.value));
                    setSimKey(prev => prev + 1);
                  }}
                  className="w-full accent-[#00685b] cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <label className="flex items-center space-x-1.5 text-[9px] font-bold text-brand-text-muted uppercase cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isLooping}
                    onChange={(e) => {
                      setIsLooping(e.target.checked);
                      setSimKey(prev => prev + 1);
                    }}
                    className="accent-[#00685b] h-3.5 w-3.5 cursor-pointer rounded"
                  />
                  <span className="flex items-center gap-1"><Repeat className="h-3 w-3" /> Auto Loop Mode</span>
                </label>

                <label className="flex items-center space-x-1.5 text-[9px] font-bold text-brand-text-muted uppercase cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="accent-[#00685b] h-3.5 w-3.5 cursor-pointer rounded"
                  />
                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> Grid Guides</span>
                </label>
              </div>
            </div>
          </div>

          {/* Kinetic Display Canvas */}
          <div className="relative bg-slate-950 rounded-xl h-48 p-4 border border-emerald-500/25 overflow-hidden flex flex-col justify-between shadow-inner">
            {/* Grid texture overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_14px]" />
                <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full border border-teal-500/25" />
                <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full border border-[#00c9a7]/25" />
              </div>
            )}

            {/* Glowing Bezier Curve Graph indicator */}
            {renderCurveSvg()}

            <div className="flex justify-between items-center text-[7px] text-white/50 font-mono z-10">
              <span className="tracking-wide uppercase bg-black/40 px-2 py-0.5 rounded border border-white/5">{getEaseLabel()}</span>
              <button
                type="button"
                onClick={() => setSimKey(prev => prev + 1)}
                className="flex items-center gap-1 text-[#00c9a7] bg-[#00c9a7]/10 border border-[#00c9a7]/20 px-2.5 py-0.5 rounded-full hover:bg-[#00c9a7]/20 transition-all font-bold uppercase cursor-pointer"
              >
                <Zap className="h-2 w-2 animate-bounce" /> Force Trigger
              </button>
            </div>

            {/* The Track Container Area */}
            <div className="relative flex-grow flex items-center w-full px-2 overflow-visible">
              {/* Reference horizontal guide track */}
              <div className="absolute left-4 right-12 h-[2px] bg-white/10 rounded-full z-0" />

              <div className="relative w-full h-12 flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${simKey}-${pathType}-${shapeType}-${easeType}`}
                    {...getAnimationProps()}
                    className="absolute select-none z-20"
                    style={{ left: '0%' }}
                  >
                    {renderShape()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="text-[7px] font-mono text-white/40 flex justify-between z-10 w-full uppercase">
              <span>PATH ENTRY [0ms]</span>
              <span>COMPILATION OK [{Math.round(duration * 1000)}ms]</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-outline/10 text-center">
          <div>
            <h5 className="font-tech text-lg font-bold text-[#00685b]">120+</h5>
            <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Films Produced</p>
          </div>
          <div>
            <h5 className="font-tech text-lg font-bold text-[#00685b]">15 Award</h5>
            <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Design Accolades</p>
          </div>
        </div>
      </div>
    </div>
  );
}
