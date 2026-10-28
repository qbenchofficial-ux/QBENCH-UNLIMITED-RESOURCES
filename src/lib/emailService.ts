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
  enquiryId?: string;
  referenceId?: string;
  smtpConfigured: boolean;
  smtpSuccess: boolean;
  adminEmailSuccess?: boolean;
  customerEmailSuccess?: boolean;
  authentication?: 'SUCCESS' | 'FAILED';
  emailDelivery?: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SKIPPED';
  deliveryChannel?: string | null;
  error?: string;
  advice?: string;
}

interface IntegrationSecrets {
  EMAILJS_PUBLIC_KEY: string;
  EMAILJS_SERVICE_ID: string;
  EMAILJS_ADMIN_TEMPLATE_ID: string;
  EMAILJS_CUSTOMER_TEMPLATE_ID: string;
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
  let EMAILJS_PUBLIC_KEY = cleanEnvValue(
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY || ''
  );
  let EMAILJS_SERVICE_ID = cleanEnvValue(
    import.meta.env.VITE_EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICE_ID || ''
  );
  let EMAILJS_ADMIN_TEMPLATE_ID = cleanEnvValue(
    import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID ||
      process.env.EMAILJS_ADMIN_TEMPLATE_ID ||
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
      ''
  );
  let EMAILJS_CUSTOMER_TEMPLATE_ID = cleanEnvValue(
    import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE_ID ||
      import.meta.env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID ||
      process.env.EMAILJS_CUSTOMER_TEMPLATE_ID ||
      process.env.EMAILJS_AUTO_REPLY_TEMPLATE_ID ||
      ''
  );
  let EMAILJS_AUTO_REPLY_TEMPLATE_ID = EMAILJS_CUSTOMER_TEMPLATE_ID;
  let GOOGLE_SHEETS_WEBHOOK_URL = cleanWebhookUrl(
    import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
      process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
      ''
  );

  if (
    !EMAILJS_PUBLIC_KEY ||
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_ADMIN_TEMPLATE_ID ||
    !EMAILJS_CUSTOMER_TEMPLATE_ID
  ) {
    try {
      const resp = await fetch('/api/integration-config');
      const contentType = resp.headers.get('content-type') || '';
      if (resp.ok && contentType.includes('application/json')) {
        const data = await resp.json();
        EMAILJS_PUBLIC_KEY =
          EMAILJS_PUBLIC_KEY ||
          cleanEnvValue(data.VITE_EMAILJS_PUBLIC_KEY) ||
          cleanEnvValue(data.EMAILJS_PUBLIC_KEY);
        EMAILJS_SERVICE_ID =
          EMAILJS_SERVICE_ID ||
          cleanEnvValue(data.VITE_EMAILJS_SERVICE_ID) ||
          cleanEnvValue(data.EMAILJS_SERVICE_ID);
        EMAILJS_ADMIN_TEMPLATE_ID =
          EMAILJS_ADMIN_TEMPLATE_ID ||
          cleanEnvValue(data.VITE_EMAILJS_ADMIN_TEMPLATE_ID) ||
          cleanEnvValue(data.EMAILJS_ADMIN_TEMPLATE_ID);
        EMAILJS_CUSTOMER_TEMPLATE_ID =
          EMAILJS_CUSTOMER_TEMPLATE_ID ||
          cleanEnvValue(data.VITE_EMAILJS_CUSTOMER_TEMPLATE_ID) ||
          cleanEnvValue(data.EMAILJS_CUSTOMER_TEMPLATE_ID) ||
          cleanEnvValue(data.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID) ||
          cleanEnvValue(data.EMAILJS_AUTO_REPLY_TEMPLATE_ID);
        EMAILJS_AUTO_REPLY_TEMPLATE_ID = EMAILJS_CUSTOMER_TEMPLATE_ID;
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
    EMAILJS_CUSTOMER_TEMPLATE_ID,
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

function maskEmailAddress(emailStr: string): string {
  const trimmed = (emailStr || '').trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) return 'invalid-email';
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (!domain) return 'invalid-email';
  const visibleLocal =
    local.length <= 2
      ? `${local[0] || '*'}*`
      : `${local.slice(0, 2)}${'*'.repeat(Math.min(local.length - 2, 4))}`;
  return `${visibleLocal}@${domain}`;
}

async function sendEmailJsWithFallback(options: {
  type: 'admin' | 'customer' | 'auto_reply';
  serviceId: string;
  templateId: string;
  publicKey: string;
  templateParams: Record<string, any>;
}): Promise<{ status: number; text: string; via: 'browser' | 'server_relay' }> {
  const { type, serviceId, templateId, publicKey, templateParams } = options;

  try {
    const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    if (!result || result.status !== 200) {
      throw new Error(
        `EmailJS (${type}) browser send returned non-200 status: ${result?.status ?? 'unknown'} (${result?.text ?? ''})`
      );
    }
    return {
      status: result.status,
      text: result.text || 'OK',
      via: 'browser'
    };
  } catch (browserErr: any) {
    console.warn(
      `[QBENCH] Browser EmailJS (${type}) encountered an issue, trying server relay (/api/emailjs-send)...`,
      browserErr?.text || browserErr?.message || browserErr
    );
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
  const relayStatus = Number(relayData?.status || relayResp.status || 0);
  if (!relayResp.ok || !relayData?.success || relayStatus !== 200) {
    throw new Error(
      relayData?.error ||
        relayData?.text ||
        `EmailJS (${type}) failed with HTTP ${relayStatus || relayResp.status}`
    );
  }

  return {
    status: relayStatus,
    text: String(relayData?.text || relayData?.response || 'OK'),
    via: 'server_relay'
  };
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
  const customerEmail = email;
  const phone = (params.phone || '').trim();
  const message = (params.message || '').trim();

  const pkgFields = resolveDynamicPackageFields(params);

  if (!name || !phone || !customerEmail || !pkgFields.service) {
    const validationErr = new SupabaseInquiryError({
      message: 'Required fields (name, phone, email, service) are missing.',
      code: 'VALIDATION_ERROR',
      hint: 'Please fill in Name, Phone, Email, and Service.',
    });
    console.error('QBENCH: Form validation FAILED', validationErr);
    throw validationErr;
  }

  if (!customerEmail.includes('@')) {
    const emailValidationErr = new SupabaseInquiryError({
      message: 'Valid customer email is required',
      code: 'VALIDATION_ERROR',
      hint: 'Please provide a valid email address containing @.',
    });
    console.error('QBENCH: Form validation FAILED', emailValidationErr);
    throw emailValidationErr;
  }

  // STEP 1 (REQUIRED): Persist inquiry in Supabase `public.project_inquiries` table.
  // Do NOT hide errors or report success unless Supabase confirms the enquiry was inserted!
  const insertedInquiry = await createProjectInquiry({
    name,
    company,
    email: customerEmail,
    phone,
    service: pkgFields.service,
    package: pkgFields.package,
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

  const enquiryReferenceId = insertedInquiry.reference_id || insertedInquiry.id;

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
    emailAddress: customerEmail,
    email: customerEmail,
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

  // STEP 2: Trigger TWO separate EmailJS notifications (Admin + Customer Confirmation).
  // Note: Only triggered after Supabase insert succeeds.
  // Failures in EmailJS must not overwrite or rollback a confirmed Supabase insert.
  const secrets = await resolveIntegrationSecrets();
  const {
    EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID,
    EMAILJS_ADMIN_TEMPLATE_ID,
    EMAILJS_CUSTOMER_TEMPLATE_ID,
    EMAILJS_AUTO_REPLY_TEMPLATE_ID,
    GOOGLE_SHEETS_WEBHOOK_URL
  } = secrets;

  const channelsUsed: string[] = ['Supabase project_inquiries'];
  let adminEmailSuccess = false;
  let customerEmailSuccess = false;
  let adminEmailError: string | null = null;
  let customerEmailError: string | null = null;

  const customerTemplateId = EMAILJS_CUSTOMER_TEMPLATE_ID || EMAILJS_AUTO_REPLY_TEMPLATE_ID;
  const resolvedBudget = params.budget || pkgFields.budget;
  const resolvedCompany = company || 'Not specified';
  const resolvedDescription = params.project_description || message;

  console.info(
    `[QBENCH] Email configuration:\n` +
      `Service ID: ${EMAILJS_SERVICE_ID ? 'configured' : 'missing'}\n` +
      `Admin Template: ${EMAILJS_ADMIN_TEMPLATE_ID ? `configured (${EMAILJS_ADMIN_TEMPLATE_ID})` : 'missing'}\n` +
      `Customer Template: ${customerTemplateId ? `configured (${customerTemplateId})` : 'missing'}\n` +
      `Public Key: ${EMAILJS_PUBLIC_KEY ? 'configured' : 'missing'}\n` +
      `Customer recipient: ${maskEmailAddress(customerEmail)}`
  );

  if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID) {
    if (emailJsInitializedKey !== EMAILJS_PUBLIC_KEY) {
      try {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        emailJsInitializedKey = EMAILJS_PUBLIC_KEY;
      } catch {
        // Ignore init error
      }
    }

    // Email 1 – QBENCH Admin Notification
    // Template: template_m9zyb5s
    // Recipient: Configured in EmailJS Admin template (with reply_to set to customerEmail).
    // Note: Keep `email: customerEmail` for template body ({{email}}), and keep `to_email` / `recipient_email`
    // out of customerEmail so the admin template is never accidentally routed to the customer.
    if (EMAILJS_ADMIN_TEMPLATE_ID) {
      const adminParams = {
        from_name: name,
        sender_name: 'QBENCH Creative Agency',
        subject: `New Project Enquiry [${enquiryReferenceId}] – QBENCH`,
        enquiry_id: enquiryReferenceId,
        reference_id: enquiryReferenceId,
        name,
        customer_name: name,
        from_email: customerEmail,
        customer_email: customerEmail,
        email: customerEmail,
        phone,
        company: resolvedCompany,
        service: pkgFields.service,
        package: pkgFields.package,
        package_id: pkgFields.package_id,
        budget: resolvedBudget,
        price: pkgFields.price,
        timeline: pkgFields.timeline,
        category: pkgFields.category,
        start_date: pkgFields.start_date,
        message,
        project_description: resolvedDescription,
        project_message: message,
        date: submissionDateTime,
        submission_date: submissionDateTime,
        lead_source: 'QBENCH Website',
        lead_status: 'New',
        reply_to: customerEmail,
        to_name: 'QBENCH Team',
        to_email: 'qbench.official@gmail.com',
        recipient_email: 'qbench.official@gmail.com'
      };

      try {
        const adminResult = await sendEmailJsWithFallback({
          type: 'admin',
          serviceId: EMAILJS_SERVICE_ID,
          templateId: EMAILJS_ADMIN_TEMPLATE_ID,
          publicKey: EMAILJS_PUBLIC_KEY,
          templateParams: adminParams
        });

        console.log('[QBENCH] Admin EmailJS response:', adminResult);

        if (adminResult.status !== 200) {
          throw new Error(`Admin EmailJS failed: ${adminResult.status}`);
        }

        adminEmailSuccess = true;
        channelsUsed.push('Admin Notification');
        console.log('[QBENCH] Admin Email: SUCCESS');
      } catch (error: any) {
        adminEmailError = error?.message || String(error) || 'Admin notification failed';
        console.error('[QBENCH] Admin Email: FAILED', error);
      }
    } else {
      adminEmailError = 'Admin EmailJS template ID is not configured';
      console.error('[QBENCH] Admin Email: FAILED', new Error(adminEmailError));
    }

    // Email 2 – Customer Automatic Confirmation
    // Template: template_7ejoq5d
    // Recipient: Customer's submitted email address ({{to_email}} / {{email}})
    if (customerTemplateId) {
      try {
        if (!customerEmail || !customerEmail.includes('@')) {
          throw new Error('Valid customer email is required');
        }

        const customerParams = {
          from_name: 'QBENCH Creative Agency',
          subject: `Enquiry Confirmation [${enquiryReferenceId}] – QBENCH`,
          enquiry_id: enquiryReferenceId,
          reference_id: enquiryReferenceId,
          name,
          customer_name: name,
          to_name: name,
          email: customerEmail,
          to_email: customerEmail,
          user_email: customerEmail,
          recipient_email: customerEmail,
          customer_email: customerEmail,
          phone,
          company: resolvedCompany,
          service: pkgFields.service,
          package: pkgFields.package,
          package_id: pkgFields.package_id,
          budget: resolvedBudget,
          price: pkgFields.price,
          timeline: pkgFields.timeline,
          category: pkgFields.category,
          message,
          project_description: resolvedDescription,
          customer_message: message,
          project_message: message,
          confirmation_message:
            'Thank you for reaching out to QBENCH Creative Agency! We have successfully received your project enquiry. Our team will review your requirements and get back to you as soon as possible.',
          date: submissionDateTime,
          submission_date: submissionDateTime,
          reply_to: 'qbench.official@gmail.com'
        };

        const customerResult = await sendEmailJsWithFallback({
          type: 'customer',
          serviceId: EMAILJS_SERVICE_ID,
          templateId: customerTemplateId,
          publicKey: EMAILJS_PUBLIC_KEY,
          templateParams: customerParams
        });

        console.log('[QBENCH] Customer EmailJS response:', customerResult);

        if (customerResult.status !== 200) {
          throw new Error(`Customer EmailJS failed: ${customerResult.status}`);
        }

        customerEmailSuccess = true;
        channelsUsed.push('Customer Confirmation');
        console.log('[QBENCH] Customer Email: SUCCESS');
      } catch (error: any) {
        customerEmailError = error?.message || String(error) || 'Customer confirmation failed';
        console.error('[QBENCH] Customer Email: FAILED', error);
      }
    } else {
      customerEmailError = 'Customer EmailJS template ID is not configured';
      console.error('[QBENCH] Customer Email: FAILED', new Error(customerEmailError));
    }
  } else {
    const missingConfigMsg = 'EmailJS Service ID or Public Key is missing';
    adminEmailError = missingConfigMsg;
    customerEmailError = missingConfigMsg;
    console.error('[QBENCH] Admin Email: FAILED', new Error(missingConfigMsg));
    console.error('[QBENCH] Customer Email: FAILED', new Error(missingConfigMsg));
  }

  if (GOOGLE_SHEETS_WEBHOOK_URL) {
    try {
      await postToGoogleSheetsWebhook(GOOGLE_SHEETS_WEBHOOK_URL, {
        name,
        company,
        email: customerEmail,
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

  let emailDelivery: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
  let outcomeMessage = 'Your enquiry has been received successfully. We will get back to you shortly.';

  if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && (EMAILJS_ADMIN_TEMPLATE_ID || customerTemplateId)) {
    if (adminEmailSuccess && customerEmailSuccess) {
      emailDelivery = 'SUCCESS';
      outcomeMessage = 'Thank you! Your enquiry has been received and confirmed. We’ll get back to you shortly.';
    } else if (adminEmailSuccess || customerEmailSuccess) {
      emailDelivery = 'PARTIAL';
      outcomeMessage = 'Your enquiry has been received successfully. We will get back to you shortly.';
    } else {
      emailDelivery = 'FAILED';
      outcomeMessage = 'Your enquiry has been received successfully. We will get back to you shortly.';
    }
  }

  return {
    success: true,
    message: outcomeMessage,
    enquiryId: enquiryReferenceId,
    referenceId: enquiryReferenceId,
    smtpConfigured: Boolean(EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID),
    smtpSuccess: adminEmailSuccess && customerEmailSuccess,
    adminEmailSuccess,
    customerEmailSuccess,
    authentication: 'SUCCESS',
    emailDelivery: emailDelivery,
    deliveryChannel: channelsUsed.join(' + '),
    error: adminEmailError || customerEmailError || undefined
  };
};

export interface EmailJSDiagnosticTestResult {
  success: boolean;
  timestamp: string;
  recipientEmail: string;
  config: {
    serviceIdConfigured: boolean;
    serviceId: string | null;
    adminTemplateIdConfigured: boolean;
    adminTemplateId: string | null;
    customerTemplateIdConfigured: boolean;
    customerTemplateId: string | null;
    publicKeyConfigured: boolean;
  };
  adminTemplateTest: {
    attempted: boolean;
    success: boolean;
    status?: number;
    text?: string;
    via?: 'browser' | 'server_relay';
    error?: string;
  };
  customerTemplateTest?: {
    attempted: boolean;
    success: boolean;
    status?: number;
    text?: string;
    via?: 'browser' | 'server_relay';
    error?: string;
  };
  message: string;
}

/**
 * Diagnostic test function that attempts to send a dummy email to the administrator
 * to verify that the EmailJS Service ID and Template IDs are correctly configured
 * and reachable via EmailJS.
 */
export async function sendEmailJSDiagnosticTest(options?: {
  adminEmail?: string;
  includeCustomerTemplate?: boolean;
}): Promise<EmailJSDiagnosticTestResult> {
  const timestamp = new Date().toISOString();
  const formattedDate = new Date(timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'long',
    timeZone: 'Asia/Kolkata'
  });
  const recipientEmail = (options?.adminEmail || 'qbench.official@gmail.com').trim();
  const includeCustomerTemplate = options?.includeCustomerTemplate ?? true;

  const secrets = await resolveIntegrationSecrets();
  const {
    EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID,
    EMAILJS_ADMIN_TEMPLATE_ID,
    EMAILJS_CUSTOMER_TEMPLATE_ID,
    EMAILJS_AUTO_REPLY_TEMPLATE_ID
  } = secrets;

  const customerTemplateId = EMAILJS_CUSTOMER_TEMPLATE_ID || EMAILJS_AUTO_REPLY_TEMPLATE_ID;

  const configSummary = {
    serviceIdConfigured: Boolean(EMAILJS_SERVICE_ID),
    serviceId: EMAILJS_SERVICE_ID || null,
    adminTemplateIdConfigured: Boolean(EMAILJS_ADMIN_TEMPLATE_ID),
    adminTemplateId: EMAILJS_ADMIN_TEMPLATE_ID || null,
    customerTemplateIdConfigured: Boolean(customerTemplateId),
    customerTemplateId: customerTemplateId || null,
    publicKeyConfigured: Boolean(EMAILJS_PUBLIC_KEY)
  };

  console.info(
    `[QBENCH Diagnostic] Starting EmailJS configuration & reachability test:\n` +
      `Service ID: ${configSummary.serviceIdConfigured ? `configured (${configSummary.serviceId})` : 'missing'}\n` +
      `Admin Template: ${configSummary.adminTemplateIdConfigured ? `configured (${configSummary.adminTemplateId})` : 'missing'}\n` +
      `Customer Template: ${configSummary.customerTemplateIdConfigured ? `configured (${configSummary.customerTemplateId})` : 'missing'}\n` +
      `Public Key: ${configSummary.publicKeyConfigured ? 'configured' : 'missing'}\n` +
      `Target Admin Recipient: ${maskEmailAddress(recipientEmail)}`
  );

  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_ADMIN_TEMPLATE_ID) {
    const missingParts: string[] = [];
    if (!EMAILJS_SERVICE_ID) missingParts.push('Service ID');
    if (!EMAILJS_ADMIN_TEMPLATE_ID) missingParts.push('Admin Template ID');
    if (!EMAILJS_PUBLIC_KEY) missingParts.push('Public Key');
    const errorMsg = `Missing required EmailJS configuration: ${missingParts.join(', ')}`;
    console.error('[QBENCH Diagnostic] FAILED:', errorMsg);

    return {
      success: false,
      timestamp,
      recipientEmail,
      config: configSummary,
      adminTemplateTest: {
        attempted: false,
        success: false,
        error: errorMsg
      },
      message: errorMsg
    };
  }

  if (emailJsInitializedKey !== EMAILJS_PUBLIC_KEY) {
    try {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      emailJsInitializedKey = EMAILJS_PUBLIC_KEY;
    } catch {
      // Ignore init error
    }
  }

  const dummyAdminParams = {
    from_name: 'QBENCH Diagnostic Test',
    sender_name: 'QBENCH Diagnostic Runner',
    subject: `[DIAGNOSTIC TEST] QBENCH EmailJS Verification (${formattedDate})`,
    name: 'QBENCH Diagnostic Administrator Test',
    customer_name: 'QBENCH Diagnostic Administrator Test',
    from_email: recipientEmail,
    customer_email: recipientEmail,
    email: recipientEmail,
    phone: '+91 00000 00000',
    company: 'QBENCH System Diagnostics',
    service: 'EmailJS Reachability & Template Verification',
    package: 'Diagnostic Probe',
    package_id: 'diagnostic_test',
    budget: 'N/A (Diagnostic Test)',
    price: 'N/A',
    timeline: 'Immediate',
    category: 'System Diagnostics',
    start_date: formattedDate,
    message: `This is an automated diagnostic test email triggered at ${formattedDate} to verify that EmailJS Service ID (${EMAILJS_SERVICE_ID}) and Admin Template ID (${EMAILJS_ADMIN_TEMPLATE_ID}) are properly configured and reachable.`,
    project_description: `Automated diagnostic test verifying EmailJS Service (${EMAILJS_SERVICE_ID}) and Admin Template (${EMAILJS_ADMIN_TEMPLATE_ID}).`,
    project_message: 'Diagnostic verification test.',
    date: formattedDate,
    submission_date: formattedDate,
    lead_source: 'QBENCH EmailJS Diagnostic',
    lead_status: 'Diagnostic',
    reply_to: recipientEmail,
    to_name: 'QBENCH Administrator',
    to_email: recipientEmail,
    recipient_email: recipientEmail
  };

  let adminTestResult: EmailJSDiagnosticTestResult['adminTemplateTest'] = {
    attempted: true,
    success: false
  };

  try {
    const res = await sendEmailJsWithFallback({
      type: 'admin',
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_ADMIN_TEMPLATE_ID,
      publicKey: EMAILJS_PUBLIC_KEY,
      templateParams: dummyAdminParams
    });

    adminTestResult = {
      attempted: true,
      success: res.status === 200,
      status: res.status,
      text: res.text,
      via: res.via
    };
    console.log('[QBENCH Diagnostic] Admin Template Test: SUCCESS', res);
  } catch (err: any) {
    const errMsg = err?.message || String(err) || 'Admin template diagnostic send failed';
    adminTestResult = {
      attempted: true,
      success: false,
      error: errMsg
    };
    console.error('[QBENCH Diagnostic] Admin Template Test: FAILED', err);
  }

  let customerTestResult: EmailJSDiagnosticTestResult['customerTemplateTest'] | undefined;

  if (includeCustomerTemplate) {
    if (!customerTemplateId) {
      customerTestResult = {
        attempted: false,
        success: false,
        error: 'Customer Template ID is not configured'
      };
    } else {
      const dummyCustomerParams = {
        from_name: 'QBENCH Creative Agency',
        subject: `[DIAGNOSTIC TEST] QBENCH Customer Template Verification (${formattedDate})`,
        name: 'QBENCH Administrator (Diagnostic)',
        customer_name: 'QBENCH Administrator (Diagnostic)',
        to_name: 'QBENCH Administrator',
        email: recipientEmail,
        to_email: recipientEmail,
        user_email: recipientEmail,
        recipient_email: recipientEmail,
        customer_email: recipientEmail,
        phone: '+91 00000 00000',
        company: 'QBENCH System Diagnostics',
        service: 'EmailJS Reachability & Template Verification',
        package: 'Diagnostic Probe',
        package_id: 'diagnostic_test',
        budget: 'N/A (Diagnostic Test)',
        price: 'N/A',
        timeline: 'Immediate',
        category: 'System Diagnostics',
        message: `This is an automated diagnostic test email triggered at ${formattedDate} to verify that Customer Template ID (${customerTemplateId}) is properly configured and reachable via Service ID (${EMAILJS_SERVICE_ID}).`,
        project_description: `Automated diagnostic test verifying Customer Template (${customerTemplateId}).`,
        customer_message: 'Diagnostic verification test.',
        project_message: 'Diagnostic verification test.',
        confirmation_message:
          'Diagnostic verification: Customer confirmation template is reachable and accepted by EmailJS.',
        date: formattedDate,
        submission_date: formattedDate,
        reply_to: recipientEmail
      };

      try {
        const res = await sendEmailJsWithFallback({
          type: 'customer',
          serviceId: EMAILJS_SERVICE_ID,
          templateId: customerTemplateId,
          publicKey: EMAILJS_PUBLIC_KEY,
          templateParams: dummyCustomerParams
        });

        customerTestResult = {
          attempted: true,
          success: res.status === 200,
          status: res.status,
          text: res.text,
          via: res.via
        };
        console.log('[QBENCH Diagnostic] Customer Template Test: SUCCESS', res);
      } catch (err: any) {
        const errMsg = err?.message || String(err) || 'Customer template diagnostic send failed';
        customerTestResult = {
          attempted: true,
          success: false,
          error: errMsg
        };
        console.error('[QBENCH Diagnostic] Customer Template Test: FAILED', err);
      }
    }
  }

  const overallSuccess =
    adminTestResult.success &&
    (!includeCustomerTemplate || Boolean(customerTestResult?.success));

  const summaryMessage = overallSuccess
    ? `EmailJS diagnostic test succeeded! Dummy verification email(s) sent to ${recipientEmail} via Service ID (${EMAILJS_SERVICE_ID}).`
    : `EmailJS diagnostic test encountered an issue. Admin template (${EMAILJS_ADMIN_TEMPLATE_ID}): ${
        adminTestResult.success ? 'OK' : adminTestResult.error || 'FAILED'
      }${
        includeCustomerTemplate && customerTestResult
          ? ` | Customer template (${customerTemplateId || 'missing'}): ${
              customerTestResult.success ? 'OK' : customerTestResult.error || 'FAILED'
            }`
          : ''
      }`;

  return {
    success: overallSuccess,
    timestamp,
    recipientEmail,
    config: configSummary,
    adminTemplateTest: adminTestResult,
    customerTemplateTest: customerTestResult,
    message: summaryMessage
  };
}

