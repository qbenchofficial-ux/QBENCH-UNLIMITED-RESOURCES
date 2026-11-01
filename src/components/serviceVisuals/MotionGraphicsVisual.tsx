import { motion } from 'motion/react';
import { Sparkles, Layers, Orbit } from 'lucide-react';

export default function MotionGraphicsVisual() {
  return (
    <div className="relative w-full h-full bg-[#021411] overflow-hidden select-none flex items-center justify-center">
      {/* Background kinetic radial flare */}
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-[#00685b]/40 blur-[80px]"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Dynamic 3D Geometric Wireframe Octagon & Rings */}
      <motion.svg
        className="absolute w-[380px] sm:w-[480px] h-[380px] sm:h-[480px] opacity-30 pointer-events-none"
        viewBox="0 0 400 400"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <ellipse cx="200" cy="200" rx="180" ry="70" fill="none" stroke="#88f8c5" strokeWidth="1.5" strokeDasharray="6 8" />
        <ellipse cx="200" cy="200" rx="70" ry="180" fill="none" stroke="#00685b" strokeWidth="1.5" strokeDasharray="4 6" />
        <circle cx="200" cy="200" r="130" fill="none" stroke="#88f8c5" strokeWidth="1" strokeDasharray="3 5" />
      </motion.svg>

      {/* Main Kinetic Motion Stage */}
      <div className="relative z-10 w-full h-full max-w-[600px] flex items-center justify-center">
        
        {/* Orbiting Particle 1 */}
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-[#88f8c5] shadow-[0_0_20px_#88f8c5]"
          animate={{
            x: [-160, 160, -160],
            y: [-70, 70, -70],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Orbiting Particle 2 */}
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_15px_white]"
          animate={{
            x: [140, -140, 140],
            y: [-90, 90, -90],
            scale: [1.2, 0.7, 1.2],
          }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Center 3D Isometric Morphing Cube Composition */}
        <div className="relative flex flex-col items-center justify-center">
          
          <motion.div
            className="w-36 h-36 sm:w-48 sm:h-48 relative flex items-center justify-center"
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {/* Square 1 */}
            <motion.div
              className="absolute inset-2 rounded-3xl border-2 border-[#88f8c5]/70 bg-gradient-to-tr from-[#00685b]/40 to-transparent backdrop-blur-xs"
              animate={{
                rotate: [0, -45, 0],
                borderRadius: ['24px', '40px', '24px'],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Square 2 */}
            <motion.div
              className="absolute inset-5 rounded-3xl border-2 border-[#178373] bg-[#022822]/60"
              animate={{
                rotate: [45, 90, 45],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Center Dynamic Core */}
            <motion.div
              className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#00685b] to-[#88f8c5] shadow-[0_0_40px_rgba(136,248,197,0.6)] flex items-center justify-center text-slate-950"
              animate={{
                scale: [0.9, 1.1, 0.9],
                rotate: [0, -180, -360],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-8 w-8 text-slate-900 fill-slate-900" />
            </motion.div>
          </motion.div>

          {/* Kinetic Motion Design Pill & Specs */}
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <div className="px-3 py-1 rounded-full bg-white/10 border border-[#88f8c5]/30 backdrop-blur-md flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#88f8c5] animate-ping" />
              <span className="font-mono text-[9px] font-bold text-white tracking-widest uppercase">
                60 FPS LIQUID BEZIER INTERPOLATION
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[8px] text-[#88f8c5]/80">
              <span>EASING: CUBIC-BEZIER(0.16, 1, 0.3, 1)</span>
              <span>·</span>
              <span>RENDER: AFTER EFFECTS / LOTTIE</span>
            </div>
          </div>

        </div>

      </div>

      {/* Watermarks */}
      <div className="absolute top-3 left-4 font-mono text-[9px] text-[#88f8c5]/50 tracking-wider">
        QBENCH // MOTION DESIGN & 3D STUDIO
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-white/40 tracking-wider">
        KEYFRAME ANIMATION SYSTEM
      </div>
    </div>
  );
}
