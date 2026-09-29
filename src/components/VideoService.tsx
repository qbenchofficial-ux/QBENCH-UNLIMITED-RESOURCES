import { useState } from 'react';
import { motion } from 'motion/react';
import { Video, Film, Music, Shield, Sliders, Trophy, CheckCircle2, Play, Activity, Sparkles } from 'lucide-react';

export default function VideoService() {
  const [formatType, setFormatType] = useState<'reel' | 'ad' | 'promo'>('reel');
  const [pacing, setPacing] = useState<'snappy' | 'cinematic'>('snappy');
  const [musicSynced, setMusicSynced] = useState<boolean>(true);
  const [soundFX, setSoundFX] = useState<boolean>(true);

  // Calculated retention data based on configurations
  const getRetentionMetrics = () => {
    let initialDrop = 98;
    let midRetention = 52;
    let finishRate = 34;
    let score = '7.4/10';

    if (formatType === 'reel') {
      initialDrop = pacing === 'snappy' ? 96 : 89;
      midRetention = pacing === 'snappy' ? 64 : 45;
      finishRate = musicSynced ? 42 : 28;
    } else if (formatType === 'ad') {
      initialDrop = pacing === 'snappy' ? 98 : 91;
      midRetention = pacing === 'snappy' ? 71 : 52;
      finishRate = (musicSynced && soundFX) ? 49 : 30;
    } else {
      initialDrop = pacing === 'cinematic' ? 94 : 88;
      midRetention = pacing === 'cinematic' ? 58 : 42;
      finishRate = (musicSynced && soundFX) ? 39 : 24;
    }

    score = (((initialDrop + midRetention + finishRate) / 3) / 10).toFixed(1) + '/10';

    return { initialDrop, midRetention, finishRate, score };
  };

  const metrics = getRetentionMetrics();

  return (
    <div id="tab-video-content" className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 animate-fade-in w-full">
      <div className="md:col-span-7 space-y-8">
        <div className="space-y-4">
          <span className="font-tech text-[10px] tracking-widest text-[#00685b] font-bold uppercase flex items-center gap-1.5 bg-[#00685b]/10 w-fit px-2.5 py-1 rounded-full">
            <Video className="h-3.5 w-3.5" /> VIDEO EDITING
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
            High-Retention Video Editing<span className="text-brand-accent">.</span>
          </h3>
          <p className="font-sans text-xs text-brand-text-variant leading-relaxed">
            Fast pacing, cinematic grading, and dynamic captions designed to hold digital attention.
          </p>
        </div>

        {/* Sub Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Film className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">01 / DYNAMIC CONTROLS</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              We cut dead air, raw mistakes, and pacing lags to deliver tight, highly cohesive edits.
            </p>
          </div>

          <div className="space-y-1.5 bg-white/50 border border-brand-outline/20 rounded-xl p-3.5 hover:border-[#00685b]/45 transition-all duration-200">
            <div className="flex items-center space-x-2 text-[#00685b] mb-0.5">
              <Music className="h-4 w-4" />
              <span className="font-tech text-[10px] tracking-wider font-bold">02 / SPATIAL SOUND MIX</span>
            </div>
            <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
              Background noise removal and crisp sound effects synchronized directly to the timeline beats.
            </p>
          </div>
        </div>

        {/* Deliverables Checklist */}
        <div id="video-deliverables-checklist" className="bg-brand-surface-low border border-brand-outline/20 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-outline/10 pb-2.5 gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-[#00685b]" />
              <h4 className="font-display text-[10px] font-bold text-brand-text uppercase tracking-wider">
                Video Deliverables
              </h4>
            </div>
            <span className="font-tech text-[9px] text-[#00685b] font-bold bg-[#00685b]/10 px-2.5 py-0.5 rounded-full">Duration: 2-4 Weeks</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Dynamic Reels & Shorts</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Vertical formats configured with kinetic auto-captions</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Modern Color-Grading</p>
                <p className="font-sans text-[10px] text-brand-text-muted">High-vibrancy aesthetic filters applied custom to you</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Dual Sound Design</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Ambient track synchronization and dynamic audio sweeps</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-display text-xs font-bold text-brand-text">Metric Ad Variations</p>
                <p className="font-sans text-[10px] text-brand-text-muted">Multiple hook variations designed for target CTA conversion</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-display pt-2.5 border-t border-brand-outline/10 text-brand-text-muted">
            <span className="font-tech font-bold uppercase">TERMS //</span>
            <span className="font-semibold text-brand-text">ProRes primary masters and project files shared</span>
          </div>
        </div>
      </div>

      {/* Right Side - Retention Timeline Playground */}
      <div className="md:col-span-5 bg-white border border-brand-outline/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-tech tracking-wider text-[#00685b] uppercase">Retention Timeline Simulator</span>
            <span className="bg-emerald-500/10 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded-full font-tech">ANALYTICS ENGINE</span>
          </div>

          {/* Controls block */}
          <div className="bg-brand-surface-low rounded-xl p-3 border border-brand-outline/10 space-y-3">
            <div>
              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Sliders className="h-3 w-3 animate-spin" /> Choose Frame Format
              </p>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'reel', label: 'Vertical Reel' },
                  { id: 'ad', label: 'Ad Creative' },
                  { id: 'promo', label: 'Brand Promo' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFormatType(opt.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer ${
                      formatType === opt.id
                        ? 'bg-[#00685b] text-white shadow-sm'
                        : 'bg-white hover:bg-brand-outline/10 border border-brand-outline/20 text-brand-text-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Editing Pacing</p>
                <div className="flex bg-white rounded-lg p-0.5 border border-brand-outline/15">
                  <button
                    onClick={() => setPacing('snappy')}
                    className={`flex-1 py-1 text-[8.5px] font-bold uppercase rounded ${pacing === 'snappy' ? 'bg-[#00685b] text-white' : 'text-brand-text-muted'}`}
                  >
                    Snappy
                  </button>
                  <button
                    onClick={() => setPacing('cinematic')}
                    className={`flex-1 py-1 text-[8.5px] font-bold uppercase rounded ${pacing === 'cinematic' ? 'bg-[#00685b] text-white' : 'text-brand-text-muted'}`}
                  >
                    Cinematic
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Sound Options</p>
                <div className="grid grid-cols-2 gap-1 text-center">
                  <button
                    onClick={() => setMusicSynced(!musicSynced)}
                    className={`py-1 text-[8px] border rounded font-black cursor-pointer uppercase ${musicSynced ? 'bg-[rgba(0,104,91,0.08)] border-[#00685b] text-[#00685b]' : 'bg-white border-brand-outline/20 text-brand-text-muted'}`}
                  >
                    Music Sync
                  </button>
                  <button
                    onClick={() => setSoundFX(!soundFX)}
                    className={`py-1 text-[8px] border rounded font-black cursor-pointer uppercase ${soundFX ? 'bg-[rgba(0,104,91,0.08)] border-[#00685b] text-[#00685b]' : 'bg-white border-brand-outline/20 text-brand-text-muted'}`}
                  >
                    Sound FX
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Retention Chart Canvas */}
          <div className="bg-slate-900 rounded-xl p-4 text-white space-y-4">
            <div className="flex justify-between items-center text-[9px] text-[#00c9a7] font-mono">
              <span className="flex items-center gap-1"><Play className="h-3 w-3 fill-emerald-400" /> TIMELINE PREVIEW</span>
              <span>R-SCORE: {metrics.score}</span>
            </div>

            {/* Simulating a Timeline Track */}
            <div className="space-y-1.5 pt-1">
              <div className="h-6 bg-slate-800 rounded flex overflow-hidden border border-white/5 relative items-center text-[7px] font-mono font-bold text-white/50">
                <span className="bg-[#00c9a7]/20 border-r border-white/10 w-[15%] text-center text-[#00c9a7]">SEC 0-3 HOOK</span>
                <span className="bg-slate-700/30 border-r border-white/10 w-[55%] text-center">CORE CONTENT SPREAD</span>
                <span className="bg-indigo-500/10 w-[30%] text-indigo-400 text-center">CALL-TO-ACTION</span>
              </div>
              
              {/* Graphical retention curve */}
              <div className="h-16 flex items-end justify-between border-b border-white/10 relative px-2 select-none">
                <div className="absolute left-1 bottom-1 text-[6.5px] font-mono text-white/30">0s</div>
                <div className="absolute right-1 bottom-1 text-[6.5px] font-mono text-white/30">30s</div>
                
                {/* Simulated vertical retention bars */}
                {[
                  { h: metrics.initialDrop, l: 'Drop 1s' },
                  { h: Math.round((metrics.initialDrop + metrics.midRetention) / 2), l: 'Drop 5s' },
                  { h: metrics.midRetention, l: 'Drop 15s' },
                  { h: Math.round((metrics.midRetention + metrics.finishRate) / 2), l: 'Drop 22s' },
                  { h: metrics.finishRate, l: 'Completion' },
                ].map((bar, bIdx) => (
                  <div key={bIdx} className="flex flex-col items-center flex-1 mx-1.5 space-y-1 group">
                    <span className="text-[7.5px] font-mono font-black text-[#00c9a7] opacity-0 group-hover:opacity-100 transition-opacity duration-150">{bar.h}%</span>
                    <div 
                      className="w-full bg-[#00c9a7]/40 rounded-t border-t border-[#00c9a7]/80 hover:bg-[#00c9a7] transition-all"
                      style={{ height: `${bar.h * 0.45}px` }}
                    />
                    <span className="text-[5.5px] text-white/40 block leading-none font-mono truncate">{bar.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-brand-outline/10 text-center">
          <div>
            <h5 className="font-tech text-base font-extrabold text-[#00685b]">{metrics.initialDrop}%</h5>
            <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-wider">Hook Stop Rate</p>
          </div>
          <div>
            <h5 className="font-tech text-base font-extrabold text-[#00685b]">{metrics.midRetention}%</h5>
            <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-wider">15s Aud Hold</p>
          </div>
          <div>
            <h5 className="font-tech text-base font-extrabold text-[#00685b]">{metrics.finishRate}%</h5>
            <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-wider">Completion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
