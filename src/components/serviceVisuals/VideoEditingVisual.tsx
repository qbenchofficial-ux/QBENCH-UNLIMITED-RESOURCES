import { motion } from 'motion/react';
import { Play, Film, Scissors, Volume2, Sparkles, Sliders } from 'lucide-react';

export default function VideoEditingVisual() {
  return (
    <div className="relative w-full h-full bg-[#031512] overflow-hidden select-none flex items-center justify-center">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#005147]/40 via-[#031512] to-[#010908]" />

      {/* Film Perforations (Top & Bottom borders) */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-black/60 border-b border-white/5 flex items-center justify-between px-3 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="h-2 w-3 rounded-xs bg-white/20 shrink-0 mx-1" />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/60 border-t border-white/5 flex items-center justify-between px-3 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="h-2 w-3 rounded-xs bg-white/20 shrink-0 mx-1" />
        ))}
      </div>

      {/* Main Composition: NLE Pro Timeline & Cinematic Preview Monitor */}
      <div className="relative z-10 w-full h-full max-w-[620px] flex flex-col justify-center px-4 sm:px-6 py-6 gap-3">
        
        {/* Top: Video Monitor Screen */}
        <div className="relative w-full h-36 sm:h-44 bg-black/90 rounded-xl border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between p-3">
          {/* Ambient video grading color backdrop */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#00685b]/30 via-transparent to-[#88f8c5]/15" />
          
          {/* Top monitor overlay info */}
          <div className="relative z-10 flex items-center justify-between text-[8px] sm:text-[9px] font-mono">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-red-500 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                REC 4K UHD
              </span>
              <span className="text-white/60">24.000 FPS</span>
              <span className="text-[#88f8c5] font-semibold">PRORES 422 HQ</span>
            </div>
            <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">
              00:01:24:18
            </span>
          </div>

          {/* Center Cinematic Composition & Play Button */}
          <div className="relative z-10 flex items-center justify-center my-auto">
            <motion.div
              className="h-12 w-12 rounded-full bg-[#00685b]/80 border-2 border-[#88f8c5] flex items-center justify-center shadow-[0_0_30px_rgba(136,248,197,0.4)] cursor-pointer text-white"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Play className="h-5 w-5 fill-white ml-0.5" />
            </motion.div>
          </div>

          {/* Audio Waveform Real-time bouncing bars */}
          <div className="relative z-10 flex items-end justify-between h-5 gap-1 px-2 border-t border-white/5 pt-1">
            <div className="flex items-center gap-1 text-[8px] font-mono text-[#88f8c5]">
              <Volume2 className="h-3 w-3" />
              <span>CH1 / CH2</span>
            </div>
            <div className="flex items-end gap-1 h-full">
              {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65, 95, 40, 70, 85].map((val, idx) => (
                <motion.div
                  key={idx}
                  className="w-1 bg-[#88f8c5] rounded-t-xs"
                  animate={{ height: [`${val * 0.3}%`, `${val}%`, `${val * 0.4}%`] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.05, ease: 'easeInOut' }}
                />
              ))}
            </div>
            <span className="text-[8px] font-mono text-emerald-400 font-bold">-6 dB</span>
          </div>
        </div>

        {/* Bottom: Multi-Track Video Timeline */}
        <div className="relative w-full bg-[#021f1a]/95 rounded-xl border border-[#00685b]/40 p-2.5 shadow-xl space-y-1.5">
          {/* Timeline ruler */}
          <div className="flex items-center justify-between text-[8px] font-mono text-white/40 border-b border-white/10 pb-1 px-1">
            <span>00:00:00</span>
            <span>00:00:30</span>
            <span>00:01:00</span>
            <span>00:01:30</span>
            <span>00:02:00</span>
          </div>

          {/* Sweeping Playhead */}
          <motion.div
            className="absolute top-2 bottom-2 w-0.5 bg-red-500 shadow-[0_0_10px_red] z-20 pointer-events-none"
            animate={{ left: ['8%', '92%', '8%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-2.5 h-2.5 -ml-1 bg-red-500 rounded-xs rotate-45" />
          </motion.div>

          {/* Video Track 1 */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[7px] text-[#88f8c5] font-bold w-6">V2</span>
            <div className="flex-1 h-5 bg-[#05352c] rounded border border-[#88f8c5]/30 flex items-center justify-between px-2 text-[8px] font-mono text-white/90">
              <span className="flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-[#88f8c5]" /> Color Grade (Teal & Orange)
              </span>
              <span className="text-[7px] text-white/50">LUMETRI</span>
            </div>
          </div>

          {/* Video Track 2 (Clips) */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[7px] text-[#88f8c5] font-bold w-6">V1</span>
            <div className="flex-1 flex gap-1 h-6">
              <div className="flex-1 bg-[#00685b] rounded border border-white/20 flex items-center px-2 text-[8px] font-mono text-white font-semibold truncate">
                Intro_Scene_4K.mov
              </div>
              <div className="flex-2 bg-[#178373] rounded border border-white/20 flex items-center px-2 text-[8px] font-mono text-white font-semibold truncate">
                Product_Hero_Cut.mov
              </div>
              <div className="w-14 bg-[#005147] rounded border border-white/20 flex items-center justify-center text-[7px] font-mono text-white/80">
                Outro.mov
              </div>
            </div>
          </div>

          {/* Audio Track */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[7px] text-emerald-400 font-bold w-6">A1</span>
            <div className="flex-1 h-4 bg-[#022821] rounded border border-emerald-500/30 flex items-center justify-between px-2 text-[7px] font-mono text-emerald-300">
              <span>Sound_Design_Master.wav</span>
              <span>48 kHz · 24-bit</span>
            </div>
          </div>
        </div>

      </div>

      {/* Corner indicators */}
      <div className="absolute top-3 left-4 font-mono text-[9px] text-[#88f8c5]/50 tracking-wider">
        QBENCH // POST-PRODUCTION & COLOR SUITE
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-white/40 tracking-wider">
        CINEMATIC NLE TIMELINE
      </div>
    </div>
  );
}
