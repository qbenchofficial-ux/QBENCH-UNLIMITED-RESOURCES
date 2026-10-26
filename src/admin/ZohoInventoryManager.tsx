import React, { useState, useMemo } from 'react';
import {
  ZOHO_CONFIG,
  ZOHO_CATALOG_ITEMS,
  ZohoCatalogItem,
  formatINR,
} from '../data/zohoCatalog';
import {
  ExternalLink,
  Search,
  Copy,
  CheckCircle2,
  Package,
  Video,
  Palette,
  FileSpreadsheet,
  ArrowUpRight,
  Filter,
  Layers,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';

interface ZohoInventoryManagerProps {
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export default function ZohoInventoryManager({ onNotify }: ZohoInventoryManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'package' | 'video' | 'design'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return ZOHO_CATALOG_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.itemId.includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.rateFormatted.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const stats = useMemo(() => {
    const total = ZOHO_CATALOG_ITEMS.length;
    const packages = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'package').length;
    const videos = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'video').length;
    const designs = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'design').length;
    const totalCatalogValue = ZOHO_CATALOG_ITEMS.reduce((sum, item) => sum + item.rate, 0);
    return { total, packages, videos, designs, totalCatalogValue };
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    if (onNotify) {
      onNotify('success', `Copied ${label} to clipboard!`);
    }
    setTimeout(() => {
      setCopiedId((prev) => (prev === text ? null : prev));
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Links */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e6f4f1] text-[#00685b] tracking-wide uppercase">
                <CheckCircle2 className="h-3 w-3" />
                Live Zoho Books Catalog Synced
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Org ID: {ZOHO_CONFIG.orgId}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
              Zoho Books Inventory & Rate Card
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Official QBENCH item catalogue, standardized rates, and turnkey packages synchronized from Zoho Books India. Click any item to jump directly into Zoho Books item editor or copy credentials for client invoicing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={ZOHO_CONFIG.variantsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00685b] hover:bg-[#005147] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open Zoho Product Variants</span>
            </a>

            <a
              href={ZOHO_CONFIG.itemsListUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
              <span>Zoho Items List</span>
            </a>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Layers className="h-3.5 w-3.5 text-[#00685b]" />
              <span>Total Catalog Items</span>
            </div>
            <div className="mt-1 text-2xl font-black text-slate-900 font-display">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500">17 services • 3 goods</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
              <Package className="h-3.5 w-3.5 text-emerald-700" />
              <span>Turnkey Packages</span>
            </div>
            <div className="mt-1 text-2xl font-black text-emerald-950 font-display">
              {stats.packages}
            </div>
            <div className="text-[11px] text-emerald-700">₹10K – ₹40K Range</div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-800 text-xs font-medium">
              <Video className="h-3.5 w-3.5 text-indigo-700" />
              <span>Video & Motion Items</span>
            </div>
            <div className="mt-1 text-2xl font-black text-indigo-950 font-display">
              {stats.videos}
            </div>
            <div className="text-[11px] text-indigo-700">₹800 – ₹10,000 Range</div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
              <Palette className="h-3.5 w-3.5 text-amber-700" />
              <span>Design & Stage Visuals</span>
            </div>
            <div className="mt-1 text-2xl font-black text-amber-950 font-display">
              {stats.designs}
            </div>
            <div className="text-[11px] text-amber-700">Starting from ₹250</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#00685b] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('package')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'package'
                ? 'bg-[#00685b] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Packages ({stats.packages})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('video')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'video'
                ? 'bg-[#00685b] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Video & Motion ({stats.videos})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('design')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'design'
                ? 'bg-[#00685b] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Design & Visuals ({stats.designs})
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, item ID, or price..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00685b]/20 focus:border-[#00685b] text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Rate (INR)</th>
                <th className="py-3.5 px-4">Unit / Type</th>
                <th className="py-3.5 px-4">Zoho Item ID</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const itemDeepLink = ZOHO_CONFIG.getItemUrl(item.itemId);
                const isCopied = copiedId === item.itemId;

                return (
                  <tr
                    key={item.itemId}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-4 px-4 max-w-sm">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-[#e6f4f1] group-hover:text-[#00685b] transition-colors shrink-0">
                          {item.category === 'package' && <Package className="h-4 w-4" />}
                          {item.category === 'video' && <Video className="h-4 w-4" />}
                          {item.category === 'design' && <Palette className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {item.description || 'Standard catalog deliverable'}
                          </p>
                          {item.deliverables && item.deliverables.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.deliverables.slice(0, 3).map((d, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                                >
                                  • {d}
                                </span>
                              ))}
                              {item.deliverables.length > 3 && (
                                <span className="text-[10px] text-slate-400 self-center">
                                  +{item.deliverables.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium text-[11px] bg-slate-100 text-slate-700">
                        {item.categoryLabel}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-display font-black text-slate-900 text-sm text-[#00685b]">
                        {item.rateFormatted}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-slate-700 font-medium">Per {item.unit}</div>
                      <div className="text-slate-400 text-[10px] uppercase">
                        {item.productType} ({item.itemType})
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80 w-fit">
                        <span>{item.itemId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.itemId, `Item ID ${item.itemId}`)}
                          className="hover:text-slate-900 p-0.5 rounded cursor-pointer"
                          title="Copy Item ID"
                        >
                          {isCopied ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `${item.name} (${item.rateFormatted} / ${item.unit}) [Zoho Item ID: ${item.itemId}]`,
                              `${item.name} Line Item`
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          title="Copy text formatted for invoice line item"
                        >
                          Copy Line
                        </button>

                        <a
                          href={itemDeepLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#e6f4f1] hover:bg-[#d0ece7] text-[#00685b] text-xs font-bold transition-colors cursor-pointer"
                          title="Open directly in Zoho Books"
                        >
                          <span>Zoho</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No Zoho items found matching "{searchQuery}"</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="mt-2 text-xs font-bold text-[#00685b] hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
