/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelmetProvider } from 'react-helmet-async';
import SEOHead from './components/SEOHead';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import ServicesView from './components/ServicesView';
import PortfolioView from './components/PortfolioView';
import ProcessView from './components/ProcessView';
import ContactView from './components/ContactView';
import PackagesView from './components/PackagesView';
import SkeletonRouter from './components/SkeletonLoader';
import { NavSection, ServiceTab } from './types';
import { HelpCircle, ChevronRight, MessageSquare, Laptop, ShieldAlert, MessageCircle } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [initialServiceTab, setInitialServiceTab] = useState<ServiceTab | undefined>(undefined);
  const [transitioningTo, setTransitioningTo] = useState<NavSection | null>(null);

  // Smooth scroll to top when changing views
  const handleNavigate = (section: NavSection, serviceTab?: ServiceTab) => {
    // Elegant transition of 500ms to allow skeleton presentation layout to render
    setTransitioningTo(section);
    window.scrollTo({ top: 0, behavior: 'instant' });

    const delay = 500;
    setTimeout(() => {
      setActiveSection(section);
      if (serviceTab) {
        setInitialServiceTab(serviceTab);
      } else {
        setInitialServiceTab(undefined);
      }
      setTransitioningTo(null);
    }, delay);
  };

  return (
    <HelmetProvider>
      <SEOHead section={transitioningTo || activeSection} activeServiceTab={initialServiceTab} />
      <div id="qbench-app-shell" className="min-h-screen bg-brand-background text-brand-text flex flex-col font-sans transition-colors duration-300 relative selection:bg-brand-primary/10 selection:text-brand-primary">
      
      {/* Absolute background organic gradients */}
      <div id="bg-ambient-layer-1" className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none pulse-glow" />
      <div id="bg-ambient-layer-2" className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-accent/5 blur-[140px] pointer-events-none pulse-glow" style={{ animationDelay: '2s' }} />
      <div id="bg-ambient-layer-3" className="absolute bottom-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-brand-secondary/5 blur-[100px] pointer-events-none pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Header element */}
      <Header 
        activeSection={activeSection} 
        onNavigate={handleNavigate} 
      />

      {/* Primary views router layout container */}
      <main id="app-main-viewports" className="flex-grow relative z-10 overflow-x-hidden">
        
        <AnimatePresence mode="wait">
          {transitioningTo ? (
            <motion.div 
              key={`skeleton-${transitioningTo}`} 
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <SkeletonRouter section={transitioningTo} />
            </motion.div>
          ) : (
            <motion.div
              key={`view-${activeSection}`}
              initial={{ opacity: 0, y: 15, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Render only the active screen state context */}
              {activeSection === 'home' && (
                <div id="view-home-screen">
                  <HomeView onNavigate={handleNavigate} />
                </div>
              )}

              {activeSection === 'about' && (
                <div id="view-about-screen">
                  {/* Standard rich home presentation but specifically scrolled or customized for About details */}
                  <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 lg:px-12">
                    <span className="font-tech text-xs tracking-widest text-[#00685b] font-bold uppercase block mb-4">
                      ABOUT COOP
                    </span>
                    <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-text leading-tight mb-6">
                      Specialists by Trade,<br />
                      <span className="text-[#00685b]">Visionaries by Choice.</span>
                    </h1>
                    <p className="font-display text-sm text-brand-text-muted max-w-2xl leading-relaxed">
                      We are a distributed group of technologists, visual architects, brand planners, and performance marketers. By merging our distinct expertise pipelines, we construct comprehensive digital spaces designed to expand corporate goals.
                    </p>
                  </div>
                  <HomeView onNavigate={handleNavigate} />
                </div>
              )}

              {activeSection === 'services' && (
                <div id="view-services-screen">
                  <ServicesView initialTab={initialServiceTab} onNavigate={handleNavigate} />
                </div>
              )}

              {activeSection === 'portfolio' && (
                <div id="view-portfolio-screen">
                  <PortfolioView onNavigate={handleNavigate} />
                </div>
              )}

              {activeSection === 'process' && (
                <div id="view-process-screen">
                  <ProcessView onNavigate={handleNavigate} />
                </div>
              )}

              {activeSection === 'packages' && (
                <div id="view-packages-screen">
                  <PackagesView onNavigate={handleNavigate} />
                </div>
              )}

              {activeSection === 'contact' && (
                <div id="view-contact-screen">
                  <ContactView onNavigate={handleNavigate} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer element */}
      <Footer onNavigate={handleNavigate} />

      {/* Real-time floating contact helper & WhatsApp support hub */}
      <div id="real-time-floating-bubble" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end select-none">
        
        {/* WhatsApp direct chat launcher */}
        <a
          id="floating-whatsapp-btn"
          href="https://wa.me/917356525932?text=Hello%20Q%20BENCH,%20I'm%20interested%20in%20your%20services!"
          target="_blank"
          rel="noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white hover:bg-[#20ba5a] transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 group relative border border-emerald-500/10"
          title="Chat on WhatsApp"
        >
          {/* Tooltip on left */}
          <span className="absolute right-14 bg-slate-900 border border-slate-800 text-white text-[10px] font-tech uppercase font-extrabold tracking-widest px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-md whitespace-nowrap">
            Chat on WhatsApp
          </span>
          <MessageCircle className="h-6 w-6 stroke-[2]" />
        </a>

        {/* Regular floating contact email form inquiry */}
        <button
          id="floating-inquire-btn"
          onClick={() => handleNavigate('contact')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-white hover:bg-brand-primary-light transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 group relative"
          title="Send inquiry Message"
        >
          {/* Tooltip on left */}
          <span className="absolute right-14 bg-slate-900 border border-slate-800 text-white text-[10px] font-tech uppercase font-extrabold tracking-widest px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-md whitespace-nowrap">
            Send Message
          </span>
          <MessageSquare className="h-5 w-5" />
        </button>
      </div>

    </div>
    </HelmetProvider>
  );
}
