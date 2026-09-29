import { useState } from 'react';
import { motion } from 'motion/react';
import { Compass, Palette, MessageSquare, BookOpen, Trophy, CheckCircle2, Sparkles, Sliders, RefreshCw } from 'lucide-react';

export default function BrandingService() {
  const [activeVibe, setActiveVibe] = useState<'corporate' | 'cyber' | 'editorial'>('corporate');
  const [letterSpacing, setLetterSpacing] = useState<number>(2); // range: 0 to 12
  const [customBrandName, setCustomBrandName] = useState<string>('UNLIMITED RESOURCES');

  const vibes = {
    corporate: {
      bg: 'bg-slate-50 border-slate-200',
      textColor: 'text-slate-900',
      subtitleColor: 'text-[#00685b]',
      font: 'font-sans',
      logoName: 'UNLIMITED RESOURCES',
      tagline: 'High-Tech Clinical Therapeutics',
      accentColor: 'bg-[#00685b]',
      pillBg: 'bg-[#00685b]/10 text-[#00685b]',
    },
    cyber: {
      bg: 'bg-[#0f172a] border-slate-800',
      textColor: 'text-slate-100',
      subtitleColor: 'text-[#10b981]',
      font: 'font-mono',
      logoName: 'UNLIMITED_RESOURCES',
      tagline: 'SYS.INITIALIZED // CH-98',
      accentColor: 'bg-[#10b981]',
      pillBg: 'bg-[#10b981]/20 text-[#10b981]',
    },
    editorial: {
      bg: 'bg-[#fdfbf7] border-amber-100',
      textColor: 'text-[#2d2219]',
      subtitleColor: 'text-amber-700',
      font: 'font-serif',
      logoName: 'Unlimited Resources',
      tagline: 'Crafted botanicals & rare minerals',
      accentColor: 'bg-amber-700',
      pillBg: 'bg-amber-100 text-amber-800',
    }
  };

  const currentVibe = vibes[activeVibe];

  return (
    <div id="tab-branding-content" className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 animate-fade-in w-full">
      <div className="md:col-span-7 space-y-8">
        <div className="space-y-4">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-bold uppercase flex items-center gap-1.5 bg-[#00685b]/10 w-fit px-2.5 py-1 rounded-full">
            <Sparkles className="h-3.5 w-3.5" /> BRANDING
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
            Refined Brand Identity<span className="text-brand-accent">.</span>
          </h3>
          <p className="font-sans text-xs text-brand-text-variant leading-relaxed">
            Premium logos, tailored typography, and clean guidelines to establish immediate market trust.
          </p>
        </div>

        {/* Sub Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Compass className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">01 / BRAND STRATEGY</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Audience profiling and competitor positioning to define your unique space.
            </p>
          </div>

          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Palette className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">02 / LOGO & GRAPHICS</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              High-craft vector logo marks customized for multi-surface scalability.
            </p>
          </div>

          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <MessageSquare className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">03 / COGNITIVE NAMING</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Memorable business names and clear brand tagline communication.
            </p>
          </div>

          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <BookOpen className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">04 / STYLE GUIDES</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Rules detailing proper logo use, font pairings, and color codes.
            </p>
          </div>
        </div>

        {/* Customer-Ready Deliverables Package Checklist */}
        <div id="branding-deliverables-checklist" className="bg-brand-surface-low border border-brand-outline/20 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-outline/10 pb-2.5 gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-[#00685b]" />
              <h4 className="font-display text-[10px] font-bold text-brand-text uppercase tracking-wider">
                Brand Deliverables
              </h4>
            </div>
            <span className="font-tech text-[9px] text-[#00685b] font-bold bg-[#00685b]/10 px-2.5 py-0.5 rounded-full">Duration: 4-6 Weeks</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Logo Suite</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Primary, secondary, and monochrome vector source formats</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Competitor Maps</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Brand positioning model and target segment values</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Color Palette</p>
                <p className="font-sans text-[10px] text-brand-text-muted">High-contrast, eye-safe corporate and digital swatches</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Typography Guide</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Consistent pairing rules for screens and print mediums</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Compliance Manual</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Clear space standards and asset configuration rules</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Collaterals kit</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Figma layouts for digital cards and initial assets</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-display pt-2.5 border-t border-brand-outline/10 text-brand-text-muted">
            <span className="font-tech font-bold uppercase">TERMS //</span>
            <span className="font-semibold text-brand-text">Comprehensive intellectual property transfer</span>
          </div>
        </div>
      </div>

      {/* Right Side Card Panel - Generative Space Sandbox */}
      <div className="md:col-span-5 bg-white border border-brand-outline/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-tech tracking-wider text-[#00685b] uppercase">Brand Preview</span>
            <span className="bg-brand-accent-light text-brand-secondary text-[8px] font-bold px-2 py-0.5 rounded-full font-tech">DYNAMIC PREVIEW</span>
          </div>

          {/* Interactive controls */}
          <div className="bg-brand-surface-low rounded-xl p-3 border border-brand-outline/10 space-y-3.5">
            <div>
              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Sliders className="h-3 w-3" /> Select Identity Vibe
              </p>
              <div className="grid grid-cols-3 gap-1">
                {(['corporate', 'cyber', 'editorial'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setActiveVibe(v)}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                      activeVibe === v
                        ? 'bg-[#00685b] text-white'
                        : 'bg-white hover:bg-brand-outline/10 border border-brand-outline/20 text-brand-text-muted'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest flex items-center gap-1">
                  Logo Letter Spacing
                </p>
                <span className="text-[9px] font-mono text-[#00685b]">{letterSpacing}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(Number(e.target.value))}
                className="w-full accent-[#00685b] cursor-pointer"
              />
            </div>

            <div className="border-t border-brand-outline/10 pt-2.5">
              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Custom Brand Name Input</p>
              <input
                type="text"
                maxLength={25}
                value={customBrandName}
                onChange={(e) => setCustomBrandName(e.target.value)}
                placeholder="Type brand name..."
                className="w-full bg-white border border-brand-outline/25 rounded-md px-2.5 py-1.5 text-[10px] font-display hover:border-[#00685b] focus:border-[#00685b] focus:outline-none"
              />
            </div>
          </div>

          {/* Canvas card preview */}
          <motion.div
            layout
            className={`aspect-square relative overflow-hidden rounded-xl border flex flex-col justify-between p-6 transition-colors duration-500 ${currentVibe.bg}`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-[8px] font-tech font-bold px-2 py-0.5 rounded-full capitalize ${currentVibe.pillBg}`}>
                {activeVibe} brand mark
              </span>
              <div className="flex gap-1">
                <div className={`h-2 w-2 rounded-full ${currentVibe.accentColor}`} />
                <div className="h-2 w-2 rounded-full bg-slate-300" />
              </div>
            </div>

            {/* Simulated Logo branding */}
            <div className="text-center space-y-1 my-auto">
              <motion.h4
                animate={{ letterSpacing: `${letterSpacing}px` }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className={`text-xl sm:text-2xl font-extrabold tracking-widest uppercase transition-colors duration-500 leading-tight ${currentVibe.textColor} ${currentVibe.font}`}
              >
                {customBrandName.trim() || currentVibe.logoName}
              </motion.h4>
              <p className="text-[9px] font-display text-slate-400 font-semibold tracking-wider transition-colors duration-500 italic">
                {currentVibe.tagline}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200/10 flex justify-between items-center text-[8px] font-mono text-slate-400">
              <span>SCALE: GOLDEN RATIO</span>
              <span>100% SCALABLE VECTOR</span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-outline/10 text-center">
          <div>
            <h5 className="font-tech text-lg font-bold text-[#00685b]">82%</h5>
            <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Brand Recognition</p>
          </div>
          <div>
            <h5 className="font-tech text-lg font-bold text-[#00685b]">12M+</h5>
            <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Launch Week Reach</p>
          </div>
        </div>

        <div className="bg-brand-surface-low rounded-xl p-3 border border-brand-outline/10 flex justify-between items-center gap-2">
          <p className="font-display text-[9px] leading-relaxed text-brand-text-variant italic">
            "We construct generative design systems that adapt to any digital or physical medium with mathematical precision."
          </p>
          <span className="text-[8px] shrink-0 font-tech font-bold text-[#00685b] block">— Akhil Suresh</span>
        </div>
      </div>
    </div>
  );
}
