import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { PricingRecord, PricingType } from '../types/crm';
import {
  fetchPricingRecords,
  saveBulkPricingRecords,
  exportPricingToExcel,
  downloadPricingTemplate,
  parsePricingExcel
} from '../services/crmService';
import * as XLSX from 'xlsx';
import {
  Search,
  Plus,
  Save,
  RotateCcw,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  Tag,
  Percent,
  DollarSign,
  HelpCircle,
  X,
  FileText,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface PricingManagementProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function PricingManagement({ onNotify }: PricingManagementProps) {
  const [records, setRecords] = useState<PricingRecord[]>([]);
  const [originalRecords, setOriginalRecords] = useState<PricingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Excel / CSV Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    validRecords: PricingRecord[];
    errors: string[];
  } | null>(null);
  const [importingFile, setImportingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load records
  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchPricingRecords();
      setRecords(JSON.parse(JSON.stringify(data)));
      setOriginalRecords(JSON.parse(JSON.stringify(data)));
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load pricing matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Compute dirty edits
  const dirtyCount = useMemo(() => {
    if (records.length !== originalRecords.length) return Math.abs(records.length - originalRecords.length) + 1;
    let count = 0;
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const orig = originalRecords.find((o) => o.id === r.id);
      if (!orig || JSON.stringify(r) !== JSON.stringify(orig)) {
        count++;
      }
    }
    return count;
  }, [records, originalRecords]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.service_category) set.add(r.service_category);
    });
    return Array.from(set);
  }, [records]);

  // Filtered list
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((rec) => {
      if (categoryFilter !== 'all' && rec.service_category !== categoryFilter) return false;
      if (activeFilter === 'active' && !rec.active) return false;
      if (activeFilter === 'inactive' && rec.active) return false;
      if (!q) return true;
      return (
        rec.id.toLowerCase().includes(q) ||
        rec.service_category.toLowerCase().includes(q) ||
        rec.service_name.toLowerCase().includes(q) ||
        rec.package_name.toLowerCase().includes(q) ||
        rec.package_description.toLowerCase().includes(q) ||
        rec.deliverables.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [records, search, categoryFilter, activeFilter]);

  // Inline Field Change
  const handleFieldChange = (id: string, field: keyof PricingRecord, value: any) => {
    setRecords((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Automatically recalculate final_price when base_price or discount changes
        if (field === 'base_price' || field === 'discount') {
          const base = field === 'base_price' ? Math.max(0, Number(value) || 0) : item.base_price;
          const disc = field === 'discount' ? Math.min(100, Math.max(0, Number(value) || 0)) : item.discount;
          updated.final_price = Math.round(base * (1 - disc / 100));
        }

        return updated;
      })
    );
  };

  // Deliverables delimiter change
  const handleDeliverablesChange = (id: string, text: string) => {
    const items = text.split(/[|,]/).map((s) => s.trim()).filter(Boolean);
    handleFieldChange(id, 'deliverables', items);
  };

  // Add New Pricing Record
  const handleAddNewRecord = () => {
    const nextIdx = records.length + 1;
    const prefix = 'PRC-NEW-';
    const newId = `${prefix}${String(nextIdx).padStart(3, '0')}`;

    const newRecord: PricingRecord = {
      id: newId,
      service_category: 'Branding',
      service_name: 'Custom Service',
      package_name: 'New Custom Package',
      package_description: 'Enter scope description here...',
      deliverables: ['Deliverable 1', 'Deliverable 2'],
      pricing_type: 'Fixed',
      base_price: 15000,
      discount: 0,
      final_price: 15000,
      gst_rate: 18,
      currency: 'INR',
      active: true,
      last_updated: new Date().toISOString(),
      updated_by: 'Admin'
    };

    setRecords((prev) => [newRecord, ...prev]);
    onNotify('success', `Created new price draft ${newId}. Remember to Save All Changes.`);
  };

  // Duplicate an existing record
  const handleDuplicateRecord = (item: PricingRecord) => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newId = `${item.id}-COPY-${randomSuffix}`;

    const duplicated: PricingRecord = {
      ...item,
      id: newId,
      package_name: `${item.package_name} (Copy)`,
      last_updated: new Date().toISOString(),
      updated_by: 'Admin'
    };

    setRecords((prev) => [duplicated, ...prev]);
    onNotify('success', `Duplicated ${item.id} as ${newId}.`);
  };

  // Delete Record
  const handleDeleteRecord = (id: string) => {
    if (!confirm(`Are you sure you want to remove price record ${id}?`)) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    onNotify('success', `Removed ${id}. Remember to Save All Changes.`);
  };

  // Save All Changes
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const saved = await saveBulkPricingRecords(records);
      setRecords(JSON.parse(JSON.stringify(saved)));
      setOriginalRecords(JSON.parse(JSON.stringify(saved)));
      onNotify('success', `Successfully committed ${saved.length} pricing records to database!`);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to save pricing changes.');
    } finally {
      setSaving(false);
    }
  };

  // Discard Edits
  const handleDiscard = () => {
    if (!confirm('Discard all unsaved edits and restore last saved state?')) return;
    setRecords(JSON.parse(JSON.stringify(originalRecords)));
    onNotify('success', 'Unsaved edits discarded.');
  };

  // Export to CSV
  const handleExportCsv = () => {
    const rows = filteredRecords.map((rec) => ({
      'Price ID': rec.id,
      'Service Category': rec.service_category,
      'Service Name': rec.service_name,
      'Package Name': rec.package_name,
      'Description': rec.package_description,
      'Deliverables': rec.deliverables.join(' | '),
      'Pricing Type': rec.pricing_type,
      'Base Price (INR)': rec.base_price,
      'Discount (%)': rec.discount,
      'Final Price (INR)': rec.final_price,
      'GST Rate (%)': rec.gst_rate,
      'Currency': rec.currency,
      'Active': rec.active ? 'YES' : 'NO'
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `QBench_Pricing_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Exported pricing to CSV.');
  };

  // Handle File Upload for Import
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingFile(true);
    try {
      const parsed = await parsePricingExcel(file);
      setImportPreview(parsed);
      setImportModalOpen(true);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to parse Excel file.');
    } finally {
      setImportingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Commit imported records
  const handleCommitImport = () => {
    if (!importPreview || importPreview.validRecords.length === 0) return;

    // Merge or upsert into current list
    const incomingMap = new Map<string, PricingRecord>();
    importPreview.validRecords.forEach((r) => incomingMap.set(r.id, r));

    const merged: PricingRecord[] = [];
    const touchedIds = new Set<string>();

    // Update existing
    records.forEach((existing) => {
      if (incomingMap.has(existing.id)) {
        merged.push(incomingMap.get(existing.id)!);
        touchedIds.add(existing.id);
      } else {
        merged.push(existing);
      }
    });

    // Append newly introduced records
    importPreview.validRecords.forEach((incoming) => {
      if (!touchedIds.has(incoming.id)) {
        merged.push(incoming);
      }
    });

    setRecords(merged);
    setImportModalOpen(false);
    setImportPreview(null);
    onNotify('success', `Imported ${importPreview.validRecords.length} records. Click "Save All Changes" to persist to database.`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Actions Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-tech text-[10px] font-black uppercase tracking-widest text-[#00685b] bg-[#00685b]/10 px-2.5 py-0.5 rounded-full">
                EDITABLE PRICING MATRIX & ERP
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-mono">SUPABASE: public.service_pricing</span>
            </div>
            <h2 className="font-display text-2xl font-black text-slate-900 mt-1">
              Service Packages & Pricing Management
            </h2>
            <p className="font-sans text-xs text-slate-500 mt-0.5">
              Live spreadsheet grid with auto-calculating final prices, bulk edit dirty tracking, and Excel sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Add New Record */}
            <button
              type="button"
              onClick={handleAddNewRecord}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#00685b]" />
              <span>Add Package</span>
            </button>

            {/* Template Download */}
            <button
              type="button"
              onClick={() => downloadPricingTemplate()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer"
              title="Download clean Excel template for bulk pricing uploads"
            >
              <Download className="h-4 w-4 text-slate-400" />
              <span>Template</span>
            </button>

            {/* Import Excel */}
            <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer">
              <Upload className="h-4 w-4 text-[#00685b]" />
              <span>{importingFile ? 'Parsing...' : 'Import Excel'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelected}
                className="hidden"
                disabled={importingFile}
              />
            </label>

            {/* Export Excel (.xlsx) */}
            <button
              type="button"
              onClick={() => exportPricingToExcel(filteredRecords)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Export pricing matrix to Excel"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Export (.xlsx)</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer"
            >
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Dirty Edits Bar (Floating banner when edits exist) */}
        {dirtyCount > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span className="font-display text-xs font-bold text-amber-900">
                You have <strong>{dirtyCount}</strong> unsaved pricing edit{dirtyCount > 1 ? 's' : ''}.
              </span>
              <span className="text-[11px] text-amber-700 hidden sm:inline">
                Edits are cached locally until committed.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-900 hover:bg-amber-100/70 text-xs font-bold transition-colors cursor-pointer"
              >
                Discard Edits
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-[#00685b] hover:bg-[#00544a] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div className="relative sm:col-span-2 lg:col-span-3">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Price ID, category, package name, or deliverables..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#00685b] focus:outline-none"
            >
              <option value="all">All Service Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#00685b] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Drafts</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Spreadsheet-Like Editable Pricing Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Tag className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="font-display text-base font-bold text-slate-700">No pricing records found</h3>
            <p className="font-sans text-xs text-slate-500 max-w-sm mx-auto">
              Reset your search filters or click "Add Package" to introduce a new service package.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-tech uppercase text-[10px] tracking-wider select-none">
                  <th className="py-3 px-3 font-extrabold w-28">Price ID</th>
                  <th className="py-3 px-3 font-extrabold w-36">Category</th>
                  <th className="py-3 px-3 font-extrabold w-44">Package Name</th>
                  <th className="py-3 px-3 font-extrabold min-w-[200px]">Description & Deliverables</th>
                  <th className="py-3 px-3 font-extrabold w-32">Type</th>
                  <th className="py-3 px-3 font-extrabold w-28">Base (₹)</th>
                  <th className="py-3 px-3 font-extrabold w-20">Disc (%)</th>
                  <th className="py-3 px-3 font-extrabold w-28">Final (₹)</th>
                  <th className="py-3 px-3 font-extrabold w-16">GST%</th>
                  <th className="py-3 px-3 font-extrabold text-center w-16">Active</th>
                  <th className="py-3 px-3 font-extrabold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Price ID (stable identifier) */}
                    <td className="py-2.5 px-3 align-top font-mono text-[11px] font-bold text-[#00685b]">
                      <input
                        type="text"
                        value={item.id}
                        onChange={(e) => handleFieldChange(item.id, 'id', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#00685b] focus:bg-white px-1 py-0.5 rounded font-mono font-bold text-[#00685b] focus:outline-none"
                      />
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 align-top">
                      <input
                        type="text"
                        value={item.service_category}
                        onChange={(e) => handleFieldChange(item.id, 'service_category', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#00685b] focus:bg-white px-1 py-0.5 rounded text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </td>

                    {/* Package Name */}
                    <td className="py-2.5 px-3 align-top">
                      <input
                        type="text"
                        value={item.package_name}
                        onChange={(e) => handleFieldChange(item.id, 'package_name', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#00685b] focus:bg-white px-1 py-0.5 rounded text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </td>

                    {/* Description & Deliverables */}
                    <td className="py-2.5 px-3 align-top space-y-1">
                      <textarea
                        rows={1}
                        value={item.package_description}
                        onChange={(e) => handleFieldChange(item.id, 'package_description', e.target.value)}
                        placeholder="Description..."
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#00685b] focus:bg-white px-1 py-0.5 rounded text-[11px] text-slate-600 focus:outline-none resize-none"
                      />
                      <input
                        type="text"
                        value={item.deliverables.join(' | ')}
                        onChange={(e) => handleDeliverablesChange(item.id, e.target.value)}
                        placeholder="Deliverables (separated by | or comma)..."
                        className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#00685b] focus:bg-white px-2 py-0.5 rounded text-[10px] text-slate-500 font-mono focus:outline-none"
                        title="Enter deliverables separated by | or commas"
                      />
                    </td>

                    {/* Pricing Type */}
                    <td className="py-2.5 px-3 align-top">
                      <select
                        value={item.pricing_type}
                        onChange={(e) => handleFieldChange(item.id, 'pricing_type', e.target.value as PricingType)}
                        className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-medium text-slate-700 focus:border-[#00685b] focus:outline-none cursor-pointer"
                      >
                        <option value="Fixed">Fixed</option>
                        <option value="Starting From">Starting From</option>
                        <option value="Custom Quote">Custom Quote</option>
                        <option value="Per Month">Per Month</option>
                      </select>
                    </td>

                    {/* Base Price */}
                    <td className="py-2.5 px-3 align-top">
                      <div className="relative">
                        <span className="absolute left-1.5 top-1 text-slate-400 font-mono text-[11px]">₹</span>
                        <input
                          type="number"
                          value={item.base_price}
                          onChange={(e) => handleFieldChange(item.id, 'base_price', parseFloat(e.target.value) || 0)}
                          className="w-full rounded border border-slate-200 bg-white pl-5 pr-1 py-0.5 font-mono text-xs font-bold text-slate-900 focus:border-[#00685b] focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* Discount % */}
                    <td className="py-2.5 px-3 align-top">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => handleFieldChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-xs text-slate-700 focus:border-[#00685b] focus:outline-none"
                      />
                    </td>

                    {/* Final Price (Auto-Calculated Display) */}
                    <td className="py-2.5 px-3 align-top">
                      <div className="font-mono text-xs font-black text-[#00685b] bg-[#00685b]/5 border border-[#00685b]/20 px-2 py-1 rounded text-center">
                        ₹{item.final_price.toLocaleString('en-IN')}
                      </div>
                    </td>

                    {/* GST Rate */}
                    <td className="py-2.5 px-3 align-top font-mono text-xs text-slate-600">
                      <input
                        type="number"
                        value={item.gst_rate}
                        onChange={(e) => handleFieldChange(item.id, 'gst_rate', parseFloat(e.target.value) || 0)}
                        className="w-full rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-xs text-slate-700 focus:border-[#00685b] focus:outline-none text-center"
                      />
                    </td>

                    {/* Active Toggle */}
                    <td className="py-2.5 px-3 align-top text-center">
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={(e) => handleFieldChange(item.id, 'active', e.target.checked)}
                        className="h-4 w-4 rounded text-[#00685b] focus:ring-[#00685b] border-slate-300 cursor-pointer mt-1"
                        title={item.active ? 'Active package' : 'Draft / Inactive'}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRecord(item)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Duplicate Package"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(item.id)}
                          className="p-1 rounded text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Package"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
          <span>
            Total Packages: <strong>{filteredRecords.length}</strong> (Active: {filteredRecords.filter((r) => r.active).length})
          </span>
          <span className="font-tech text-[10px] uppercase text-slate-400">
            Formula: Final Price = Base Price × (1 - Discount/100)
          </span>
        </div>
      </div>

      {/* 5. IMPORT PREVIEW & VALIDATION MODAL */}
      {importModalOpen && importPreview && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 space-y-4">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-tech text-[10px] font-black text-[#00685b] uppercase">Excel / CSV Import</span>
                <h4 className="font-display text-lg font-bold text-slate-900">
                  Pricing Validation Preview
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[60vh] overflow-y-auto">
              {importPreview.errors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-rose-800">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Import Warnings & Row Errors ({importPreview.errors.length})</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-rose-700">
                    {importPreview.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">
                  Valid Records Ready to Commit ({importPreview.validRecords.length}):
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 font-tech uppercase text-[10px] text-slate-500">
                      <tr>
                        <th className="p-2">Price ID</th>
                        <th className="p-2">Package Name</th>
                        <th className="p-2">Base Price</th>
                        <th className="p-2">Discount</th>
                        <th className="p-2">Final Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreview.validRecords.slice(0, 10).map((r) => (
                        <tr key={r.id}>
                          <td className="p-2 font-mono font-bold text-[#00685b]">{r.id}</td>
                          <td className="p-2 font-semibold text-slate-800">{r.package_name}</td>
                          <td className="p-2 font-mono">₹{r.base_price.toLocaleString('en-IN')}</td>
                          <td className="p-2 font-mono">{r.discount}%</td>
                          <td className="p-2 font-mono font-bold text-slate-900">₹{r.final_price.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.validRecords.length > 10 && (
                    <div className="p-2 text-center text-slate-400 font-mono text-[11px] bg-slate-50">
                      + {importPreview.validRecords.length - 10} more rows
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-100 cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importPreview.validRecords.length === 0}
                onClick={handleCommitImport}
                className="rounded-xl bg-[#00685b] hover:bg-[#00544a] text-white px-5 py-2 font-display text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                Commit & Merge ({importPreview.validRecords.length})
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
