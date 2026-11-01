import React from 'react';
import { motion } from 'motion/react';
import type { ServiceTab } from '../../types';
import BrandingVisual from './BrandingVisual';
import SocialMediaVisual from './SocialMediaVisual';
import VideoEditingVisual from './VideoEditingVisual';
import DigitalMarketingVisual from './DigitalMarketingVisual';
import WebsiteDevelopmentVisual from './WebsiteDevelopmentVisual';
import MotionGraphicsVisual from './MotionGraphicsVisual';
import CreativeDesignVisual from './CreativeDesignVisual';

interface CategoryVisualRendererProps {
  categoryId: ServiceTab;
  imageUrl?: string | null;
  videoUrl?: string | null;
  className?: string;
  isHovered?: boolean;
}

export default function CategoryVisualRenderer({
  categoryId,
  imageUrl,
  videoUrl,
  className = '',
  isHovered = false,
}: CategoryVisualRendererProps) {
  // If an uploaded/configured video URL is provided by the admin
  if (videoUrl && videoUrl.trim()) {
    return (
      <div
        className={`relative w-full aspect-[16/9] max-h-[240px] md:max-h-[340px] lg:max-h-[420px] rounded-2xl overflow-hidden bg-black select-none ${className}`}
      >
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  // If an uploaded/configured image URL is provided by the admin
  if (imageUrl && imageUrl.trim()) {
    return (
      <div
        className={`relative w-full aspect-[16/9] max-h-[240px] md:max-h-[340px] lg:max-h-[420px] rounded-2xl overflow-hidden bg-slate-900 select-none ${className}`}
      >
        <motion.img
          src={imageUrl}
          alt={`Visual for ${categoryId}`}
          loading="lazy"
          className="w-full h-full object-cover object-center filter brightness-[0.98]"
          animate={{ scale: isHovered ? 1.04 : 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  // Render the unique animated motion graphics visual per category
  const renderVisual = () => {
    switch (categoryId) {
      case 'branding':
        return <BrandingVisual />;
      case 'social-media':
        return <SocialMediaVisual />;
      case 'video-editing':
        return <VideoEditingVisual />;
      case 'digital-marketing':
        return <DigitalMarketingVisual />;
      case 'webdev':
        return <WebsiteDevelopmentVisual />;
      case 'motion':
        return <MotionGraphicsVisual />;
      case 'creative-design':
        return <CreativeDesignVisual />;
      default:
        return <BrandingVisual />;
    }
  };

  return (
    <div
      className={`relative w-full aspect-[16/9] max-h-[240px] md:max-h-[340px] lg:max-h-[420px] rounded-2xl overflow-hidden shadow-md border border-brand-outline/15 select-none transition-transform duration-300 ${
        isHovered ? 'scale-[1.01]' : 'scale-100'
      } ${className}`}
    >
      {renderVisual()}
    </div>
  );
}
