import React from 'react';

// A helper component to render a unified shimmer-box skeleton element.
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={`bg-slate-200/70 border border-slate-300/10 rounded-lg animate-pulse ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

// ----------------------------------------------------
// HOME SKELETON LOADER
// ----------------------------------------------------
export function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 space-y-20">
      {/* Hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-8">
        <div className="lg:col-span-7 space-y-6">
          {/* Main heading lines */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-10 w-2/3 rounded-xl" />
            <Skeleton className="h-12 w-1/2 rounded-xl" />
          </div>
          {/* Subtext description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          {/* Buttons row */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Skeleton className="h-12 w-40 rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
        
        {/* Visual Showcase (Metrics panel mock) */}
        <div className="lg:col-span-5">
          <div className="border border-brand-outline/25 rounded-2xl p-6 bg-white shadow-xs space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-24 rounded-lg" />
              </div>
              <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services summary row */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-brand-outline/20 pb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-brand-outline/20 bg-white rounded-2xl p-6 space-y-4 shadow-2xs">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ABOUT SKELETON LOADER
// ----------------------------------------------------
export function AboutSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12 space-y-12">
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-4 w-32 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-3/4 rounded-xl" />
          <Skeleton className="h-10 w-1/2 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      {/* Bio panels mock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-brand-outline/25 bg-white rounded-2xl p-6 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
            <Skeleton className="h-3 w-1/3" />
            <div className="space-y-1.5 pt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SERVICES SKELETON LOADER
// ----------------------------------------------------
export function ServicesSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 space-y-12">
      {/* Intro section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48 rounded-lg mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>

      {/* Nav Tabs row */}
      <div className="flex flex-wrap gap-2 justify-center border-b border-brand-outline/20 pb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-lg" />
        ))}
      </div>

      {/* Main active tab presentation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
        <div className="md:col-span-7 space-y-6">
          <Skeleton className="h-8 w-2/3 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <div className="border border-slate-100 rounded-xl p-6 bg-white space-y-4">
            <Skeleton className="h-5 w-40 rounded-md" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 bg-white border border-brand-outline/25 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="pt-6 border-t border-brand-outline/10 space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PORTFOLIO SKELETON LOADER
// ----------------------------------------------------
export function PortfolioSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 space-y-12">
      {/* Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-64 rounded-lg mx-auto" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-brand-outline/25 bg-white rounded-2xl overflow-hidden shadow-xs space-y-4">
            <Skeleton className="h-52 w-full rounded-t-2xl" />
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-16 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PROCESS SKELETON LOADER
// ----------------------------------------------------
export function ProcessSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 space-y-12">
      {/* Title block */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-56 rounded-lg mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>

      {/* Timeline Nodes */}
      <div className="relative max-w-3xl mx-auto pl-8 sm:pl-0 sm:space-y-16 py-8">
        {/* Hidden vertical line */}
        <div className="absolute left-8 sm:left-1/2 transform -translate-x-1/2 top-4 bottom-4 w-0.5 border-l-2 border-dashed border-slate-200" />
        
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex flex-col sm:flex-row items-center relative ${i % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>
            {/* Circle Node */}
            <div className="absolute left-0 sm:left-1/2 transform -translate-x-1/2 h-10 w-10 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center z-10 animate-pulse">
              <div className="h-4 w-4 rounded-full bg-slate-300" />
            </div>

            {/* Empty space matching timeline balance */}
            <div className="w-full sm:w-1/2 pr-0 sm:pr-12 md:pr-16" />

            {/* Block content mock */}
            <div className="w-full sm:w-1/2 pl-12 sm:pl-12 md:pl-16 pt-4 sm:pt-0">
              <div className="border border-brand-outline/25 bg-white rounded-2xl p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PACKAGES SKELETON LOADER
// ----------------------------------------------------
export function PackagesSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 space-y-16">
      {/* Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-64 rounded-lg mx-auto" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Calculator tool skeleton */}
      <div className="bg-brand-secondary/5 border border-brand-outline/25 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-brand-outline/15 pb-4">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full mt-2 sm:mt-0" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-slate-100 p-4 rounded-xl bg-white space-y-3">
              <Skeleton className="h-4 w-24 rounded" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-5 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Columns packages matching India base prices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`border border-brand-outline/25 bg-white rounded-2xl p-6 space-y-6 flex flex-col justify-between ${i === 2 ? 'ring-2 ring-[#00685b] shadow-md relative' : ''}`}>
            {i === 2 && (
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
            )}
            <div className="space-y-4">
              <Skeleton className="h-5 w-20 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-8 w-32 rounded-lg" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-3.5 w-full" />
              
              <div className="border-t border-brand-outline/10 pt-4 space-y-3">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                ))}
              </div>
            </div>

            <Skeleton className="h-11 w-full rounded-xl mt-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// CONTACT SKELETON LOADER
// ----------------------------------------------------
export function ContactSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 space-y-12">
      {/* Header text */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48 rounded-lg mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>

      {/* Two Columns contact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column info */}
        <div className="lg:col-span-4 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 border border-brand-outline/15 bg-white rounded-xl">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          ))}
        </div>

        {/* Right column form */}
        <div className="lg:col-span-8 bg-white border border-brand-outline/25 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MAIN ROUTER SKELETON RE-REDIRECTOR
// ----------------------------------------------------
interface SkeletonRouterProps {
  section: string;
}

export default function SkeletonRouter({ section }: SkeletonRouterProps) {
  switch (section) {
    case 'home':
      return <HomeSkeleton />;
    case 'about':
      return <AboutSkeleton />;
    case 'services':
      return <ServicesSkeleton />;
    case 'portfolio':
      return <PortfolioSkeleton />;
    case 'process':
      return <ProcessSkeleton />;
    case 'packages':
      return <PackagesSkeleton />;
    case 'contact':
      return <ContactSkeleton />;
    default:
      return <HomeSkeleton />;
  }
}
