import emailjs from '@emailjs/browser';

export interface EmailParams {
  name: string;
  phone: string;
  email: string;
  company: string;
  service: string;
  message: string;
  package?: string;
  price?: string;
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

/**
 * Resolves Google AI Studio Secrets from environment variables and runtime server config
 * without hardcoding credentials in the frontend.
 */
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
  let GOOGLE_SHEETS_WEBHOOK_URL = cleanEnvValue(
    procEnv.GOOGLE_SHEETS_WEBHOOK_URL ||
      metaEnv.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
      metaEnv.GOOGLE_SHEETS_WEBHOOK_URL
  );

  // Fetch runtime secrets from the backend if any value is not baked into the static bundle
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
          GOOGLE_SHEETS_WEBHOOK_URL || cleanEnvValue(data.GOOGLE_SHEETS_WEBHOOK_URL);
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
 * Executes the QBENCH enquiry submission in the exact required order:
 * 1. Prepare form data (including selectedPackage, packagePrice, budget, start_date, lead_source, lead_status).
 * 2. Initialize EmailJS with EMAILJS_PUBLIC_KEY and send Admin notification (EMAILJS_SERVICE_ID + EMAILJS_ADMIN_TEMPLATE_ID).
 * 3. Send Client Auto-Reply notification (EMAILJS_SERVICE_ID + EMAILJS_AUTO_REPLY_TEMPLATE_ID) to the client's submitted email.
 * 4. Send the same lead data as JSON via POST to GOOGLE_SHEETS_WEBHOOK_URL.
 * 5. Return success only after all steps succeed; otherwise log the technical error and throw so the UI displays the error message.
 */
export const sendEmailJS = async (params: EmailParams): Promise<ContactSubmissionResult> => {
  // 1. Prepare form data
  const name = (params.name || '').trim();
  const company = (params.company || 'Not specified').trim() || 'Not specified';
  const email = (params.email || '').trim();
  const phone = (params.phone || '').trim();
  const service = (params.service || 'Branding').trim();
  const message = (params.message || '').trim();

  const packageName = (
    params.package ||
    params.selectedPackage?.packageName ||
    params.selectedBlueprint?.projectName ||
    (params.freeConsultation
      ? `Free Consultation (${params.freeConsultation.selectedItem || 'General'})`
      : 'Not Selected')
  ).trim();

  const packagePrice = (
    params.price ||
    params.selectedPackage?.packagePrice ||
    params.selectedPackage?.totalAmount ||
    params.selectedBlueprint?.estimatedBudget ||
    'Custom Quote'
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
    params.selectedPackage?.totalAmount ||
    params.selectedPackage?.packagePrice ||
    params.selectedBlueprint?.estimatedBudget ||
    'Not specified'
  ).trim();

  const startDate = (
    params.start_date ||
    params.selectedPackage?.duration ||
    'Immediate / Flexible'
  ).trim();

  const leadSource = 'QBENCH Website';
  const leadStatus = 'New';

  const secrets = await resolveIntegrationSecrets();
  const {
    EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID,
    EMAILJS_ADMIN_TEMPLATE_ID,
    EMAILJS_AUTO_REPLY_TEMPLATE_ID,
    GOOGLE_SHEETS_WEBHOOK_URL
  } = secrets;

  // Validate required secrets before dispatching
  const missingSecrets: string[] = [];
  if (!EMAILJS_PUBLIC_KEY) missingSecrets.push('EMAILJS_PUBLIC_KEY');
  if (!EMAILJS_SERVICE_ID) missingSecrets.push('EMAILJS_SERVICE_ID');
  if (!EMAILJS_ADMIN_TEMPLATE_ID) missingSecrets.push('EMAILJS_ADMIN_TEMPLATE_ID');
  if (!EMAILJS_AUTO_REPLY_TEMPLATE_ID) missingSecrets.push('EMAILJS_AUTO_REPLY_TEMPLATE_ID');
  if (!GOOGLE_SHEETS_WEBHOOK_URL) missingSecrets.push('GOOGLE_SHEETS_WEBHOOK_URL');

  if (missingSecrets.length > 0) {
    console.error(
      `[QBENCH Enquiry Integration Error] Missing required secrets/environment variables: ${missingSecrets.join(', ')}`
    );
    throw new Error('Enquiry integration configuration is incomplete.');
  }

  // Initialize EmailJS with EMAILJS_PUBLIC_KEY
  emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY
  });

  // 2. Send Admin EmailJS notification using EMAILJS_SERVICE_ID and EMAILJS_ADMIN_TEMPLATE_ID
  const adminTemplateParams = {
    name,
    company,
    email,
    phone,
    service,
    package: packageName,
    price: packagePrice,
    budget,
    start_date: startDate,
    message,
    lead_source: leadSource,
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
  } catch (adminEmailErr) {
    console.error('[QBENCH EmailJS Admin Notification Error]:', adminEmailErr);
    throw new Error('Failed to send Admin EmailJS notification.');
  }

  // 3. Send Client Auto-Reply EmailJS notification using EMAILJS_SERVICE_ID and EMAILJS_AUTO_REPLY_TEMPLATE_ID
  // The auto-reply uses the client's submitted email address as the recipient.
  const autoReplyTemplateParams = {
    name,
    email,
    service,
    package: packageName,
    budget,
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
  } catch (autoReplyErr) {
    console.error('[QBENCH EmailJS Client Auto-Reply Error]:', autoReplyErr);
    throw new Error('Failed to send Client Auto-Reply EmailJS notification.');
  }

  // 4. Send lead data to Google Sheets CRM through Google Apps Script Web App
  const payload = {
    name: name,
    company: company,
    email: email,
    phone: phone,
    service: service,
    package: packageName,
    price: packagePrice,
    budget: budget,
    start_date: startDate,
    message: message,
    lead_source: leadSource,
    lead_status: leadStatus
  };

  try {
    const sheetsResponse = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!sheetsResponse.ok) {
      console.error(
        `[QBENCH Google Sheets Webhook Error]: HTTP ${sheetsResponse.status} ${sheetsResponse.statusText}`
      );
      throw new Error('Google Sheets webhook returned a non-OK status.');
    }

    const responseText = await sheetsResponse.text().catch(() => '');
    if (
      responseText.includes('accounts.google.com') ||
      responseText.includes('ServiceLogin')
    ) {
      console.error(
        '[QBENCH Google Sheets Webhook Error]: Apps Script redirected to Google login. Ensure deployment "Who has access" is set to "Anyone".'
      );
      throw new Error('Google Sheets webhook requires public access authorization.');
    }

    if (responseText) {
      try {
        const parsed = JSON.parse(responseText);
        if (parsed && (parsed.success === false || parsed.result === 'error')) {
          console.error('[QBENCH Google Sheets Webhook Error]:', parsed.error || parsed);
          throw new Error('Google Sheets webhook reported an error.');
        }
      } catch (parseErr: any) {
        if (parseErr?.message === 'Google Sheets webhook reported an error.') {
          throw parseErr;
        }
        // Non-JSON 200 OK text output from Apps Script is valid
      }
    }
  } catch (sheetsErr) {
    console.error('[QBENCH Google Sheets CRM Submission Error]:', sheetsErr);
    throw new Error('Failed to send lead data to Google Sheets CRM.');
  }

  // Save a local CRM backup copy after successful submission
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
    businessName: company,
    company,
    phoneNumber: phone,
    phone,
    emailAddress: email,
    email,
    service,
    package: packageName,
    price: packagePrice,
    budget,
    start_date: startDate,
    message,
    lead_source: leadSource,
    lead_status: leadStatus,
    emailStatus: 'Sent',
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
    deliveryChannel: 'EmailJS + Google Sheets CRM'
  };
};
