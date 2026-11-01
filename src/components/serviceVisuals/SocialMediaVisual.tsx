import { motion } from 'motion/react';
import { Heart, MessageCircle, Send, Bookmark, Sparkles, TrendingUp } from 'lucide-react';

export default function SocialMediaVisual() {
  return (
    <div className="relative w-full h-full bg-[#021814] overflow-hidden select-none flex items-center justify-center">
      {/* Background dynamic ambient orbs */}
      <motion.div
        className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#00685b]/30 blur-3xl"
        animate={{ scale: [1, 1.25, 1], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-[#88f8c5]/20 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], y: [0, -20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Dynamic diagonal stripe texture */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,_rgba(0,104,91,0.06)_25%,_transparent_25%,_transparent_50%,_rgba(0,104,91,0.06)_50%,_rgba(0,104,91,0.06)_75%,_transparent_75%,_transparent)] bg-[length:24px_24px] opacity-40" />

      {/* Main Composition: Layered Social Posts in 3D Stack */}
      <div className="relative z-10 w-full h-full max-w-[620px] flex items-center justify-center px-4">
        
        {/* Left Layer: Story / Reel Post (9:16 vertical card) */}
        <motion.div
          className="absolute left-2 sm:left-6 w-32 sm:w-40 h-52 sm:h-64 rounded-2xl bg-gradient-to-b from-[#004d43] to-[#01221d] border border-[#88f8c5]/30 p-2.5 shadow-2xl flex flex-col justify-between"
          animate={{
            y: [-8, 8, -8],
            rotate: [-6, -4, -6],
            scale: [0.96, 1, 0.96],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Story header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full ring-1 ring-[#88f8c5] p-0.5">
                <div className="w-full h-full rounded-full bg-[#88f8c5]" />
              </div>
              <span className="font-display font-bold text-[8px] sm:text-[9px] text-white">qbench.co</span>
            </div>
            <span className="font-mono text-[7px] text-[#88f8c5] bg-white/10 px-1 rounded font-bold">REEL</span>
          </div>

          {/* Story Visual Creative */}
          <div className="my-auto rounded-lg bg-black/40 border border-white/5 p-2 space-y-1.5 text-center">
            <span className="text-[14px]">🔥</span>
            <div className="font-display font-black text-[10px] text-white leading-tight">
              VIRAL CONTENT
            </div>
            <div className="font-mono text-[8px] text-[#88f8c5]">+184K REACH</div>
          </div>

          {/* Engagement interaction bar */}
          <div className="flex items-center justify-between text-white/80 px-1 pt-1 border-t border-white/10">
            <Heart className="h-3.5 w-3.5 fill-[#88f8c5] text-[#88f8c5]" />
            <MessageCircle className="h-3.5 w-3.5" />
            <Send className="h-3.5 w-3.5" />
          </div>
        </motion.div>

        {/* Center Layer: High-End Square Carousel Post (1:1) */}
        <motion.div
          className="relative z-20 w-52 sm:w-64 h-56 sm:h-70 rounded-2xl bg-[#062c25]/95 border-2 border-[#88f8c5]/40 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col justify-between"
          animate={{
            y: [5, -5, 5],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Post Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#00685b] to-[#88f8c5] flex items-center justify-center font-display font-black text-[10px] text-slate-900">
                Q
              </div>
              <div>
                <div className="font-display font-bold text-[10px] text-white leading-tight">QBENCH Media</div>
                <div className="font-sans text-[7px] text-[#88f8c5]">Sponsored · High Engagement</div>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-[#88f8c5] animate-ping" />
          </div>

          {/* Creative Graphic Display (Carousel Slide 01/05) */}
          <div className="relative my-2 h-28 sm:h-36 rounded-xl bg-gradient-to-tr from-[#011a15] to-[#043d34] border border-[#88f8c5]/20 overflow-hidden p-3 flex flex-col justify-between">
            {/* Carousel badge */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[7px] text-white/90 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                1 / 5 SLIDES
              </span>
              <Sparkles className="h-3.5 w-3.5 text-[#88f8c5]" />
            </div>

            {/* Kinetic Creative Copy */}
            <div className="space-y-1">
              <span className="font-mono text-[8px] text-[#88f8c5] tracking-widest uppercase block">
                CREATIVE AD FORMAT
              </span>
              <h4 className="font-display text-xs sm:text-sm font-black text-white leading-tight">
                Scroll-Stopping Social Campaigns
              </h4>
            </div>

            {/* Slide dots */}
            <div className="flex gap-1 justify-center">
              <span className="h-1 w-4 rounded-full bg-[#88f8c5]" />
              <span className="h-1 w-1.5 rounded-full bg-white/30" />
              <span className="h-1 w-1.5 rounded-full bg-white/30" />
              <span className="h-1 w-1.5 rounded-full bg-white/30" />
            </div>
          </div>

          {/* Social Stats Action Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-white/90">
              <div className="flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.2 }}>
                  <Heart className="h-4 w-4 text-red-400 fill-red-400 cursor-pointer" />
                </motion.div>
                <MessageCircle className="h-4 w-4 text-white/80 cursor-pointer" />
                <Send className="h-4 w-4 text-white/80 cursor-pointer" />
              </div>
              <Bookmark className="h-4 w-4 text-[#88f8c5] fill-[#88f8c5]" />
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-white/70">
              <span className="font-bold text-white">4,892 Likes</span>
              <span className="text-[#88f8c5] font-semibold">100% On-Brand</span>
            </div>
          </div>
        </motion.div>

        {/* Right Layer: Analytics / Notification Floating Card */}
        <motion.div
          className="absolute right-2 sm:right-6 w-36 sm:w-44 bg-white/95 rounded-2xl p-3 border border-slate-200 shadow-2xl flex flex-col justify-between gap-2"
          animate={{
            y: [-6, 6, -6],
            rotate: [6, 4, 6],
            scale: [0.95, 1, 0.95],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] font-extrabold uppercase text-[#00685b] tracking-wider">
              CAMPAIGN ROI
            </span>
            <TrendingUp className="h-3 w-3 text-emerald-600" />
          </div>

          <div className="space-y-0.5">
            <span className="font-display font-black text-sm text-slate-900 leading-none block">
              +320% CTR
            </span>
            <span className="font-mono text-[7px] text-slate-500">Instagram & LinkedIn Ads</span>
          </div>

          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#00685b] to-[#88f8c5]"
              animate={{ width: ['30%', '92%', '30%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="flex items-center justify-between text-[7px] font-mono text-slate-600">
            <span>SAVED ADS: 1.4K</span>
            <span className="text-emerald-700 font-bold">TOP PERFORMER</span>
          </div>
        </motion.div>

      </div>

      {/* Subtitle tag / watermark */}
      <div className="absolute top-3 left-4 font-mono text-[9px] text-[#88f8c5]/50 tracking-wider">
        QBENCH // SOCIAL CREATIVE SUITE
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-white/40 tracking-wider">
        OPTIMIZED FOR 4:5 · 9:16 · 1:1
      </div>
    </div>
  );
}
