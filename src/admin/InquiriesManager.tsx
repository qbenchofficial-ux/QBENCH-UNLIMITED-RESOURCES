import React, { useState, useMemo, useEffect } from 'react';
import type { ProjectInquiry } from '../types/project';
import { 
  EnquiryStatus, 
  STATUS_CONFIG, 
  FollowupNote, 
  PaymentEntry,
  EnquiryRecord
} from '../types/crm';
import {
  fetchCrmEnquiries,
  updateCrmEnquiry,
  addEnquiryFollowup,
  exportEnquiriesToExcel,
  exportEnquiriesToCsv
} from '../services/crmService';
import { deleteProjectInquiry } from '../services/inquiryService';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Plus,
  MessageSquare,
  DollarSign,
  Briefcase,
  X,
  Copy,
  Check,
  Send,
  Trash2,
  ExternalLink,
  Edit3,
  Building,
  CreditCard,
  Layers
} from 'lucide-react';

interface InquiriesManagerProps {
  inquiries: ProjectInquiry[];
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function InquiriesManager({
  inquiries,
  onRefresh,
  onNotify
}: InquiriesManagerProps) {
  // Sync Supabase project_inquiries with CRM enrichment
  const [crmEnquiries, setCrmEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'due-today' | 'overdue' | 'upcoming'>('all');
  
  // Sorting & Pagination
  const [sortField, setSortField] = useState<'date' | 'amount' | 'followup'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals & Slide-overs
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'customer' | 'scope' | 'followup' | 'execution' | 'payments'>('customer');
  const [quickFollowupEnquiry, setQuickFollowupEnquiry] = useState<EnquiryRecord | null>(null);
  const [quickNote, setQuickNote] = useState('');
  const [quickNextDate, setQuickNextDate] = useState('');
  const [quickAuthor, setQuickAuthor] = useState('Admin');
  
  // Drawer editing state
  const [drawerNotesInput, setDrawerNotesInput] = useState('');
  const [drawerAuthorInput, setDrawerAuthorInput] = useState('Admin');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize CRM records from passed inquiries or crmService
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchCrmEnquiries();
        setCrmEnquiries(data);
      } catch (err) {
        console.error('Error loading CRM inquiries', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [inquiries]);

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = crmEnquiries.length;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let newCount = 0;
    let contactedCount = 0;
    let followupsDueCount = 0;
    let quotationsSentCount = 0;
    let approvedCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let lostOrRejectedCount = 0;

    crmEnquiries.forEach((item) => {
      const s = item.status;
      if (s === 'New') newCount++;
      else if (s === 'Contacted') contactedCount++;
      else if (s === 'Quotation Sent') quotationsSentCount++;
      else if (s === 'Approved') approvedCount++;
      else if (s === 'In Progress') inProgressCount++;
      else if (s === 'Completed') completedCount++;
      else if (s === 'Lost' || s === 'Rejected' || s === 'Cancelled') lostOrRejectedCount++;

      if (item.next_followup_at) {
        const itemDateStr = item.next_followup_at.split('T')[0];
        if (itemDateStr <= todayStr && s !== 'Completed' && s !== 'Cancelled' && s !== 'Lost') {
          followupsDueCount++;
        }
      }
    });

    return {
      total,
      newCount,
      contactedCount,
      followupsDueCount,
      quotationsSentCount,
      approvedCount,
      inProgressCount,
      completedCount,
      lostOrRejectedCount
    };
  }, [crmEnquiries]);

  // Unique service categories for filter dropdown
  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    crmEnquiries.forEach((e) => {
      if (e.service) set.add(e.service);
    });
    return Array.from(set);
  }, [crmEnquiries]);

  // Filtering & Sorting
  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];

    let result = crmEnquiries.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Service filter
      if (serviceFilter !== 'all' && item.service !== serviceFilter) return false;

      // Urgency filter
      if (urgencyFilter !== 'all') {
        if (!item.next_followup_at) return false;
        const itemDateStr = item.next_followup_at.split('T')[0];
        if (urgencyFilter === 'due-today' && itemDateStr !== todayStr) return false;
        if (urgencyFilter === 'overdue' && itemDateStr >= todayStr) return false;
        if (urgencyFilter === 'upcoming' && itemDateStr <= todayStr) return false;
      }

      // Search term
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        item.service.toLowerCase().includes(q) ||
        (item.reference_id || '').toLowerCase().includes(q) ||
        (item.package || '').toLowerCase().includes(q) ||
        (item.assigned_to || '').toLowerCase().includes(q) ||
        (item.project_requirements || '').toLowerCase().includes(q)
      );
    });

    // Sorting
    result.sort((a, b) => {
      if (sortField === 'amount') {
        const amtA = a.quotation_amount || 0;
        const amtB = b.quotation_amount || 0;
        return sortDirection === 'asc' ? amtA - amtB : amtB - amtA;
      }
      if (sortField === 'followup') {
        const timeA = a.next_followup_at ? new Date(a.next_followup_at).getTime() : 0;
        const timeB = b.next_followup_at ? new Date(b.next_followup_at).getTime() : 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
      // default: date (submission timestamp)
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [crmEnquiries, search, statusFilter, serviceFilter, urgencyFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage, itemsPerPage]);

  // Handle direct inline status change
  const handleStatusChange = async (enquiry: EnquiryRecord, nextStatus: EnquiryStatus) => {
    try {
      const updated = await updateCrmEnquiry(enquiry.id, {
        status: nextStatus,
        status_history: [
          ...(enquiry.status_history || []),
          {
            fromStatus: enquiry.status,
            toStatus: nextStatus,
            from_status: enquiry.status,
            to_status: nextStatus,
            changedBy: 'Admin',
            changed_by: 'Admin',
            timestamp: new Date().toISOString(),
            changed_at: new Date().toISOString(),
            notes: 'Status updated via CRM table',
            reason: 'Status updated via CRM table'
          }
        ]
      });

      setCrmEnquiries((prev) =>
        prev.map((item) => (item.id === enquiry.id ? updated : item))
      );

      if (selectedEnquiry?.id === enquiry.id) {
        setSelectedEnquiry(updated);
      }

      onNotify('success', `Status updated to "${nextStatus}" for ${enquiry.reference_id}.`);
      await onRefresh();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to update enquiry status.');
    }
  };

  // Quick Follow-up Submission
  const handleSaveQuickFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFollowupEnquiry) return;

    try {
      const updated = await addEnquiryFollowup(
        quickFollowupEnquiry.id,
        {
          note: quickNote.trim(),
          created_by: quickAuthor || 'Admin',
          created_at: new Date().toISOString()
        },
        quickNextDate || undefined
      );

      setCrmEnquiries((prev) =>
        prev.map((item) => (item.id === quickFollowupEnquiry.id ? updated : item))
      );

      onNotify('success', `Follow-up note added for ${quickFollowupEnquiry.reference_id}`);
      setQuickFollowupEnquiry(null);
      setQuickNote('');
      setQuickNextDate('');
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to add follow-up note.');
    }
  };

  // Add note inside drawer
  const handleAddDrawerNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !drawerNotesInput.trim()) return;

    try {
      const updated = await addEnquiryFollowup(
        selectedEnquiry.id,
        {
          note: drawerNotesInput.trim(),
          created_by: drawerAuthorInput || 'Admin',
          created_at: new Date().toISOString()
        }
      );

      setSelectedEnquiry(updated);
      setCrmEnquiries((prev) =>
        prev.map((item) => (item.id === selectedEnquiry.id ? updated : item))
      );
      setDrawerNotesInput('');
      onNotify('success', 'Follow-up note logged.');
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to log note.');
    }
  };

  // Update Drawer Fields (Quotation, Assigned To, Next Followup, Execution)
  const handleUpdateDrawerField = async (fields: Partial<EnquiryRecord>) => {
    if (!selectedEnquiry) return;
    try {
      const updated = await updateCrmEnquiry(selectedEnquiry.id, fields);
      setSelectedEnquiry(updated);
      setCrmEnquiries((prev) =>
        prev.map((item) => (item.id === selectedEnquiry.id ? updated : item))
      );
      onNotify('success', 'Enquiry details updated.');
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to update details.');
    }
  };

  // Delete Enquiry
  const handleDelete = async (id: string, refId: string) => {
    if (!confirm(`Are you sure you want to delete enquiry ${refId}? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteProjectInquiry(id);
      setCrmEnquiries((prev) => prev.filter((item) => item.id !== id));
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
      onNotify('success', `Enquiry ${refId} deleted.`);
      await onRefresh();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to delete inquiry.');
    }
  };

  // Follow-up visual status badge
  const renderFollowupBadge = (nextDateStr?: string) => {
    if (!nextDateStr) {
      return <span className="text-slate-400 font-mono text-[11px]">—</span>;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const itemDateStr = nextDateStr.split('T')[0];

    const isOverdue = itemDateStr < todayStr;
    const isToday = itemDateStr === todayStr;

    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let label = 'Upcoming';

    if (isOverdue) {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      label = 'Overdue';
    } else if (isToday) {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Due Today';
    }

    return (
      <div className="flex flex-col">
        <span className="font-mono text-xs font-semibold text-slate-800">
          {new Date(nextDateStr).toLocaleDateString()}
        </span>
        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border w-fit mt-0.5 ${badgeClass}`}>
          {label}
        </span>
      </div>
    );
  };

  // Status configuration helper
  const getStatusBadge = (status: EnquiryStatus) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['New'];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.bg} ${config.text} ${config.border}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Export & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-tech text-[10px] font-black uppercase tracking-widest text-[#00685b] bg-[#00685b]/10 px-2.5 py-0.5 rounded-full">
                QBENCH CRM ENGINE
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-mono">SUPABASE: public.project_inquiries</span>
            </div>
            <h2 className="font-display text-2xl font-black text-slate-900 mt-1">
              Enquiry Management Dashboard
            </h2>
            <p className="font-sans text-xs text-slate-500 mt-0.5">
              Excel-style pipeline tracking, 14-stage workflows, quotations, and client follow-ups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => exportEnquiriesToExcel(filteredAndSorted)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#00544a] text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Export all filtered enquiries to Excel (.xlsx)"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export to Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() => exportEnquiriesToCsv(filteredAndSorted)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer"
              title="Export to CSV"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 2. 9 Live KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 pt-2">
          {/* Total */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3">
            <span className="font-tech text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Total</span>
            <span className="font-display text-xl font-black text-slate-900 mt-0.5 block">{stats.total}</span>
          </div>

          {/* New */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
            <span className="font-tech text-[9px] font-extrabold uppercase tracking-wider text-blue-600 block">New</span>
            <span className="font-display text-xl font-black text-blue-900 mt-0.5 block">{stats.newCount}</span>
          </div>

          {/* Contacted */}
          <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3">
            <span className="font-tech text-[9px] font-extrabold uppercase tracking-wider text-cyan-700 block">Contacted</span>
            <span className="font-display text-xl font-black text-cyan-900 mt-0.5 block">{stats.contactedCount}</span>
          </div>

          {/* Follow-ups Due */}
          <div className={`rounded-xl p-3 border ${stats.followupsDueCount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`font-tech text-[9px] font-extrabold uppercase tracking-wider block ${stats.followupsDueCount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
              Follow-ups Due
            </span>
            <span className={`font-display text-xl font-black mt-0.5 block ${stats.followupsDueCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
              {stats.followupsDueCount}
            </span>
          </div>

          {/* Quotations Sent */}
          <div className="bg-violet-50/70 border border-violet-200 rounded-xl p-3">
            <span className="font-tech text-[9px] font-extrabold uppercase tracking-wider text-violet-700 block">Quotes Sent</span>
            <span className="font-display text-xl font-black text-violet-900 mt-0.5 block">{stats.quotationsSentCount}</span>
          </div>

          {/* Approved */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
            <span className="font-tech text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 block">Approved</span>
            <span className="font-display text-xl font-black text-emerald-900 mt-0.5 block">{stats.approvedCount}</span>
          </div>

          {/* In Progress */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3">
            <span className="font-tech text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 block">In Progress</span>
            <span className="font-display text-xl font-black text-indigo-900 mt-0.5 block">{stats.inProgressCount}</span>
          </div>

          {/* Completed */}
          <div className="bg-[#00685b]/10 border border-[#00685b]/30 rounded-xl p-3">
            <span className="font-tech text-[9px] font-extrabold uppercase tracking-wider text-[#00685b] block">Completed</span>
            <span className="font-display text-xl font-black text-[#002f29] mt-0.5 block">{stats.completedCount}</span>
          </div>

          {/* Lost / Rejected */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3">
            <span className="font-tech text-[9px] font-extrabold uppercase tracking-wider text-rose-700 block">Lost / Rej.</span>
            <span className="font-display text-xl font-black text-rose-900 mt-0.5 block">{stats.lostOrRejectedCount}</span>
          </div>
        </div>

        {/* 3. Search and Multi-Filtering Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Ref ID, Client Name, Phone, Email, Package..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#00685b] focus:outline-none"
            >
              <option value="all">All 14 Statuses</option>
              {Object.keys(STATUS_CONFIG).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Service filter */}
          <div>
            <select
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#00685b] focus:outline-none"
            >
              <option value="all">All Services</option>
              {uniqueServices.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => {
                setUrgencyFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#00685b] focus:outline-none"
            >
              <option value="all">All Urgency Levels</option>
              <option value="due-today">Due Today</option>
              <option value="overdue">Overdue Follow-ups</option>
              <option value="upcoming">Upcoming Follow-ups</option>
            </select>
          </div>
        </div>

        {/* Sort selector row */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>Showing <strong>{filteredAndSorted.length}</strong> enquiries</span>
            {(search || statusFilter !== 'all' || serviceFilter !== 'all' || urgencyFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setServiceFilter('all');
                  setUrgencyFilter('all');
                  setCurrentPage(1);
                }}
                className="text-[#00685b] hover:underline font-bold"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-tech text-[10px] uppercase font-bold tracking-wider">Sort By:</span>
            <button
              type="button"
              onClick={() => {
                if (sortField === 'date') setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
                else {
                  setSortField('date');
                  setSortDirection('desc');
                }
              }}
              className={`flex items-center gap-1 font-semibold ${sortField === 'date' ? 'text-[#00685b]' : 'hover:text-slate-800'}`}
            >
              <span>Date</span>
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (sortField === 'amount') setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
                else {
                  setSortField('amount');
                  setSortDirection('desc');
                }
              }}
              className={`flex items-center gap-1 font-semibold ${sortField === 'amount' ? 'text-[#00685b]' : 'hover:text-slate-800'}`}
            >
              <span>Quotation ₹</span>
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (sortField === 'followup') setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
                else {
                  setSortField('followup');
                  setSortDirection('asc');
                }
              }}
              className={`flex items-center gap-1 font-semibold ${sortField === 'followup' ? 'text-[#00685b]' : 'hover:text-slate-800'}`}
            >
              <span>Next Follow-up</span>
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Excel-Style CRM Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {paginatedItems.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="font-display text-base font-bold text-slate-700">No enquiries match your filter</h3>
            <p className="font-sans text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or resetting filters to see all client enquiries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-tech uppercase text-[10px] tracking-wider select-none">
                  <th className="py-3 px-3 font-extrabold">Ref ID</th>
                  <th className="py-3 px-3 font-extrabold">Date & Time</th>
                  <th className="py-3 px-3 font-extrabold">Client Name</th>
                  <th className="py-3 px-3 font-extrabold">Phone</th>
                  <th className="py-3 px-3 font-extrabold">Email</th>
                  <th className="py-3 px-3 font-extrabold">Service</th>
                  <th className="py-3 px-3 font-extrabold">Package</th>
                  <th className="py-3 px-3 font-extrabold min-w-[150px]">Status (14-Stage)</th>
                  <th className="py-3 px-3 font-extrabold">Quotation (₹)</th>
                  <th className="py-3 px-3 font-extrabold">Next Follow-up</th>
                  <th className="py-3 px-3 font-extrabold">Assigned To</th>
                  <th className="py-3 px-3 font-extrabold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedEnquiry(item);
                      setActiveDrawerTab('customer');
                    }}
                  >
                    {/* Reference ID with copy */}
                    <td className="py-3 px-3 font-mono text-[11px] font-bold text-[#00685b] whitespace-nowrap">
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <span>{item.reference_id}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.reference_id, item.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 transition-opacity cursor-pointer"
                          title="Copy Ref ID"
                        >
                          {copiedId === item.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Client Name & Company */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block truncate max-w-[140px]">{item.name}</span>
                      {item.company && (
                        <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[140px]">{item.company}</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-3 font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`tel:${item.phone}`}
                        className="text-slate-800 hover:text-[#00685b] font-medium whitespace-nowrap inline-flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{item.phone}</span>
                      </a>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[130px]" onClick={(e) => e.stopPropagation()}>
                      {item.email ? (
                        <a
                          href={`mailto:${item.email}`}
                          className="hover:text-[#00685b] hover:underline truncate block"
                          title={item.email}
                        >
                          {item.email}
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* Service */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {item.service}
                      </span>
                    </td>

                    {/* Package */}
                    <td className="py-3 px-3 truncate max-w-[130px] font-medium text-slate-700">
                      {item.package || <span className="text-slate-400 font-mono text-[11px]">—</span>}
                    </td>

                    {/* 14-Status Dropdown */}
                    <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value as EnquiryStatus)}
                        className={`text-[11px] font-bold rounded-lg border px-2.5 py-1 focus:outline-none transition-colors cursor-pointer ${
                          STATUS_CONFIG[item.status]?.bg || 'bg-slate-50'
                        } ${STATUS_CONFIG[item.status]?.text || 'text-slate-800'} ${
                          STATUS_CONFIG[item.status]?.border || 'border-slate-200'
                        }`}
                      >
                        {Object.keys(STATUS_CONFIG).map((st) => (
                          <option key={st} value={st} className="bg-white text-slate-900 font-sans">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Quotation Amount */}
                    <td className="py-3 px-3 font-mono font-bold whitespace-nowrap text-slate-900">
                      {item.quotation_amount ? `₹${item.quotation_amount.toLocaleString('en-IN')}` : <span className="text-slate-400 font-mono text-[11px]">—</span>}
                    </td>

                    {/* Next Follow-up */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {renderFollowupBadge(item.next_followup_at)}
                    </td>

                    {/* Assigned To */}
                    <td className="py-3 px-3 text-slate-700 truncate max-w-[110px]">
                      {item.assigned_to || <span className="text-slate-400 font-mono text-[11px]">Unassigned</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Follow-up modal trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            setQuickFollowupEnquiry(item);
                            setQuickNote('');
                            setQuickNextDate(item.next_followup_at ? item.next_followup_at.split('T')[0] : '');
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-[#00685b]/10 hover:text-[#00685b] text-slate-600 transition-colors cursor-pointer"
                          title="Quick Add Follow-up Note"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>

                        {/* WhatsApp Client button */}
                        <a
                          href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hello ${item.name}, thank you for contacting QBENCH regarding your inquiry ${item.reference_id} (${item.service})!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </a>

                        {/* Slide-over details button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEnquiry(item);
                            setActiveDrawerTab('customer');
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                          title="View & Edit Full Details"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.reference_id)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          title="Delete Enquiry"
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

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. FULL ENQUIRY DETAILS SLIDE-OVER / MODAL WITH 5 TABS */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#00685b] bg-[#00685b]/10 px-2 py-0.5 rounded">
                    {selectedEnquiry.reference_id}
                  </span>
                  {getStatusBadge(selectedEnquiry.status)}
                </div>
                <h3 className="font-display text-lg font-black text-slate-900">
                  {selectedEnquiry.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 bg-white px-5 overflow-x-auto text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveDrawerTab('customer')}
                className={`py-3 px-3 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                  activeDrawerTab === 'customer'
                    ? 'border-[#00685b] text-[#00685b]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                1. Customer Details
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab('scope')}
                className={`py-3 px-3 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                  activeDrawerTab === 'scope'
                    ? 'border-[#00685b] text-[#00685b]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                2. Service Scope
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab('followup')}
                className={`py-3 px-3 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                  activeDrawerTab === 'followup'
                    ? 'border-[#00685b] text-[#00685b]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                3. Sales & Notes ({selectedEnquiry.followup_notes?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab('execution')}
                className={`py-3 px-3 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                  activeDrawerTab === 'execution'
                    ? 'border-[#00685b] text-[#00685b]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                4. Project Execution
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab('payments')}
                className={`py-3 px-3 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                  activeDrawerTab === 'payments'
                    ? 'border-[#00685b] text-[#00685b]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                5. Payment Ledger
              </button>
            </div>

            {/* Tab content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: Customer Details */}
              {activeDrawerTab === 'customer' && (
                <div className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Full Name</span>
                      <p className="font-display text-sm font-bold text-slate-900">{selectedEnquiry.name}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Company / Brand</span>
                      <p className="font-sans text-sm text-slate-800">{selectedEnquiry.company || 'Not Specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Phone Number</span>
                      <a href={`tel:${selectedEnquiry.phone}`} className="font-mono text-sm text-[#00685b] font-bold hover:underline flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{selectedEnquiry.phone}</span>
                      </a>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Email Address</span>
                      {selectedEnquiry.email ? (
                        <a href={`mailto:${selectedEnquiry.email}`} className="font-sans text-sm text-[#00685b] hover:underline flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{selectedEnquiry.email}</span>
                        </a>
                      ) : (
                        <p className="text-slate-400 font-sans italic">Not provided (optional)</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Submission Timestamp</span>
                      <p className="font-mono text-slate-700">{new Date(selectedEnquiry.created_at).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Origin Source</span>
                      <p className="font-mono text-slate-700">{selectedEnquiry.source || 'Website Contact Form'}</p>
                    </div>
                  </div>

                  {/* Direct Contact Actions */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-2.5">
                    <a
                      href={`https://wa.me/${selectedEnquiry.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hello ${selectedEnquiry.name}, thank you for contacting QBENCH regarding your inquiry ${selectedEnquiry.reference_id} (${selectedEnquiry.service})!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2.5 font-bold shadow-xs"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Open WhatsApp</span>
                    </a>
                    {selectedEnquiry.email && (
                      <a
                        href={`mailto:${selectedEnquiry.email}?subject=${encodeURIComponent(
                          `QBENCH Inquiry Update — Ref: ${selectedEnquiry.reference_id}`
                        )}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#00544a] text-white px-4 py-2.5 font-bold shadow-xs"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Send Email</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Service Scope */}
              {activeDrawerTab === 'scope' && (
                <div className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Service Category</span>
                      <p className="font-display text-sm font-bold text-[#00685b]">{selectedEnquiry.service}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Selected Package</span>
                      <p className="font-sans text-sm font-bold text-slate-800">{selectedEnquiry.package || 'Standardized Scope'}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Project Requirements / Client Message</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {selectedEnquiry.project_requirements || selectedEnquiry.message || 'No additional requirements specified.'}
                    </div>
                  </div>

                  {selectedEnquiry.reference_url && (
                    <div className="space-y-1">
                      <span className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Referenced Design URL</span>
                      <a
                        href={selectedEnquiry.reference_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#00685b] hover:underline flex items-center gap-1.5 font-mono break-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span>{selectedEnquiry.reference_url}</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Sales & Follow-up Notes */}
              {activeDrawerTab === 'followup' && (
                <div className="space-y-5 text-xs">
                  {/* Next Followup Date Picker */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <span className="font-tech text-[10px] font-extrabold uppercase text-slate-500 block">Next Follow-up Due Date</span>
                        <div className="mt-1">
                          {renderFollowupBadge(selectedEnquiry.next_followup_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={selectedEnquiry.next_followup_at ? selectedEnquiry.next_followup_at.split('T')[0] : ''}
                          onChange={(e) => handleUpdateDrawerField({ next_followup_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 focus:border-[#00685b] focus:outline-none"
                        />
                        {selectedEnquiry.next_followup_at && (
                          <button
                            type="button"
                            onClick={() => handleUpdateDrawerField({ next_followup_at: undefined })}
                            className="text-xs text-rose-600 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add New Follow-up Note Form */}
                  <form onSubmit={handleAddDrawerNote} className="space-y-3 border-t border-slate-200 pt-4">
                    <span className="font-tech text-[10px] font-extrabold uppercase text-slate-600 block">
                      Add New Sales / Follow-up Note
                    </span>
                    <textarea
                      rows={3}
                      value={drawerNotesInput}
                      onChange={(e) => setDrawerNotesInput(e.target.value)}
                      placeholder="e.g. Called client on phone, requirement clarified, agreed to send proposal by tomorrow..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-800 focus:border-[#00685b] focus:bg-white focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">Author:</span>
                        <input
                          type="text"
                          value={drawerAuthorInput}
                          onChange={(e) => setDrawerAuthorInput(e.target.value)}
                          className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!drawerNotesInput.trim()}
                        className="rounded-xl bg-[#00685b] hover:bg-[#00544a] disabled:opacity-50 text-white px-4 py-2 font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>
                  </form>

                  {/* Chronological Notes History */}
                  <div className="space-y-3 border-t border-slate-200 pt-4">
                    <span className="font-tech text-[10px] font-extrabold uppercase text-slate-500 block">
                      Follow-up History Log ({selectedEnquiry.followup_notes?.length || 0})
                    </span>
                    {!selectedEnquiry.followup_notes || selectedEnquiry.followup_notes.length === 0 ? (
                      <p className="text-slate-400 italic">No follow-up notes logged yet.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {selectedEnquiry.followup_notes.slice().reverse().map((fn, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span className="font-bold text-slate-700">{fn.created_by}</span>
                              <span className="font-mono">{new Date(fn.created_at).toLocaleString()}</span>
                            </div>
                            <p className="font-sans text-xs text-slate-800 whitespace-pre-wrap">{fn.note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Project Execution */}
              {activeDrawerTab === 'execution' && (
                <div className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Assigned Team Member</label>
                      <input
                        type="text"
                        defaultValue={selectedEnquiry.assigned_to || ''}
                        onBlur={(e) => handleUpdateDrawerField({ assigned_to: e.target.value })}
                        placeholder="e.g. Lead Designer, Video Editor"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-[#00685b] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Project Status</label>
                      <select
                        value={selectedEnquiry.project_status || 'Not Started'}
                        onChange={(e) => handleUpdateDrawerField({ project_status: e.target.value as any })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-[#00685b] focus:bg-white focus:outline-none"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="Discovery">Discovery & Briefing</option>
                        <option value="Design">Design Phase</option>
                        <option value="Revisions">Client Revisions</option>
                        <option value="Delivered">Delivered</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Target Delivery Date</label>
                      <input
                        type="date"
                        defaultValue={selectedEnquiry.target_delivery_date ? selectedEnquiry.target_delivery_date.split('T')[0] : ''}
                        onBlur={(e) => handleUpdateDrawerField({ target_delivery_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-800 focus:border-[#00685b] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Payment Ledger */}
              {activeDrawerTab === 'payments' && (
                <div className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <span className="font-tech text-[10px] font-extrabold uppercase text-slate-500 block">Total Quotation</span>
                      <input
                        type="number"
                        defaultValue={selectedEnquiry.quotation_amount || 0}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const paid = selectedEnquiry.advance_paid || 0;
                          handleUpdateDrawerField({
                            quotation_amount: val,
                            balance_amount: Math.max(0, val - paid)
                          });
                        }}
                        className="w-full font-mono text-base font-black text-slate-900 bg-white border border-slate-200 rounded px-2 py-1"
                      />
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                      <span className="font-tech text-[10px] font-extrabold uppercase text-emerald-700 block">Advance / Paid</span>
                      <input
                        type="number"
                        defaultValue={selectedEnquiry.advance_paid || 0}
                        onBlur={(e) => {
                          const paid = parseFloat(e.target.value) || 0;
                          const quote = selectedEnquiry.quotation_amount || 0;
                          handleUpdateDrawerField({
                            advance_paid: paid,
                            balance_amount: Math.max(0, quote - paid)
                          });
                        }}
                        className="w-full font-mono text-base font-black text-emerald-800 bg-white border border-emerald-200 rounded px-2 py-1"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1">
                      <span className="font-tech text-[10px] font-extrabold uppercase text-blue-700 block">Calculated Balance</span>
                      <div className="font-mono text-base font-black text-blue-900 py-1">
                        ₹{((selectedEnquiry.quotation_amount || 0) - (selectedEnquiry.advance_paid || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-tech uppercase text-[10px] font-bold block">Payment Status</label>
                    <select
                      value={selectedEnquiry.payment_status || 'Pending'}
                      onChange={(e) => handleUpdateDrawerField({ payment_status: e.target.value as any })}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-[#00685b] focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Partial">Partial Advance Paid</option>
                      <option value="Paid">Fully Paid</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              )}

            </div>

            {/* Footer close */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="rounded-xl bg-[#00685b] hover:bg-[#00544a] text-white px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. QUICK FOLLOW-UP MODAL */}
      {quickFollowupEnquiry && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-mono text-[10px] font-black text-[#00685b] uppercase">Quick Follow-up</span>
                <h4 className="font-display text-base font-bold text-slate-900">
                  {quickFollowupEnquiry.name} ({quickFollowupEnquiry.reference_id})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setQuickFollowupEnquiry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickFollowup} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold block">Follow-up Note *</label>
                <textarea
                  required
                  rows={3}
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="e.g. Spoke to client on phone, quotation reviewed, client will confirm by Friday..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold block">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={quickNextDate}
                    onChange={(e) => setQuickNextDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-[#00685b] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold block">Logged By</label>
                  <input
                    type="text"
                    value={quickAuthor}
                    onChange={(e) => setQuickAuthor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#00685b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickFollowupEnquiry(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quickNote.trim()}
                  className="rounded-xl bg-[#00685b] hover:bg-[#00544a] text-white px-5 py-2 font-display text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  Save Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
