import React from 'react';
import { Helmet } from 'react-helmet-async';
import { NavSection, ServiceTab } from '../types';

interface SEOHeadProps {
  section: NavSection;
  activeServiceTab?: ServiceTab;
}

export default function SEOHead({ section, activeServiceTab }: SEOHeadProps) {
  // Let us map each section and optional service tab to the perfect metadata
  let title = 'QBench | Organic-Futurist Digital Space Architects & Engineers';
  let description = 'QBench is a premier hybrid digital engineering guild. We combine design poetry with custom software craftsmanship, building organic-futurist web apps, enterprise systems, and digital ecosystems.';
  let keywords = 'digital architects, organic design, web applications, enterprise systems, QBench engineering, custom software, UI-UX poetry';

  // Section-specific metadata fine-tuned for ultimate organic-futurist SEO
  switch (section) {
    case 'home':
      title = 'QBench | Organic-Futurist Digital Space Architects & Engineers';
      description = 'Welcome to QBench—a premier hybrid digital engineering guild. We build highly calibrated, high-fidelity responsive systems and high-impact web software designed to grow corporate goals.';
      keywords = 'digital architects, software engineering, organic coding, web development services, premium web apps, QBench India';
      break;

    case 'about':
      title = 'About Us | QBench — Specialists by Trade, Visionaries by Choice';
      description = 'Meet the distributed multi-disciplinary crew at QBench. We are a collection of tech specialists, brand designers, and scale engineers creating beautiful performant digital structures.';
      keywords = 'about QBench, software elite guild, custom UI developers, cloud-native tech, remote developer team';
      break;

    case 'services':
      if (activeServiceTab) {
        // Special deep SEO integration for service categories
        const tabTitle = activeServiceTab.charAt(0).toUpperCase() + activeServiceTab.slice(1).replace('-', ' ');
        title = `Services: ${tabTitle} | QBench Architects`;
        description = `Engage with QBench for specialized expertise in ${tabTitle}. We build robust architectural blueprints, premium responsive layouts, and highly optimized server engines.`;
        keywords = `${activeServiceTab}, digital solution architecture, developer specialists, automated logic`;
      } else {
        title = 'Services | QBench — Engineered Custom Ecosystems';
        description = 'Discover our full spectrum of performance services: UI/UX product engineering, enterprise automation pipelines, rapid prototype development, and scalable cloud applications.';
        keywords = 'full-stack software, automation platforms, graphic UI consulting, React consulting, cloud engines';
      }
      break;

    case 'portfolio':
      title = 'Portfolio | QBench — Masterpieces of Software & Craft';
      description = 'Explore our showcase of advanced web platforms, beautiful enterprise apps, high-speed API layers, and user-centric portal hubs crafted with meticulous digital architecture.';
      keywords = 'client portfolios, React-powered, system layouts, database applications, interactive UI grids';
      break;

    case 'process':
      title = 'Our Process | QBench — Code of Craft & Engineering';
      description = 'A blueprint of how we bring ideas to life. Read about our rigorous four-phase pipeline: Alignment & Exploration, Blueprinting, Extreme Craft Coding, and Direct Secure Delivery.';
      keywords = 'agile development, tech blueprints, sprint milestones, quality assurance, developer workflows';
      break;

    case 'packages':
      title = 'Packages & Estimator | QBench — Scalable Digital Plans';
      description = 'Transparent valuation pricing plans for MVPs, professional growth, and fully scaled enterprise systems. Use our dynamic calculator to customize your project requirements instantly.';
      keywords = 'pricing estimator, MVP app costs, custom web platform pricing, software packages, developer contracts';
      break;

    case 'contact':
      title = 'Contact | QBench — Launch Your Next Digital Evolution';
      description = 'Inquire about your next project with QBench. Enjoy prioritized multi-channel support, WhatsApp fast replies, and reliable, instant database backup delivery.';
      keywords = 'contact web agency, hire React engineers, system administration project, custom integration quote, WhatsApp developers';
      break;

    default:
      break;
  }

  // Canonical base URL mapping
  const canonicalUrl = `https://qbench.agency/${section === 'home' ? '' : section}`;
  const bannerImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

  return (
    <Helmet>
      {/* Standard SEO Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph Protocol (Facebook, LinkedIn, Discord etc.) */}
      <meta property="og:site_name" content="QBench Digital Space Architects" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={bannerImageUrl} />
      <meta property="og:image:alt" content="QBench - Organic-Futurist Digital Space Architects" />

      {/* Twitter Cards (X Platform) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={bannerImageUrl} />

      {/* Semantic/Organic Search Enhancements */}
      <meta name="author" content="QBench Architects" />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#00685b" />
    </Helmet>
  );
}
