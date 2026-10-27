import React, { useState, useMemo } from 'react';
import {
  ZOHO_CATALOG_ITEMS,
  ZohoCatalogItem,
} from '../data/zohoCatalog';
import {
  ShieldCheck,
  CheckCircle2,
  Package,
  Video,
  Palette,
  Search,
  MessageCircle,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { NavSection } from '../types';

interface ServicesCatalogProps {
  onNavigate?: (section: NavSection) => void;
  activeFilter?: 'all' | 'package' | 'video' | 'design';
  compact?: boolean;
}

export default function ServicesCatalog({
  onNavigate,
  activeFilter = 'all',
  compact = false,
}: ServicesCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'package' | 'video' | 'design'>(activeFilter);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    return ZOHO_CATALOG_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = ZOHO_CATALOG_ITEMS.length;
    const packages = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'package').length;
    const videos = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'video').length;
    const designs = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'design').length;
    return { total, packages, videos, designs };
  }, []);

  const handleBookService = (item: ZohoCatalogItem) => {
    try {
      const packagePayload = {
        serviceId: 'qbench-' + item.category,
        serviceName: item.name,
        tier: item.unit === 'Package' ? 'Turnkey Suite' : 'Production Scope',
        tierName: item.unit === 'Package' ? 'Full Turnkey Package' : 'Standard Deliverable',
        duration: item.unit === 'Package' ? 'Complete Turnkey Sprint' : 'Standard Turnaround',
        packageCategory: item.categoryLabel,
        addonsOrOptions: [],
        features: item.deliverables || [item.description]
      };
      localStorage.setItem('qbench_selected_package', JSON.stringify(packagePayload));
      localStorage.removeItem('qbench_prefilled_budget');
      localStorage.setItem(
        'qbench_prefilled_message',
        `Hello QBENCH, I am interested in inquiring about the "${item.name}" service (${item.categoryLabel}, ${item.unit} Scope). Please share scope confirmation and onboarding schedule.`
      );
    } catch (e) {
      console.error('Error saving selected service', e);
    }

    if (onNavigate) {
      onNavigate('contact');
    }
  };

  const handleWhatsAppInquiry = (item: ZohoCatalogItem) => {
    const text = `Hi QBENCH, I am interested in booking the service "${item.name}" (${item.categoryLabel}). Could you share availability and proposal details?`;
    window.open(`https://wa.me/917356525932?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div id="all-services-catalog" className="space-y-8 scroll-mt-24">
      {/* Header section */}
      {!compact && (
        <div className="bg-[#05211c] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-[#00685b]/30 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00685b]/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#00685b]/40 text-[#40dfcb] border border-[#00685b]/60">
              <ShieldCheck className="h-4 w-4" />
              <span>Full Service Deliverables Directory</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight leading-tight">
              All 20 Specialized{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#40dfcb] to-[#8ef7ea]">
                QBENCH Services
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore our complete suite of specialized creative and digital services. From complete turnkey event media suites and brand identities to bespoke motion graphics and high-retention video production.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#40dfcb]" />
                5 Complete Turnkey Packages
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#40dfcb]" />
                9 Video & Motion Services
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#40dfcb]" />
                6 Design & Stage Visual Assets
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-[#00685b] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Services ({stats.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('package')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'package'
                ? 'bg-[#00685b] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Turnkey Packages ({stats.packages})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('video')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'video'
                ? 'bg-[#00685b] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Video & Motion ({stats.videos})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('design')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'design'
                ? 'bg-[#00685b] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Design & Stage Visuals ({stats.designs})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services or deliverables..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00685b]/20 focus:border-[#00685b] text-slate-800"
          />
        </div>
      </div>

      {/* 20 Items Grid - NO PRICES DISPLAYED */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.itemId}
            className="flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-6 hover:border-[#00685b]/40 hover:shadow-md transition-all duration-200 group"
          >
            <div>
              {/* Category & Badge Header */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <span className="text-[10px] font-mono uppercase font-bold text-[#00685b] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full">
                  {item.categoryLabel}
                </span>

                {item.badge ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 tracking-wide">
                    {item.badge}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    {item.unit === 'Package' ? 'Full Suite' : `${item.unit} Scope`}
                  </span>
                )}
              </div>

              {/* Service Name */}
              <h3 className="text-lg font-bold text-slate-900 font-display group-hover:text-[#00685b] transition-colors">
                {item.name}
              </h3>

              {/* Deliverable Type Tag */}
              <div className="flex items-center gap-2 my-2 pb-3 border-b border-slate-100 text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1 text-[#00685b] font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {item.unit === 'Package' ? 'Turnkey Production Bundle' : 'Custom Project Deliverable'}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {item.description || 'Verified production deliverable from QBENCH catalog.'}
              </p>

              {/* Deliverables Checklist */}
              {item.deliverables && item.deliverables.length > 0 && (
                <div className="space-y-1.5 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    What's Included:
                  </span>
                  <ul className="space-y-1.5">
                    {item.deliverables.map((deliv, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#00685b] shrink-0 mt-0.5" />
                        <span>{deliv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons - NO PRICES */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBookService(item)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#00685b] hover:bg-[#005147] text-white transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Inquire / Book Scope</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppInquiry(item)}
                  className="p-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all flex items-center justify-center cursor-pointer border border-emerald-200"
                  title="Inquire about this service on WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <p className="text-sm font-medium text-slate-500">
            No services found matching "{searchQuery}"
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-2 text-xs font-bold text-[#00685b] hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
