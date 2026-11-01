import { motion } from 'motion/react';
import { TrendingUp, Target, Users, Zap, BarChart3, ArrowUpRight } from 'lucide-react';

export default function DigitalMarketingVisual() {
  return (
    <div className="relative w-full h-full bg-[#021815] overflow-hidden select-none flex items-center justify-center">
      {/* Background ambient gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#00685b]/30 via-[#021815] to-[#010e0c]" />

      {/* Futuristic matrix dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#88f8c5_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

      {/* Main Composition: High-Conversion Performance Dashboard */}
      <div className="relative z-10 w-full h-full max-w-[620px] flex items-center justify-center px-4 sm:px-6">
        
        {/* Core Dashboard Card */}
        <div className="w-full bg-[#03241e]/90 rounded-2xl border border-[#88f8c5]/25 p-4 sm:p-5 shadow-2xl backdrop-blur-xl space-y-4">
          
          {/* Dashboard Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#00685b] text-[#88f8c5]">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <h4 className="font-display font-black text-xs sm:text-sm text-white leading-tight">
                  Omnichannel Performance Engine
                </h4>
                <span className="font-mono text-[8px] text-[#88f8c5]">Google Ads · Meta · SEO · Conversion Funnels</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00685b]/40 border border-[#88f8c5]/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[8px] font-bold text-white uppercase tracking-wider">LIVE 4.8x ROAS</span>
            </div>
          </div>

          {/* Metric KPIs Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <motion.div
              className="bg-[#021815] rounded-xl p-2.5 border border-white/5 space-y-0.5"
              whileHover={{ y: -2 }}
            >
              <span className="font-mono text-[7px] text-white/60 uppercase block">Total Conversions</span>
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-sm sm:text-base text-white">14,290</span>
                <span className="font-mono text-[8px] font-bold text-emerald-400 flex items-center">
                  +184% <ArrowUpRight className="h-2.5 w-2.5" />
                </span>
              </div>
            </motion.div>

            <motion.div
              className="bg-[#021815] rounded-xl p-2.5 border border-white/5 space-y-0.5"
              whileHover={{ y: -2 }}
            >
              <span className="font-mono text-[7px] text-white/60 uppercase block">Avg. Cost Per Lead</span>
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-sm sm:text-base text-[#88f8c5]">₹142</span>
                <span className="font-mono text-[8px] font-bold text-emerald-400">-38%</span>
              </div>
            </motion.div>

            <motion.div
              className="bg-[#021815] rounded-xl p-2.5 border border-white/5 space-y-0.5"
              whileHover={{ y: -2 }}
            >
              <span className="font-mono text-[7px] text-white/60 uppercase block">Organic Traffic</span>
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-sm sm:text-base text-white">280K+</span>
                <span className="font-mono text-[8px] font-bold text-emerald-400 flex items-center">
                  +210% <ArrowUpRight className="h-2.5 w-2.5" />
                </span>
              </div>
            </motion.div>
          </div>

          {/* Dynamic Animated Chart Area */}
          <div className="relative h-28 sm:h-32 bg-[#011411] rounded-xl border border-white/5 p-3 flex flex-col justify-between overflow-hidden">
            {/* Chart grid horizontal reference lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-10">
              <div className="w-full border-b border-white" />
              <div className="w-full border-b border-white" />
              <div className="w-full border-b border-white" />
            </div>

            {/* Glowing animated SVG Area Chart */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="marketing-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#88f8c5" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00685b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <motion.path
                d="M 0 90 Q 60 70, 120 75 T 240 45 T 320 30 T 400 10 L 400 100 L 0 100 Z"
                fill="url(#marketing-gradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />

              {/* Stroke line */}
              <motion.path
                d="M 0 90 Q 60 70, 120 75 T 240 45 T 320 30 T 400 10"
                fill="none"
                stroke="#88f8c5"
                strokeWidth="3"
                strokeLinecap="round"
                animate={{
                  d: [
                    "M 0 90 Q 60 70, 120 75 T 240 45 T 320 30 T 400 10",
                    "M 0 85 Q 60 75, 120 60 T 240 40 T 320 20 T 400 8",
                    "M 0 90 Q 60 70, 120 75 T 240 45 T 320 30 T 400 10"
                  ]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Pulse Peak Indicator */}
              <circle cx="400" cy="10" r="5" fill="#88f8c5" />
              <circle cx="400" cy="10" r="10" fill="none" stroke="#88f8c5" opacity="0.6">
                <animate attributeName="r" values="5;14;5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>

            {/* Bottom Chart Labels */}
            <div className="relative z-10 flex items-center justify-between text-[7px] font-mono text-white/50 pt-1">
              <span>WEEK 01</span>
              <span>WEEK 02</span>
              <span>WEEK 03</span>
              <span>WEEK 04</span>
              <span className="text-[#88f8c5] font-bold">SCALE PHASE (CURRENT)</span>
            </div>
          </div>

          {/* Bottom active campaign tags */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[8px] font-mono">
            <span className="px-2 py-0.5 rounded bg-white/5 text-white/80 border border-white/5">
              TARGET: HIGH INTENT BUYERS
            </span>
            <span className="px-2 py-0.5 rounded bg-[#00685b]/30 text-[#88f8c5] border border-[#88f8c5]/20 font-bold">
              SEARCH & DISPLAY AUDIT PASSED
            </span>
          </div>

        </div>

      </div>

      {/* Watermarks */}
      <div className="absolute top-3 left-4 font-mono text-[9px] text-[#88f8c5]/50 tracking-wider">
        QBENCH // PERFORMANCE MARKETING & SEO
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-white/40 tracking-wider">
        CONTINUOUS CONVERSION TRACKING
      </div>
    </div>
  );
}
