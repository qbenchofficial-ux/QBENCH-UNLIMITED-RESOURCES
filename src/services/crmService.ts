import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured, ensureSupabaseConfig } from '../lib/supabase';
import type {
  EnquiryRecord,
  EnquiryStatus,
  FollowupNote,
  StatusHistoryEntry,
  PricingRecord,
  PricingType,
} from '../types/crm';
import { ZOHO_CATALOG_ITEMS } from '../data/zohoCatalog';

const LOCAL_CRM_ENQUIRIES_KEY = 'qbench_crm_enquiries_cache';
const LOCAL_CRM_PRICING_KEY = 'qbench_crm_pricing_cache';

export function generateEnquiryReferenceId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const timeSuffix = Date.now().toString(36).slice(-3).toUpperCase();
  return `QB-ENQ-${year}-${rand}${timeSuffix}`;
}

export const INITIAL_PRICING_RECORDS: PricingRecord[] = [
  {
    id: 'PRC-BRD-001',
    service_category: 'Branding',
    service_name: 'Branding & Visual Identity',
    package_name: 'Starter Scope',
    package_description: 'Essential logo design, color palette, typography guidelines, and business cards.',
    deliverables: ['Logo Design', 'Brand Color Palette', 'Typography Guidelines', 'Business Card Design'],
    pricing_type: 'Fixed Price',
    base_price: 5000,
    discount: 0,
    final_price: 5000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-BRD-002',
    service_category: 'Branding',
    service_name: 'Branding & Visual Identity',
    package_name: 'Professional ⭐',
    package_description: 'Full brand style guide, social media brand kit, stationery suite, and vector masters.',
    deliverables: ['Full Brand Style Guide', 'Social Media Kit', 'Stationery Suite', '3 Logo Directions'],
    pricing_type: 'Fixed Price',
    base_price: 12000,
    discount: 0,
    final_price: 12000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-BRD-003',
    service_category: 'Branding',
    service_name: 'Branding & Visual Identity',
    package_name: 'Enterprise System',
    package_description: 'End-to-end brand identity architecture with complete brand guidelines book and trademark assets.',
    deliverables: ['Complete Brand System', 'Corporate Guidelines Book', 'Motion Logo Stinger', 'Priority Support'],
    pricing_type: 'Starting Price',
    base_price: 25000,
    discount: 0,
    final_price: 25000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-AWD-001',
    service_category: 'Awards Package',
    service_name: 'Event & Award Gala Suite',
    package_name: 'Awards Package',
    package_description: 'Consolidated media, stage LED graphics, and motion production package for award ceremonies and galas.',
    deliverables: [
      'LED Stage Backdrops & Award Screen Designs',
      'Winner Reveal Sequence & Fanfare Animation',
      'Nominee Stingers & Presentation Videos',
      'Lucky Draw Interactive Stage Video',
      '30-Second Event Highlight Reel',
      'Stage Visual Package & Operator Masters'
    ],
    pricing_type: 'Fixed Price',
    base_price: 40000,
    discount: 0,
    final_price: 40000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-VID-001',
    service_category: 'Video Editing',
    service_name: 'Cinematic Video & Social Reels',
    package_name: 'Social Video Starter',
    package_description: 'Short-form cinematic reels and shorts tailored for maximum audience retention.',
    deliverables: ['4 Short Form Videos', 'Dynamic Motion Typography', 'Sound Design & Transitions'],
    pricing_type: 'Fixed Price',
    base_price: 5000,
    discount: 0,
    final_price: 5000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-VID-002',
    service_category: 'Video Editing',
    service_name: 'Cinematic Video & Social Reels',
    package_name: 'Growth Ads Video Suite',
    package_description: 'High-converting ad creatives and promotional video edits with sound design.',
    deliverables: ['8 Videos', 'Motion Graphics', 'Transitions & Effects', '3 Revision Rounds'],
    pricing_type: 'Fixed Price',
    base_price: 15000,
    discount: 0,
    final_price: 15000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-WEB-001',
    service_category: 'Web Development',
    service_name: 'Full-Stack Web Development',
    package_name: 'Essential Launch Website',
    package_description: 'Fast, responsive, modern responsive website with contact form and SEO setup.',
    deliverables: ['Responsive Website (Up to 5 Pages)', 'Contact Forms', 'SEO Setup', 'Mobile Optimization'],
    pricing_type: 'Starting Price',
    base_price: 25000,
    discount: 0,
    final_price: 25000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-WEB-002',
    service_category: 'Web Development',
    service_name: 'Full-Stack Web Development',
    package_name: 'Full-Stack Web Application',
    package_description: 'Custom React application, CMS integration, authenticated portal, and dynamic database.',
    deliverables: ['Custom Web App', 'CMS Integration', 'User Portal & Auth', 'Custom API Architecture'],
    pricing_type: 'Starting Price',
    base_price: 60000,
    discount: 0,
    final_price: 60000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-UIX-001',
    service_category: 'UI/UX Design',
    service_name: 'UI/UX & Product Design',
    package_name: 'Interactive Screen Prototype',
    package_description: 'Complete Figma wireframes, UI screen layouts, and interactive developer-ready prototype.',
    deliverables: ['15 Custom Screens', 'Interactive Prototype', 'Design System Components', 'Figma File'],
    pricing_type: 'Fixed Price',
    base_price: 35000,
    discount: 0,
    final_price: 35000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-MOT-001',
    service_category: 'Motion Graphics',
    service_name: 'Motion Design & Kinetic Visuals',
    package_name: '2D Explainer Video',
    package_description: 'Full 2D motion animated explainer video with custom storyboard and professional voiceover sync.',
    deliverables: ['60-Second Explainer', 'Storyboard & Concept', 'Liquid 2D Animation', 'Sound Design'],
    pricing_type: 'Fixed Price',
    base_price: 30000,
    discount: 0,
    final_price: 30000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-MKT-001',
    service_category: 'Digital Marketing',
    service_name: 'Performance Marketing & SEO',
    package_name: 'Lead Funnel Engine',
    package_description: 'Ad campaign setup, audience segmentation, conversion tracking, and monthly growth optimization.',
    deliverables: ['Ad Campaign Setup', 'Funnel Strategy', 'Weekly Optimization', 'Bi-weekly Strategy Calls'],
    pricing_type: 'Hourly Rate',
    base_price: 15000,
    discount: 0,
    final_price: 15000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'PRC-SPT-001',
    service_category: 'Business Support',
    service_name: 'Studio Support & Content Operations',
    package_name: 'Monthly Operational Support',
    package_description: 'Dedicated presentation deck design, content copywriting, and digital operations retainer.',
    deliverables: ['12 Copywriting Assets', '3 Pitch Decks', 'Print Production Specs', 'Media Resizing'],
    pricing_type: 'Daily Rate',
    base_price: 18000,
    discount: 0,
    final_price: 18000,
    gst_rate: 18,
    currency: 'INR',
    active: true,
    last_updated: new Date().toISOString(),
  },
];

function normalizeStatus(raw: unknown): EnquiryStatus {
  if (!raw) return 'New';
  const str = String(raw).trim();
  const lower = str.toLowerCase();
  if (lower === 'new') return 'New';
  if (lower === 'contacted') return 'Contacted';
  if (lower === 'requirement confirmed' || lower === 'requirement_confirmed') return 'Requirement Confirmed';
  if (lower === 'quotation preparing' || lower === 'quotation_preparing') return 'Quotation Preparing';
  if (lower === 'quotation sent' || lower === 'quotation_sent') return 'Quotation Sent';
  if (lower === 'negotiation') return 'Negotiation';
  if (lower === 'follow-up required' || lower === 'followup_required') return 'Follow-up Required';
  if (lower === 'approved') return 'Approved';
  if (lower === 'on hold' || lower === 'on_hold') return 'On Hold';
  if (lower === 'rejected') return 'Rejected';
  if (lower === 'lost') return 'Lost';
  if (lower === 'cancelled') return 'Cancelled';
  if (lower === 'in progress' || lower === 'in_progress') return 'In Progress';
  if (lower === 'completed' || lower === 'closed' || lower === 'archived') return 'Completed';
  return 'New';
}

function parseCrmMeta(row: Record<string, any>): Record<string, any> {
  if (row.crm_meta && typeof row.crm_meta === 'object') {
    return row.crm_meta;
  }
  if (row.crm_meta && typeof row.crm_meta === 'string') {
    try {
      return JSON.parse(row.crm_meta);
    } catch {
      return {};
    }
  }
  return {};
}

export function normalizeEnquiryRecord(row: Record<string, any>): EnquiryRecord {
  const meta = parseCrmMeta(row);

  const id = String(row.id || '');
  const refId =
    row.reference_id ||
    meta.reference_id ||
    (id.startsWith('inq-') ? id.toUpperCase() : `QB-ENQ-${id.slice(0, 8).toUpperCase()}`);

  const totalAgreed = Number(row.agreed_value ?? meta.agreed_value ?? meta.total_agreed_amount ?? 0);
  const amountRec = Number(row.amount_received ?? meta.amount_received ?? 0);
  const outstanding = Math.max(0, totalAgreed - amountRec);

  return {
    id,
    reference_id: refId,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || undefined,
    name: String(row.name || ''),
    phone: String(row.phone || ''),
    email: row.email ? String(row.email) : null,
    company: row.company ? String(row.company) : meta.company || null,
    contact_person: row.contact_person || meta.contact_person || null,
    source: row.source || meta.source || 'Website Contact Form',
    service: String(row.service || 'Branding'),
    package: row.package ? String(row.package) : meta.package || null,
    requirements: row.requirements || meta.requirements || row.message || null,
    project_requirements: row.project_requirements || meta.project_requirements || row.requirements || meta.requirements || row.message || null,
    message: row.message ? String(row.message) : null,
    estimated_budget: row.budget ? String(row.budget) : meta.estimated_budget || null,
    reference_url: row.reference_url || meta.reference_url || null,
    reference_links: row.reference_links || meta.reference_links || null,
    additional_deliverables: row.additional_deliverables || meta.additional_deliverables || null,
    status: normalizeStatus(row.status),
    assigned_to: row.assigned_to || meta.assigned_to || null,
    last_contacted_at: row.last_contacted_at || meta.last_contacted_at || null,
    next_followup_at: row.next_followup_at || meta.next_followup_at || null,
    followup_notes: Array.isArray(meta.followup_notes) ? meta.followup_notes : [],
    status_history: Array.isArray(meta.status_history) ? meta.status_history : [],
    quotation_number: row.quotation_number || meta.quotation_number || null,
    quotation_amount: row.quotation_amount != null ? Number(row.quotation_amount) : meta.quotation_amount != null ? Number(meta.quotation_amount) : null,
    quotation_sent_at: row.quotation_sent_at || meta.quotation_sent_at || null,
    package_price: row.package_price != null ? Number(row.package_price) : meta.package_price != null ? Number(meta.package_price) : null,
    discount_amount: row.discount_amount != null ? Number(row.discount_amount) : meta.discount_amount != null ? Number(meta.discount_amount) : 0,
    discount_percentage: row.discount_percentage != null ? Number(row.discount_percentage) : meta.discount_percentage != null ? Number(meta.discount_percentage) : 0,
    discount_reason: row.discount_reason || meta.discount_reason || null,
    additional_charges: row.additional_charges != null ? Number(row.additional_charges) : meta.additional_charges != null ? Number(meta.additional_charges) : 0,
    additional_charges_reason: row.additional_charges_reason || meta.additional_charges_reason || null,
    tax_amount: row.tax_amount != null ? Number(row.tax_amount) : meta.tax_amount != null ? Number(meta.tax_amount) : 0,
    pricing_notes: row.pricing_notes || meta.pricing_notes || null,
    client_feedback: row.client_feedback || meta.client_feedback || null,
    internal_remarks: row.internal_remarks || meta.internal_remarks || null,
    lost_reason: row.lost_reason || meta.lost_reason || null,
    project_status: row.project_status || meta.project_status || 'Not Started',
    project_start_date: row.project_start_date || meta.project_start_date || null,
    project_deadline: row.project_deadline || meta.project_deadline || null,
    target_delivery_date: row.target_delivery_date || meta.target_delivery_date || null,
    project_completion_date: row.project_completion_date || meta.project_completion_date || null,
    agreed_value: totalAgreed || null,
    project_progress: row.project_progress != null ? Number(row.project_progress) : meta.project_progress != null ? Number(meta.project_progress) : 0,
    delivery_links: row.delivery_links || meta.delivery_links || null,
    invoice_reference: row.invoice_reference || meta.invoice_reference || null,
    total_agreed_amount: totalAgreed || null,
    advance_amount: row.advance_amount != null ? Number(row.advance_amount) : meta.advance_amount != null ? Number(meta.advance_amount) : null,
    advance_paid: row.advance_paid != null ? Number(row.advance_paid) : (row.advance_amount != null ? Number(row.advance_amount) : (meta.advance_paid != null ? Number(meta.advance_paid) : (meta.advance_amount != null ? Number(meta.advance_amount) : null))),
    amount_received: amountRec || null,
    balance_amount: outstanding,
    outstanding_balance: outstanding,
    payment_status: row.payment_status || meta.payment_status || (amountRec >= totalAgreed && totalAgreed > 0 ? 'Paid' : amountRec > 0 ? 'Partially Paid' : 'Pending'),
  };
}

export async function fetchCrmEnquiries(): Promise<EnquiryRecord[]> {
  await ensureSupabaseConfig();

  let records: EnquiryRecord[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('project_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        records = data.map((row) => normalizeEnquiryRecord(row as Record<string, any>));
      }
    } catch (err) {
      console.warn('[CRM] Supabase inquiries fetch fallback:', err);
    }
  }

  // Fallback to local cache if Supabase is offline or returned empty
  if (records.length === 0) {
    try {
      const raw = localStorage.getItem(LOCAL_CRM_ENQUIRIES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          records = parsed.map((item) => normalizeEnquiryRecord(item));
        }
      }
    } catch {
      // ignore
    }
  } else {
    // Cache fresh records locally
    try {
      localStorage.setItem(LOCAL_CRM_ENQUIRIES_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  }

  return records;
}

export async function updateCrmEnquiry(
  id: string,
  updates: Partial<EnquiryRecord>,
  adminUser = 'Admin'
): Promise<EnquiryRecord> {
  await ensureSupabaseConfig();

  const nowIso = new Date().toISOString();

  // Load existing records to merge
  const all = await fetchCrmEnquiries();
  const existing = all.find((item) => item.id === id);

  if (!existing) {
    throw new Error(`Enquiry with ID ${id} not found.`);
  }

  const merged: EnquiryRecord = {
    ...existing,
    ...updates,
    updated_at: nowIso,
  };

  // Recalculate outstanding balance
  const agreed = Number(merged.agreed_value || merged.total_agreed_amount || 0);
  const rec = Number(merged.amount_received || 0);
  merged.outstanding_balance = Math.max(0, agreed - rec);
  if (agreed > 0 && rec >= agreed) {
    merged.payment_status = 'Paid';
  } else if (rec > 0) {
    merged.payment_status = 'Partially Paid';
  }

  // If status changed, record in history
  if (updates.status && updates.status !== existing.status) {
    const historyEntry: StatusHistoryEntry = {
      timestamp: nowIso,
      fromStatus: existing.status,
      toStatus: updates.status,
      changedBy: adminUser,
      notes: updates.internal_remarks || `Status transitioned to ${updates.status}`,
    };
    merged.status_history = [historyEntry, ...(merged.status_history || [])];
  }

  // Save to Supabase
  if (isSupabaseConfigured) {
    // Extract base table payload and full CRM meta
    const basePayload: Record<string, any> = {
      status: merged.status,
      name: merged.name,
      email: merged.email || 'not-provided@qbench.in',
      phone: merged.phone,
      company: merged.company,
      service: merged.service,
      package: merged.package,
      budget: merged.estimated_budget,
      message: merged.requirements || merged.message,
      updated_at: nowIso,
    };

    // Store rich CRM fields in crm_meta column
    const metaPayload = {
      reference_id: merged.reference_id,
      contact_person: merged.contact_person,
      source: merged.source,
      project_requirements: merged.project_requirements,
      reference_url: merged.reference_url,
      assigned_to: merged.assigned_to,
      last_contacted_at: merged.last_contacted_at,
      next_followup_at: merged.next_followup_at,
      followup_notes: merged.followup_notes,
      status_history: merged.status_history,
      quotation_number: merged.quotation_number,
      quotation_amount: merged.quotation_amount,
      quotation_sent_at: merged.quotation_sent_at,
      package_price: merged.package_price,
      discount_amount: merged.discount_amount,
      discount_percentage: merged.discount_percentage,
      discount_reason: merged.discount_reason,
      additional_charges: merged.additional_charges,
      additional_charges_reason: merged.additional_charges_reason,
      tax_amount: merged.tax_amount,
      pricing_notes: merged.pricing_notes,
      client_feedback: merged.client_feedback,
      internal_remarks: merged.internal_remarks,
      lost_reason: merged.lost_reason,
      project_status: merged.project_status,
      project_start_date: merged.project_start_date,
      project_deadline: merged.project_deadline,
      target_delivery_date: merged.target_delivery_date,
      project_completion_date: merged.project_completion_date,
      agreed_value: merged.agreed_value,
      project_progress: merged.project_progress,
      delivery_links: merged.delivery_links,
      invoice_reference: merged.invoice_reference,
      total_agreed_amount: merged.total_agreed_amount,
      advance_amount: merged.advance_amount,
      advance_paid: merged.advance_paid ?? merged.advance_amount,
      amount_received: merged.amount_received,
      balance_amount: merged.balance_amount ?? merged.outstanding_balance,
      outstanding_balance: merged.outstanding_balance,
      payment_status: merged.payment_status,
    };

    try {
      // First attempt update including crm_meta
      const { error: metaErr } = await supabase
        .from('project_inquiries')
        .update({
          ...basePayload,
          crm_meta: metaPayload,
        })
        .eq('id', id);

      if (metaErr) {
        // If crm_meta column does not exist in schema, fallback to base table columns
        console.warn('[CRM] Retrying update without crm_meta:', metaErr.message);
        await supabase
          .from('project_inquiries')
          .update(basePayload)
          .eq('id', id);
      }
    } catch (err) {
      console.error('[CRM] Supabase update failed, saving to local cache:', err);
    }
  }

  // Update local cache
  const updatedList = all.map((item) => (item.id === id ? merged : item));
  try {
    localStorage.setItem(LOCAL_CRM_ENQUIRIES_KEY, JSON.stringify(updatedList));
  } catch {
    // ignore
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return merged;
}

export async function addEnquiryFollowup(
  id: string,
  noteData: {
    note: string;
    type?: 'call' | 'email' | 'meeting' | 'note';
    author?: string;
    created_by?: string;
    created_at?: string;
    nextDate?: string;
  },
  nextDateParam?: string
): Promise<EnquiryRecord> {
  const all = await fetchCrmEnquiries();
  const existing = all.find((item) => item.id === id);
  if (!existing) throw new Error('Enquiry not found');

  const nowIso = noteData.created_at || new Date().toISOString();
  const newNote: FollowupNote = {
    id: `fn-${Date.now()}`,
    date: nowIso,
    created_at: nowIso,
    author: noteData.author || noteData.created_by || 'Admin',
    created_by: noteData.author || noteData.created_by || 'Admin',
    note: noteData.note.trim(),
    type: noteData.type || 'note',
    completed: true,
  };

  const updatedNotes = [newNote, ...(existing.followup_notes || [])];
  const targetNextDate = nextDateParam || noteData.nextDate || existing.next_followup_at;

  return updateCrmEnquiry(id, {
    followup_notes: updatedNotes,
    last_contacted_at: nowIso,
    next_followup_at: targetNextDate,
    status: existing.status === 'New' ? 'Contacted' : existing.status,
  });
}

// ==========================================
// EXCEL EXPORT & IMPORT UTILITIES
// ==========================================

export function exportEnquiriesToExcel(enquiries: EnquiryRecord[], filename = 'QBench_Enquiries_CRM.xlsx') {
  const rows = enquiries.map((item) => ({
    'Enquiry ID': item.reference_id,
    'Date Submitted': new Date(item.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    'Client Name': item.name,
    'Contact Person': item.contact_person || '—',
    'Phone': item.phone,
    'Email': item.email || 'Not provided',
    'Company': item.company || '—',
    'Service Required': item.service,
    'Package': item.package || '—',
    'Status': item.status,
    'Quotation No': item.quotation_number || '—',
    'Quotation Amount (INR)': item.quotation_amount ? `₹${item.quotation_amount.toLocaleString('en-IN')}` : '—',
    'Agreed Value (INR)': item.agreed_value ? `₹${item.agreed_value.toLocaleString('en-IN')}` : '—',
    'Amount Received (INR)': item.amount_received ? `₹${item.amount_received.toLocaleString('en-IN')}` : '₹0',
    'Outstanding Balance (INR)': item.outstanding_balance ? `₹${item.outstanding_balance.toLocaleString('en-IN')}` : '₹0',
    'Payment Status': item.payment_status || 'Pending',
    'Assigned To': item.assigned_to || 'Unassigned',
    'Next Follow-up': item.next_followup_at ? new Date(item.next_followup_at).toLocaleDateString('en-IN') : '—',
    'Requirements / Remarks': item.requirements || item.message || '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Enquiries');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 }, // Enquiry ID
    { wch: 20 }, // Date
    { wch: 20 }, // Client Name
    { wch: 18 }, // Contact Person
    { wch: 15 }, // Phone
    { wch: 25 }, // Email
    { wch: 20 }, // Company
    { wch: 20 }, // Service
    { wch: 22 }, // Package
    { wch: 18 }, // Status
    { wch: 15 }, // Quotation No
    { wch: 22 }, // Quotation Amount
    { wch: 20 }, // Agreed Value
    { wch: 22 }, // Amount Received
    { wch: 25 }, // Outstanding Balance
    { wch: 16 }, // Payment Status
    { wch: 16 }, // Assigned To
    { wch: 16 }, // Next Follow-up
    { wch: 40 }, // Remarks
  ];

  XLSX.writeFile(workbook, filename);
}

export function exportEnquiriesToCsv(enquiries: EnquiryRecord[], filename = 'QBench_Enquiries_CRM.csv') {
  exportEnquiriesToExcel(enquiries, filename.endsWith('.csv') ? filename.replace('.csv', '.xlsx') : filename);
}

// ==========================================
// PRICING MANAGEMENT (EXCEL-STYLE ADMIN MODULE)
// ==========================================

export async function fetchPricingRecords(): Promise<PricingRecord[]> {
  await ensureSupabaseConfig();

  // Try reading from Supabase table service_pricing
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .order('service_category', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row) => ({
          id: String(row.id || row.price_id),
          service_category: String(row.service_category || 'Branding'),
          service_name: String(row.service_name || row.service_category),
          package_name: String(row.package_name || ''),
          package_description: String(row.package_description || ''),
          deliverables: Array.isArray(row.deliverables)
            ? row.deliverables
            : typeof row.deliverables === 'string'
            ? row.deliverables.split('\n').filter(Boolean)
            : [],
          pricing_type: (row.pricing_type as PricingType) || 'Fixed Price',
          base_price: Number(row.base_price || 0),
          discount: Number(row.discount || 0),
          final_price: Number(row.final_price || row.base_price || 0),
          gst_rate: Number(row.gst_rate || 18),
          currency: String(row.currency || 'INR'),
          active: row.active !== false,
          last_updated: row.last_updated || new Date().toISOString(),
          updated_by: row.updated_by || 'Admin',
          internal_notes: row.internal_notes || '',
        }));
      }
    } catch {
      // ignore
    }
  }

  // Fallback to local storage cache
  try {
    const raw = localStorage.getItem(LOCAL_CRM_PRICING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // Fallback to initial seeds
  return INITIAL_PRICING_RECORDS;
}

export async function saveBulkPricingRecords(
  records: PricingRecord[],
  adminUser = 'Admin'
): Promise<PricingRecord[]> {
  await ensureSupabaseConfig();

  const nowIso = new Date().toISOString();

  // Normalize final_price and validate
  const validated = records.map((rec) => {
    const base = Math.max(0, Number(rec.base_price || 0));
    const disc = Math.min(100, Math.max(0, Number(rec.discount || 0)));
    const finalPrice = Math.round(base * (1 - disc / 100));

    return {
      ...rec,
      base_price: base,
      discount: disc,
      final_price: finalPrice,
      last_updated: nowIso,
      updated_by: adminUser,
    };
  });

  if (isSupabaseConfigured) {
    try {
      const payload = validated.map((rec) => ({
        id: rec.id,
        price_id: rec.id,
        service_category: rec.service_category,
        service_name: rec.service_name,
        package_name: rec.package_name,
        package_description: rec.package_description,
        deliverables: rec.deliverables,
        pricing_type: rec.pricing_type,
        base_price: rec.base_price,
        discount: rec.discount,
        final_price: rec.final_price,
        gst_rate: rec.gst_rate,
        currency: rec.currency,
        active: rec.active,
        last_updated: nowIso,
        updated_by: adminUser,
      }));

      await supabase.from('service_pricing').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('[CRM Pricing] Supabase table upsert failed, stored in localStorage:', err);
    }
  }

  try {
    localStorage.setItem(LOCAL_CRM_PRICING_KEY, JSON.stringify(validated));
  } catch {
    // ignore
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return validated;
}

export function exportPricingToExcel(records: PricingRecord[], filename = 'QBench_Pricing_Matrix.xlsx') {
  const rows = records.map((rec) => ({
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
    'Active': rec.active ? 'YES' : 'NO',
    'Last Updated': new Date(rec.last_updated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pricing');

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 25 },
    { wch: 25 },
    { wch: 40 },
    { wch: 45 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
  ];

  XLSX.writeFile(workbook, filename);
}

export function downloadPricingTemplate() {
  const exampleRows = [
    {
      'Price ID': 'PRC-NEW-001',
      'Service Category': 'Branding',
      'Service Name': 'Brand Identity',
      'Package Name': 'Brand Sprint',
      'Description': 'Rapid 3-day brand positioning and logo design.',
      'Deliverables': 'Logo | Palette | Vector Files',
      'Pricing Type': 'Fixed Price',
      'Base Price (INR)': 15000,
      'Discount (%)': 10,
      'Final Price (INR)': 13500,
      'GST Rate (%)': 18,
      'Currency': 'INR',
      'Active': 'YES',
    },
    {
      'Price ID': 'PRC-NEW-002',
      'Service Category': 'Awards Package',
      'Service Name': 'Event Gala Visuals',
      'Package Name': 'Awards Package',
      'Description': 'Stage LED visuals, winner reveal, and nominee videos.',
      'Deliverables': 'Stage Backdrops | Winner Stings | 30s Reel',
      'Pricing Type': 'Fixed Price',
      'Base Price (INR)': 40000,
      'Discount (%)': 0,
      'Final Price (INR)': 40000,
      'GST Rate (%)': 18,
      'Currency': 'INR',
      'Active': 'YES',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(exampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pricing_Template');
  XLSX.writeFile(workbook, 'QBench_Pricing_Import_Template.xlsx');
}

export async function parsePricingExcel(file: File): Promise<{
  validRecords: PricingRecord[];
  errors: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    return { validRecords: [], errors: ['No sheets found in uploaded spreadsheet.'] };
  }

  const rawData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
  const validRecords: PricingRecord[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  rawData.forEach((row, idx) => {
    const rowNum = idx + 2;
    const priceId = String(row['Price ID'] || row['id'] || '').trim();
    const category = String(row['Service Category'] || row['category'] || '').trim();
    const pkgName = String(row['Package Name'] || row['package'] || '').trim();
    const basePriceStr = String(row['Base Price (INR)'] || row['base_price'] || row['Base Price'] || '0').replace(/[^0-9.]/g, '');
    const discStr = String(row['Discount (%)'] || row['discount'] || '0').replace(/[^0-9.]/g, '');

    if (!priceId) {
      errors.push(`Row ${rowNum}: Missing "Price ID".`);
      return;
    }
    if (seenIds.has(priceId)) {
      errors.push(`Row ${rowNum}: Duplicate Price ID "${priceId}" found in import file.`);
      return;
    }
    seenIds.add(priceId);

    if (!category) {
      errors.push(`Row ${rowNum}: Missing "Service Category".`);
      return;
    }
    if (!pkgName) {
      errors.push(`Row ${rowNum}: Missing "Package Name".`);
      return;
    }

    const basePrice = Math.max(0, parseFloat(basePriceStr) || 0);
    const discount = Math.min(100, Math.max(0, parseFloat(discStr) || 0));
    const finalPrice = Math.round(basePrice * (1 - discount / 100));

    const rawDeliverables = String(row['Deliverables'] || row['deliverables'] || '');
    const deliverables = rawDeliverables
      ? rawDeliverables.split(/[|\n,]/).map((s) => s.trim()).filter(Boolean)
      : [];

    const rawType = String(row['Pricing Type'] || row['pricing_type'] || 'Fixed Price').trim();
    const pricingType: PricingType = [
      'Fixed Price',
      'Starting Price',
      'Hourly Rate',
      'Daily Rate',
      'Custom Quotation',
    ].includes(rawType)
      ? (rawType as PricingType)
      : 'Fixed Price';

    const activeStr = String(row['Active'] || row['active'] || 'YES').toUpperCase().trim();
    const active = activeStr === 'YES' || activeStr === 'TRUE' || activeStr === '1';

    validRecords.push({
      id: priceId,
      service_category: category,
      service_name: String(row['Service Name'] || row['service_name'] || category).trim(),
      package_name: pkgName,
      package_description: String(row['Description'] || row['description'] || '').trim(),
      deliverables,
      pricing_type: pricingType,
      base_price: basePrice,
      discount,
      final_price: finalPrice,
      gst_rate: 18,
      currency: 'INR',
      active,
      last_updated: new Date().toISOString(),
      updated_by: 'Excel Import',
    });
  });

  return { validRecords, errors };
}
