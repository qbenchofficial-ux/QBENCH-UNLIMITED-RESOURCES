import { motion } from 'motion/react';
import { Smartphone, Monitor, Code2, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

export default function WebsiteDevelopmentVisual() {
  return (
    <div className="relative w-full h-full bg-[#021613] overflow-hidden select-none flex items-center justify-center">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#00685b]/35 via-[#021613] to-[#010b0a]" />

      {/* Cybernetic Code Matrix Lines in background */}
      <div className="absolute inset-0 opacity-10 font-mono text-[9px] text-[#88f8c5] p-4 leading-relaxed overflow-hidden pointer-events-none">
        <div>import React from 'react';</div>
        <div>export function createScalablePlatform() &#123;</div>
        <div>&nbsp;&nbsp;return &lt;Experience speed=&#123;0.02&#125; seo=&#123;100&#125; /&gt;;</div>
        <div>&#125;</div>
        <div>// Vercel Edge Serverless Architecture · Next.js / Vite SPA</div>
      </div>

      {/* Main Composition: Layered Desktop Browser Window + Overlapping Smartphone */}
      <div className="relative z-10 w-full h-full max-w-[620px] flex items-center justify-center px-4 sm:px-6">
        
        {/* Desktop Browser Mockup Window */}
        <motion.div
          className="w-full max-w-[500px] h-56 sm:h-68 bg-[#04241e]/95 rounded-2xl border border-[#88f8c5]/30 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Browser Chrome Header */}
          <div className="h-8 bg-[#021a15] border-b border-white/10 px-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
            </div>

            {/* URL Search bar */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-md border border-white/5 text-[8px] sm:text-[9px] font-mono text-white/80 w-52 sm:w-64 justify-center">
              <ShieldCheck className="h-2.5 w-2.5 text-[#88f8c5]" />
              <span className="text-[#88f8c5]">https://</span>
              <span>qbench-platform.design</span>
            </div>

            <div className="flex items-center gap-1.5 text-white/40">
              <Code2 className="h-3 w-3" />
            </div>
          </div>

          {/* Browser Inner Page Content Mockup */}
          <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden">
            {/* Nav Row */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xs text-white">QBENCH</span>
                <span className="font-mono text-[7px] text-[#88f8c5] bg-[#00685b]/40 px-1.5 rounded">v2.4 PROD</span>
              </div>
              <div className="flex items-center gap-3 text-[8px] font-mono text-white/60">
                <span>SERVICES</span>
                <span>WORKS</span>
                <span className="text-[#88f8c5] font-bold">CONTACT</span>
              </div>
            </div>

            {/* Web Hero Mockup Banner */}
            <div className="my-auto grid grid-cols-12 gap-3 items-center">
              <div className="col-span-7 space-y-1.5">
                <span className="font-mono text-[7px] text-[#88f8c5] tracking-widest uppercase block">
                  SPEED INDEX: 99/100
                </span>
                <h3 className="font-display font-black text-xs sm:text-sm text-white leading-tight">
                  High-Performance Web Applications Built to Scale.
                </h3>
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-4 px-2 rounded bg-[#00685b] flex items-center text-[7px] font-bold text-white">
                    Explore Build
                  </div>
                  <div className="h-4 px-2 rounded bg-white/10 flex items-center text-[7px] font-mono text-white/80">
                    Lighthouse 100%
                  </div>
                </div>
              </div>

              {/* Code Snippet Box on the right */}
              <div className="col-span-5 bg-black/60 rounded-lg p-2 border border-white/10 space-y-1 font-mono text-[6.5px] sm:text-[7px]">
                <div className="flex items-center justify-between text-white/40 border-b border-white/5 pb-0.5">
                  <span>Stack.tsx</span>
                  <span className="text-[#88f8c5]">TypeScript</span>
                </div>
                <div className="text-white/80">
                  <span className="text-pink-400">const</span> stack = &#123;
                </div>
                <div className="text-white/70 pl-2">
                  framework: <span className="text-emerald-400">'React 19'</span>,
                </div>
                <div className="text-white/70 pl-2">
                  css: <span className="text-emerald-400">'Tailwind v4'</span>,
                </div>
                <div className="text-white/70 pl-2">
                  database: <span className="text-[#88f8c5]">'Supabase'</span>
                </div>
                <div className="text-white/80">&#125;;</div>
              </div>
            </div>

            {/* Performance status footer bar */}
            <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[7px] sm:text-[8px] font-mono text-white/60">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-2.5 w-2.5" /> Full SSR / Edge Cached
              </span>
              <span>TTFB: 18ms</span>
              <span className="text-[#88f8c5]">Responsive Breakpoints Active</span>
            </div>
          </div>
        </motion.div>

        {/* Floating Mobile Smartphone (Responsive perspective overlay) */}
        <motion.div
          className="absolute right-0 sm:right-4 bottom-2 sm:bottom-4 w-28 sm:w-36 h-48 sm:h-56 bg-black rounded-[22px] border-2 border-[#88f8c5]/40 shadow-2xl p-1.5 flex flex-col justify-between"
          animate={{
            y: [6, -6, 6],
            rotate: [4, 2, 4],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Mobile screen */}
          <div className="w-full h-full bg-[#03221b] rounded-[18px] p-2 flex flex-col justify-between overflow-hidden relative">
            {/* Notch */}
            <div className="h-2.5 w-10 bg-black rounded-full mx-auto" />

            {/* Mobile layout */}
            <div className="space-y-1.5 text-center my-auto">
              <div className="h-6 w-6 rounded-lg bg-[#00685b] mx-auto flex items-center justify-center font-display font-black text-[9px] text-white">
                Q
              </div>
              <div className="font-display font-black text-[8px] text-white leading-tight">
                Mobile-First UX
              </div>
              <div className="h-1 w-12 bg-[#88f8c5] rounded mx-auto" />
            </div>

            {/* Mobile bottom touch pill */}
            <div className="h-1 w-10 bg-white/40 rounded-full mx-auto" />
          </div>
        </motion.div>

      </div>

      {/* Watermarks */}
      <div className="absolute top-3 left-4 font-mono text-[9px] text-[#88f8c5]/50 tracking-wider">
        QBENCH // PRODUCTION WEB ARCHITECTURE
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-white/40 tracking-wider">
        RESPONSIVE VIEWPORT 1440 · 768 · 375
      </div>
    </div>
  );
}
