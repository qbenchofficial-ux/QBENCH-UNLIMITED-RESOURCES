import { motion } from 'motion/react';

export default function BrandingVisual() {
  return (
    <div className="relative w-full h-full bg-[#031b17] overflow-hidden select-none flex items-center justify-center">
      {/* Background radial gradient and geometric grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00685b]/35 via-[#031b17] to-[#01100e]" />
      
      {/* Architectural Blueprint grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="branding-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#88f8c5" strokeWidth="0.5" />
            <circle cx="0" cy="0" r="1" fill="#88f8c5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#branding-grid)" />
      </svg>

      {/* Golden Ratio & Construction Circles */}
      <motion.svg
        className="absolute w-[440px] h-[440px] opacity-25 pointer-events-none"
        viewBox="0 0 400 400"
        animate={{ rotate: 360 }}
        transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="200" cy="200" r="160" fill="none" stroke="#88f8c5" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="200" cy="200" r="100" fill="none" stroke="#00685b" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="60" fill="none" stroke="#88f8c5" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="200" y1="20" x2="200" y2="380" stroke="#88f8c5" strokeWidth="0.75" strokeDasharray="3 3" />
        <line x1="20" y1="200" x2="380" y2="200" stroke="#88f8c5" strokeWidth="0.75" strokeDasharray="3 3" />
        <rect x="120" y="120" width="160" height="160" fill="none" stroke="#88f8c5" strokeWidth="0.75" strokeDasharray="4 4" transform="rotate(45 200 200)" />
      </motion.svg>

      {/* Main Composition: Center floating emblem + cards */}
      <div className="relative z-10 w-full h-full max-w-[560px] flex items-center justify-center px-4">
        
        {/* Floating Business Card 1 (Back/Perspective) */}
        <motion.div
          className="absolute -left-4 sm:left-4 top-8 sm:top-10 w-44 sm:w-52 h-28 sm:h-32 bg-gradient-to-br from-[#052d26] to-[#011a15] rounded-xl p-3 border border-[#88f8c5]/25 shadow-2xl backdrop-blur-md flex flex-col justify-between"
          animate={{
            y: [-6, 6, -6],
            rotate: [-8, -6, -8],
            rotateX: [6, 12, 6],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-xs text-white tracking-widest flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#88f8c5] animate-ping" />
              QBENCH
            </span>
            <span className="font-mono text-[9px] text-[#88f8c5]/80">IDENTITY</span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-16 bg-[#88f8c5]/40 rounded" />
            <div className="h-1 w-24 bg-white/20 rounded" />
            <div className="h-1 w-20 bg-white/10 rounded" />
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <span className="font-mono text-[8px] text-white/50 tracking-wider">EST. 2026</span>
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#00685b]" />
              <span className="h-2 w-2 rounded-full bg-[#88f8c5]" />
              <span className="h-2 w-2 rounded-full bg-white" />
            </div>
          </div>
        </motion.div>

        {/* Central Kinetic Monogram / Logo Transformation */}
        <motion.div
          className="relative z-20 flex flex-col items-center justify-center"
          animate={{ scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Animated Glowing Ring */}
          <motion.div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-tr from-[#00685b] via-[#178373] to-[#88f8c5] p-[2px] shadow-[0_0_50px_rgba(0,104,91,0.5)]"
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-full h-full bg-[#041d18] rounded-3xl flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00685b]/40 via-transparent to-transparent" />
              
              {/* Dynamic Logo Symbol */}
              <motion.svg
                className="w-16 h-16 sm:w-20 sm:h-20 text-[#88f8c5] relative z-10"
                viewBox="0 0 100 100"
                fill="none"
              >
                {/* Outer dynamic polygon */}
                <motion.polygon
                  points="50,10 90,30 90,70 50,90 10,70 10,30"
                  stroke="#88f8c5"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{
                    strokeDasharray: ['10 150', '150 0', '10 150'],
                  }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Inner stylized Q Bench Monogram */}
                <path
                  d="M32 40 C32 28, 68 28, 68 40 C68 56, 32 56, 32 72 L68 72"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="68" cy="72" r="3.5" fill="#88f8c5" />
              </motion.svg>
            </div>
          </motion.div>

          {/* Kinetic Typography Label */}
          <motion.div
            className="mt-3 flex items-center gap-2 px-3 py-1 bg-white/5 border border-[#88f8c5]/30 rounded-full backdrop-blur-md"
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#88f8c5]" />
            <span className="font-mono text-[10px] font-bold text-white tracking-widest uppercase">
              GRID SYSTEM · 1:1.618
            </span>
          </motion.div>
        </motion.div>

        {/* Floating Brand Guidelines Card 2 (Front/Perspective) */}
        <motion.div
          className="absolute -right-4 sm:right-4 bottom-8 sm:bottom-10 w-44 sm:w-52 h-28 sm:h-32 bg-white/95 rounded-xl p-3 border border-slate-200 shadow-2xl flex flex-col justify-between"
          animate={{
            y: [6, -6, 6],
            rotate: [6, 8, 6],
            rotateX: [-6, -10, -6],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-mono text-[9px] font-bold text-slate-800 uppercase tracking-wider">
              PALETTE / SWATCH
            </span>
            <span className="font-mono text-[8px] text-[#00685b] font-bold">CMYK / RGB</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 my-auto">
            <div className="h-7 rounded bg-[#00685b] flex items-end p-0.5">
              <span className="text-[6px] font-mono text-white/90">#00685B</span>
            </div>
            <div className="h-7 rounded bg-[#178373] flex items-end p-0.5">
              <span className="text-[6px] font-mono text-white/90">#178373</span>
            </div>
            <div className="h-7 rounded bg-[#88f8c5] flex items-end p-0.5">
              <span className="text-[6px] font-mono text-slate-900 font-bold">#88F8C5</span>
            </div>
            <div className="h-7 rounded bg-[#031b17] flex items-end p-0.5">
              <span className="text-[6px] font-mono text-white/80">#031B17</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
            <span>TYPE: SYNE / INTER</span>
            <span className="font-bold text-[#00685b]">AA PASSED</span>
          </div>
        </motion.div>

      </div>

      {/* Floating Kinetic Specs (Corners) */}
      <div className="absolute top-3 left-4 font-mono text-[9px] text-[#88f8c5]/50 tracking-wider">
        QBENCH // BRAND IDENTITY STUDIO
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-white/40 tracking-wider">
        VECTOR RESOLUTION: 1920×1080 · 60FPS
      </div>
    </div>
  );
}
