import React, { useState } from 'react';
import { NavSection, ServiceTab } from '../types';
import QBenchLogo from './QBenchLogo';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  ArrowUp,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';

interface FooterProps {
  onNavigate: (section: NavSection, tab?: ServiceTab) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [copied, setCopied] = useState(false);
  
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText('qbench.official@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer id="qbench-footer" className="w-full bg-[#0d1414] text-white/90 border-t border-white/5 pt-16 pb-8 px-6 md:px-12 select-none">
      <div className="mx-auto max-w-7xl">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-white/5">
          
          {/* Logo & Tagline Column */}
          <div className="lg:col-span-4 space-y-6">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => onNavigate('home')}
            >
              {/* Custom Logo Component over dark background */}
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <QBenchLogo variant="horizontal" />
              </div>
            </div>
            
            <p className="font-sans text-xs text-white/60 leading-relaxed font-medium">
              Creative Agency for Branding, Design, Web Development, Digital Marketing, and Motion Graphics.
            </p>
            
            {/* Professional Digital Presence Grid */}
            <div className="space-y-3.5 pt-2">
              <span className="text-[9px] font-display font-extrabold tracking-widest text-[#45b88a] uppercase block">
                Digital Presence
              </span>
              <div className="grid grid-cols-2 gap-3">
                <a 
                  href="https://linkedin.com/company/qbench" 
                  target="_blank" 
                  rel="noreferrer"
                  className="group block p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#45b88a]/40 hover:bg-white/[0.08] transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 rounded-lg bg-[#0077b5]/10 text-white/90 group-hover:text-[#45b88a] transition-colors">
                      <Linkedin className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-display text-xs font-bold text-white group-hover:text-[#45b88a] transition-colors">
                      LinkedIn
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 leading-normal line-clamp-2">
                    Industry trends, enterprise systems & solutions.
                  </p>
                </a>

                <a 
                  href="https://twitter.com/qbench" 
                  target="_blank" 
                  rel="noreferrer"
                  className="group block p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#45b88a]/40 hover:bg-white/[0.08] transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 rounded-lg bg-[#1da1f2]/10 text-white/90 group-hover:text-[#45b88a] transition-colors">
                      <Twitter className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-display text-xs font-bold text-white group-hover:text-[#45b88a] transition-colors">
                      Twitter
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 leading-normal line-clamp-2">
                    Design insights, future tech drop-offs & drops.
                  </p>
                </a>
              </div>

              {/* Secondary brand channels */}
              <div className="flex items-center space-x-3 pt-2 text-white/40 text-xs">
                <span className="text-[9px] uppercase tracking-wider">Other channels:</span>
                <div className="flex items-center space-x-2">
                  <a 
                    href="https://facebook.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#45b88a] hover:bg-white/10 transition-colors"
                  >
                    <Facebook className="h-3 w-3" />
                  </a>
                  <a 
                    href="https://www.instagram.com/qbench_official?igsh=MXdscDgwMHFzd2d1aA==" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#45b88a] hover:bg-white/10 transition-colors"
                  >
                    <Instagram className="h-3 w-3" />
                  </a>
                  <a 
                    href="https://youtube.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#45b88a] hover:bg-white/10 transition-colors"
                  >
                    <Youtube className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Links Column */}
          <div className="lg:col-span-2.5 space-y-4">
            <h4 className="font-display text-xs font-black tracking-widest text-white uppercase border-b border-white/10 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button 
                  onClick={() => onNavigate('home')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('services')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none transition-colors"
                >
                  Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('packages')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none transition-colors"
                >
                  Packages
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('portfolio')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none transition-colors"
                >
                  Portfolio
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('process')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none transition-colors"
                >
                  Process
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none transition-colors"
                >
                  Contact
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('admin')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none transition-colors"
                >
                  Admin Control
                </button>
              </li>
            </ul>
          </div>
          
          {/* Our Services Column */}
          <div className="lg:col-span-2.5 space-y-4">
            <h4 className="font-display text-xs font-black tracking-widest text-white uppercase border-b border-white/10 pb-2">
              Our Services
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button 
                  onClick={() => onNavigate('services', 'branding')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none text-left transition-colors"
                >
                  Branding
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('services', 'webdev')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none text-left transition-colors"
                >
                  Web Development
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('services', 'digital-marketing')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none text-left transition-colors"
                >
                  Digital Marketing
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('services', 'motion')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none text-left transition-colors"
                >
                  Motion Graphics
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('services', 'business-support')}
                  className="font-sans text-[11px] text-white/60 hover:text-[#45b88a] cursor-pointer block leading-none text-left transition-colors"
                >
                  Business Support
                </button>
              </li>
            </ul>
          </div>
          
          {/* Contact Us Column */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-display text-xs font-black tracking-widest text-white uppercase border-b border-white/10 pb-2">
              Get in Touch
            </h4>
            <ul className="space-y-3.5">
              <li className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-[#45b88a] shrink-0" />
                <span className="font-sans text-xs text-white/70 font-semibold tracking-wider">+91 73565 26932</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <MessageCircle className="h-4 w-4 text-[#25D366] shrink-0" />
                <a 
                  href="https://wa.me/917356526932?text=Hello%20Q%20BENCH,%20I'm%20interested%20in%20your%20services!" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="font-sans text-xs text-[#25D366] hover:text-[#88f8c5] font-semibold transition-colors"
                >
                  WhatsApp Chat
                </a>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
                <div className="flex items-center space-x-2.5">
                  <Mail className="h-4 w-4 text-[#45b88a] shrink-0" />
                  <a href="mailto:qbench.official@gmail.com" className="font-sans text-xs text-white/70 hover:text-[#88f8c5] transition-colors">qbench.official@gmail.com</a>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="w-fit flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-[#45b88a] border border-white/10 transition-all text-[9px] uppercase font-bold tracking-wider cursor-pointer ml-6 sm:ml-0"
                  title="Copy email address"
                  aria-label="Copy email address"
                >
                  {copied ? (
                    <>
                      <Check className="h-2.5 w-2.5 text-[#45b88a]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-2.5 w-2.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </li>
              <li className="flex items-center space-x-2.5">
                <Globe className="h-4 w-4 text-[#45b88a] shrink-0" />
                <a href="https://www.qbench.in" target="_blank" rel="noreferrer" className="font-sans text-xs text-white/70 hover:text-[#88f8c5] transition-colors">www.qbench.in</a>
              </li>
              <li className="flex items-start space-x-2.5">
                <MapPin className="h-4 w-4 text-[#45b88a] mt-0.5 shrink-0" />
                <span className="font-sans text-xs text-white/70">Kochi, Kerala, India</span>
              </li>
            </ul>
          </div>
          
        </div>
        
        {/* Bottom copyright and Scroll-to-Top Row */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <p className="font-display text-white/40">
            © 2024 Q BENCH. All Rights Reserved.
          </p>
          
          <button 
            onClick={handleScrollTop}
            className="self-start sm:self-auto h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 hover:border-white/30 transition-all cursor-pointer"
            title="Scroll To Top"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        
      </div>
    </footer>
  );
}
