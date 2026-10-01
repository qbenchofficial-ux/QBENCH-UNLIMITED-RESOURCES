import React, { useState, useMemo } from 'react';
import {
  updateProjectInquiryStatus,
  deleteProjectInquiry,
} from '../services/inquiryService';
import type { ProjectInquiry, InquiryStatus } from '../types/project';
import {
  Mail,
  Phone,
  Trash2,
  Search,
  MessageSquare,
  Calendar,
  Building2,
  DollarSign,
} from 'lucide-react';

interface InquiriesManagerProps {
  inquiries: ProjectInquiry[];
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export default function InquiriesManager({
  inquiries,
  onRefresh,
  onNotify,
}: InquiriesManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inquiries.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.company || '').toLowerCase().includes(q) ||
        item.service.toLowerCase().includes(q) ||
        (item.message || '').toLowerCase().includes(q)
      );
    });
  }, [inquiries, search, statusFilter]);

  const handleStatusChange = async (id: string, nextStatus: InquiryStatus) => {
    try {
      await updateProjectInquiryStatus(id, nextStatus);
      onNotify('success', `Inquiry status updated to "${nextStatus}".`);
      await onRefresh();
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to update inquiry status.'
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProjectInquiry(id);
      onNotify('success', 'Inquiry deleted.');
      await onRefresh();
    } catch (err: unknown) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Failed to delete inquiry.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="font-tech text-[10px] font-extrabold uppercase tracking-widest text-[#00685b]">
              SUPABASE TABLE: PROJECT_INQUIRIES
            </span>
            <h2 className="font-display text-2xl font-black text-slate-900">
              Project Inquiries ({filtered.length})
            </h2>
            <p className="font-sans text-xs text-slate-500 mt-1">
              Submissions received from the Contact and Start a Project forms (newest first).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, email, service, or message..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:border-[#00685b] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | InquiryStatus)
            }
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-[#00685b] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2 shadow-2xs">
          <p className="font-display text-sm font-bold text-slate-700">
            No project inquiries found
          </p>
          <p className="font-sans text-xs text-slate-500">
            When visitors submit the Contact or Start a Project form, their inquiries appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inq) => (
            <div
              key={inq.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-black text-slate-900">
                      {inq.name}
                    </h3>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="font-tech text-xs font-bold text-[#00685b]">
                      {inq.service}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {inq.company && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{inq.company}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(inq.created_at).toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={inq.status}
                    onChange={(e) =>
                      handleStatusChange(inq.id, e.target.value as InquiryStatus)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-[#00685b] focus:outline-none"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDelete(inq.id)}
                    className="rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 p-2 text-red-700 cursor-pointer"
                    title="Delete Inquiry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <a
                  href={`mailto:${inq.email}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-slate-700 hover:border-[#00685b]"
                >
                  <Mail className="h-4 w-4 text-[#00685b] shrink-0" />
                  <span className="truncate font-semibold">{inq.email}</span>
                </a>

                <a
                  href={`tel:${inq.phone}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-slate-700 hover:border-[#00685b]"
                >
                  <Phone className="h-4 w-4 text-[#00685b] shrink-0" />
                  <span className="truncate font-semibold">{inq.phone}</span>
                </a>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-slate-700">
                  <DollarSign className="h-4 w-4 text-[#00685b] shrink-0" />
                  <span className="truncate">
                    Budget: <strong>{inq.budget || 'Not specified'}</strong>
                  </span>
                </div>
              </div>

              {inq.message && (
                <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4 space-y-1 text-xs text-slate-700">
                  <span className="font-tech text-[10px] font-bold uppercase text-slate-400 block">
                    Message
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {inq.message}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`mailto:${inq.email}?subject=${encodeURIComponent(
                    `Re: Your ${inq.service} Inquiry with QBENCH`
                  )}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00685b] hover:bg-[#005348] px-3.5 py-2 font-display text-xs font-bold text-white"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Reply via Email</span>
                </a>

                <a
                  href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${inq.name}, thank you for contacting QBENCH regarding ${inq.service}!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] px-3.5 py-2 font-display text-xs font-bold text-white"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp Client</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
