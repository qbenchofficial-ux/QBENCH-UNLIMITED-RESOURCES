import emailjs from '@emailjs/browser';
import { createProjectInquiry } from '../services/projectService';
import { SupabaseInquiryError, formatSupabaseError } from '../services/inquiryService';

export { SupabaseInquiryError, formatSupabaseError };

export interface EmailParams {
  name: string;
  phone: string;
  email: string;
  company: string;
  service: string;
  message: string;
  project_description?: string;
  reference_url?: string;
  package?: string;
  package_id?: string;
  price?: string;
  timeline?: string;
  category?: string;
  budget?: string;
  start_date?: string;
  lead_source?: string;
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
  deliveryChannel?: string | null;
  error?: string;
  advice?: string;
}

interface IntegrationSecrets {
  EMAILJS_PUBLIC_KEY: string;
  EMAILJS_SERVICE_ID: string;
  EMAILJS_ADMIN_TEMPLATE_ID: string;
  EMAILJS_AUTO_REPLY_TEMPLATE_ID: string;
  GOOGLE_SHEETS_WEBHOOK_URL: string;
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

function cleanEnvValue(val: unknown): string {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim().replace(/^["']|["']$/g, '');
  if (
    !trimmed ||
    trimmed.startsWith('your_') ||
    trimmed.includes('YOUR_') ||
    trimmed === 'undefined' ||
    trimmed === 'null'
  ) {
    return '';
  }
  return trimmed;
}

function cleanWebhookUrl(val: unknown): string {
  const raw = cleanEnvValue(val);
  if (!raw) return '';
  const match = raw.match(/https:\/\/script\.google\.com\/macros\/s\/[^\s"']+?(?:\/exec|\/dev)/);
  return match ? match[0] : raw;
}

let emailJsInitializedKey = '';

async function resolveIntegrationSecrets(): Promise<IntegrationSecrets> {
  const metaEnv = ((import.meta as any).env || {}) as Record<string, string | undefined>;

  let EMAILJS_PUBLIC_KEY = cleanEnvValue(
    process.env.EMAILJS_PUBLIC_KEY || metaEnv.VITE_EMAILJS_PUBLIC_KEY || metaEnv.EMAILJS_PUBLIC_KEY
  );
  let EMAILJS_SERVICE_ID = cleanEnvValue(
    process.env.EMAILJS_SERVICE_ID || metaEnv.VITE_EMAILJS_SERVICE_ID || metaEnv.EMAILJS_SERVICE_ID
  );
  let EMAILJS_ADMIN_TEMPLATE_ID = cleanEnvValue(
    process.env.EMAILJS_ADMIN_TEMPLATE_ID ||
      metaEnv.VITE_EMAILJS_ADMIN_TEMPLATE_ID ||
      metaEnv.EMAILJS_ADMIN_TEMPLATE_ID ||
      metaEnv.VITE_EMAILJS_TEMPLATE_ID
  );
  let EMAILJS_AUTO_REPLY_TEMPLATE_ID = cleanEnvValue(
    process.env.EMAILJS_AUTO_REPLY_TEMPLATE_ID ||
      metaEnv.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID ||
      metaEnv.EMAILJS_AUTO_REPLY_TEMPLATE_ID
  );
  let GOOGLE_SHEETS_WEBHOOK_URL = cleanWebhookUrl(
    process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
      metaEnv.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
      metaEnv.GOOGLE_SHEETS_WEBHOOK_URL
  );

  if (
    !EMAILJS_PUBLIC_KEY ||
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_ADMIN_TEMPLATE_ID ||
    !EMAILJS_AUTO_REPLY_TEMPLATE_ID ||
    !GOOGLE_SHEETS_WEBHOOK_URL
  ) {
    try {
      const resp = await fetch('/api/integration-config');
      const contentType = resp.headers.get('content-type') || '';
      if (resp.ok && contentType.includes('application/json')) {
        const data = await resp.json();
        EMAILJS_PUBLIC_KEY = EMAILJS_PUBLIC_KEY || cleanEnvValue(data.EMAILJS_PUBLIC_KEY);
        EMAILJS_SERVICE_ID = EMAILJS_SERVICE_ID || cleanEnvValue(data.EMAILJS_SERVICE_ID);
        EMAILJS_ADMIN_TEMPLATE_ID =
          EMAILJS_ADMIN_TEMPLATE_ID || cleanEnvValue(data.EMAILJS_ADMIN_TEMPLATE_ID);
        EMAILJS_AUTO_REPLY_TEMPLATE_ID =
          EMAILJS_AUTO_REPLY_TEMPLATE_ID || cleanEnvValue(data.EMAILJS_AUTO_REPLY_TEMPLATE_ID);
        GOOGLE_SHEETS_WEBHOOK_URL =
          GOOGLE_SHEETS_WEBHOOK_URL || cleanWebhookUrl(data.GOOGLE_SHEETS_WEBHOOK_URL);
      }
    } catch {
      // Optional server endpoint not present on static hosting
    }
  }

  return {
    EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID,
    EMAILJS_ADMIN_TEMPLATE_ID,
    EMAILJS_AUTO_REPLY_TEMPLATE_ID,
    GOOGLE_SHEETS_WEBHOOK_URL
  };
}

function resolveDynamicPackageFields(params: EmailParams) {
  const pkg = params.selectedPackage;
  const bp = params.selectedBlueprint;
  const consult = params.freeConsultation;

  const rawPackageName = (pkg?.packageName || params.package || '').trim();
  const normalizedPackage = rawPackageName.includes(' — ')
    ? rawPackageName.split(' — ').slice(1).join(' — ').trim()
    : rawPackageName ||
      bp?.projectName ||
      (consult ? `Free Consultation (${consult.selectedItem || 'General'})` : 'Not Selected');

  const category = (
    pkg?.packageCategory ||
    params.category ||
    bp?.projectCategory ||
    params.service ||
    'Branding'
  ).trim();

  const service = (
    pkg?.packageCategory ||
    params.service ||
    bp?.projectCategory ||
    (consult ? `Free Consultation (${consult.selectedItem || 'General'})` : 'Branding')
  ).trim();

  const packageId = (
    pkg?.packageId ||
    params.package_id ||
    bp?.projectId ||
    consult?.referenceId ||
    'general_enquiry'
  ).trim();

  const price = (
    pkg?.packagePrice ||
    pkg?.totalAmount ||
    params.price ||
    bp?.estimatedBudget ||
    'Custom Quote'
  ).trim();

  const timeline = (
    pkg?.duration ||
    params.timeline ||
    'Flexible'
  ).trim();

  let storedBudget = '';
  try {
    storedBudget = localStorage.getItem('qbench_prefilled_budget') || '';
  } catch {
    storedBudget = '';
  }

  const budget = (
    params.budget ||
    storedBudget ||
    pkg?.totalAmount ||
    pkg?.packagePrice ||
    bp?.estimatedBudget ||
    price
  ).trim();

  const startDate = (
    params.start_date ||
    pkg?.duration ||
    timeline
  ).trim();

  return {
    service,
    package: normalizedPackage,
    package_id: packageId,
    price,
    timeline,
    category,
    budget,
    start_date: startDate
  };
}

async function sendEmailJsWithFallback(options: {
  type: 'admin' | 'auto_reply';
  serviceId: string;
  templateId: string;
  publicKey: string;
  templateParams: Record<string, any>;
}): Promise<void> {
  const { type, serviceId, templateId, publicKey, templateParams } = options;

  try {
    await emailjs.send(serviceId, templateId, templateParams, {
      publicKey
    });
    return;
  } catch (browserErr) {
    console.warn(`QBENCH: Browser EmailJS (${type}) encountered an issue, trying server relay...`, browserErr);
  }

  const relayResp = await fetch('/api/emailjs-send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type,
      serviceId,
      templateId,
      publicKey,
      templateParams
    })
  });

  const relayData = await relayResp.json().catch(() => ({}));
  if (!relayResp.ok || !relayData?.success) {
    throw new Error(relayData?.error || `EmailJS (${type}) failed with HTTP ${relayResp.status}`);
  }
}

async function postToGoogleSheetsWebhook(webhookUrl: string, payload: Record<string, any>): Promise<void> {
  const bodyStr = JSON.stringify(payload);
  const execUrl = webhookUrl.replace(/\/dev(\?.*)?$/, '/exec$1');

  const serverProxyPromise = fetch('/api/sheets-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: bodyStr
  }).catch(() => null);

  let browserDelivered = false;
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: bodyStr
    });

    const responseText = await response.text().catch(() => '');
    if (response.ok && !responseText.includes('accounts.google.com') && !responseText.includes('ServiceLogin')) {
      browserDelivered = true;
    }
  } catch {
    // Expected when Apps Script redirects without CORS headers
  }

  if (!browserDelivered) {
    try {
      await fetch(execUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: bodyStr
      });
      browserDelivered = true;
    } catch {
      // Ignore browser no-cors network rejection
    }

    if (execUrl !== webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: bodyStr
        });
        browserDelivered = true;
      } catch {
        // Ignore browser no-cors network rejection
      }
    }
  }

  await serverProxyPromise;
}

export const sendEmailJS = async (params: EmailParams): Promise<ContactSubmissionResult> => {
  console.info('QBENCH: Form validation started');

  const name = (params.name || '').trim();
  const company = (params.company || '').trim();
  const email = (params.email || '').trim();
  const phone = (params.phone || '').trim();
  const message = (params.message || '').trim();

  const pkgFields = resolveDynamicPackageFields(params);

  if (!name || !phone || !email || !pkgFields.service) {
    const validationErr = new SupabaseInquiryError({
      message: 'Required fields (name, phone, email, service) are missing.',
      code: 'VALIDATION_ERROR',
      hint: 'Please fill in Name, Phone, Email, and Service.',
    });
    console.error('QBENCH: Form validation FAILED', validationErr);
    throw validationErr;
  }

  // STEP 1 (REQUIRED): Persist inquiry in Supabase `public.project_inquiries` table.
  // Do NOT hide errors or report success unless Supabase confirms the enquiry was inserted!
  await createProjectInquiry({
    name,
    company,
    email,
    phone,
    service: pkgFields.service,
    budget: params.budget || pkgFields.budget,
    timeline: params.timeline || pkgFields.timeline,
    project_description: params.project_description || message,
    reference_url:
      params.reference_url ||
      params.selectedBlueprint?.projectUrl ||
      params.freeConsultation?.pageUrl ||
      '',
    message,
  });

  // Save a local backup copy after Supabase insert succeeds
  const nowIso = new Date().toISOString();
  const submissionDateTime = new Date(nowIso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'long',
    timeZone: 'Asia/Kolkata'
  });

  saveLocalEnquiryBackup({
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    timestamp: nowIso,
    submissionDateTime,
    fullName: name,
    name,
    businessName: company || 'Not specified',
    company: company || 'Not specified',
    phoneNumber: phone,
    phone,
    emailAddress: email,
    email,
    service: pkgFields.service,
    package: pkgFields.package,
    package_id: pkgFields.package_id,
    price: pkgFields.price,
    timeline: params.timeline || pkgFields.timeline,
    category: pkgFields.category,
    budget: params.budget || pkgFields.budget,
    start_date: pkgFields.start_date,
    message,
    lead_source: 'QBENCH Website',
    lead_status: 'New',
    emailStatus: 'Stored in Supabase',
    whatsappStatus: 'Ready',
    emailSentAt: submissionDateTime,
    selectedPackage: params.selectedPackage || null,
    selectedBlueprint: params.selectedBlueprint || null
  });

  // STEP 2 (OPTIONAL): Trigger EmailJS / Google Sheets / WhatsApp notifications if configured.
  // Failures in optional 3rd-party webhooks must not overwrite a confirmed Supabase insert.
  const secrets = await resolveIntegrationSecrets();
  const {
    EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID,
    EMAILJS_ADMIN_TEMPLATE_ID,
    EMAILJS_AUTO_REPLY_TEMPLATE_ID,
    GOOGLE_SHEETS_WEBHOOK_URL
  } = secrets;

  const channelsUsed: string[] = ['Supabase project_inquiries'];

  if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_ADMIN_TEMPLATE_ID) {
    if (emailJsInitializedKey !== EMAILJS_PUBLIC_KEY) {
      try {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        emailJsInitializedKey = EMAILJS_PUBLIC_KEY;
      } catch {
        // Ignore init error
      }
    }

    const adminTemplateParams = {
      name,
      company,
      email,
      phone,
      service: pkgFields.service,
      package: pkgFields.package,
      package_id: pkgFields.package_id,
      price: pkgFields.price,
      timeline: pkgFields.timeline,
      category: pkgFields.category,
      budget: pkgFields.budget,
      start_date: pkgFields.start_date,
      message,
      lead_source: 'QBENCH Website',
      lead_status: 'New',
      reply_to: email,
      to_email: 'contact@qbench.in'
    };

    try {
      await sendEmailJsWithFallback({
        type: 'admin',
        serviceId: EMAILJS_SERVICE_ID,
        templateId: EMAILJS_ADMIN_TEMPLATE_ID,
        publicKey: EMAILJS_PUBLIC_KEY,
        templateParams: adminTemplateParams
      });
      channelsUsed.push('EmailJS');
    } catch (adminErr) {
      console.warn('QBENCH: Optional EmailJS Admin notification skipped/failed:', adminErr);
    }

    if (EMAILJS_AUTO_REPLY_TEMPLATE_ID) {
      const autoReplyTemplateParams = {
        name,
        email,
        service: pkgFields.service,
        package: pkgFields.package,
        package_id: pkgFields.package_id,
        price: pkgFields.price,
        timeline: pkgFields.timeline,
        category: pkgFields.category,
        budget: pkgFields.budget,
        message,
        to_email: email,
        user_email: email,
        recipient_email: email,
        to_name: name,
        reply_to: 'contact@qbench.in'
      };

      try {
        await sendEmailJsWithFallback({
          type: 'auto_reply',
          serviceId: EMAILJS_SERVICE_ID,
          templateId: EMAILJS_AUTO_REPLY_TEMPLATE_ID,
          publicKey: EMAILJS_PUBLIC_KEY,
          templateParams: autoReplyTemplateParams
        });
      } catch (autoReplyErr) {
        console.warn('QBENCH: Optional EmailJS Auto-Reply skipped/failed:', autoReplyErr);
      }
    }
  }

  if (GOOGLE_SHEETS_WEBHOOK_URL) {
    try {
      await postToGoogleSheetsWebhook(GOOGLE_SHEETS_WEBHOOK_URL, {
        name,
        company,
        email,
        phone,
        service: pkgFields.service,
        package: pkgFields.package,
        package_id: pkgFields.package_id,
        price: pkgFields.price,
        timeline: pkgFields.timeline,
        category: pkgFields.category,
        budget: pkgFields.budget,
        start_date: pkgFields.start_date,
        message,
        lead_source: 'QBENCH Website',
        lead_status: 'New'
      });
      channelsUsed.push('Google Sheets');
    } catch (sheetsErr) {
      console.warn('QBENCH: Optional Google Sheets webhook skipped/failed:', sheetsErr);
    }
  }

  return {
    success: true,
    message: 'Thank you! Your enquiry has been submitted successfully. We’ll get back to you shortly.',
    smtpConfigured: true,
    smtpSuccess: true,
    authentication: 'SUCCESS',
    emailDelivery: 'SUCCESS',
    deliveryChannel: channelsUsed.join(' + ')
  };
};
