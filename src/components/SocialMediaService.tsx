import { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Image, Sparkles, Layout, Sliders, Trophy, CheckCircle2, Heart, MessageCircle, Send, Check } from 'lucide-react';

export default function SocialMediaService() {
  const [activeVibe, setActiveVibe] = useState<'minimalist' | 'cyber' | 'editorial'>('minimalist');
  const [layoutType, setLayoutType] = useState<'square' | 'story'>('square');
  const [captionText, setCaptionText] = useState<string>('Designing high-velocity digital assets to command absolute attention.');
  const [activeBadge, setActiveBadge] = useState<string>('LAUNCH //');

  const designs = {
    minimalist: {
      cardBg: 'bg-white text-slate-900 border-slate-100',
      tagline: 'STRATEGIC MINIMALISM',
      title: 'Less Noise. More Impact.',
      accent: 'text-[#00685b]',
      pillBg: 'bg-[#00685b]/10 text-[#00685b]',
      imageUrl: 'bg-gradient-to-tr from-slate-100 to-slate-200'
    },
    cyber: {
      cardBg: 'bg-slate-900 text-emerald-400 border-slate-800',
      tagline: 'CYBERPUNK AESTHETIC // 09',
      title: 'COMMAND DIGITAL SPACES',
      accent: 'text-emerald-400',
      pillBg: 'bg-emerald-400/20 text-emerald-300',
      imageUrl: 'bg-gradient-to-tr from-[#0b0f19] to-slate-900'
    },
    editorial: {
      cardBg: 'bg-[#fdfbf7] text-[#2d2219] border-amber-100',
      tagline: 'PREMIUM EDITORIAL VOICE',
      title: 'Crafted For Global Taste.',
      accent: 'text-amber-800',
      pillBg: 'bg-amber-100 text-amber-800',
      imageUrl: 'bg-gradient-to-tr from-[#f5f1e9] to-[#faf7f0]'
    }
  };

  const currentDesign = designs[activeVibe];

  return (
    <div id="tab-social-media-content" className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 animate-fade-in w-full">
      <div className="md:col-span-7 space-y-8">
        <div className="space-y-4">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-bold uppercase flex items-center gap-1.5 bg-[#00685b]/10 w-fit px-2.5 py-1 rounded-full">
            <Share2 className="h-3.5 w-3.5" /> SOCIAL MEDIA DESIGN
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
            Social Grid Aesthetic<span className="text-brand-accent">.</span>
          </h3>
          <p className="font-sans text-xs text-brand-text-variant leading-relaxed">
            Cohesive, high-converting layouts and templates designed to capture immediate digital attention.
          </p>
        </div>

        {/* Sub Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Image className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">01 / FEED GRAPHICS</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Custom static graphics for LinkedIn, Twitter, and Instagram that deliver a clear story.
            </p>
          </div>

          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Layout className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">02 / EASY FIGMA TEMPLATES</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Fully editable design systems allowing your internal team to launch new posts in minutes.
            </p>
          </div>
        </div>

        {/* Customer-Ready Deliverables Package Checklist */}
        <div id="social-deliverables-checklist" className="bg-brand-surface-low border border-brand-outline/20 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-outline/10 pb-2.5 gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-[#00685b]" />
              <h4 className="font-display text-[10px] font-bold text-brand-text uppercase tracking-wider">
                Included Deliverables
              </h4>
            </div>
            <span className="font-tech text-[9px] text-[#00685b] font-bold bg-[#00685b]/10 px-2.5 py-0.5 rounded-full">Duration: 2-3 Weeks</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Static Post Grids</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Aesthetic, clean posts customized with typography assets</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Story Frameworks</p>
                <p className="font-sans text-[10px] text-brand-text-muted">High-contrast layouts optimized for interaction metrics</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Figma Master Kit</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Direct handoff of original swatches and component vectors</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Content Formulas</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Creative suggestions and layout spacing metrics guide</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-display pt-2.5 border-t border-brand-outline/10 text-brand-text-muted">
            <span className="font-tech font-bold uppercase">TERMS //</span>
            <span className="font-semibold text-brand-text">Direct component handoff • Multi-ratio outputs</span>
          </div>
        </div>
      </div>

      {/* Right Side Card Panel - Grid Playfield Sandbox */}
      <div className="md:col-span-5 bg-white border border-brand-outline/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-tech tracking-wider text-[#00685b] uppercase">Social Grid Previewer</span>
            <span className="bg-[#00685b]/10 text-[#00685b] text-[8px] font-bold px-2 py-0.5 rounded-full font-tech">LIVE CANVAS</span>
          </div>

          {/* Interactive controls */}
          <div className="bg-brand-surface-low rounded-xl p-3 border border-brand-outline/10 space-y-3.5">
            <div>
              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Sliders className="h-3 w-3" /> Select Design Grid Vibe
              </p>
              <div className="grid grid-cols-3 gap-1">
                {(['minimalist', 'cyber', 'editorial'] as const).map((v) => (
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Layout Mode</p>
                <div className="flex bg-white rounded-lg p-0.5 border border-brand-outline/20">
                  <button
                    onClick={() => setLayoutType('square')}
                    className={`flex-1 py-1 text-[8px] font-bold uppercase rounded ${layoutType === 'square' ? 'bg-[#00685b] text-white' : 'text-brand-text-muted'}`}
                  >
                    1:1 Feed Post
                  </button>
                  <button
                    onClick={() => setLayoutType('story')}
                    className={`flex-1 py-1 text-[8px] font-bold uppercase rounded ${layoutType === 'story' ? 'bg-[#00685b] text-white' : 'text-brand-text-muted'}`}
                  >
                    9:16 Portrait
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Overlay Copy</p>
                <input
                  type="text"
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder="Type post text..."
                  className="w-full bg-white border border-brand-outline/25 rounded-md px-2 py-1 text-[9px] font-display hover:border-[#00685b] focus:border-[#00685b] focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-brand-outline/10 pt-2 bg-brand-surface-low rounded-lg mt-1">
              <span className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-[#00685b]" /> Sticker Badge Accent
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {['None', 'LAUNCH //', 'LIVE NOW', 'PRO_SYS', '100% RAW'].map((bOpt) => (
                  <button
                    key={bOpt}
                    onClick={() => setActiveBadge(bOpt)}
                    className={`py-1 px-1.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      activeBadge === bOpt
                        ? 'bg-[#00685b] text-white shadow-xs'
                        : 'bg-white hover:bg-brand-outline/10 border border-[#bdc9c5]/25 text-brand-text-muted'
                    }`}
                  >
                    {bOpt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas mock layout display */}
          <div className="flex justify-center items-center py-2 bg-slate-50 border border-brand-outline/15 rounded-xl">
            <motion.div
              layout
              className={`relative overflow-hidden rounded-xl border flex flex-col justify-between p-5 transition-shadow duration-300 shadow-md ${currentDesign.cardBg} ${
                layoutType === 'square' ? 'w-56 h-56' : 'w-48 h-80'
              }`}
            >
              {/* Profile Bar */}
              <div className="flex items-center space-x-2">
                <div className={`h-6 w-6 rounded-full ${currentDesign.pillBg} font-mono text-[8px] font-bold flex items-center justify-center border border-white/10`}>
                  QB
                </div>
                <div>
                  <h5 className="text-[8px] font-bold uppercase leading-tight font-display tracking-wider">qbench_official</h5>
                  <p className="text-[6px] opacity-60 leading-none">Sponsored Hub</p>
                </div>
              </div>

              {/* Graphic preview space */}
              <div className={`my-auto rounded-lg p-4 border border-white/5 relative overflow-hidden flex flex-col justify-center text-center leading-normal ${currentDesign.imageUrl}`}>
                {activeBadge !== 'None' && (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-1.5 right-1.5 bg-[#00685b] text-white text-[6px] font-mono tracking-widest font-black px-1.5 py-0.5 rounded shadow-sm z-20"
                  >
                    {activeBadge}
                  </motion.span>
                )}
                <span className={`text-[7px] font-tech font-bold uppercase tracking-widest mb-1.5 block ${currentDesign.accent}`}>
                  {currentDesign.tagline}
                </span>
                <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-tight leading-snug">
                  {currentDesign.title}
                </h4>
                <p className="text-[7.5px] opacity-75 mt-2 italic font-display">
                  {captionText || "Designing cohesive strategic visual frameworks."}
                </p>
              </div>

              {/* Engagement Indicators */}
              <div className="flex justify-between items-center text-[8px] pt-2 border-t border-black/5 opacity-80 font-mono">
                <div className="flex items-center space-x-2.5">
                  <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" /> 1.2k</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" /> 34</span>
                </div>
                <Send className="h-3 w-3" />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-outline/10 text-center">
          <div>
            <h5 className="font-tech text-lg font-bold text-[#00685b]">4.8x</h5>
            <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Scroll Stop Rate</p>
          </div>
          <div>
            <h5 className="font-tech text-lg font-bold text-[#00685b]">₹0.42</h5>
            <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Cost Per Engagement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
