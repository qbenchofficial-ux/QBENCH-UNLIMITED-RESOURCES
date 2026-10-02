import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { getProjectBySlug } from '../services/projectService';
import { useAuth } from '../hooks/useAuth';
import { slugify } from '../lib/supabase';
import type { Project, ProjectVideo } from '../types/project';
import type { NavSection } from '../types';
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  User,
  Layers,
  ExternalLink,
  Video,
  Film,
  Play,
  Star,
  MessageSquare,
  Loader2,
  AlertCircle,
  Wrench,
  Briefcase,
  X,
  ZoomIn,
} from 'lucide-react';

interface ProjectDetailPageProps {
  slug: string;
  onNavigate: (section: NavSection) => void;
  onOpenPortfolio: () => void;
  onOpenPortfolioCategory?: (categorySlug: string) => void;
}

function extractYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = url.match(regExp);
  return match && match[1]
    ? `https://www.youtube.com/embed/${match[1]}`
    : null;
}

function isDirectVideoFileUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    url.includes('/portfolio-videos/')
  );
}

export default function ProjectDetailPage({
  slug,
  onNavigate,
  onOpenPortfolio,
  onOpenPortfolioCategory,
}: ProjectDetailPageProps) {
  const { isAdmin, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const found = await getProjectBySlug(slug, isAdmin);
        if (mounted) {
          setProject(found);
          setActiveImage(
            found?.cover_image_url ||
              found?.cover_image ||
              found?.gallery?.[0] ||
              null
          );
          if (found?.project_videos && found.project_videos.length > 0) {
            const featuredIdx = found.project_videos.findIndex(
              (v) => v.is_featured
            );
            setActiveVideoIndex(featuredIdx >= 0 ? featuredIdx : 0);
          } else {
            setActiveVideoIndex(0);
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load project details.'
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
  }, [slug, isAdmin, authLoading]);

  const galleryFrames = useMemo(() => {
    if (!project) return [];
    const frames: { url: string; label: string }[] = [];
    const seen = new Set<string>();

    if (project.portfolio_images && project.portfolio_images.length > 0) {
      const sorted = [...project.portfolio_images].sort(
        (a, b) =>
          (a.display_order ?? a.sort_order ?? 0) -
          (b.display_order ?? b.sort_order ?? 0)
      );
      sorted.forEach((img, idx) => {
        if (!img.image_url || seen.has(img.image_url)) return;
        seen.add(img.image_url);
        frames.push({
          url: img.image_url,
          label:
            img.alt_text ||
            `${project.title} — Frame ${String(idx + 1).padStart(2, '0')}`,
        });
      });
    }

    const cover = project.cover_image_url || project.cover_image;
    if (cover && !seen.has(cover)) {
      seen.add(cover);
      frames.unshift({
        url: cover,
        label: 'Main Cover Image',
      });
    }

    (project.gallery || []).forEach((url, idx) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      frames.push({
        url,
        label: `${project.title} — Image ${String(idx + 1).padStart(2, '0')}`,
      });
    });

    return frames;
  }, [project]);

  const uploadedVideos = useMemo<ProjectVideo[]>(() => {
    if (!project) return [];
    const list: ProjectVideo[] = [];
    const seenUrls = new Set<string>();

    if (project.project_videos && project.project_videos.length > 0) {
      const sorted = [...project.project_videos].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      );
      for (const v of sorted) {
        if (!v.video_url || seenUrls.has(v.video_url)) continue;
        seenUrls.add(v.video_url);
        list.push(v);
      }
    }

    // If a direct video URL was set on video_url and isn't already in project_videos, include it
    const directCandidate = project.video_url || project.youtube_url;
    if (
      directCandidate &&
      isDirectVideoFileUrl(directCandidate) &&
      !seenUrls.has(directCandidate)
    ) {
      seenUrls.add(directCandidate);
      list.push({
        id: `${project.id}-direct-video`,
        project_id: project.id,
        video_url: directCandidate,
        storage_path: null,
        video_title: `${project.title} — Project Video`,
        video_description: project.short_description || null,
        display_order: list.length,
        is_featured: list.length === 0,
        created_at: project.created_at,
      });
    }

    return list;
  }, [project]);

  if (loading || authLoading) {
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
    project.cover_image_url ||
    project.cover_image ||
    project.gallery?.[0] ||
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  const canonicalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/portfolio/${project.slug}`
      : `https://qbench.agency/portfolio/${project.slug}`;

  const videoLink = project.video_url || project.youtube_url;
  const youtubeEmbedUrl = extractYouTubeEmbedUrl(videoLink);
  const activeFrameLabel =
    galleryFrames.find((f) => f.url === activeImage)?.label || project.title;

  const activeUploadedVideo =
    uploadedVideos[activeVideoIndex] ||
    uploadedVideos.find((v) => v.is_featured) ||
    uploadedVideos[0] ||
    null;

  const posterImage =
    project.cover_image_url ||
    project.cover_image ||
    galleryFrames[0]?.url ||
    ogImage;

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-outline/20 pb-5">
        <button
          type="button"
          onClick={onOpenPortfolio}
          className="inline-flex items-center gap-2 font-display text-xs font-bold text-brand-text-muted hover:text-brand-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Projects</span>
        </button>

        <div className="flex items-center gap-2">
          {project.status === 'draft' && (
            <span className="font-tech text-[10px] tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full font-extrabold uppercase">
              Draft Preview (Admin Only)
            </span>
          )}
          {project.category && (
            <button
              type="button"
              onClick={() => {
                const catSlug = slugify(project.category || '');
                if (onOpenPortfolioCategory && catSlug) {
                  onOpenPortfolioCategory(catSlug);
                } else {
                  onOpenPortfolio();
                }
              }}
              className="font-tech text-[10px] tracking-wider text-brand-primary font-bold uppercase bg-brand-accent-light/50 border border-brand-accent/20 px-3 py-1 rounded-full hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
            >
              {project.category}
            </button>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          {project.project_type && (
            <span className="font-tech text-xs tracking-widest text-brand-primary font-extrabold uppercase block">
              {project.project_type}
            </span>
          )}
          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-brand-text leading-tight">
            {project.title}
          </h1>
          {(project.short_description || project.description) && (
            <p className="font-sans text-sm sm:text-base text-brand-text-variant leading-relaxed max-w-3xl">
              {project.short_description ||
                project.description?.split('\n')[0]}
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
                {project.client_name || project.client || 'QBENCH Partner'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase tracking-wider text-brand-text-muted">
                <Calendar className="h-3 w-3 text-brand-primary" />
                Project Date
              </span>
              <p className="font-display font-bold text-brand-text tabular-nums">
                {project.project_date ||
                  project.year ||
                  new Date().getFullYear()}
              </p>
            </div>
          </div>

          {project.project_type && (
            <div className="pt-3 border-t border-brand-outline/15 space-y-1 text-xs">
              <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase tracking-wider text-brand-text-muted">
                <Briefcase className="h-3 w-3 text-brand-primary" />
                Project Type
              </span>
              <p className="font-display font-bold text-brand-text">
                {project.project_type}
              </p>
            </div>
          )}

          {project.software_tools && project.software_tools.length > 0 && (
            <div className="pt-3 border-t border-brand-outline/15 space-y-2">
              <span className="inline-flex items-center gap-1 font-tech text-[10px] uppercase tracking-wider text-brand-text-muted">
                <Wrench className="h-3 w-3 text-brand-primary" />
                Software & Tools Used
              </span>
              <div className="flex flex-wrap gap-1.5">
                {project.software_tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-lg bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 font-display text-[11px] font-bold text-brand-primary"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

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

          {/* External Links: Behance, Video, Website, Instagram */}
          {(project.behance_url ||
            videoLink ||
            project.website_url ||
            project.instagram_url) && (
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
              {videoLink && (
                <a
                  href={videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-outline/40 bg-white hover:bg-brand-surface-low px-3.5 py-2 font-display text-xs font-bold text-brand-text transition-colors"
                >
                  <Video className="h-3.5 w-3.5 text-brand-primary" />
                  <span>Watch Video</span>
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
            </div>
          )}
        </div>
      </header>

      {/* Main Cover / Selected Gallery Showcase */}
      {activeImage && (
        <div className="space-y-4">
          <div
            onClick={() =>
              setLightboxImage({ url: activeImage, label: activeFrameLabel })
            }
            className="aspect-[16/10] w-full rounded-3xl overflow-hidden border border-brand-outline/25 bg-brand-surface-low shadow-sm relative group cursor-zoom-in"
          >
            <img
              src={activeImage}
              alt={activeFrameLabel}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="rounded-xl bg-black/75 backdrop-blur-xs px-3.5 py-1.5 font-display text-xs font-bold text-white">
                {activeFrameLabel}
              </span>
              <span className="rounded-xl bg-black/75 backdrop-blur-xs p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-4 w-4" />
              </span>
            </div>
          </div>

          {galleryFrames.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {galleryFrames.map((frame, idx) => (
                <button
                  key={`${frame.url}-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(frame.url)}
                  className={`aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative ${
                    activeImage === frame.url
                      ? 'border-brand-primary scale-102 shadow-xs'
                      : 'border-brand-outline/20 opacity-75 hover:opacity-100'
                  }`}
                  title={frame.label}
                >
                  <img
                    src={frame.url}
                    alt={frame.label}
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

      {/* ==================================================================== */}
      {/* Uploaded Project Videos Showcase (Supabase Storage HTML5 Player)     */}
      {/* ==================================================================== */}
      {uploadedVideos.length > 0 && activeUploadedVideo && (
        <section id="project-videos-showcase" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 font-tech text-xs tracking-widest text-brand-primary font-bold uppercase">
                <Film className="h-3.5 w-3.5" />
                <span>
                  PROJECT VIDEO SHOWCASE ({uploadedVideos.length}{' '}
                  {uploadedVideos.length === 1 ? 'VIDEO' : 'VIDEOS'})
                </span>
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-brand-text">
                {activeUploadedVideo.video_title ||
                  `${project.title} — Motion & Video`}
              </h2>
              {activeUploadedVideo.video_description && (
                <p className="font-sans text-xs sm:text-sm text-brand-text-muted max-w-3xl leading-relaxed">
                  {activeUploadedVideo.video_description}
                </p>
              )}
            </div>

            {activeUploadedVideo.is_featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/25 px-3.5 py-1 font-tech text-[10px] font-extrabold uppercase tracking-wider text-brand-primary self-start sm:self-auto">
                <Star className="h-3 w-3 fill-current" />
                <span>Featured Reel</span>
              </span>
            )}
          </div>

          {/* Primary Responsive HTML5 Video Player (Play/Pause, Volume, Fullscreen, Poster, No Autoplay with Sound) */}
          <div className="rounded-3xl overflow-hidden border border-brand-outline/25 bg-slate-950 shadow-md">
            <div className="aspect-video w-full relative bg-slate-950">
              <video
                key={activeUploadedVideo.video_url}
                src={activeUploadedVideo.video_url}
                poster={posterImage}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain bg-slate-950"
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>

            <div className="px-6 py-4 bg-white border-t border-brand-outline/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-display text-sm font-bold text-brand-text">
                  {activeUploadedVideo.video_title ||
                    `${project.title} — Video ${String(
                      activeVideoIndex + 1
                    ).padStart(2, '0')}`}
                </p>
                {activeUploadedVideo.video_description && (
                  <p className="font-sans text-xs text-brand-text-muted mt-0.5">
                    {activeUploadedVideo.video_description}
                  </p>
                )}
              </div>
              <span className="font-mono text-[11px] font-bold text-brand-text-muted shrink-0">
                Video {String(activeVideoIndex + 1).padStart(2, '0')} of{' '}
                {String(uploadedVideos.length).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Multiple Videos Playlist / Selector Grid */}
          {uploadedVideos.length > 1 && (
            <div className="space-y-3">
              <span className="font-tech text-[11px] font-bold uppercase tracking-wider text-brand-text-muted block">
                More Videos in This Project ({uploadedVideos.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedVideos.map((vid, idx) => {
                  const isCurrent = idx === activeVideoIndex;
                  return (
                    <button
                      key={`${vid.id}-${idx}`}
                      type="button"
                      onClick={() => setActiveVideoIndex(idx)}
                      className={`text-left rounded-2xl border p-4 transition-all cursor-pointer flex items-start gap-3.5 ${
                        isCurrent
                          ? 'border-brand-primary bg-brand-primary/5 shadow-xs'
                          : 'border-brand-outline/20 bg-white hover:border-brand-primary/40'
                      }`}
                    >
                      <div className="h-11 w-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Play
                          className={`h-4 w-4 ${
                            isCurrent ? 'fill-brand-primary' : ''
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-brand-primary">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          {vid.is_featured && (
                            <span className="inline-flex items-center gap-1 rounded bg-brand-primary text-white px-1.5 py-0.5 font-tech text-[9px] font-bold uppercase">
                              <Star className="h-2.5 w-2.5 fill-white" />
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="font-display text-xs font-bold text-brand-text truncate">
                          {vid.video_title ||
                            `${project.title} — Video ${idx + 1}`}
                        </p>
                        {vid.video_description && (
                          <p className="font-sans text-[11px] text-brand-text-muted line-clamp-2">
                            {vid.video_description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Optional External Embedded YouTube Video Showcase */}
      {youtubeEmbedUrl && (
        <section className="space-y-4">
          <div className="space-y-1">
            <span className="font-tech text-xs tracking-widest text-brand-primary font-bold uppercase">
              MOTION & VIDEO SHOWCASE
            </span>
            <h2 className="font-display text-2xl font-black text-brand-text">
              Project Video Presentation
            </h2>
          </div>
          <div className="aspect-video w-full rounded-3xl overflow-hidden border border-brand-outline/25 bg-black shadow-sm">
            <iframe
              src={youtubeEmbedUrl}
              title={`${project.title} Video`}
              className="w-full h-full"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
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

      {/* Full Responsive Multi-Image Gallery Grid */}
      {galleryFrames.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div className="space-y-1">
              <span className="font-tech text-xs tracking-widest text-brand-primary font-bold uppercase">
                VISUAL GALLERY ({galleryFrames.length}{' '}
                {galleryFrames.length === 1 ? 'FRAME' : 'FRAMES'})
              </span>
              <h2 className="font-display text-2xl font-black text-brand-text">
                Project Frames, Storyboards & Deliverables
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {galleryFrames.map((frame, idx) => (
              <div
                key={`gallery-grid-${idx}`}
                onClick={() => setLightboxImage(frame)}
                className="group rounded-2xl overflow-hidden border border-brand-outline/20 bg-white shadow-2xs hover:shadow-md transition-all cursor-zoom-in flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-brand-surface-low">
                  <img
                    src={frame.url}
                    alt={frame.label}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3 left-3 rounded-lg bg-black/70 backdrop-blur-xs px-2.5 py-0.5 font-mono text-[10px] font-bold text-white">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="px-4 py-3 border-t border-brand-outline/10 flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-brand-text">
                    {frame.label}
                  </span>
                  <ZoomIn className="h-3.5 w-3.5 text-brand-text-muted group-hover:text-brand-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full space-y-3"
          >
            <div className="flex items-center justify-between text-white">
              <span className="font-display text-sm font-bold">
                {lightboxImage.label}
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.label}
              className="w-full max-h-[82vh] object-contain rounded-2xl bg-black"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
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
