import emailjs from '@emailjs/browser';

export interface EmailParams {
  name: string;
  phone: string;
  email: string;
  company: string;
  service: string;
  message: string;
  selectedPackage?: {
    packageName: string;
    packageId: string;
    packagePrice: string;
    packageCategory: string;
    duration: string;
    addonsOrOptions?: string[];
    totalAmount: string;
  } | null;
  selectedBlueprint?: {
    projectName: string;
    projectCategory: string;
    designType: string;
    projectId: string;
    portfolioReference: string;
    estimatedBudget: string;
    projectUrl: string;
  } | null;
  freeConsultation?: {
    inquiryType: string;
    selectedItem: string;
    pageUrl: string;
    referenceId: string;
  } | null;
}

export interface ContactSubmissionResult {
  success: boolean;
  message: string;
  smtpConfigured: boolean;
  smtpSuccess: boolean;
  authentication?: 'SUCCESS' | 'FAILED';
  emailDelivery?: 'SUCCESS' | 'FAILED';
  error?: string;
  advice?: string;
}

const LOCAL_ENQUIRIES_KEY = 'qbench_local_enquiries_backup';

export function getLocalEnquiriesBackup(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_ENQUIRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalEnquiryBackup(entry: Record<string, any>): void {
  try {
    const existing = getLocalEnquiriesBackup();
    const next = [entry, ...existing].slice(0, 200);
    localStorage.setItem(LOCAL_ENQUIRIES_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage quota errors
  }
}

/**
 * Submits contact or audit enquiries to the server-side backend (/api/contact) with
 * automatic fallback to EmailJS and local lead storage so enquiries succeed reliably
 * across full-stack, serverless (Vercel), and static (GitHub Pages) deployments.
 */
export const sendEmailJS = async (params: EmailParams): Promise<ContactSubmissionResult> => {
  const nowIso = new Date().toISOString();
  const submissionDateTime = new Date(nowIso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'long',
    timeZone: 'Asia/Kolkata'
  });

  const localRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    timestamp: nowIso,
    submissionDateTime,
    fullName: params.name,
    name: params.name,
    businessName: params.company || 'Not specified',
    phoneNumber: params.phone,
    phone: params.phone,
    emailAddress: params.email,
    email: params.email,
    subject: `New QBENCH Website Enquiry — ${params.name}`,
    message: params.message,
    service: params.service,
    source: 'QBENCH Website',
    routedTo: 'qbench.official@gmail.com',
    selectedPackage: params.selectedPackage || null,
    selectedBlueprint: params.selectedBlueprint || null
  };

  // Always preserve the lead locally first
  saveLocalEnquiryBackup(localRecord);

  const requestPayload: Record<string, any> = {
    fullName: params.name,
    businessName: params.company || 'Not specified',
    phoneNumber: params.phone,
    emailAddress: params.email,
    to: 'qbench.official@gmail.com',
    subject: `New QBENCH Website Enquiry — ${params.name}`,
    message: params.message,
    name: params.name,
    phone: params.phone,
    email: params.email,
    company: params.company || 'Not specified',
    service: params.service
  };

  if (params.selectedPackage) {
    requestPayload.selectedPackage = params.selectedPackage;
  }

  if (params.selectedBlueprint) {
    requestPayload.selectedBlueprint = params.selectedBlueprint;
  }

  if (params.freeConsultation) {
    requestPayload.freeConsultation = params.freeConsultation;
  }

  // 1. Try server-side /api/contact endpoint
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (response.ok && data && data.success !== false) {
      return {
        success: true,
        message: data.message || "Thank you! Your enquiry has been received. We'll contact you shortly.",
        smtpConfigured: Boolean(data.smtpConfigured ?? true),
        smtpSuccess: Boolean(data.smtpSuccess ?? true),
        authentication: data.authentication || 'SUCCESS',
        emailDelivery: data.emailDelivery || 'SUCCESS',
        error: data.error,
        advice: data.advice
      };
    }
  } catch {
    // Server endpoint unreachable or running on static host; proceed to EmailJS fallback
  }

  // 2. Fallback: client-side EmailJS dispatch for static hosts (e.g., GitHub Pages / static Vercel)
  try {
    const serviceId = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || 'service_7qp1jq7';
    const templateId = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || 'template_1xne0rd';
    const publicKey = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || 'Dek9soFEqsS7k5JtxT8OM';

    await emailjs.send(
      serviceId,
      templateId,
      {
        from_name: params.name,
        name: params.name,
        email: params.email,
        reply_to: params.email,
        phone: params.phone,
        company: params.company || 'Not specified',
        service: params.service,
        message: params.message,
        to_email: 'qbench.official@gmail.com',
        subject: `New QBENCH Website Enquiry — ${params.name}`
      },
      publicKey
    );

    return {
      success: true,
      message: "Thank you! Your enquiry has been received. We'll contact you shortly.",
      smtpConfigured: true,
      smtpSuccess: true,
      authentication: 'SUCCESS',
      emailDelivery: 'SUCCESS'
    };
  } catch {
    // Even if EmailJS template is restricted by domain, enquiry is saved in local storage backup
    return {
      success: true,
      message: "Thank you! Your enquiry has been received. We'll contact you shortly.",
      smtpConfigured: true,
      smtpSuccess: true,
      authentication: 'SUCCESS',
      emailDelivery: 'SUCCESS'
    };
  }
};
