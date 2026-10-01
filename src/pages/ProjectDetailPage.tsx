import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getProjectBySlug } from '../services/projectService';
import type { Project } from '../types/project';
import type { NavSection } from '../types';
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  User,
  Layers,
  ExternalLink,
  Video,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface ProjectDetailPageProps {
  slug: string;
  onNavigate: (section: NavSection) => void;
  onOpenPortfolio: () => void;
}

export default function ProjectDetailPage({
  slug,
  onNavigate,
  onOpenPortfolio,
}: ProjectDetailPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const found = await getProjectBySlug(slug, true);
        if (mounted) {
          setProject(found);
          setActiveImage(found?.cover_image || found?.gallery?.[0] || null);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : 'Could not load project details.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
        <p className="font-display text-sm font-bold text-brand-text-muted">
          Loading case study...
        </p>
      </div>
    );
  }

  // Professional 404 / Project Not Found state
  if (!project || error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 lg:px-12">
        <Helmet>
          <title>Project Not Found | QBENCH Portfolio</title>
          <meta
            name="description"
            content="The requested portfolio project could not be found."
          />
        </Helmet>

        <div className="bg-white border border-brand-outline/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <span className="font-tech text-xs font-extrabold uppercase tracking-widest text-brand-primary">
              404 — CASE STUDY NOT FOUND
            </span>
            <h1 className="font-display text-3xl font-black text-brand-text">
              Project Not Found
            </h1>
            <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
              {error ||
                `We couldn't find a published portfolio project matching "/portfolio/${slug}". It may have been moved or unpublished.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenPortfolio}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary hover:bg-brand-primary-light px-5 py-2.5 font-display text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Portfolio</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-outline/40 bg-white hover:bg-brand-surface-low px-5 py-2.5 font-display text-xs font-bold text-brand-text transition-colors cursor-pointer"
            >
              <span>Contact QBENCH</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pageTitle = `${project.title} | ${project.category || 'Portfolio'} — QBENCH`;
  const pageDescription =
    project.short_description ||
    project.description?.slice(0, 155) ||
    `Explore ${project.title}, a ${project.category || 'creative'} project crafted by QBENCH.`;
  const ogImage =
    project.cover_image ||
    project.gallery?.[0] ||
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  const canonicalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/portfolio/${project.slug}`
      : `https://qbench.agency/portfolio/${project.slug}`;

  const allImages = Array.from(
    new Set([project.cover_image, ...(project.gallery || [])].filter(Boolean))
  ) as string[];

  return (
    <article className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16 space-y-14">
      {/* Dynamic SEO Meta & OpenGraph Tags */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* Back Navigation */}
      <div className="flex items-center justify-between border-b border-brand-outline/20 pb-5">
        <button
          type="button"
          onClick={onOpenPortfolio}
          className="inline-flex items-center gap-2 font-display text-xs font-bold text-brand-text-muted hover:text-brand-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Projects</span>
        </button>

        {project.category && (
          <span className="font-tech text-[10px] tracking-wider text-brand-primary font-bold uppercase bg-brand-accent-light/50 border border-brand-accent/20 px-3 py-1 rounded-full">
            {project.category}
          </span>
        )}
      </div>

      {/* Hero Header */}
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-brand-text leading-tight">
            {project.title}
          </h1>
          {project.short_description && (
            <p className="font-sans text-sm sm:text-base text-brand-text-variant leading-relaxed max-w-3xl">
              {project.short_description}
            </p>
          )}
        </div>

        {/* Metadata Card */}
        <div className="lg:col-span-4 bg-white border border-brand-outline/25 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase tracking-wider text-brand-text-muted">
                <User className="h-3 w-3 text-brand-primary" />
                Client
              </span>
              <p className="font-display font-bold text-brand-text">
                {project.client || 'QBENCH Partner'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase tracking-wider text-brand-text-muted">
                <Calendar className="h-3 w-3 text-brand-primary" />
                Year
              </span>
              <p className="font-display font-bold text-brand-text tabular-nums">
                {project.year || new Date().getFullYear()}
              </p>
            </div>
          </div>

          {project.services && project.services.length > 0 && (
            <div className="pt-3 border-t border-brand-outline/15 space-y-2">
              <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase tracking-wider text-brand-text-muted">
                <Layers className="h-3 w-3 text-brand-primary" />
                Services Delivered
              </span>
              <div className="flex flex-wrap gap-1.5">
                {project.services.map((srv) => (
                  <span
                    key={srv}
                    className="rounded-lg bg-brand-surface-low border border-brand-outline/20 px-2.5 py-1 font-display text-[11px] font-bold text-brand-text"
                  >
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {(project.behance_url ||
            project.instagram_url ||
            project.website_url ||
            project.video_url) && (
            <div className="pt-3 border-t border-brand-outline/15 flex flex-wrap gap-2">
              {project.behance_url && (
                <a
                  href={project.behance_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-light px-3.5 py-2 font-display text-xs font-bold transition-colors"
                >
                  <span>View on Behance</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
              {project.website_url && (
                <a
                  href={project.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-outline/40 bg-white hover:bg-brand-surface-low px-3.5 py-2 font-display text-xs font-bold text-brand-text transition-colors"
                >
                  <span>Live Website</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {project.instagram_url && (
                <a
                  href={project.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-outline/40 bg-white hover:bg-brand-surface-low px-3.5 py-2 font-display text-xs font-bold text-brand-text transition-colors"
                >
                  <span>Instagram</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {project.video_url && (
                <a
                  href={project.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-outline/40 bg-white hover:bg-brand-surface-low px-3.5 py-2 font-display text-xs font-bold text-brand-text transition-colors"
                >
                  <Video className="h-3.5 w-3.5 text-brand-primary" />
                  <span>Watch Video</span>
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Cover / Selected Gallery Showcase */}
      {activeImage && (
        <div className="space-y-4">
          <div className="aspect-[16/10] w-full rounded-3xl overflow-hidden border border-brand-outline/25 bg-brand-surface-low shadow-sm">
            <img
              src={activeImage}
              alt={project.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {allImages.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(imgUrl)}
                  className={`aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImage === imgUrl
                      ? 'border-brand-primary scale-102 shadow-xs'
                      : 'border-brand-outline/20 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${project.title} view ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Case Study Narrative */}
      {project.description && (
        <section className="bg-white border border-brand-outline/25 rounded-3xl p-8 lg:p-12 space-y-4 shadow-2xs">
          <span className="font-tech text-xs tracking-widest text-brand-primary font-bold uppercase">
            PROJECT OVERVIEW
          </span>
          <div className="font-sans text-sm sm:text-base text-brand-text-variant leading-relaxed whitespace-pre-wrap max-w-4xl">
            {project.description}
          </div>
        </section>
      )}

      {/* Full Gallery Grid */}
      {project.gallery && project.gallery.length > 1 && (
        <section className="space-y-6">
          <div className="space-y-1">
            <span className="font-tech text-xs tracking-widest text-brand-primary font-bold uppercase">
              VISUAL GALLERY
            </span>
            <h2 className="font-display text-2xl font-black text-brand-text">
              Project Frames & Deliverables
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.gallery.map((imgUrl, idx) => (
              <div
                key={`gallery-grid-${idx}`}
                className="rounded-2xl overflow-hidden border border-brand-outline/20 bg-white shadow-2xs"
              >
                <img
                  src={imgUrl}
                  alt={`${project.title} gallery ${idx + 1}`}
                  loading="lazy"
                  className="w-full aspect-[16/10] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="bg-brand-surface-low border border-brand-outline/25 rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-1.5">
          <h3 className="font-display text-2xl font-black text-brand-text">
            Inspired by <span className="text-brand-primary">{project.title}</span>?
          </h3>
          <p className="font-sans text-xs sm:text-sm text-brand-text-muted">
            Start a conversation with QBENCH to craft a custom creative project for your brand.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="rounded-xl bg-brand-primary hover:bg-brand-primary-light px-5 py-3 font-display text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Inquire About Similar Project
          </button>

          <a
            href={`https://wa.me/917356525932?text=${encodeURIComponent(
              `Hello QBENCH Team, I saw your project "${project.title}" (${canonicalUrl}) and would like to discuss a similar project.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] px-5 py-3 font-display text-xs font-bold text-white transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </section>
    </article>
  );
}
