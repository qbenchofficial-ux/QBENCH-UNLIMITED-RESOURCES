import React, { useState, useMemo } from 'react';
import {
  ZOHO_CONFIG,
  ZOHO_CATALOG_ITEMS,
  ZohoCatalogItem,
  formatINR,
} from '../data/zohoCatalog';
import {
  CheckCircle2,
  Package,
  Video,
  Palette,
  ArrowRight,
  Calculator,
  Plus,
  Minus,
  Trash2,
  Share2,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  Clock,
  Layers,
  Copy
} from 'lucide-react';
import { NavSection } from '../types';

interface ZohoCatalogSectionProps {
  onNavigate?: (section: NavSection) => void;
  onSelectZohoPackage?: (item: ZohoCatalogItem) => void;
}

export default function ZohoCatalogSection({
  onNavigate,
  onSelectZohoPackage,
}: ZohoCatalogSectionProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'package' | 'video' | 'design'>('package');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [copiedEstimate, setCopiedEstimate] = useState(false);

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return ZOHO_CATALOG_ITEMS;
    return ZOHO_CATALOG_ITEMS.filter((i) => i.category === activeTab);
  }, [activeTab]);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = 1;
      }
      return next;
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] || 0;
      const nextVal = current + delta;
      if (nextVal <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: nextVal };
    });
  };

  const clearSelection = () => {
    setSelectedItems({});
  };

  // Estimate calculations
  const estimateSummary = useMemo(() => {
    let subtotal = 0;
    const itemsList: { item: ZohoCatalogItem; quantity: number; total: number }[] = [];

    Object.entries(selectedItems).forEach(([id, rawQty]) => {
      const qty = Number(rawQty) || 0;
      if (qty <= 0) return;
      const found = ZOHO_CATALOG_ITEMS.find((it) => it.itemId === id);
      if (found) {
        const itemTotal = found.rate * qty;
        subtotal += itemTotal;
        itemsList.push({ item: found, quantity: qty, total: itemTotal });
      }
    });

    return { subtotal, itemsList, count: itemsList.length };
  }, [selectedItems]);

  const handleBookSinglePackage = (pkg: ZohoCatalogItem) => {
    if (onSelectZohoPackage) {
      onSelectZohoPackage(pkg);
    } else {
      try {
        const packagePayload = {
          serviceId: 'zoho-' + pkg.category,
          serviceName: pkg.name,
          tier: 'zoho-catalog',
          tierName: `Zoho Books Verified [${pkg.unit}]`,
          price: pkg.rate,
          priceFormatted: pkg.rateFormatted,
          timeline: 'Consultation & Sprint',
          zohoItemId: pkg.itemId,
          zohoRate: pkg.rate,
          features: pkg.deliverables || [pkg.description]
        };
        localStorage.setItem('qbench_selected_package', JSON.stringify(packagePayload));
        localStorage.setItem('qbench_prefilled_budget', pkg.rateFormatted);
        localStorage.setItem(
          'qbench_prefilled_message',
          `Hello QBENCH, I am interested in booking the "${pkg.name}" (${pkg.rateFormatted} / ${pkg.unit}, Zoho Ref #${pkg.itemId}). Please share scope confirmation and invoice schedule.`
        );
      } catch (err) {
        console.error('Error saving package to localStorage', err);
      }
      if (onNavigate) {
        onNavigate('contact');
      }
    }
  };

  const handleBookEstimate = () => {
    if (estimateSummary.itemsList.length === 0) return;

    const breakdownText = estimateSummary.itemsList
      .map(
        (line) =>
          `• ${line.item.name} (${line.quantity > 1 ? `${line.quantity}x ` : ''}${formatINR(line.total)}, Item #${line.item.itemId})`
      )
      .join('\n');

    const totalFormatted = formatINR(estimateSummary.subtotal);

    try {
      const packagePayload = {
        serviceId: 'zoho-custom-estimate',
        serviceName: `Custom Scope (${estimateSummary.count} Zoho items)`,
        tier: 'custom-zoho-bundle',
        tierName: 'Zoho Books Itemized Scope',
        price: estimateSummary.subtotal,
        priceFormatted: totalFormatted,
        timeline: 'Custom Milestone Schedule',
        features: estimateSummary.itemsList.map(
          (i) => `${i.item.name} (${i.quantity > 1 ? `${i.quantity}x ` : ''}${formatINR(i.total)})`
        )
      };
      localStorage.setItem('qbench_selected_package', JSON.stringify(packagePayload));
      localStorage.setItem('qbench_prefilled_budget', totalFormatted);
      localStorage.setItem(
        'qbench_prefilled_message',
        `Hello QBENCH, I have configured a custom project estimate via your Zoho Books catalog:\n\n${breakdownText}\n\nEstimated Total: ${totalFormatted}\n\nPlease confirm availability and next steps.`
      );
    } catch (err) {
      console.error('Error saving estimate to localStorage', err);
    }

    if (onNavigate) {
      onNavigate('contact');
    }
  };

  const handleWhatsAppEstimate = () => {
    if (estimateSummary.itemsList.length === 0) return;
    const breakdownText = estimateSummary.itemsList
      .map(
        (line) =>
          `• ${line.item.name} (${line.quantity > 1 ? `${line.quantity}x ` : ''}${formatINR(line.total)})`
      )
      .join('%0A');
    const totalFormatted = formatINR(estimateSummary.subtotal);
    const text = `Hi QBENCH, I calculated an estimate from your Zoho Books Catalog:%0A%0A${breakdownText}%0A%0ATotal Estimated: ${totalFormatted}%0A%0ACould we discuss timeline and invoice details?`;
    window.open(`https://wa.me/917356525932?text=${text}`, '_blank');
  };

  const handleCopyEstimate = () => {
    if (estimateSummary.itemsList.length === 0) return;
    const breakdownText = estimateSummary.itemsList
      .map(
        (line) =>
          `• ${line.item.name} (${line.quantity > 1 ? `${line.quantity}x ` : ''}${formatINR(line.total)}, Ref #${line.item.itemId})`
      )
      .join('\n');
    const totalFormatted = formatINR(estimateSummary.subtotal);
    const clipboardText = `QBENCH Project Estimate (Zoho Books Verified):\n\n${breakdownText}\n\nTotal: ${totalFormatted}\n\nVerified via Zoho Books Org ID: ${ZOHO_CONFIG.orgId}`;
    navigator.clipboard.writeText(clipboardText);
    setCopiedEstimate(true);
    setTimeout(() => setCopiedEstimate(false), 3000);
  };

  return (
    <div className="space-y-8" id="zoho-catalog-section">
      {/* Section Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-radial from-slate-900 via-[#072421] to-[#041513] text-white p-8 md:p-12 border border-[#00685b]/30 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#00685b]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#00685b]/40 text-[#40dfcb] border border-[#00685b]/60">
            <ShieldCheck className="h-4 w-4" />
            <span>Zoho Books Verified Rate Card</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight leading-tight">
            Transparent Pricing.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#40dfcb] to-[#8ef7ea]">
              Zero Guesswork.
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Every package, video highlight, and design asset has an official registered item ID and fixed pricing in Indian Rupees (INR) synced with QBENCH’s Zoho Books ERP (Org ID: {ZOHO_CONFIG.orgId}). Select individual deliverables or turnkey bundles to generate your itemized estimate.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#40dfcb]" />
              GST Invoicing Ready
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#40dfcb]" />
              20 Standardized Items
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#40dfcb]" />
              Direct Bank & UPI Settlement
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('package')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-display text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'package'
                ? 'bg-[#00685b] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Turnkey Packages (5)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-display text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-[#00685b] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Video & Motion (9)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('design')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-display text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'design'
                ? 'bg-[#00685b] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Design & Stage Visuals (6)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-display text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#00685b] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>All Items (20)</span>
          </button>
        </div>

        {estimateSummary.count > 0 && (
          <div className="flex items-center gap-2 text-xs font-bold text-[#00685b] bg-[#e6f4f1] px-3 py-1.5 rounded-xl">
            <Calculator className="h-4 w-4" />
            <span>{estimateSummary.count} item{estimateSummary.count > 1 ? 's' : ''} in your custom scope: {formatINR(estimateSummary.subtotal)}</span>
          </div>
        )}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isSelected = !!selectedItems[item.itemId];
          const qty = selectedItems[item.itemId] || 0;

          return (
            <div
              key={item.itemId}
              className={`flex flex-col justify-between rounded-2xl bg-white p-6 transition-all border ${
                isSelected
                  ? 'border-[#00685b] ring-2 ring-[#00685b]/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-400">
                      {item.categoryLabel}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-display mt-0.5">
                      {item.name}
                    </h3>
                  </div>

                  {item.badge && (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 tracking-wide">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Price block */}
                <div className="flex items-baseline gap-1.5 my-3 pb-3 border-b border-slate-100">
                  <span className="text-2xl font-black font-display text-slate-900">
                    {item.rateFormatted}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    / {item.unit}
                  </span>
                  <span className="ml-auto text-[10px] font-mono text-slate-400">
                    ID #{item.itemId.slice(-6)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {item.description || 'Verified production deliverable from QBENCH catalog.'}
                </p>

                {/* Deliverables List */}
                {item.deliverables && item.deliverables.length > 0 && (
                  <div className="space-y-1.5 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Inclusions:
                    </span>
                    <ul className="space-y-1">
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

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleItemSelection(item.itemId)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#00685b] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    <span>{isSelected ? `Selected (${qty})` : 'Add to Estimate'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBookSinglePackage(item)}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-[#e6f4f1] hover:bg-[#d0ece7] text-[#00685b] transition-all flex items-center gap-1 cursor-pointer"
                    title="Inquire directly with this single item"
                  >
                    <span>Inquire</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* If selected and unit is 'Each' or 'Project', allow quantity controls */}
                {isSelected && (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.itemId, -1)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-slate-900 w-4 text-center">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.itemId, 1)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating or Bottom Estimate Summary Banner when items are selected */}
      {estimateSummary.count > 0 && (
        <div className="sticky bottom-6 z-30 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#00685b] text-[#40dfcb]">
                  Custom Zoho Scope
                </span>
                <span className="text-xs text-slate-400">
                  {estimateSummary.count} item{estimateSummary.count > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400">Estimated Project Total:</span>
                <span className="text-2xl sm:text-3xl font-black font-display text-white">
                  {formatINR(estimateSummary.subtotal)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">(excl. GST)</span>
              </div>
              <div className="text-xs text-slate-400 max-w-xl truncate">
                {estimateSummary.itemsList
                  .map((i) => `${i.item.name} (${i.quantity > 1 ? `${i.quantity}x ` : ''}${formatINR(i.total)})`)
                  .join(' • ')}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleCopyEstimate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedEstimate ? 'Copied!' : 'Copy Breakdown'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppEstimate}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Quote</span>
              </button>

              <button
                type="button"
                onClick={handleBookEstimate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00685b] hover:bg-[#005147] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <span>Book This Scope</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
