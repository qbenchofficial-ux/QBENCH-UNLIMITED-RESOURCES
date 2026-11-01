import { motion } from 'motion/react';
import { Palette, Layers, Grid, Crop, Sparkles } from 'lucide-react';

export default function CreativeDesignVisual() {
  return (
    <div className="relative w-full h-full bg-[#021714] overflow-hidden select-none flex items-center justify-center">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#00685b]/35 via-[#021714] to-[#010c0a]" />

      {/* Swiss typography ruler ticks across top & left */}
      <div className="absolute top-0 left-0 right-0 h-3 border-b border-white/10 flex items-center justify-between px-2 font-mono text-[6px] text-white/30">
        <span>0mm</span>
        <span>50mm</span>
        <span>100mm</span>
        <span>150mm</span>
        <span>200mm</span>
        <span>250mm</span>
        <span>300mm</span>
      </div>

      {/* Main Composition: Layered Editorial Posters & Print Design Mockups */}
      <div className="relative z-10 w-full h-full max-w-[620px] flex items-center justify-center px-4 sm:px-6">
        
        {/* Left Poster (Magazine Layout Perspective) */}
        <motion.div
          className="absolute left-2 sm:left-8 w-36 sm:w-48 h-52 sm:h-64 bg-white rounded-xl shadow-2xl p-3 border border-slate-200 flex flex-col justify-between overflow-hidden"
          animate={{
            y: [-6, 6, -6],
            rotate: [-6, -4, -6],
            scale: [0.96, 1, 0.96],
          }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Magazine Header */}
          <div className="border-b border-black pb-1.5 flex items-center justify-between">
            <span className="font-display font-black text-[10px] sm:text-xs text-black tracking-tight">
              EDITORIAL
            </span>
            <span className="font-mono text-[7px] text-slate-500">ISSUE 26</span>
          </div>

          {/* Duotone Artistic Graphic Layout */}
          <div className="my-auto space-y-1.5">
            <div className="h-20 sm:h-24 bg-[#00685b] rounded-lg p-2 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-[#88f8c5]/30" />
              <span className="font-mono text-[7px] text-[#88f8c5]">SWISS STYLE</span>
              <div className="font-display font-black text-xs sm:text-sm leading-none">
                FORM &amp;<br />FUNCTION
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-200 rounded" />
              <div className="h-1.5 w-3/4 bg-slate-200 rounded" />
            </div>
          </div>

          {/* Footer Bar */}
          <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-mono text-[6.5px] text-slate-600">
            <span>GRID: 12-COL</span>
            <span className="text-[#00685b] font-bold">PRINT READY 300 DPI</span>
          </div>
        </motion.div>

        {/* Center Card: High-Impact Event Poster Design Mockup */}
        <motion.div
          className="relative z-20 w-48 sm:w-60 h-60 sm:h-72 bg-[#042821] rounded-2xl border-2 border-[#88f8c5]/50 shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-4 flex flex-col justify-between overflow-hidden backdrop-blur-xl"
          animate={{
            y: [5, -5, 5],
          }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Crop marks overlay (Swiss print standards) */}
          <div className="absolute top-1 left-1 font-mono text-[8px] text-[#88f8c5]/60">+</div>
          <div className="absolute top-1 right-1 font-mono text-[8px] text-[#88f8c5]/60">+</div>
          <div className="absolute bottom-1 left-1 font-mono text-[8px] text-[#88f8c5]/60">+</div>
          <div className="absolute bottom-1 right-1 font-mono text-[8px] text-[#88f8c5]/60">+</div>

          {/* Poster Masthead */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-mono text-[8px] font-extrabold text-[#88f8c5] uppercase tracking-widest">
              QBENCH EXHIBITION
            </span>
            <span className="h-2 w-2 rounded-full bg-[#88f8c5]" />
          </div>

          {/* Kinetic Headline & Geometric Graphic */}
          <div className="my-auto space-y-2">
            <h3 className="font-display font-black text-lg sm:text-2xl text-white leading-[0.95] tracking-tight">
              CREATIVE<br />
              <span className="text-[#88f8c5]">AVANT-GARDE</span>
            </h3>

            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-[#88f8c5] text-slate-900 flex items-center justify-center font-display font-black text-xs">
                Q
              </span>
              <span className="font-mono text-[7px] text-white/70">
                POSTER · FLYER · BROCHURE · PRINT
              </span>
            </div>
          </div>

          {/* Color Separations CMYK */}
          <div className="space-y-1.5 border-t border-white/10 pt-2">
            <div className="flex items-center justify-between font-mono text-[7px] text-white/70">
              <span>COLOR SEPARATION</span>
              <span className="text-[#88f8c5] font-bold">PANTONE® VERIFIED</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <div className="h-2 rounded-xs bg-cyan-400" title="Cyan" />
              <div className="h-2 rounded-xs bg-pink-500" title="Magenta" />
              <div className="h-2 rounded-xs bg-yellow-400" title="Yellow" />
              <div className="h-2 rounded-xs bg-slate-900 border border-white/20" title="Key/Black" />
            </div>
          </div>
        </motion.div>

        {/* Right Card: Print Specs & Swatches Floating Panel */}
        <motion.div
          className="absolute right-2 sm:right-8 w-36 sm:w-44 bg-white/95 rounded-xl p-3 border border-slate-200 shadow-2xl flex flex-col justify-between gap-2"
          animate={{
            y: [-5, 5, -5],
            rotate: [6, 4, 6],
            scale: [0.95, 1, 0.95],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] font-bold text-slate-800 uppercase">
              PRINT SPECS
            </span>
            <Crop className="h-3 w-3 text-[#00685b]" />
          </div>

          <div className="space-y-1 font-mono text-[7.5px] text-slate-600">
            <div className="flex justify-between">
              <span>Paper Stock:</span>
              <span className="font-bold text-slate-900">350 GSM Matte</span>
            </div>
            <div className="flex justify-between">
              <span>Finish:</span>
              <span className="font-bold text-[#00685b]">Spot UV Foil</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span className="font-bold text-slate-900">300 DPI Vector</span>
            </div>
          </div>

          <div className="p-1 rounded bg-[#00685b]/10 text-center font-mono text-[7px] text-[#00685b] font-bold">
            CMYK OFFSET READY
          </div>
        </motion.div>

      </div>

      {/* Watermarks */}
      <div className="absolute top-3 left-4 font-mono text-[9px] text-[#88f8c5]/50 tracking-wider">
        QBENCH // PRINT & EDITORIAL GRAPHIC ATELIER
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-white/40 tracking-wider">
        SWISS INTERNATIONAL TYPOGRAPHIC STYLE
      </div>
    </div>
  );
}
