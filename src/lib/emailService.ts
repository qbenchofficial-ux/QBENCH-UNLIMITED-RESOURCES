import emailjs from '@emailjs/browser';

export interface EmailParams {
  name: string;
  phone: string;
  email: string;
  company: string;
  service: string;
  message: string;
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
  const procEnv = (typeof process !== 'undefined' && process.env ? process.env : {}) as Record<
    string,
    string | undefined
  >;

  let EMAILJS_PUBLIC_KEY = cleanEnvValue(
    procEnv.EMAILJS_PUBLIC_KEY || metaEnv.VITE_EMAILJS_PUBLIC_KEY || metaEnv.EMAILJS_PUBLIC_KEY
  );
  let EMAILJS_SERVICE_ID = cleanEnvValue(
    procEnv.EMAILJS_SERVICE_ID || metaEnv.VITE_EMAILJS_SERVICE_ID || metaEnv.EMAILJS_SERVICE_ID
  );
  let EMAILJS_ADMIN_TEMPLATE_ID = cleanEnvValue(
    procEnv.EMAILJS_ADMIN_TEMPLATE_ID ||
      metaEnv.VITE_EMAILJS_ADMIN_TEMPLATE_ID ||
      metaEnv.EMAILJS_ADMIN_TEMPLATE_ID ||
      metaEnv.VITE_EMAILJS_TEMPLATE_ID
  );
  let EMAILJS_AUTO_REPLY_TEMPLATE_ID = cleanEnvValue(
    procEnv.EMAILJS_AUTO_REPLY_TEMPLATE_ID ||
      metaEnv.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID ||
      metaEnv.EMAILJS_AUTO_REPLY_TEMPLATE_ID
  );
  let GOOGLE_SHEETS_WEBHOOK_URL = cleanWebhookUrl(
    procEnv.GOOGLE_SHEETS_WEBHOOK_URL ||
      metaEnv.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
      metaEnv.GOOGLE_SHEETS_WEBHOOK_URL
  );

  // Always check runtime /api/integration-config if any secret is missing
  if (
    !EMAILJS_PUBLIC_KEY ||
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_ADMIN_TEMPLATE_ID ||
    !EMAILJS_AUTO_REPLY_TEMPLATE_ID ||
    !GOOGLE_SHEETS_WEBHOOK_URL
  ) {
    try {
      const resp = await fetch('/api/integration-config');
      if (resp.ok) {
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
    } catch (err) {
      console.error('[QBENCH Integration Config Fetch Error]:', err);
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

/**
 * Extracts normalized package data dynamically from the existing selectedPackage object
 * (e.g. "Branding — Standard Package" -> package: "Standard Package", service/category: "Branding").
 */
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

/**
 * Submits the lead to Google Apps Script Web App with proper CORS / no-cors handling.
 */
async function postToGoogleSheetsWebhook(webhookUrl: string, payload: Record<string, any>): Promise<void> {
  const bodyStr = JSON.stringify(payload);

  // Try standard CORS POST first so we can inspect the response when CORS headers are present
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
      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          if (parsed && (parsed.success === false || parsed.result === 'error')) {
            throw new Error(parsed.error || 'Apps Script returned an error response.');
          }
        } catch (err: any) {
          if (err?.message === 'Apps Script returned an error response.') {
            throw err;
          }
        }
      }
      return;
    }
  } catch {
    // Fall through to no-cors compatible Google Apps Script request
  }

  // Google Apps Script Web Apps (especially /dev or 302 redirects to script.googleusercontent.com)
  // require mode: 'no-cors' with text/plain from browsers when CORS headers are omitted on redirect.
  const execUrl = webhookUrl.replace(/\/dev(\?.*)?$/, '/exec$1');
  await fetch(execUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: bodyStr
  });

  if (execUrl !== webhookUrl) {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: bodyStr
    });
  }
}

export const sendEmailJS = async (params: EmailParams): Promise<ContactSubmissionResult> => {
  // STEP 1: Form validation
  console.log('QBENCH: Form validation started');

  const name = (params.name || '').trim();
  const company = (params.company || '').trim();
  const email = (params.email || '').trim();
  const phone = (params.phone || '').trim();
  const message = (params.message || '').trim();

  const pkgFields = resolveDynamicPackageFields(params);

  if (!name || !phone || !email || !pkgFields.service) {
    const validationErr = new Error('Required fields (name, phone, email, service) are missing.');
    console.error('QBENCH: Form validation FAILED', validationErr);
    throw validationErr;
  }

  const secrets = await resolveIntegrationSecrets();
  const {
    EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID,
    EMAILJS_ADMIN_TEMPLATE_ID,
    EMAILJS_AUTO_REPLY_TEMPLATE_ID,
    GOOGLE_SHEETS_WEBHOOK_URL
  } = secrets;

  const missingSecrets: string[] = [];
  if (!EMAILJS_PUBLIC_KEY) missingSecrets.push('EMAILJS_PUBLIC_KEY');
  if (!EMAILJS_SERVICE_ID) missingSecrets.push('EMAILJS_SERVICE_ID');
  if (!EMAILJS_ADMIN_TEMPLATE_ID) missingSecrets.push('EMAILJS_ADMIN_TEMPLATE_ID');
  if (!EMAILJS_AUTO_REPLY_TEMPLATE_ID) missingSecrets.push('EMAILJS_AUTO_REPLY_TEMPLATE_ID');
  if (!GOOGLE_SHEETS_WEBHOOK_URL) missingSecrets.push('GOOGLE_SHEETS_WEBHOOK_URL');

  if (missingSecrets.length > 0) {
    const configErr = new Error(`Missing required secrets: ${missingSecrets.join(', ')}`);
    console.error('QBENCH: Form validation FAILED', configErr);
    throw configErr;
  }

  // Initialize EmailJS once per public key
  if (emailJsInitializedKey !== EMAILJS_PUBLIC_KEY) {
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY
    });
    emailJsInitializedKey = EMAILJS_PUBLIC_KEY;
  }

  // STEP 2: EmailJS Admin
  console.log('QBENCH: Admin email started');

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
    to_email: 'qbench.official@gmail.com'
  };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_ADMIN_TEMPLATE_ID,
      adminTemplateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log('QBENCH: Admin email successful');
  } catch (adminErr) {
    console.error('QBENCH: EmailJS Admin FAILED', adminErr);
    throw adminErr;
  }

  // STEP 3: EmailJS Auto-Reply
  console.log('QBENCH: Auto-reply started');

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
    reply_to: 'qbench.official@gmail.com'
  };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_AUTO_REPLY_TEMPLATE_ID,
      autoReplyTemplateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log('QBENCH: Auto-reply successful');
  } catch (autoReplyErr) {
    console.error('QBENCH: EmailJS Auto-Reply FAILED', autoReplyErr);
    throw autoReplyErr;
  }

  // STEP 4: Google Sheets
  console.log('QBENCH: Google Sheets submission started');

  const sheetPayload = {
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
  };

  try {
    await postToGoogleSheetsWebhook(GOOGLE_SHEETS_WEBHOOK_URL, sheetPayload);
    console.log('QBENCH: Google Sheets submission successful');
  } catch (sheetsErr) {
    console.error('QBENCH: Google Sheets FAILED', sheetsErr);
    throw sheetsErr;
  }

  // STEP 5: WhatsApp Business Cloud API Notification (Server-Side)
  console.log('QBENCH: WhatsApp notification started');

  const whatsappPayload = {
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
  };

  let whatsappDelivered = false;
  try {
    const waResp = await fetch('/api/whatsapp-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(whatsappPayload)
    });

    const waData = await waResp.json().catch(() => ({}));
    if (!waResp.ok || !waData?.success) {
      throw new Error(waData?.error || `WhatsApp notification failed with HTTP ${waResp.status}`);
    }

    whatsappDelivered = true;
    console.log('QBENCH: WhatsApp notification successful');
  } catch (whatsappErr) {
    // Log clear diagnostic without breaking completed EmailJS + Google Sheets submission if WhatsApp is not yet configured
    console.error('QBENCH: WhatsApp FAILED', whatsappErr);
  }

  // Save a local CRM backup copy after all steps succeed
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
    timeline: pkgFields.timeline,
    category: pkgFields.category,
    budget: pkgFields.budget,
    start_date: pkgFields.start_date,
    message,
    lead_source: 'QBENCH Website',
    lead_status: 'New',
    emailStatus: 'Sent',
    whatsappStatus: whatsappDelivered ? 'Sent' : 'Pending',
    emailSentAt: submissionDateTime,
    selectedPackage: params.selectedPackage || null,
    selectedBlueprint: params.selectedBlueprint || null
  });

  return {
    success: true,
    message: 'Thank you! Your enquiry has been submitted successfully. We’ll get back to you shortly.',
    smtpConfigured: true,
    smtpSuccess: true,
    authentication: 'SUCCESS',
    emailDelivery: 'SUCCESS',
    deliveryChannel: whatsappDelivered
      ? 'EmailJS + Google Sheets CRM + WhatsApp Cloud API'
      : 'EmailJS + Google Sheets CRM'
  };
};
