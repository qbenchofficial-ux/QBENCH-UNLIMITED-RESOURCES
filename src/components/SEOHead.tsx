import React from 'react';
import { Helmet } from 'react-helmet-async';
import { NavSection, ServiceTab } from '../types';
import { useProjects } from '../hooks/useProjects';

interface SEOHeadProps {
  section: NavSection;
  activeServiceTab?: ServiceTab;
}

export default function SEOHead({ section, activeServiceTab }: SEOHeadProps) {
  const { settings } = useProjects('public');
  const agencyName = settings.agency_name || 'QBENCH';
  const baseDomain = (settings.website_url || 'https://www.qbench.in').replace(/\/+$/, '');

  let title = `${agencyName} | Creative & Digital Agency — Strategy → Creativity → Execution`;
  let description =
    settings.agency_description ||
    'QBENCH is a creative & digital agency specializing in Branding, Social Media Design, Motion Graphics, Video Editing, Digital Marketing, UI/UX Design, Web Development, and AI Creative Services.';
  let keywords =
    'QBENCH, creative agency, branding, social media design, motion graphics, video editing, digital marketing, UI/UX design, web development, AI creative services, printing';
  let pathSlug = '';

  switch (section) {
    case 'home':
      title = `${agencyName} | Creative & Digital Agency — Strategy → Creativity → Execution`;
      description =
        settings.agency_description ||
        'Welcome to QBENCH — a creative & digital agency transforming brands through Strategy → Creativity → Execution across branding, motion graphics, UI/UX, and web development.';
      pathSlug = '';
      break;

    case 'about':
      title = `About Us | ${agencyName} — Creative & Digital Agency`;
      description =
        'Meet the creative technologists, brand designers, motion artists, and digital engineers at QBENCH.';
      pathSlug = 'about';
      break;

    case 'services':
      pathSlug = 'services';
      if (activeServiceTab) {
        const tabTitle =
          activeServiceTab.charAt(0).toUpperCase() +
          activeServiceTab.slice(1).replace('-', ' ');
        title = `${tabTitle} Services | ${agencyName} Creative Agency`;
        description = `Explore ${agencyName}'s specialized ${tabTitle} services — combining strategic thinking, visual craft, and modern execution.`;
      } else {
        title = `Services | ${agencyName} — Branding, Motion, Web & Digital Marketing`;
        description =
          'Discover QBENCH services: Branding, Social Media Design, Motion Graphics, Video Editing, Digital Marketing, UI/UX Design, Web Development, AI Creative Services, Printing, and Business Support.';
      }
      break;

    case 'portfolio':
      pathSlug = 'portfolio';
      title = `Portfolio | ${agencyName} — Selected Creative & Digital Works`;
      description =
        'Explore QBENCH portfolio case studies across branding, luxury motion design, social media campaigns, video editing, UI/UX, and web development.';
      break;

    case 'process':
      pathSlug = 'process';
      title = `Our Process | ${agencyName} — Strategy → Creativity → Execution`;
      description =
        'Learn how QBENCH takes projects from discovery and strategy to creative direction, execution, and launch.';
      break;

    case 'packages':
      pathSlug = 'packages';
      title = `Packages & Pricing | ${agencyName} — Scalable Creative & Digital Plans`;
      description =
        'Transparent creative and digital packages for branding, social media, motion graphics, video production, and custom web development.';
      break;

    case 'nfc-access':
      pathSlug = 'nfc-access';
      title = `NFC Access Card Manager | ${agencyName} — Smart Access & Tag Scanner`;
      description =
        'Scan and manage compatible NFC access cards using your phone’s built-in NFC hardware with QBENCH Smart Access.';
      break;

    case 'contact':
      pathSlug =
        typeof window !== 'undefined' &&
        window.location.pathname.toLowerCase().startsWith('/start-a-project')
          ? 'start-a-project'
          : 'contact';
      title =
        pathSlug === 'start-a-project'
          ? `Start a Project | ${agencyName} Creative & Digital Agency`
          : `Contact ${agencyName} | Start Your Next Creative Project`;
      description = `Get in touch with ${agencyName} (${settings.email || 'contact@qbench.in'} | ${settings.phone || '+91 73565 25932'}) to launch your next branding, motion, or digital project.`;
      break;

    default:
      break;
  }

  const canonicalUrl = pathSlug ? `${baseDomain}/${pathSlug}` : `${baseDomain}/`;
  const bannerImageUrl =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

  return (
    <Helmet>
      {/* Standard SEO Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph Protocol */}
      <meta property="og:site_name" content={`${agencyName} Creative & Digital Agency`} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={bannerImageUrl} />
      <meta
        property="og:image:alt"
        content={`${agencyName} — Strategy → Creativity → Execution`}
      />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={bannerImageUrl} />

      <meta name="author" content={agencyName} />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#00685b" />
    </Helmet>
  );
}
