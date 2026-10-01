/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelmetProvider } from 'react-helmet-async';
import { SpeedInsights } from '@vercel/speed-insights/react';
import SEOHead from './components/SEOHead';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import ServicesView from './components/ServicesView';
import PortfolioView from './components/PortfolioView';
import ProcessView from './components/ProcessView';
import ContactView from './components/ContactView';
import PackagesView from './components/PackagesView';
import AdminControlView from './components/AdminControlView';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SkeletonRouter from './components/SkeletonLoader';
import { OfflineIndicator } from './components/PWAInstallPrompt';
import { useProjects } from './hooks/useProjects';
import { NavSection, ServiceTab } from './types';
import { MessageSquare, MessageCircle } from 'lucide-react';

function extractPortfolioSlug(pathname: string): string | null {
  const match = pathname.match(/^\/portfolio\/([^/]+)\/?$/i);
  return match ? decodeURIComponent(match[1]) : null;
}

function resolveSectionFromLocation(): NavSection {
  if (typeof window === 'undefined') return 'home';
  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const hash = window.location.hash.replace('#', '').toLowerCase();
  const params = new URLSearchParams(window.location.search);

  if (
    pathname.startsWith('/admin') ||
    hash === 'admin' ||
    params.get('view') === 'admin'
  ) {
    return 'admin';
  }
  if (pathname.startsWith('/portfolio') || hash === 'portfolio') {
    return 'portfolio';
  }
  if (pathname === '/services' || hash === 'services') {
    return 'services';
  }
  if (pathname === '/packages' || hash === 'packages') {
    return 'packages';
  }
  if (pathname === '/process' || hash === 'process') {
    return 'process';
  }
  if (
    pathname === '/contact' ||
    pathname === '/start-a-project' ||
    hash === 'contact' ||
    hash === 'start-a-project'
  ) {
    return 'contact';
  }
  if (pathname === '/about' || hash === 'about') {
    return 'about';
  }
  return 'home';
}

function sectionToPathname(section: NavSection): string {
  switch (section) {
    case 'home':
      return '/';
    case 'services':
      return '/services';
    case 'packages':
      return '/packages';
    case 'portfolio':
      return '/portfolio';
    case 'process':
      return '/process';
    case 'contact':
      return '/contact';
    case 'about':
      return '/about';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}

export default function App() {
  const { settings } = useProjects('public');
  const [activeSection, setActiveSection] = useState<NavSection>(resolveSectionFromLocation);

  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return extractPortfolioSlug(window.location.pathname);
    }
    return null;
  });

  const [initialServiceTab, setInitialServiceTab] = useState<ServiceTab | undefined>(undefined);
  const [transitioningTo, setTransitioningTo] = useState<NavSection | null>(null);

  useEffect(() => {
    const onPopState = () => {
      const pathname = window.location.pathname;
      const slug = extractPortfolioSlug(pathname);
      const nextSection = resolveSectionFromLocation();

      if (nextSection === 'admin') {
        setActiveProjectSlug(null);
        setActiveSection('admin');
      } else if (slug) {
        setActiveProjectSlug(slug);
        setActiveSection('portfolio');
      } else {
        setActiveProjectSlug(null);
        setActiveSection(nextSection);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleOpenProjectDetail = useCallback((slug: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/portfolio/${slug}`);
    }
    setActiveProjectSlug(slug);
    setActiveSection('portfolio');
    setTransitioningTo(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleOpenPublicPath = useCallback(
    (path: string) => {
      const slug = extractPortfolioSlug(path);
      if (slug) {
        handleOpenProjectDetail(slug);
        return;
      }
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', path);
      }
      setActiveProjectSlug(null);
      setActiveSection(resolveSectionFromLocation());
      window.scrollTo({ top: 0, behavior: 'instant' });
    },
    [handleOpenProjectDetail]
  );

  // Smooth scroll to top when changing views and sync clean URL path
  const handleNavigate = (section: NavSection, serviceTab?: ServiceTab) => {
    setActiveProjectSlug(null);
    if (typeof window !== 'undefined') {
      if (section === 'admin') {
        if (!window.location.pathname.startsWith('/admin')) {
          window.history.pushState({}, '', '/admin');
        }
      } else {
        const targetPath = sectionToPathname(section);
        if (window.location.pathname !== targetPath) {
          window.history.pushState({}, '', targetPath);
        }
      }
    }

    if (section === 'admin') {
      setActiveSection('admin');
      setTransitioningTo(null);
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

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

  // Keep Admin CMS UI completely separate from the public website
  if (activeSection === 'admin') {
    return (
      <HelmetProvider>
        <div id="view-admin-screen" className="min-h-screen bg-[#f6f7f6] text-slate-900">
          <AdminControlView
            onNavigate={handleNavigate}
            onOpenPublicPath={handleOpenPublicPath}
          />
          <OfflineIndicator />
        </div>
      </HelmetProvider>
    );
  }

  const whatsappDigits = (settings.whatsapp || '917356525932').replace(/[^0-9]/g, '');

  return (
    <HelmetProvider>
      {!activeProjectSlug && (
        <SEOHead section={transitioningTo || activeSection} activeServiceTab={initialServiceTab} />
      )}
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
              key={`view-${activeSection}-${activeProjectSlug || 'root'}`}
              initial={{ opacity: 0, y: 15, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeProjectSlug ? (
                <div id="view-project-detail-screen">
                  <ProjectDetailPage
                    slug={activeProjectSlug}
                    onNavigate={handleNavigate}
                    onOpenPortfolio={() => {
                      setActiveProjectSlug(null);
                      if (typeof window !== 'undefined') {
                        window.history.pushState({}, '', '/portfolio');
                      }
                      setActiveSection('portfolio');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                  />
                </div>
              ) : (
                <>
                  {/* Render only the active screen state context */}
                  {activeSection === 'home' && (
                    <div id="view-home-screen">
                      <HomeView
                        onNavigate={handleNavigate}
                        onOpenProjectDetail={handleOpenProjectDetail}
                      />
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
                      <HomeView
                        onNavigate={handleNavigate}
                        onOpenProjectDetail={handleOpenProjectDetail}
                      />
                    </div>
                  )}

                  {activeSection === 'services' && (
                    <div id="view-services-screen">
                      <ServicesView initialTab={initialServiceTab} onNavigate={handleNavigate} />
                    </div>
                  )}

                  {activeSection === 'portfolio' && (
                    <div id="view-portfolio-screen">
                      <PortfolioView
                        onNavigate={handleNavigate}
                        onOpenProjectDetail={handleOpenProjectDetail}
                      />
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
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer element */}
      <Footer onNavigate={handleNavigate} />

      {/* Offline state toast indicator */}
      <OfflineIndicator />

      {/* Real-time floating contact helper & WhatsApp support hub */}
      <div id="real-time-floating-bubble" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end select-none">
        
        {/* WhatsApp direct chat launcher */}
        <a
          id="floating-whatsapp-btn"
          href={`https://wa.me/${whatsappDigits}?text=Hello%20Q%20BENCH,%20I'm%20interested%20in%20your%20services!`}
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
    <SpeedInsights />
    </HelmetProvider>
  );
}
