import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  AlertTriangle,
  DollarSign,
  Calculator,
  User,
  Phone,
  Mail,
  Building,
  Briefcase,
  Layers,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type { EnquiryRecord, EnquiryStatus } from '../types/crm';
import { STATUS_CONFIG } from '../types/crm';
import { updateCrmEnquiry } from '../services/crmService';

interface EnquiryEditModalProps {
  enquiry: EnquiryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updated: EnquiryRecord) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
  adminName?: string;
}

const SERVICE_OPTIONS = [
  'Branding',
  'Awards Package',
  'Social Media Design',
  'Video Editing',
  'Digital Marketing',
  'UI/UX Design',
  'Web Development',
  'Motion Graphics',
  'Digital Growth',
  'Business Support',
  'Free Consultation',
  'Other'
];

const STANDARD_PACKAGES = [
  'Standard Scope (Default)',
  'Awards Package (All-in-One Suite)',
  'Starter Scope',
  'Growth Scope',
  'Enterprise Scope',
  'Interactive Screen Prototype',
  '2D Explainer Video',
  'Lead Funnel Engine',
  'Monthly Operational Support',
  'Custom Quotation'
];

const STAFF_MEMBERS = [
  'Akhil Suresh (Director)',
  'Shalumol Varghese (Chief Technologist)',
  'Jobin Jose (Design Director)',
  'Creative Studio Team',
  'Sales & Client Relations',
  'Unassigned'
];

export default function EnquiryEditModal({
  enquiry,
  isOpen,
  onClose,
  onSaveSuccess,
  onNotify,
  adminName = 'Admin'
}: EnquiryEditModalProps) {
  if (!isOpen || !enquiry) return null;

  // Active section tab inside modal
  const [activeTab, setActiveTab] = useState<'details' | 'scope' | 'pricing' | 'workflow'>('details');

  // Form State initialized with the selected enquiry's saved values
  const [formData, setFormData] = useState({
    name: enquiry.name || '',
    phone: enquiry.phone || '',
    email: enquiry.email || '',
    company: enquiry.company || '',
    contact_person: enquiry.contact_person || '',
    source: enquiry.source || 'Website Contact Form',

    service: enquiry.service || 'Branding',
    package: enquiry.package || '',
    project_requirements: enquiry.project_requirements || enquiry.requirements || enquiry.message || '',
    additional_deliverables: enquiry.additional_deliverables || '',
    reference_url: enquiry.reference_url || '',

    // Pricing Fields
    package_price: enquiry.package_price ?? (enquiry.quotation_amount ? enquiry.quotation_amount : 0),
    quotation_amount: enquiry.quotation_amount ?? 0,
    discount_amount: enquiry.discount_amount ?? 0,
    discount_reason: enquiry.discount_reason || '',
    additional_charges: enquiry.additional_charges ?? 0,
    additional_charges_reason: enquiry.additional_charges_reason || '',
    tax_amount: enquiry.tax_amount ?? 0,
    pricing_notes: enquiry.pricing_notes || '',
    total_agreed_amount: enquiry.total_agreed_amount ?? (enquiry.agreed_value ?? (enquiry.quotation_amount ?? 0)),
    advance_paid: enquiry.advance_paid ?? (enquiry.advance_amount ?? 0),
    amount_received: enquiry.amount_received ?? 0,
    payment_status: enquiry.payment_status || 'Pending',
    quotation_number: enquiry.quotation_number || `QB-QT-${new Date().getFullYear()}-${enquiry.reference_id.replace(/[^0-9]/g, '').slice(-4) || '1001'}`,
    invoice_reference: enquiry.invoice_reference || '',

    // Workflow State
    status: enquiry.status || ('New' as EnquiryStatus),
    assigned_to: enquiry.assigned_to || '',
    next_followup_at: enquiry.next_followup_at ? enquiry.next_followup_at.split('T')[0] : '',
    internal_remarks: enquiry.internal_remarks || '',
    lost_reason: enquiry.lost_reason || '',
    project_status: enquiry.project_status || 'Not Started',
    project_start_date: enquiry.project_start_date ? enquiry.project_start_date.split('T')[0] : '',
    project_deadline: enquiry.project_deadline ? enquiry.project_deadline.split('T')[0] : '',
    target_delivery_date: enquiry.target_delivery_date ? enquiry.target_delivery_date.split('T')[0] : ''
  });

  // Auto-calculation toggle
  const [autoCalculateTotal, setAutoCalculateTotal] = useState(true);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Track initial snapshot to detect dirty form
  const initialSnapshot = useMemo(
    () => JSON.stringify({
      name: enquiry.name || '',
      phone: enquiry.phone || '',
      email: enquiry.email || '',
      company: enquiry.company || '',
      service: enquiry.service || 'Branding',
      package: enquiry.package || '',
      project_requirements: enquiry.project_requirements || enquiry.requirements || enquiry.message || '',
      quotation_amount: enquiry.quotation_amount ?? 0,
      total_agreed_amount: enquiry.total_agreed_amount ?? (enquiry.agreed_value ?? 0),
      advance_paid: enquiry.advance_paid ?? 0,
      status: enquiry.status,
      assigned_to: enquiry.assigned_to || '',
      next_followup_at: enquiry.next_followup_at ? enquiry.next_followup_at.split('T')[0] : '',
      internal_remarks: enquiry.internal_remarks || ''
    }),
    [enquiry]
  );

  const isDirty = useMemo(() => {
    const current = JSON.stringify({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      company: formData.company,
      service: formData.service,
      package: formData.package,
      project_requirements: formData.project_requirements,
      quotation_amount: formData.quotation_amount,
      total_agreed_amount: formData.total_agreed_amount,
      advance_paid: formData.advance_paid,
      status: formData.status,
      assigned_to: formData.assigned_to,
      next_followup_at: formData.next_followup_at,
      internal_remarks: formData.internal_remarks
    });
    return current !== initialSnapshot;
  }, [formData, initialSnapshot]);

  // Recalculate computed final total when components change and auto-calc is enabled
  useEffect(() => {
    if (autoCalculateTotal) {
      const base = Number(formData.quotation_amount) || Number(formData.package_price) || 0;
      const discount = Math.max(0, Number(formData.discount_amount) || 0);
      const charges = Math.max(0, Number(formData.additional_charges) || 0);
      const taxes = Math.max(0, Number(formData.tax_amount) || 0);
      const calculated = Math.max(0, base - discount + charges + taxes);
      setFormData((prev) => ({ ...prev, total_agreed_amount: calculated }));
    }
  }, [
    autoCalculateTotal,
    formData.quotation_amount,
    formData.package_price,
    formData.discount_amount,
    formData.additional_charges,
    formData.tax_amount
  ]);

  // Auto calculate outstanding balance
  const outstandingBalance = useMemo(() => {
    const total = Number(formData.total_agreed_amount) || 0;
    const paid = Number(formData.advance_paid) || Number(formData.amount_received) || 0;
    return Math.max(0, total - paid);
  }, [formData.total_agreed_amount, formData.advance_paid, formData.amount_received]);

  // Handle Close with Unsaved Changes Guard
  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Validate form
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Full Name is required.';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required.';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (Number(formData.quotation_amount) < 0) {
      errs.quotation_amount = 'Quoted price cannot be negative.';
    }
    if (Number(formData.discount_amount) < 0) {
      errs.discount_amount = 'Discount cannot be negative.';
    }
    if (Number(formData.additional_charges) < 0) {
      errs.additional_charges = 'Additional charges cannot be negative.';
    }
    if (Number(formData.advance_paid) < 0) {
      errs.advance_paid = 'Advance amount cannot be negative.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      onNotify('error', 'Please resolve form validation errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const finalAgreed = Number(formData.total_agreed_amount) || 0;
      const advancePaid = Number(formData.advance_paid) || 0;
      const balance = Math.max(0, finalAgreed - advancePaid);

      // Derive auto payment status if not manually set to refunded
      let finalPaymentStatus = formData.payment_status;
      if (finalPaymentStatus !== 'Refunded') {
        if (finalAgreed > 0 && advancePaid >= finalAgreed) {
          finalPaymentStatus = 'Paid';
        } else if (advancePaid > 0) {
          finalPaymentStatus = 'Partially Paid';
        } else {
          finalPaymentStatus = 'Pending';
        }
      }

      const updates: Partial<EnquiryRecord> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        company: formData.company.trim() || null,
        contact_person: formData.contact_person.trim() || null,
        source: formData.source,

        service: formData.service,
        package: formData.package.trim() || null,
        project_requirements: formData.project_requirements.trim() || null,
        requirements: formData.project_requirements.trim() || null,
        message: formData.project_requirements.trim() || null,
        additional_deliverables: formData.additional_deliverables.trim() || null,
        reference_url: formData.reference_url.trim() || null,

        // Pricing Updates
        package_price: Number(formData.package_price) || null,
        quotation_amount: Number(formData.quotation_amount) || null,
        discount_amount: Number(formData.discount_amount) || 0,
        discount_reason: formData.discount_reason.trim() || null,
        additional_charges: Number(formData.additional_charges) || 0,
        additional_charges_reason: formData.additional_charges_reason.trim() || null,
        tax_amount: Number(formData.tax_amount) || 0,
        pricing_notes: formData.pricing_notes.trim() || null,
        agreed_value: finalAgreed || null,
        total_agreed_amount: finalAgreed || null,
        advance_paid: advancePaid,
        advance_amount: advancePaid,
        amount_received: advancePaid,
        balance_amount: balance,
        outstanding_balance: balance,
        payment_status: finalPaymentStatus,
        quotation_number: formData.quotation_number.trim() || null,
        invoice_reference: formData.invoice_reference.trim() || null,

        // Workflow state
        status: formData.status,
        assigned_to: formData.assigned_to.trim() || null,
        next_followup_at: formData.next_followup_at ? new Date(formData.next_followup_at).toISOString() : null,
        internal_remarks: formData.internal_remarks.trim() || null,
        lost_reason: formData.lost_reason.trim() || null,
        project_status: formData.project_status,
        project_start_date: formData.project_start_date ? new Date(formData.project_start_date).toISOString() : null,
        project_deadline: formData.project_deadline ? new Date(formData.project_deadline).toISOString() : null,
        target_delivery_date: formData.target_delivery_date ? new Date(formData.target_delivery_date).toISOString() : null
      };

      // Execute update on Supabase and local cache
      const updatedRecord = await updateCrmEnquiry(enquiry.id, updates, adminName);

      onNotify('success', `Enquiry ${enquiry.reference_id} successfully updated and saved.`);
      onSaveSuccess(updatedRecord);
      onClose();
    } catch (err: any) {
      console.error('[QBENCH CRM Edit Error]', err);
      onNotify('error', err.message || 'Failed to update enquiry. Unsaved changes preserved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
          
          {/* 1. Modal Header */}
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#00685b] text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#88f8c5] uppercase tracking-wider">
                    RE-EDIT ENQUIRY
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-xs text-slate-300 font-bold">
                    {enquiry.reference_id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[formData.status]?.bg || 'bg-slate-100'} ${STATUS_CONFIG[formData.status]?.text || 'text-slate-800'}`}>
                    {formData.status}
                  </span>
                </div>
                <h3 className="font-display text-lg font-black text-white mt-0.5">
                  Edit Enquiry & Pricing Specification
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="hidden sm:inline-block font-tech text-[10px] text-amber-300 uppercase font-black bg-amber-400/15 border border-amber-400/30 px-2 py-1 rounded-md">
                  Unsaved Changes
                </span>
              )}
              <button
                type="button"
                onClick={handleRequestClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close editor"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 2. Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-3.5 px-4 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'details'
                  ? 'border-[#00685b] text-[#00685b] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="h-4 w-4" />
              <span>1. Customer Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scope')}
              className={`py-3.5 px-4 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'scope'
                  ? 'border-[#00685b] text-[#00685b] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>2. Service Scope & Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`py-3.5 px-4 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'pricing'
                  ? 'border-[#00685b] text-[#00685b] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>3. Pricing & Quotation</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('workflow')}
              className={`py-3.5 px-4 border-b-2 font-display uppercase tracking-wider cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'workflow'
                  ? 'border-[#00685b] text-[#00685b] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>4. Workflow & Assignment</span>
            </button>
          </div>

          {/* 3. Form Body */}
          <form id="enquiry-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB 1: Customer Details */}
            {activeTab === 'details' && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Original Submission: <strong>{new Date(enquiry.created_at).toLocaleString()}</strong></span>
                  </div>
                  {enquiry.updated_at && (
                    <div className="text-slate-500 font-mono text-[11px]">
                      Last Edited: {new Date(enquiry.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold flex items-center gap-1">
                      <span>Full Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00685b] ${
                        validationErrors.name ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    />
                    {validationErrors.name && (
                      <p className="text-[11px] text-rose-600">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold flex items-center gap-1">
                      <span>Phone Number *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#00685b] ${
                        validationErrors.phone ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    />
                    {validationErrors.phone && (
                      <p className="text-[11px] text-rose-600">{validationErrors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="client@company.com"
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00685b] ${
                        validationErrors.email ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="text-[11px] text-rose-600">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Company / Brand */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Apex Innovations Ltd"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00685b]"
                    />
                  </div>

                  {/* Contact Person */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Contact Person / Representative
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="e.g. Marketing Lead / Brand Head"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00685b]"
                    />
                  </div>

                  {/* Source / Channel */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Enquiry Source / Preferred Channel
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00685b] cursor-pointer"
                    >
                      <option value="Website Contact Form">Website Contact Form</option>
                      <option value="WhatsApp Business">WhatsApp Business</option>
                      <option value="Direct Phone Call">Direct Phone Call</option>
                      <option value="Direct Email">Direct Email</option>
                      <option value="Client Referral">Client Referral</option>
                      <option value="Exhibition / Event">Exhibition / Event</option>
                      <option value="Portfolio Blueprint Inquiry">Portfolio Blueprint Inquiry</option>
                      <option value="Free Consultation Request">Free Consultation Request</option>
                      <option value="Other">Other Channel</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Service Scope & Timeline */}
            {activeTab === 'scope' && (
              <div className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Service Category */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Service Category *
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-[#00685b] focus:outline-none focus:border-[#00685b] cursor-pointer"
                    >
                      {SERVICE_OPTIONS.map((srv) => (
                        <option key={srv} value={srv}>
                          {srv}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Package Bundle */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Selected Package Bundle
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={STANDARD_PACKAGES.includes(formData.package) ? formData.package : (formData.package ? 'custom' : '')}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') {
                            setFormData({ ...formData, package: e.target.value });
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#00685b] cursor-pointer"
                      >
                        <option value="">Standard Scope (Default)</option>
                        {STANDARD_PACKAGES.map((pkg) => (
                          <option key={pkg} value={pkg}>
                            {pkg}
                          </option>
                        ))}
                        <option value="custom">-- Custom Package Name --</option>
                      </select>
                    </div>
                    {(!STANDARD_PACKAGES.includes(formData.package) && formData.package) && (
                      <input
                        type="text"
                        value={formData.package}
                        onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                        placeholder="Custom Package Name"
                        className="w-full mt-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00685b]"
                      />
                    )}
                  </div>
                </div>

                {/* Project Requirements */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                    Project Requirements & Scope Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.project_requirements}
                    onChange={(e) => setFormData({ ...formData, project_requirements: e.target.value })}
                    placeholder="Enter detailed client requirements, brand background, deliverables expected, and specific instructions..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 focus:outline-none focus:border-[#00685b] leading-relaxed resize-y"
                  />
                </div>

                {/* Additional Deliverables */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                    Additional Deliverables / Add-ons
                  </label>
                  <input
                    type="text"
                    value={formData.additional_deliverables}
                    onChange={(e) => setFormData({ ...formData, additional_deliverables: e.target.value })}
                    placeholder="e.g. Print guidelines, Vector SVG pack, 4K export, 3 Reels"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00685b]"
                  />
                </div>

                {/* Reference Link */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                    Reference Design / Inspiration URL
                  </label>
                  <input
                    type="url"
                    value={formData.reference_url}
                    onChange={(e) => setFormData({ ...formData, reference_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#00685b]"
                  />
                </div>

                {/* Timeline dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Project Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.project_start_date}
                      onChange={(e) => setFormData({ ...formData, project_start_date: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#00685b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Target Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.target_delivery_date}
                      onChange={(e) => setFormData({ ...formData, target_delivery_date: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#00685b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Project Execution Phase
                    </label>
                    <select
                      value={formData.project_status}
                      onChange={(e) => setFormData({ ...formData, project_status: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00685b] cursor-pointer"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Discovery">Discovery & Briefing</option>
                      <option value="Design">Design Phase</option>
                      <option value="Revisions">Client Revisions</option>
                      <option value="Delivered">Delivered</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Pricing & Independent Updates */}
            {activeTab === 'pricing' && (
              <div className="space-y-6 animate-fade-in">
                {/* Zoho notice */}
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-900 text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Independent Enquiry Pricing:</span>{' '}
                    <span>
                      Modifying prices here updates the CRM enquiry quotation and client balance in Supabase. It does not overwrite finalized Zoho Books invoices (Org: 60072580070).
                    </span>
                  </div>
                </div>

                {/* Calculation Mode Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="font-tech text-[10px] font-black uppercase text-[#00685b] block">
                      PRICING CALCULATION ENGINE
                    </span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {autoCalculateTotal
                        ? 'Formula active: Total = Quoted Amount - Discount + Additional Charges + Taxes'
                        : 'Manual override active: Total amount is set manually.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoCalculateTotal}
                        onChange={(e) => setAutoCalculateTotal(e.target.checked)}
                        className="rounded border-slate-300 text-[#00685b] focus:ring-[#00685b] h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Auto-Calculate Total</span>
                    </label>
                  </div>
                </div>

                {/* Pricing Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Quoted Amount */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold flex items-center justify-between">
                      <span>Quoted Amount (₹) *</span>
                      <span className="text-slate-400 font-sans font-normal text-[10px]">Base quote</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.quotation_amount}
                        onChange={(e) => setFormData({ ...formData, quotation_amount: parseFloat(e.target.value) || 0 })}
                        className={`w-full rounded-xl border bg-white pl-7 pr-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#00685b] ${
                          validationErrors.quotation_amount ? 'border-rose-500' : 'border-slate-200'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Standard Package Reference Price */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold flex items-center justify-between">
                      <span>Standard Package Price (₹)</span>
                      <span className="text-slate-400 font-sans font-normal text-[10px]">Catalog ref</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.package_price}
                        onChange={(e) => setFormData({ ...formData, package_price: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#00685b]"
                      />
                    </div>
                  </div>

                  {/* Quotation Number */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Quotation Reference Number
                    </label>
                    <input
                      type="text"
                      value={formData.quotation_number}
                      onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
                      placeholder="QB-QT-2026-0001"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#00685b]"
                    />
                  </div>
                </div>

                {/* Adjustments: Discount & Additional Charges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Discount */}
                  <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-tech text-[10px] font-extrabold uppercase text-rose-700">
                        Discount / Concession
                      </span>
                      <span className="text-rose-600 font-mono text-xs font-bold">-₹{formData.discount_amount}</span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                        placeholder="Discount amount"
                        className="w-full rounded-xl border border-rose-200 bg-white pl-7 pr-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <input
                      type="text"
                      value={formData.discount_reason}
                      onChange={(e) => setFormData({ ...formData, discount_reason: e.target.value })}
                      placeholder="Reason for discount (e.g. Inaugural offer, volume referral)..."
                      className="w-full rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  {/* Additional Charges / Add-ons */}
                  <div className="bg-blue-50/40 border border-blue-200/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-tech text-[10px] font-extrabold uppercase text-blue-700">
                        Additional Charges / Add-ons
                      </span>
                      <span className="text-blue-600 font-mono text-xs font-bold">+₹{formData.additional_charges}</span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={formData.additional_charges}
                        onChange={(e) => setFormData({ ...formData, additional_charges: parseFloat(e.target.value) || 0 })}
                        placeholder="Additional charges"
                        className="w-full rounded-xl border border-blue-200 bg-white pl-7 pr-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    <input
                      type="text"
                      value={formData.additional_charges_reason}
                      onChange={(e) => setFormData({ ...formData, additional_charges_reason: e.target.value })}
                      placeholder="Reason (e.g. Rush 24h delivery, additional 2 revisions)..."
                      className="w-full rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* Final Total Amount & Payment Ledger */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <span className="font-tech text-[10px] font-bold text-[#88f8c5] uppercase tracking-wider block">
                        FINAL AGREED PROJECT AMOUNT
                      </span>
                      <p className="text-xs text-white/60">
                        This value determines the total project quotation and invoices.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#88f8c5]">₹</span>
                      <input
                        type="number"
                        disabled={autoCalculateTotal}
                        value={formData.total_agreed_amount}
                        onChange={(e) => setFormData({ ...formData, total_agreed_amount: parseFloat(e.target.value) || 0 })}
                        className={`font-mono text-2xl font-black rounded-xl px-3 py-1.5 w-48 text-right ${
                          autoCalculateTotal
                            ? 'bg-white/10 text-white cursor-not-allowed border border-white/10'
                            : 'bg-white text-slate-900 border-2 border-[#88f8c5]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Advance and Balance summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div>
                      <span className="text-white/60 font-tech uppercase text-[10px] block">Advance Paid / Received</span>
                      <div className="relative mt-1">
                        <span className="absolute left-2.5 top-2 text-white/50 text-xs font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={formData.advance_paid}
                          onChange={(e) => setFormData({ ...formData, advance_paid: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white/10 border border-white/20 rounded-xl pl-6 pr-3 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#88f8c5]"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-white/60 font-tech uppercase text-[10px] block">Outstanding Balance</span>
                      <div className="mt-1 font-mono text-xl font-black text-[#88f8c5] py-1.5">
                        ₹{outstandingBalance.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div>
                      <span className="text-white/60 font-tech uppercase text-[10px] block">Payment Status</span>
                      <select
                        value={formData.payment_status}
                        onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as any })}
                        className="mt-1 w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#88f8c5] cursor-pointer"
                      >
                        <option value="Pending" className="text-slate-900">Pending</option>
                        <option value="Advance Paid" className="text-slate-900">Advance Paid</option>
                        <option value="Partially Paid" className="text-slate-900">Partially Paid</option>
                        <option value="Paid" className="text-slate-900">Fully Paid</option>
                        <option value="Overdue" className="text-slate-900">Overdue</option>
                        <option value="Refunded" className="text-slate-900">Refunded</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pricing notes */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                    Pricing & Payment Terms / Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.pricing_notes}
                    onChange={(e) => setFormData({ ...formData, pricing_notes: e.target.value })}
                    placeholder="e.g. 50% advance before kickoff, 50% on final vector file delivery. GST included..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:border-[#00685b]"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: Workflow, Assignment & Follow-ups */}
            {activeTab === 'workflow' && (
              <div className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Pipeline Stage (14-Stage Workflow) *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as EnquiryStatus })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#00685b] cursor-pointer"
                    >
                      {Object.keys(STATUS_CONFIG).map((st) => (
                        <option key={st} value={st}>
                          {st} — {STATUS_CONFIG[st as EnquiryStatus]?.purpose}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned To */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Assigned Team Member
                    </label>
                    <select
                      value={STAFF_MEMBERS.includes(formData.assigned_to) ? formData.assigned_to : (formData.assigned_to ? 'custom' : '')}
                      onChange={(e) => {
                        if (e.target.value !== 'custom') {
                          setFormData({ ...formData, assigned_to: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00685b] cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {STAFF_MEMBERS.map((staff) => (
                        <option key={staff} value={staff}>
                          {staff}
                        </option>
                      ))}
                      <option value="custom">-- Custom Name --</option>
                    </select>
                    {(!STAFF_MEMBERS.includes(formData.assigned_to) && formData.assigned_to) && (
                      <input
                        type="text"
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                        placeholder="Assignee Name"
                        className="w-full mt-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00685b]"
                      />
                    )}
                  </div>

                  {/* Next Follow-up Date */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                      Next Follow-up Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.next_followup_at}
                      onChange={(e) => setFormData({ ...formData, next_followup_at: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#00685b]"
                    />
                  </div>

                  {/* Lost / Cancellation Reason */}
                  {(formData.status === 'Lost' || formData.status === 'Rejected' || formData.status === 'Cancelled') && (
                    <div className="space-y-1.5">
                      <label className="text-rose-700 font-tech uppercase text-[10px] font-extrabold">
                        Reason for Loss / Cancellation
                      </label>
                      <input
                        type="text"
                        value={formData.lost_reason}
                        onChange={(e) => setFormData({ ...formData, lost_reason: e.target.value })}
                        placeholder="e.g. Budget mismatch, client chose in-house team"
                        className="w-full rounded-xl border border-rose-200 bg-rose-50/30 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  )}
                </div>

                {/* Internal Remarks */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-tech uppercase text-[10px] font-extrabold">
                    Internal Admin Remarks & Collaboration Notes
                  </label>
                  <textarea
                    rows={4}
                    value={formData.internal_remarks}
                    onChange={(e) => setFormData({ ...formData, internal_remarks: e.target.value })}
                    placeholder="Confidential team notes, meeting outcomes, negotiation notes..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 focus:outline-none focus:border-[#00685b] leading-relaxed resize-y"
                  />
                </div>
              </div>
            )}

          </form>

          {/* 4. Modal Footer Actions */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-500">
                Editing Record ID: <strong>{enquiry.id}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRequestClose}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-sans text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="enquiry-edit-form"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#00685b] hover:bg-[#00544a] text-white px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Enquiry</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-60 overflow-hidden bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h4 className="font-display text-base font-bold text-slate-900">
                Discard Unsaved Changes?
              </h4>
            </div>
            <p className="font-sans text-xs text-slate-600 leading-relaxed">
              You have modified this enquiry's details or pricing. If you close without saving, these edits will be discarded.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
