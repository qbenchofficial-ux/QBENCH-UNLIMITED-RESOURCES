import React, { useState, useMemo, useRef } from 'react';
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
  DollarSign,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  Receipt,
  FileText,
  Users,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Check,
  Building2,
  Calculator,
  Compass
} from 'lucide-react';

interface ZohoInventoryManagerProps {
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export default function ZohoInventoryManager({ onNotify }: ZohoInventoryManagerProps) {
  // Navigation tabs inside Zoho Books Portal
  const [activeTab, setActiveTab] = useState<'portal' | 'catalog' | 'calculator' | 'config'>('portal');

  // Portal frame controls
  const [iframeUrl, setIframeUrl] = useState<string>(ZOHO_CONFIG.portalUrl);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Catalog search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'package' | 'video' | 'design'>('all');

  // Estimate / Invoice Line Builder state
  const [selectedItemForCalc, setSelectedItemForCalc] = useState<ZohoCatalogItem>(ZOHO_CATALOG_ITEMS[0]);
  const [calcQty, setCalcQty] = useState(1);
  const [calcDiscount, setCalcDiscount] = useState(0); // percentage
  const [calcClientName, setCalcClientName] = useState('');
  const [invoiceDraftLines, setInvoiceDraftLines] = useState<
    Array<{ item: ZohoCatalogItem; qty: number; discount: number; lineTotal: number }>
  >([]);

  // Catalog item stats
  const stats = useMemo(() => {
    const total = ZOHO_CATALOG_ITEMS.length;
    const packages = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'package').length;
    const videos = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'video').length;
    const designs = ZOHO_CATALOG_ITEMS.filter((i) => i.category === 'design').length;
    const totalCatalogValue = ZOHO_CATALOG_ITEMS.reduce((sum, item) => sum + item.rate, 0);
    return { total, packages, videos, designs, totalCatalogValue };
  }, []);

  // Filtered catalog items
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

  // Copy helper
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

  // Quick Zoho Books Navigation Modules
  const zohoModules = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="h-4 w-4" />,
      url: `https://books.zoho.in/app/${ZOHO_CONFIG.orgId}#/home/dashboard`,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: <Receipt className="h-4 w-4" />,
      url: `https://books.zoho.in/app/${ZOHO_CONFIG.orgId}#/invoices`,
    },
    {
      id: 'estimates',
      label: 'Estimates & Quotes',
      icon: <FileText className="h-4 w-4" />,
      url: `https://books.zoho.in/app/${ZOHO_CONFIG.orgId}#/estimates`,
    },
    {
      id: 'items',
      label: 'Items & Inventory',
      icon: <Package className="h-4 w-4" />,
      url: `https://books.zoho.in/app/${ZOHO_CONFIG.orgId}#/inventory/items`,
    },
    {
      id: 'variants',
      label: 'Product Variants',
      icon: <Layers className="h-4 w-4" />,
      url: ZOHO_CONFIG.variantsUrl,
    },
    {
      id: 'contacts',
      label: 'Customers / Clients',
      icon: <Users className="h-4 w-4" />,
      url: `https://books.zoho.in/app/${ZOHO_CONFIG.orgId}#/contacts`,
    },
    {
      id: 'payments',
      label: 'Payments Received',
      icon: <CreditCard className="h-4 w-4" />,
      url: `https://books.zoho.in/app/${ZOHO_CONFIG.orgId}#/customerpayments`,
    },
  ];

  // Quick Action Shortcuts
  const quickActions = [
    {
      label: '+ New Invoice',
      url: `https://books.zoho.in/app/${ZOHO_CONFIG.orgId}#/invoices/new`,
      primary: true,
    },
    {
      label: '+ New Estimate',
      url: `https://books.zoho.in/app/${ZOHO_CONFIG.orgId}#/estimates/new`,
      primary: false,
    },
    {
      label: '+ New Item',
      url: `https://books.zoho.in/app/${ZOHO_CONFIG.orgId}#/inventory/items/new`,
      primary: false,
    },
  ];

  // Invoice draft calculation
  const calculatedLineTotal = useMemo(() => {
    const base = selectedItemForCalc.rate * calcQty;
    const disc = base * (calcDiscount / 100);
    return Math.round(base - disc);
  }, [selectedItemForCalc, calcQty, calcDiscount]);

  const addLineToDraft = () => {
    setInvoiceDraftLines((prev) => [
      ...prev,
      {
        item: selectedItemForCalc,
        qty: calcQty,
        discount: calcDiscount,
        lineTotal: calculatedLineTotal,
      },
    ]);
    if (onNotify) {
      onNotify('success', `Added "${selectedItemForCalc.name}" to invoice draft.`);
    }
  };

  const draftSubtotal = useMemo(() => {
    return invoiceDraftLines.reduce((sum, line) => sum + line.lineTotal, 0);
  }, [invoiceDraftLines]);

  const draftGst = Math.round(draftSubtotal * 0.18);
  const draftGrandTotal = draftSubtotal + draftGst;

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : ''}`}>
      
      {/* 1. Top Header Banner with Org Details & Quick Links */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-[#e6f4f1] text-[#00685b] tracking-wider uppercase">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live Zoho Books Portal Active
              </span>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-0.5 rounded-full">
                Org ID: {ZOHO_CONFIG.orgId}
              </span>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-0.5 rounded-full">
                QBENCH India ({ZOHO_CONFIG.currency})
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
              Zoho Books Portal & Financial Operations
            </h1>
            
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Official QBENCH financial management suite. Access your live Zoho Books accounting workspace, manage turnkey packages, look up item codes, and build GST-compliant invoice drafts directly from the admin dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={ZOHO_CONFIG.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00685b] hover:bg-[#005147] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Open full Zoho Books workspace in a new browser window"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Launch Full Zoho Books (New Window)</span>
            </a>

            {isFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <Minimize2 className="h-4 w-4" />
                <span>Exit Fullscreen</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Sub-tab Navigation */}
        <div className="flex border-b border-slate-200 mt-6 pt-2 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('portal')}
            className={`py-3 px-4 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'portal'
                ? 'border-[#00685b] text-[#00685b]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>1. Live Zoho Books Portal Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`py-3 px-4 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'border-[#00685b] text-[#00685b]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>2. Item Catalogue & Rates ({stats.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`py-3 px-4 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'calculator'
                ? 'border-[#00685b] text-[#00685b]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>3. Estimate & Invoice Line Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'config'
                ? 'border-[#00685b] text-[#00685b]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>4. Org & Accounting Credentials</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: LIVE ZOHO BOOKS PORTAL / WORKSPACE                      */}
      {/* ============================================================== */}
      {activeTab === 'portal' && (
        <div className="space-y-4">
          
          {/* Quick Module Navigation Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <span className="font-tech text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Direct Module Launchers (QBENCH Org ID: {ZOHO_CONFIG.orgId})
              </span>

              <div className="flex items-center gap-2">
                {quickActions.map((qa, idx) => (
                  <a
                    key={idx}
                    href={qa.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      qa.primary
                        ? 'bg-[#00685b] hover:bg-[#005147] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{qa.label}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick module links grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {zohoModules.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    setIframeUrl(mod.url);
                    setIframeLoading(true);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                    iframeUrl === mod.url
                      ? 'border-[#00685b] bg-[#e6f4f1] text-[#00685b] shadow-2xs font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    {mod.icon}
                    <a
                      href={mod.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                      title="Open in new window"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                  <span className="text-[11px] font-semibold leading-tight mt-0.5">
                    {mod.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Embedded Zoho Books Workspace Portal Frame */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            
            {/* Browser-like address / controls bar */}
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIframeLoading(true);
                    const current = iframeUrl;
                    setIframeUrl('');
                    setTimeout(() => setIframeUrl(current), 100);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer ml-1"
                  title="Reload Workspace"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${iframeLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* URL bar */}
              <div className="flex-1 max-w-xl mx-auto bg-white border border-slate-200 rounded-lg px-3 py-1 font-mono text-[11px] text-slate-600 truncate flex items-center justify-between">
                <span className="truncate">{iframeUrl}</span>
                <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-tech">
                  SSL / ZOHO.IN
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Portal'}
                >
                  {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>

                <a
                  href={iframeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  title="Open this specific page in a new window"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Embedded iFrame workspace container */}
            <div className="relative w-full h-[750px] bg-slate-50">
              
              {/* Notice banner for browser cookie / third-party auth restrictions */}
              <div className="p-3 bg-amber-50/90 border-b border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Zoho Authentication Notice:</strong> If Zoho Books prompts for login or restricts embedding due to your browser's third-party cookie policy, click "Launch Full Zoho Books" to authenticate your session in a single click.
                  </span>
                </div>
                <a
                  href={iframeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 font-bold text-[11px] shrink-0 inline-flex items-center gap-1"
                >
                  <span>Launch in New Window</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* The Live Iframe */}
              {iframeUrl && (
                <iframe
                  title="Zoho Books Portal"
                  src={iframeUrl}
                  onLoad={() => setIframeLoading(false)}
                  className="w-full h-full border-0"
                  allow="clipboard-write; camera; microphone; payment"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                />
              )}

            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SYNCHRONIZED ITEM CATALOGUE & RATES                      */}
      {/* ============================================================== */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          
          {/* Quick Stat Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                <Layers className="h-3.5 w-3.5 text-[#00685b]" />
                <span>Total Catalog Items</span>
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900 font-display">
                {stats.total}
              </div>
              <div className="text-[11px] text-slate-500">17 services • 3 goods</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
                <Package className="h-3.5 w-3.5 text-emerald-700" />
                <span>Turnkey Packages</span>
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-950 font-display">
                {stats.packages}
              </div>
              <div className="text-[11px] text-emerald-700">₹10K – ₹40K Range</div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-800 text-xs font-medium">
                <Video className="h-3.5 w-3.5 text-indigo-700" />
                <span>Video & Motion Items</span>
              </div>
              <div className="mt-1 text-2xl font-black text-indigo-950 font-display">
                {stats.videos}
              </div>
              <div className="text-[11px] text-indigo-700">₹800 – ₹10,000 Range</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 shadow-2xs">
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
                placeholder="Search by name, item ID, or rate..."
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
                              onClick={() => {
                                setSelectedItemForCalc(item);
                                setActiveTab('calculator');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#00685b] text-xs font-bold transition-colors cursor-pointer"
                              title="Calculate estimate line item"
                            >
                              Calc
                            </button>

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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ESTIMATE & INVOICE LINE BUILDER                         */}
      {/* ============================================================== */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Line Configurator */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
              <div>
                <span className="font-tech text-[10px] font-black uppercase text-[#00685b] tracking-wider">
                  QUICK LINE ITEM CALCULATOR
                </span>
                <h3 className="font-display text-lg font-black text-slate-900 mt-1">
                  Configure Line Item
                </h3>
                <p className="font-sans text-xs text-slate-500 mt-0.5">
                  Select a Zoho catalog service or package, customize quantity and discount, then add to invoice draft.
                </p>
              </div>

              {/* Item Selector */}
              <div className="space-y-1.5">
                <label className="text-slate-600 font-tech text-[11px] uppercase font-bold block">
                  Select Zoho Item / Package
                </label>
                <select
                  value={selectedItemForCalc.itemId}
                  onChange={(e) => {
                    const found = ZOHO_CATALOG_ITEMS.find((i) => i.itemId === e.target.value);
                    if (found) setSelectedItemForCalc(found);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                >
                  {ZOHO_CATALOG_ITEMS.map((item) => (
                    <option key={item.itemId} value={item.itemId}>
                      {item.name} — {item.rateFormatted} / {item.unit} [{item.categoryLabel}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate & Unit Info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">BASE RATE</span>
                  <span className="font-display font-black text-base text-[#00685b]">
                    {selectedItemForCalc.rateFormatted}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">ZOHO ITEM ID</span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {selectedItemForCalc.itemId}
                  </span>
                </div>
              </div>

              {/* Quantity & Discount Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-tech text-[11px] uppercase font-bold block">
                    Quantity ({selectedItemForCalc.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={calcQty}
                    onChange={(e) => setCalcQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 font-tech text-[11px] uppercase font-bold block">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={calcDiscount}
                    onChange={(e) => setCalcDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Calculated Total for this line */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-emerald-800 font-mono text-[10px] block font-bold">LINE AMOUNT (EXCL. GST)</span>
                  <span className="font-display font-black text-xl text-emerald-950">
                    ₹{calculatedLineTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addLineToDraft}
                  className="rounded-xl bg-[#00685b] hover:bg-[#005147] text-white px-4 py-2 text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to Draft</span>
                </button>
              </div>

              {/* Copy line text helper */}
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `${selectedItemForCalc.name} | Qty: ${calcQty} ${selectedItemForCalc.unit} | Rate: ₹${selectedItemForCalc.rate} | Disc: ${calcDiscount}% | Total: ₹${calculatedLineTotal.toLocaleString('en-IN')} [Zoho ID: ${selectedItemForCalc.itemId}]`,
                    'Configured Line Item'
                  )
                }
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy Formatted Line for Zoho Books</span>
              </button>

            </div>

            {/* Right Column: Interactive Invoice Draft Summary */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-tech text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      GST INVOICE / ESTIMATE DRAFT
                    </span>
                    <h3 className="font-display text-lg font-black text-slate-900">
                      Invoice Draft Ledger ({invoiceDraftLines.length} items)
                    </h3>
                  </div>

                  {invoiceDraftLines.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setInvoiceDraftLines([])}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear Draft
                    </button>
                  )}
                </div>

                {invoiceDraftLines.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <Receipt className="h-8 w-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No line items added to draft yet</p>
                    <p className="text-[11px] text-slate-400">
                      Configure an item on the left and click "Add to Draft" to calculate tax breakdown.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs divide-y divide-slate-100">
                        <thead className="bg-slate-50 font-tech uppercase text-[10px] text-slate-500">
                          <tr>
                            <th className="p-2.5">Item</th>
                            <th className="p-2.5">Qty</th>
                            <th className="p-2.5">Rate</th>
                            <th className="p-2.5">Disc</th>
                            <th className="p-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {invoiceDraftLines.map((line, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-900">{line.item.name}</td>
                              <td className="p-2.5 font-mono">{line.qty} {line.item.unit}</td>
                              <td className="p-2.5 font-mono">{line.item.rateFormatted}</td>
                              <td className="p-2.5 font-mono">{line.discount}%</td>
                              <td className="p-2.5 font-mono font-bold text-slate-900 text-right">
                                ₹{line.lineTotal.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹{draftSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST @ 18% (CGST 9% + SGST 9% / IGST 18%):</span>
                  <span className="font-mono font-semibold">₹{draftGst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100 font-display">
                  <span>Grand Total (INR):</span>
                  <span className="text-[#00685b] font-mono">₹{draftGrandTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="pt-3 flex flex-wrap gap-2">
                  <a
                    href={`https://books.zoho.in/app/${ZOHO_CONFIG.orgId}#/invoices/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-[#00685b] hover:bg-[#005147] text-white py-3 text-center font-display text-xs font-bold uppercase tracking-wider transition-all shadow-xs inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Create in Zoho Books</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <button
                    type="button"
                    disabled={invoiceDraftLines.length === 0}
                    onClick={() => {
                      const text = `QBENCH INVOICE ESTIMATE DRAFT\n-----------------------------\n` +
                        invoiceDraftLines.map((l) => `${l.item.name} x ${l.qty} = ₹${l.lineTotal.toLocaleString('en-IN')}`).join('\n') +
                        `\n-----------------------------\nSubtotal: ₹${draftSubtotal.toLocaleString('en-IN')}\nGST (18%): ₹${draftGst.toLocaleString('en-IN')}\nGrand Total: ₹${draftGrandTotal.toLocaleString('en-IN')}\nZoho Org ID: ${ZOHO_CONFIG.orgId}`;
                      handleCopy(text, 'Complete Invoice Draft Summary');
                    }}
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                  >
                    Copy Summary
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: ORG & ACCOUNTING CREDENTIALS                            */}
      {/* ============================================================== */}
      {activeTab === 'config' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div>
            <span className="font-tech text-[10px] font-black uppercase text-[#00685b] tracking-wider">
              ENTERPRISE CONFIGURATION
            </span>
            <h3 className="font-display text-xl font-black text-slate-900 mt-1">
              Zoho Books Organization & Integration Setup
            </h3>
            <p className="font-sans text-xs text-slate-500 mt-0.5 max-w-2xl">
              Verified organization credentials, API endpoint parameters, and deep-link patterns for QBENCH accounting operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">ORGANIZATION NAME</span>
              <p className="font-display font-black text-slate-900 text-base">{ZOHO_CONFIG.orgName}</p>
              <p className="text-[11px] text-slate-500">Creative, Digital & Events Agency</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">ZOHO ORGANIZATION ID</span>
              <div className="flex items-center justify-between">
                <p className="font-mono font-black text-slate-900 text-base">{ZOHO_CONFIG.orgId}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(ZOHO_CONFIG.orgId, 'Organization ID')}
                  className="text-xs text-[#00685b] font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">books.zoho.in (India Data Center)</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">CURRENCY & TAX JURISDICTION</span>
              <p className="font-display font-black text-slate-900 text-base">INR (₹) — GST Compliant</p>
              <p className="text-[11px] text-slate-500">Standard GST Rate: 18% (CGST 9% + SGST 9% / IGST 18%)</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">ZOHO BOOKS PORTAL URL</span>
              <a
                href={ZOHO_CONFIG.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs font-bold text-[#00685b] hover:underline truncate block"
              >
                {ZOHO_CONFIG.portalUrl}
              </a>
              <p className="text-[11px] text-slate-500">Direct portal entry point for authenticated team members</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-900">
            <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
            <div>
              <strong>Security Protocol:</strong> Privileged Zoho API tokens, refresh tokens, and client secrets are never exposed in client bundles. Deep links safely authenticate through your existing active Zoho single sign-on session.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
