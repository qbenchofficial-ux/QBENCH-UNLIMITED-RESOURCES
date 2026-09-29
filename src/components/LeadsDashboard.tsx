import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  Download, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Users, 
  Clock, 
  Layers3, 
  X,
  Mail,
  Phone
} from 'lucide-react';
import { getLocalEnquiriesBackup } from '../lib/emailService';

function mergeLeadsWithLocalBackup(serverLeads: any[]): any[] {
  const localLeads = getLocalEnquiriesBackup();
  const byId = new Map<string, any>();

  for (const item of serverLeads) {
    if (item && item.id) {
      byId.set(String(item.id), item);
    }
  }
  for (const localItem of localLeads) {
    if (localItem && localItem.id && !byId.has(String(localItem.id))) {
      byId.set(String(localItem.id), localItem);
    }
  }

  return Array.from(byId.values());
}

export default function LeadsDashboard() {
  const [adminSecret, setAdminSecret] = useState(() => {
    return sessionStorage.getItem('qbench_admin_secret_key') || '';
  });
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('qbench_admin_crm_unlocked') === 'true';
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // UI states
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // SMTP / Email Delivery Diagnostic State
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpDiagnostic, setSmtpDiagnostic] = useState<{
    smtpConfigured: string;
    authentication: string;
    emailDelivery: string;
    sheetsWebhookConfigured?: string;
    sheetsWebhookStatus?: string;
    message: string;
    advice?: string;
    details?: {
      host: string;
      port: number;
      security: string;
      user: string;
    };
  } | null>(null);

  const runEmailDiagnostic = async () => {
    setSmtpTesting(true);
    try {
      const resp = await fetch('/api/smtp-test');
      const data = await resp.json();
      setSmtpDiagnostic(data);
    } catch {
      setSmtpDiagnostic({
        smtpConfigured: 'NO',
        authentication: 'FAILED',
        emailDelivery: 'FAILED',
        message: 'Could not reach /api/smtp-test endpoint.'
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  // Authenticate with server
  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminSecret.trim()) {
      setError('Please provide the ADMIN_SECRET access key.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/messages?secret=${encodeURIComponent(adminSecret.trim())}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsUnlocked(true);
        setLeads(mergeLeadsWithLocalBackup(data.messages || []));
        sessionStorage.setItem('qbench_admin_crm_unlocked', 'true');
        sessionStorage.setItem('qbench_admin_secret_key', adminSecret.trim());
        triggerSuccessNotice('Portal Unlocked Successfully');
      } else {
        setError(data.error || 'Access Denied: The provided secret key is invalid.');
      }
    } catch {
      // Fallback to local enquiries backup if backend is unreachable
      if (adminSecret.trim() === 'qbench2026secret') {
        setIsUnlocked(true);
        setLeads(getLocalEnquiriesBackup());
        sessionStorage.setItem('qbench_admin_crm_unlocked', 'true');
        sessionStorage.setItem('qbench_admin_secret_key', adminSecret.trim());
        triggerSuccessNotice('Portal Unlocked (Local Backup Mode)');
      } else {
        setError('Could not connect to the API. Verify that the server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reload action
  const handleReload = async () => {
    if (!isUnlocked) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/messages?secret=${encodeURIComponent(adminSecret.trim())}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setLeads(mergeLeadsWithLocalBackup(data.messages || []));
        triggerSuccessNotice('Leads updated');
      } else {
        setLeads(mergeLeadsWithLocalBackup([]));
      }
    } catch {
      setLeads(mergeLeadsWithLocalBackup([]));
    } finally {
      setLoading(false);
    }
  };

  // Delete lead record
  const handleDeleteLead = async (leadId: string) => {
    setIsDeletingId(leadId);
    try {
      const response = await fetch(`/api/messages/${leadId}?secret=${encodeURIComponent(adminSecret.trim())}`, {
        method: 'DELETE'
      });
      const data = await response.json().catch(() => ({ success: true }));
      
      if (response.ok && data.success) {
        setLeads(prev => prev.filter(item => item.id !== leadId));
        if (expandedLeadId === leadId) {
          setExpandedLeadId(null);
        }
        setConfirmDeleteId(null);
        triggerSuccessNotice('Lead record deleted successfully');
      } else {
        setError(data.error || 'An error occurred during deletion.');
      }
    } catch {
      setLeads(prev => prev.filter(item => item.id !== leadId));
      setConfirmDeleteId(null);
      triggerSuccessNotice('Lead removed from view');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Lock portal
  const handleLock = () => {
    setIsUnlocked(false);
    setLeads([]);
    sessionStorage.removeItem('qbench_admin_crm_unlocked');
    sessionStorage.removeItem('qbench_admin_secret_key');
    setAdminSecret('');
    setError(null);
  };

  const triggerSuccessNotice = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Export to CSV stream
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      setError('No leads available in active filtered view to export.');
      return;
    }

    const headers = ['Lead ID', 'Timestamp', 'Customer Name', 'Company', 'Email', 'Phone', 'Service', 'Message', 'Email Status', 'Email Sent At', 'Error'];
    const rows = filteredLeads.map((item, idx) => {
      const timeStr = item.submissionDateTime || (item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A');
      return [
        item.id || `L-${idx + 1}`,
        timeStr,
        item.fullName || 'Anonymous',
        item.businessName || 'Not specified',
        item.emailAddress || 'Not specified',
        item.phoneNumber || 'Not specified',
        item.service || 'Branding',
        (item.message || '').replace(/"/g, '""').replace(/\r?\n|\r/g, ' '),
        item.emailStatus || 'Pending',
        item.emailSentAt || '',
        (item.error || '').replace(/"/g, '""').replace(/\r?\n|\r/g, ' ')
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const tempElement = document.createElement('a');
      tempElement.setAttribute('href', url);
      tempElement.setAttribute('download', `qbench_crm_leads_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(tempElement);
      tempElement.click();
      document.body.removeChild(tempElement);
      triggerSuccessNotice('CSV Download Started Successfully');
    } catch (csvError: any) {
      setError('Could not generate CSV file: ' + (csvError?.message || 'Unknown error'));
    }
  };

  // Init fetch if already unlocked on mount
  useEffect(() => {
    if (isUnlocked && adminSecret) {
      handleReload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter Leads
  const filteredLeads = leads
    .filter(item => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (item.fullName || '').toLowerCase().includes(searchLower) ||
        (item.businessName || '').toLowerCase().includes(searchLower) ||
        (item.emailAddress || '').toLowerCase().includes(searchLower) ||
        (item.phoneNumber || '').toLowerCase().includes(searchLower) ||
        (item.message || '').toLowerCase().includes(searchLower);
      
      const matchesService = !serviceFilter || item.service === serviceFilter;
      
      return matchesSearch && matchesService;
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  // Calculate stats metrics
  const totalLeads = leads.length;
  
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentLeads = leads.filter(item => {
    const epoch = new Date(item.timestamp || 0).getTime();
    return epoch > oneDayAgo;
  }).length;

  const getServiceBreakdown = () => {
    const counts: { [key: string]: number } = {};
    leads.forEach(item => {
      const category = item.service || 'Branding';
      counts[category] = (counts[category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const serviceBreakdown = getServiceBreakdown();
  const topService = serviceBreakdown[0] ? `${serviceBreakdown[0][0]} (${serviceBreakdown[0][1]})` : 'None yet';

  if (!isUnlocked) {
    return (
      <div id="crm-lock-screen" className="bg-[#fafaf9] border border-brand-outline/20 rounded-3xl p-6 sm:p-10 space-y-6 animate-fade-in shadow-sm">
        <div className="text-center space-y-3 max-w-sm mx-auto">
          <div className="h-14 w-14 rounded-full bg-[#00685b]/10 text-[#00685b] flex items-center justify-center text-xl mx-auto">
            <Lock className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h3 className="font-display text-xl font-bold text-[#002f29] tracking-tight">
            Secure Leads Portal Key
          </h3>
          <p className="font-sans text-xs text-brand-text-muted leading-relaxed">
            Please enter the authentication key specified by the <strong>ADMIN_SECRET</strong> environment variable on your server workspace.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="max-w-md mx-auto space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-tech text-brand-text-muted uppercase font-bold tracking-wider">
              Secret Pass Key Phrase *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Enter access key (e.g. qbench2026secret)"
                className="w-full bg-white border border-brand-outline/25 rounded-xl pl-4 pr-10 py-3 text-xs text-brand-text focus:outline-none focus:border-[#00685b] transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted/40">
                🗝️
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-start gap-2 animate-fade-in leading-relaxed">
              <span className="shrink-0 text-amber-500">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#00685b] hover:bg-[#16786a] text-white py-3.5 text-xs font-display font-bold uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Validating Key...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>Authenticate Portal</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-brand-outline/10 text-center max-w-sm mx-auto">
          <p className="font-mono text-[10px] text-brand-text-muted/80 leading-relaxed">
            Note: The default key configured in the local setup environment template is <code className="bg-slate-200 px-1 py-0.5 rounded text-amber-900 font-bold font-mono">qbench2026secret</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="crm-active-panel" className="space-y-6 animate-fade-in text-brand-text select-text">
      
      {/* 1. Header with Lock Control & reload */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#002f29]/5 border border-[#00685b]/15 p-4 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00685b]/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 bg-emerald-50 text-[#00685b] rounded-full flex items-center justify-center text-lg shadow-sm border border-[#00685b]/20">
            📊
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-100 text-[#00685b] px-2 py-0.5 font-bold rounded-full font-mono uppercase tracking-wider block w-fit">
                Inbox Target: qbench.official@gmail.com
              </span>
            </div>
            <h4 className="font-display text-sm font-black text-[#002f29] mt-0.5">
              QBENCH Leads Management Engine (CRM)
            </h4>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={smtpTesting}
            onClick={runEmailDiagnostic}
            className="rounded-lg border border-[#00685b]/30 bg-[#00685b]/10 hover:bg-[#00685b]/20 text-[#002f29] p-2 px-3 text-[11px] font-sans font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Test Gmail SMTP & Webhook delivery to qbench.official@gmail.com"
          >
            <Activity className={`h-3.5 w-3.5 text-[#00685b] ${smtpTesting ? 'animate-spin' : ''}`} />
            <span>{smtpTesting ? 'Testing SMTP...' : 'Verify Email Delivery'}</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleReload}
            className="rounded-lg border border-brand-outline/25 bg-white space-x-1.5 p-2 px-3 text-[11px] font-sans font-bold hover:border-[#00685b] text-[#00685b] transition-all flex items-center cursor-pointer"
            title="Refresh Leads dataset"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden leading-none sm:inline">Sync Leads</span>
          </button>
          
          <button
            type="button"
            onClick={handleLock}
            className="rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 p-2 px-3 text-[11px] font-sans font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Disconnect CRM Admin session"
          >
            <Lock className="h-3 w-3" />
            <span className="hidden leading-none sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Email Diagnostic Result Panel */}
      {smtpDiagnostic && (
        <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
          smtpDiagnostic.emailDelivery === 'SUCCESS'
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            : 'bg-amber-50/90 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase font-extrabold tracking-wider">
              {smtpDiagnostic.emailDelivery === 'SUCCESS'
                ? '✓ Email Delivery Verified (qbench.official@gmail.com)'
                : '⚠️ Email Delivery Diagnostic Status'}
            </span>
            <button
              type="button"
              onClick={() => setSmtpDiagnostic(null)}
              className="text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="font-sans font-semibold">{smtpDiagnostic.message}</p>
          {smtpDiagnostic.details && (
            <div className="flex flex-wrap gap-3 font-mono text-[10px] opacity-85">
              <span>Host: {smtpDiagnostic.details.host}:{smtpDiagnostic.details.port} ({smtpDiagnostic.details.security})</span>
              <span>User: {smtpDiagnostic.details.user}</span>
              <span>Auth: {smtpDiagnostic.authentication}</span>
              {smtpDiagnostic.sheetsWebhookStatus && (
                <span>Sheets Webhook: {smtpDiagnostic.sheetsWebhookStatus}</span>
              )}
            </div>
          )}
          {smtpDiagnostic.advice && (
            <p className="font-sans text-[11px] leading-relaxed bg-white/80 p-2.5 rounded-xl border border-amber-200/80">
              <strong>Action Required:</strong> {smtpDiagnostic.advice}
            </p>
          )}
        </div>
      )}

      {/* Success / Error Notification Alerts */}
      <AnimatePresence>
        {successNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-600 text-white p-3 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{successNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-center justify-between gap-2">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-700 hover:text-red-950">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-4 bg-white border border-brand-outline/15 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold block">
              Total Inbound Leads
            </span>
            <span className="text-2xl font-display font-black text-[#002f29]">
              {totalLeads}
            </span>
          </div>
          <span className="p-2.5 bg-[#00685b]/5 text-[#00685b] rounded-xl">
            <Users className="h-5 w-5" />
          </span>
        </div>

        <div className="p-4 bg-white border border-brand-outline/15 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold block">
              Recent (Last 24 Hours)
            </span>
            <span className="text-2xl font-display font-black text-emerald-600">
              {recentLeads}
            </span>
          </div>
          <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="h-5 w-5" />
          </span>
        </div>

        <div className="p-4 bg-white border border-brand-outline/15 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold block">
              Primary Service Focus
            </span>
            <span className="text-sm font-sans font-black text-[#00685b] truncate max-w-[150px] block" title={topService}>
              {topService}
            </span>
          </div>
          <span className="p-2.5 bg-teal-50 text-[#00685b] rounded-xl">
            <Layers3 className="h-5 w-5" />
          </span>
        </div>

      </div>

      {/* 3. Filtering & Control Actions bar */}
      <div className="bg-white border border-brand-outline/15 rounded-2xl p-4 space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted/40">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="w-full bg-[#faf9f9] border border-brand-outline/25 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#00685b]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filters Suite */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center md:justify-end">
            
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-[#faf9f9] border border-brand-outline/25 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#00685b] cursor-pointer"
            >
              <option value="">All Service Focus</option>
              <option value="Branding">Branding & Identity</option>
              <option value="Social Media Design">Social Media Design</option>
              <option value="Video Editing">Video Editing</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Web Development">Web Development</option>
              <option value="Motion Graphics">Motion Graphics</option>
              <option value="Business Support">Business Support</option>
              <option value="Free Consultation">Free Consultation</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              className="bg-[#faf9f9] border border-brand-outline/25 hover:border-[#00685b] rounded-xl py-2 px-3 text-xs transition-colors cursor-pointer font-medium"
            >
              Sort: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-[#00685b] hover:bg-[#16786a] text-white font-medium rounded-xl py-2 px-4 text-xs transition-transform transform active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download entire current filtered dataset"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

          </div>

        </div>

      </div>

      {/* 4. Leads List / Table */}
      <div className="bg-white border border-brand-outline/15 rounded-2xl overflow-hidden shadow-xs">
        
        <div className="px-5 py-4 border-b border-brand-outline/10 bg-[#fafaf9] flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-brand-text">
            Submission Entries ({filteredLeads.length} filtered / {totalLeads} total)
          </span>
          <span className="text-[10px] text-brand-text-muted font-sans italic">
            Click any row to inspect rich inquiry payload details
          </span>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-brand-text-muted space-y-2">
            <span className="text-3xl block">📋</span>
            <p className="font-sans text-xs font-bold text-[#002f29]">
              No Leads Index Available
            </p>
            <p className="text-[11px] opacity-75 max-w-sm mx-auto">
              There are no matching submissions. Fill the contact form or reset your active filters to verify entries.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredLeads.map((item, idx) => {
              const isExpanded = expandedLeadId === item.id;
              const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A';
              
              return (
                <div key={item.id || idx} className={`transition-colors ${isExpanded ? 'bg-slate-50/70' : 'hover:bg-slate-50/40'}`}>
                  
                  {/* Lead Row Trigger */}
                  <div 
                    onClick={() => setExpandedLeadId(isExpanded ? null : item.id)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
                      
                      {/* Name / Business info block */}
                      <div className="min-w-0">
                        <p className="font-sans font-bold text-[#002f29] text-xs truncate">
                          {item.fullName || 'Anonymous'}
                        </p>
                        <p className="font-mono text-[9px] text-[#00685b] font-semibold mt-0.5 truncate uppercase">
                          🏢 {item.businessName || 'General Inquiry'}
                        </p>
                      </div>

                      {/* Contact metadata */}
                      <div className="min-w-0 text-[11px] leading-tight space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-600 truncate">
                          <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>{item.emailAddress || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 truncate font-mono text-[10px]">
                          <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>{item.phoneNumber || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Service classification Badge */}
                      <div className="min-w-0 md:text-center">
                        <span className="inline-block text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#00685b]/10 text-[#00685b] uppercase tracking-wide">
                          {item.service || 'Branding'}
                        </span>
                      </div>

                      {/* Saved timestamp */}
                      <div className="min-w-0 text-[10px] text-[#002f29]/70 font-mono flex items-center gap-1">
                        <span>🕒</span>
                        <span>{dateStr}</span>
                      </div>

                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={isDeletingId === item.id}
                            onClick={() => handleDeleteLead(item.id)}
                            className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isDeletingId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(item.id);
                          }}
                          className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-40"
                          title="Delete Lead Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <span className="text-slate-400">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    </div>

                  </div>

                  {/* Expanded Detail Area */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100/60 text-xs text-brand-text leading-relaxed space-y-4 animate-fade-in">
                      
                      {/* Blueprint/Package info badges if any */}
                      {(item.selectedPackage || item.selectedBlueprint) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#00685b]/5 border border-[#00685b]/15 p-4 rounded-xl">
                          {item.selectedPackage && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-[#00685b] font-bold tracking-wider uppercase block">
                                Booked Package Details
                              </span>
                              <p className="font-display font-black text-[#002f29] text-xs">
                                {item.selectedPackage.packageName}
                              </p>
                              <p className="text-[10px] text-[#00685b] font-medium font-sans">
                                Rate Base: {item.selectedPackage.totalAmount} (ID: {item.selectedPackage.packageId})
                              </p>
                            </div>
                          )}
                          {item.selectedBlueprint && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-[#00685b] font-bold tracking-wider uppercase block">
                                Portfolio Blueprint Inquired
                              </span>
                              <p className="font-display font-medium text-[#002f29] text-xs">
                                {item.selectedBlueprint.projectName}
                              </p>
                              <p className="text-[10px] text-slate-500 font-sans">
                                Catalog Reference: {item.selectedBlueprint.portfolioReference} ({item.selectedBlueprint.estimatedBudget})
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Decoded Message block */}
                      <div className="space-y-1 text-slate-800">
                        <span className="text-[9px] font-mono text-slate-500 tracking-wider uppercase font-bold block">
                          Full submitted Inquiry text body
                        </span>
                        <div className="bg-[#faf9f9] border border-slate-200/50 p-4.5 rounded-xl text-xs whitespace-pre-wrap font-sans leading-relaxed text-slate-700 selection:bg-teal-200">
                          {item.message}
                        </div>
                      </div>

                      {/* Lead routing & Email Status confirmation */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 border-t border-slate-200/50 pt-3">
                        <div>
                          <span className="font-bold">Lead ID:</span> {item.id}
                        </div>
                        <div className="flex items-center gap-3">
                          <span>
                            <span className="font-bold">Email Status:</span>{' '}
                            <span className={`font-mono font-bold ${
                              item.emailStatus === 'Sent' ? 'text-emerald-600' : item.emailStatus === 'Failed' ? 'text-rose-600' : 'text-amber-600'
                            }`}>
                              {item.emailStatus || 'Pending'}
                            </span>
                          </span>
                          {item.emailSentAt && (
                            <span>
                              <span className="font-bold">Email Sent At:</span> {item.emailSentAt}
                            </span>
                          )}
                          {item.error && (
                            <span className="text-rose-600">
                              <span className="font-bold">Error:</span> {item.error}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
