export type EnquiryStatus =
  | 'New'
  | 'Contacted'
  | 'Requirement Confirmed'
  | 'Quotation Preparing'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Follow-up Required'
  | 'Approved'
  | 'On Hold'
  | 'Rejected'
  | 'Lost'
  | 'Cancelled'
  | 'In Progress'
  | 'Completed';

export const ALL_ENQUIRY_STATUSES: EnquiryStatus[] = [
  'New',
  'Contacted',
  'Requirement Confirmed',
  'Quotation Preparing',
  'Quotation Sent',
  'Negotiation',
  'Follow-up Required',
  'Approved',
  'On Hold',
  'Rejected',
  'Lost',
  'Cancelled',
  'In Progress',
  'Completed',
];

export interface StatusConfig {
  label: EnquiryStatus;
  purpose: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export const STATUS_CONFIG: Record<EnquiryStatus, StatusConfig> = {
  New: {
    label: 'New',
    purpose: 'Enquiry received',
    bg: 'bg-emerald-50 text-emerald-700',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Contacted: {
    label: 'Contacted',
    purpose: 'Initial contact completed',
    bg: 'bg-blue-50 text-blue-700',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  'Requirement Confirmed': {
    label: 'Requirement Confirmed',
    purpose: 'Client requirements verified',
    bg: 'bg-teal-50 text-teal-700',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
  },
  'Quotation Preparing': {
    label: 'Quotation Preparing',
    purpose: 'Preparing the quotation',
    bg: 'bg-amber-50 text-amber-700',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  'Quotation Sent': {
    label: 'Quotation Sent',
    purpose: 'Quotation shared with client',
    bg: 'bg-indigo-50 text-indigo-700',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  Negotiation: {
    label: 'Negotiation',
    purpose: 'Discussing pricing or deliverables',
    bg: 'bg-purple-50 text-purple-700',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  'Follow-up Required': {
    label: 'Follow-up Required',
    purpose: 'Further contact is needed',
    bg: 'bg-orange-50 text-orange-700',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  Approved: {
    label: 'Approved',
    purpose: 'Client approved the proposal',
    bg: 'bg-green-50 text-green-700',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-600',
  },
  'On Hold': {
    label: 'On Hold',
    purpose: 'Temporarily paused',
    bg: 'bg-yellow-50 text-yellow-800',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
  },
  Rejected: {
    label: 'Rejected',
    purpose: 'Client declined the proposal',
    bg: 'bg-rose-50 text-rose-700',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  Lost: {
    label: 'Lost',
    purpose: 'Opportunity closed without conversion',
    bg: 'bg-slate-100 text-slate-700',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  Cancelled: {
    label: 'Cancelled',
    purpose: 'Enquiry or project cancelled',
    bg: 'bg-red-50 text-red-700',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  'In Progress': {
    label: 'In Progress',
    purpose: 'Approved project is underway',
    bg: 'bg-cyan-50 text-cyan-800',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  Completed: {
    label: 'Completed',
    purpose: 'Project delivery completed',
    bg: 'bg-emerald-100 text-emerald-900',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
  },
};

export interface FollowupNote {
  id?: string;
  date?: string;
  created_at?: string;
  author?: string;
  created_by?: string;
  note: string;
  type?: 'call' | 'email' | 'meeting' | 'note';
  completed?: boolean;
}

export interface StatusHistoryEntry {
  timestamp?: string;
  changed_at?: string;
  fromStatus?: string;
  from_status?: string;
  toStatus?: EnquiryStatus;
  to_status?: EnquiryStatus;
  changedBy?: string;
  changed_by?: string;
  notes?: string;
  reason?: string;
}

export interface PaymentEntry {
  id: string;
  date: string;
  amount: number;
  paymentMethod?: string;
  transactionRef?: string;
  status: 'Pending' | 'Success' | 'Failed';
}

export interface EnquiryRecord {
  id: string;
  reference_id: string;
  created_at: string;
  updated_at?: string;

  // Customer Details
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  contact_person?: string | null;
  source?: string | null;

  // Service Details
  service: string;
  package?: string | null;
  requirements?: string | null;
  project_requirements?: string | null;
  message?: string | null;
  estimated_budget?: string | null;
  reference_url?: string | null;
  reference_links?: string | null;
  additional_deliverables?: string | null;

  // Sales & Follow-up
  status: EnquiryStatus;
  assigned_to?: string | null;
  last_contacted_at?: string | null;
  next_followup_at?: string | null;
  followup_notes?: FollowupNote[];
  status_history?: StatusHistoryEntry[];
  quotation_number?: string | null;
  quotation_amount?: number | null;
  quotation_sent_at?: string | null;
  client_feedback?: string | null;
  internal_remarks?: string | null;
  lost_reason?: string | null;

  // Project Management & Execution
  project_status?: 'Not Started' | 'Discovery' | 'Design' | 'Revisions' | 'Delivered' | 'On Hold' | string | null;
  project_start_date?: string | null;
  project_deadline?: string | null;
  target_delivery_date?: string | null;
  project_completion_date?: string | null;
  agreed_value?: number | null;
  project_progress?: number | null;
  delivery_links?: string | null;

  // Pricing & Quotation Breakdown
  package_price?: number | null;
  discount_amount?: number | null;
  discount_percentage?: number | null;
  discount_reason?: string | null;
  additional_charges?: number | null;
  additional_charges_reason?: string | null;
  tax_amount?: number | null;
  pricing_notes?: string | null;

  // Payment Tracking
  invoice_reference?: string | null;
  total_agreed_amount?: number | null;
  advance_amount?: number | null;
  advance_paid?: number | null;
  amount_received?: number | null;
  balance_amount?: number | null;
  outstanding_balance?: number | null;
  payment_status?: 'Pending' | 'Advance Paid' | 'Partially Paid' | 'Partial' | 'Paid' | 'Overdue' | 'Refunded';
}

export type PricingType =
  | 'Fixed'
  | 'Fixed Price'
  | 'Starting From'
  | 'Starting Price'
  | 'Hourly Rate'
  | 'Daily Rate'
  | 'Per Month'
  | 'Custom Quote'
  | 'Custom Quotation';

export interface PricingRecord {
  id: string; // Price ID (e.g. PRC-BRD-001)
  service_category: string;
  service_name: string;
  package_name: string;
  package_description: string;
  deliverables: string[];
  pricing_type: PricingType;
  base_price: number;
  discount: number; // percentage (0-100)
  final_price: number; // base_price * (1 - discount/100)
  gst_rate: number; // e.g. 18
  currency: string; // Default: 'INR'
  active: boolean;
  last_updated: string;
  updated_by?: string;
  internal_notes?: string;
}
