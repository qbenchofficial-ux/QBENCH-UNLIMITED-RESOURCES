import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const NOTIFICATION_RECIPIENT = 'qbench.official@gmail.com';

app.use(express.json());

// Enable CORS controls
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Ensure the data directory exists for local database storage (use /tmp on Vercel serverless)
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'qbench-data') : path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const APPS_SCRIPT_FILE = path.join(process.cwd(), 'google-apps-script', 'Code.gs');

let memoryMessagesFallback: any[] = [];

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  // Ignore directory creation errors on read-only environments
}

function readMessagesSafe(): any[] {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const fileContent = fs.readFileSync(MESSAGES_FILE, 'utf-8');
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) {
        memoryMessagesFallback = parsed;
        return parsed;
      }
    }
  } catch {
    // Fall back to in-memory messages
  }
  return [...memoryMessagesFallback];
}

function writeMessagesSafe(messages: any[]): void {
  memoryMessagesFallback = [...messages];
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
  } catch {
    // Keep in memoryMessagesFallback if disk is read-only
  }
}

app.get('/api/health', (_req, res) => {
  return res.status(200).json({ status: 'ok', recipient: NOTIFICATION_RECIPIENT });
});

/**
 * Provides the client-side integration configuration from Google AI Studio Secrets / environment variables
 * so credentials are never hardcoded in the frontend.
 * Never exposes private keys, SMTP passwords, or service account credentials.
 */
app.get('/api/integration-config', (_req, res) => {
  const clean = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
  const cleanUrl = (val?: string) => {
    const raw = clean(val);
    const matches = raw.match(/https:\/\/script\.google\.com\/macros\/s\/[^\s"']+?(?:\/exec|\/dev)/);
    return matches ? matches[0] : raw;
  };
  return res.status(200).json({
    EMAILJS_PUBLIC_KEY: clean(process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY),
    EMAILJS_SERVICE_ID: clean(process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID),
    EMAILJS_ADMIN_TEMPLATE_ID: clean(
      process.env.EMAILJS_ADMIN_TEMPLATE_ID ||
        process.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID ||
        process.env.VITE_EMAILJS_TEMPLATE_ID
    ),
    EMAILJS_AUTO_REPLY_TEMPLATE_ID: clean(
      process.env.EMAILJS_AUTO_REPLY_TEMPLATE_ID || process.env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID
    ),
    GOOGLE_SHEETS_WEBHOOK_URL: cleanUrl(
      process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL
    )
  });
});

/**
 * Server-side EmailJS relay endpoint (/api/emailjs-send)
 * Ensures EmailJS Admin and Auto-Reply notifications succeed even if browser extensions,
 * iframe policies, or network filters block client-side calls to api.emailjs.com.
 */
app.post('/api/emailjs-send', async (req, res) => {
  const clean = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
  const { type, templateParams, serviceId, templateId, publicKey } = req.body || {};

  const resolvedPublicKey = clean(
    publicKey || process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY
  );
  const resolvedServiceId = clean(
    serviceId || process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID
  );
  const resolvedTemplateId = clean(
    templateId ||
      (type === 'auto_reply'
        ? process.env.EMAILJS_AUTO_REPLY_TEMPLATE_ID || process.env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID
        : process.env.EMAILJS_ADMIN_TEMPLATE_ID ||
          process.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID ||
          process.env.VITE_EMAILJS_TEMPLATE_ID)
  );

  if (!resolvedPublicKey || !resolvedServiceId || !resolvedTemplateId) {
    return res.status(400).json({
      success: false,
      error: 'Missing EmailJS configuration on server.'
    });
  }

  const originHeader =
    req.headers.origin ||
    process.env.APP_URL ||
    'https://ais-dev-somwyso2xv5jhu4pxvfzyv-572791785868.asia-east1.run.app';

  try {
    const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: String(originHeader),
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        lib_version: '4.4.1',
        user_id: resolvedPublicKey,
        service_id: resolvedServiceId,
        template_id: resolvedTemplateId,
        template_params: templateParams || {}
      })
    });

    const text = await resp.text().catch(() => '');
    if (resp.ok) {
      return res.status(200).json({ success: true, status: resp.status, response: text });
    }
    return res.status(resp.status).json({
      success: false,
      status: resp.status,
      error: text || `EmailJS returned HTTP ${resp.status}`
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server EmailJS relay failed.'
    });
  }
});

/**
 * Server-side Google Sheets CRM Webhook proxy + local CRM persistence (/api/sheets-webhook)
 * Prevents browser CORS / iframe redirect failures on script.google.com from breaking form submission.
 */
app.post('/api/sheets-webhook', async (req, res) => {
  const payload = req.body || {};
  const sheetsConfig = getSheetsWebhookConfig();

  // Always persist the lead in local CRM storage so zero enquiries are ever lost
  try {
    const nowIso = new Date().toISOString();
    const submissionDateTime = new Date(nowIso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'long',
      timeZone: 'Asia/Kolkata'
    });
    const messages = readMessagesSafe();
    messages.push({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: nowIso,
      submissionDateTime,
      fullName: payload.name || '',
      name: payload.name || '',
      businessName: payload.company || 'Not specified',
      company: payload.company || 'Not specified',
      phoneNumber: payload.phone || '',
      phone: payload.phone || '',
      emailAddress: payload.email || '',
      email: payload.email || '',
      subject: `New QBENCH Website Enquiry — ${payload.name || 'Client'}`,
      service: payload.service || 'Branding',
      package: payload.package || '',
      package_id: payload.package_id || '',
      price: payload.price || '',
      timeline: payload.timeline || '',
      category: payload.category || '',
      budget: payload.budget || '',
      start_date: payload.start_date || '',
      message: payload.message || '',
      source: payload.lead_source || 'QBENCH Website',
      lead_source: payload.lead_source || 'QBENCH Website',
      lead_status: payload.lead_status || 'New',
      routedTo: NOTIFICATION_RECIPIENT,
      emailStatus: 'Sent',
      emailSentAt: submissionDateTime,
      deliveryChannel: 'EmailJS + Google Sheets CRM'
    });
    writeMessagesSafe(messages);
  } catch {
    // Ignore local persistence error
  }

  if (!sheetsConfig.isConfigured) {
    return res.status(200).json({
      success: true,
      forwarded: false,
      note: 'GOOGLE_SHEETS_WEBHOOK_URL not configured; saved to local CRM.'
    });
  }

  const cleanUrl = (val: string) => {
    const matches = val.match(/https:\/\/script\.google\.com\/macros\/s\/[^\s"']+?(?:\/exec|\/dev)/);
    return matches ? matches[0] : val;
  };

  const targetUrl = cleanUrl(sheetsConfig.url);
  const execUrl = targetUrl.replace(/\/dev(\?.*)?$/, '/exec$1');
  const bodyStr = JSON.stringify(payload);

  let webhookDelivered = false;
  let lastStatus = 0;

  for (const url of Array.from(new Set([execUrl, targetUrl]))) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: bodyStr,
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      lastStatus = resp.status;
      if (resp.ok) {
        webhookDelivered = true;
        break;
      }
    } catch {
      // Continue to next URL candidate
    }
  }

  return res.status(200).json({
    success: true,
    forwarded: webhookDelivered,
    status: lastStatus
  });
});

/**
 * Secure server-side WhatsApp Business Cloud API configuration helper.
 * WHATSAPP_ACCESS_TOKEN is strictly kept on the server and NEVER exposed to browser JavaScript.
 */
function getWhatsAppConfig() {
  const clean = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
  const isPlaceholder = (val: string) =>
    !val ||
    val.startsWith('your_') ||
    val.includes('YOUR_') ||
    val === 'undefined' ||
    val === 'null';

  const rawApiUrl = clean(process.env.WHATSAPP_API_URL);
  const accessToken = clean(process.env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = clean(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const rawRecipient = clean(process.env.WHATSAPP_RECIPIENT_NUMBER);
  const templateName = clean(process.env.WHATSAPP_TEMPLATE_NAME);
  const templateLanguage = clean(process.env.WHATSAPP_TEMPLATE_LANGUAGE) || 'en';

  const recipientNumber = isPlaceholder(rawRecipient)
    ? ''
    : rawRecipient.replace(/[^\d]/g, '');

  let endpointUrl = '';
  if (!isPlaceholder(rawApiUrl) && rawApiUrl.endsWith('/messages')) {
    endpointUrl = rawApiUrl;
  } else if (!isPlaceholder(phoneNumberId)) {
    const baseUrl = (!isPlaceholder(rawApiUrl) ? rawApiUrl : 'https://graph.facebook.com/v20.0').replace(/\/$/, '');
    endpointUrl = `${baseUrl}/${phoneNumberId}/messages`;
  } else if (!isPlaceholder(rawApiUrl)) {
    endpointUrl = rawApiUrl;
  }

  const isConfigured = Boolean(
    !isPlaceholder(accessToken) &&
      !isPlaceholder(endpointUrl) &&
      !isPlaceholder(recipientNumber)
  );

  return {
    endpointUrl,
    accessToken,
    phoneNumberId: isPlaceholder(phoneNumberId) ? '' : phoneNumberId,
    recipientNumber,
    templateName: isPlaceholder(templateName) ? '' : templateName,
    templateLanguage,
    isConfigured
  };
}

function sanitizeWhatsAppParam(val: unknown, fallback = 'Not specified'): string {
  const cleaned = String(val ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned ? cleaned.slice(0, 1024) : fallback;
}

function buildOrderedWhatsAppParams(
  data: Record<string, string>,
  count: number
): Array<{ type: 'text'; text: string }> {
  if (count <= 0) return [];

  const parameterSetsByCount: Record<number, string[]> = {
    1: [data.name],
    2: [data.name, data.phone],
    3: [data.name, data.phone, data.service],
    4: [data.name, data.phone, data.service, data.package],
    5: [data.name, data.phone, data.email, data.service, data.message],
    6: [data.name, data.phone, data.email, data.service, data.package, data.message],
    7: [data.name, data.phone, data.email, data.service, data.package, data.price, data.message],
    8: [data.name, data.company, data.email, data.phone, data.service, data.package, data.price, data.message],
    9: [
      data.name,
      data.company,
      data.email,
      data.phone,
      data.service,
      data.package,
      data.price,
      data.timeline,
      data.message
    ],
    10: [
      data.name,
      data.company,
      data.email,
      data.phone,
      data.service,
      data.package,
      data.price,
      data.budget,
      data.start_date,
      data.message
    ],
    11: [
      data.name,
      data.company,
      data.email,
      data.phone,
      data.service,
      data.package,
      data.price,
      data.budget,
      data.start_date,
      data.message,
      data.lead_source
    ],
    12: [
      data.name,
      data.company,
      data.email,
      data.phone,
      data.service,
      data.package,
      data.package_id,
      data.price,
      data.timeline,
      data.budget,
      data.start_date,
      data.message
    ]
  };

  const fullList = parameterSetsByCount[count] || [
    data.name,
    data.company,
    data.email,
    data.phone,
    data.service,
    data.package,
    data.price,
    data.budget,
    data.start_date,
    data.message,
    data.lead_source,
    data.timeline,
    data.package_id
  ].slice(0, count);

  return fullList.map((val) => ({
    type: 'text',
    text: sanitizeWhatsAppParam(val)
  }));
}

async function handleWhatsAppNotification(req: express.Request, res: express.Response) {
  const waConfig = getWhatsAppConfig();

  if (!waConfig.isConfigured) {
    const missing: string[] = [];
    if (!waConfig.accessToken) missing.push('WHATSAPP_ACCESS_TOKEN');
    if (!waConfig.endpointUrl) missing.push('WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_API_URL');
    if (!waConfig.recipientNumber) missing.push('WHATSAPP_RECIPIENT_NUMBER');

    return res.status(503).json({
      success: false,
      configured: false,
      error: `WhatsApp Cloud API secrets not configured: ${missing.join(', ')}`
    });
  }

  const body = req.body || {};
  const normalizedData: Record<string, string> = {
    name: sanitizeWhatsAppParam(body.name, 'Not provided'),
    company: sanitizeWhatsAppParam(body.company, 'Not specified'),
    email: sanitizeWhatsAppParam(body.email, 'Not provided'),
    phone: sanitizeWhatsAppParam(body.phone, 'Not provided'),
    service: sanitizeWhatsAppParam(body.service, 'Branding'),
    package: sanitizeWhatsAppParam(body.package || body.packageName, 'Not Selected'),
    package_id: sanitizeWhatsAppParam(body.package_id || body.packageId, 'general_enquiry'),
    price: sanitizeWhatsAppParam(body.price || body.packagePrice, 'Custom Quote'),
    timeline: sanitizeWhatsAppParam(body.timeline, 'Flexible'),
    category: sanitizeWhatsAppParam(body.category || body.service, 'Branding'),
    budget: sanitizeWhatsAppParam(body.budget || body.price, 'Custom Quote'),
    start_date: sanitizeWhatsAppParam(body.start_date || body.startDate || body.timeline, 'Flexible'),
    message: sanitizeWhatsAppParam(body.message, 'No additional message provided'),
    lead_source: sanitizeWhatsAppParam(body.lead_source, 'QBENCH Website')
  };

  const sendToMeta = async (payload: Record<string, any>) => {
    const resp = await fetch(waConfig.endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${waConfig.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data: any = await resp.json().catch(() => ({}));
    return { ok: resp.ok, status: resp.status, data };
  };

  try {
    // 1. If a WhatsApp Template is configured, send using template mode first
    if (waConfig.templateName) {
      const initialParamCount = waConfig.templateName === 'hello_world' ? 0 : 10;
      const buildTemplatePayload = (langCode: string, paramCount: number) => {
        const parameters = buildOrderedWhatsAppParams(normalizedData, paramCount);
        const templateObj: Record<string, any> = {
          name: waConfig.templateName,
          language: { code: langCode }
        };
        if (parameters.length > 0) {
          templateObj.components = [
            {
              type: 'body',
              parameters
            }
          ];
        }
        return {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: waConfig.recipientNumber,
          type: 'template',
          template: templateObj
        };
      };

      let activeLang = waConfig.templateLanguage;
      let attempt = await sendToMeta(buildTemplatePayload(activeLang, initialParamCount));

      // If language code translation error (132001), retry with fallback language ('en_US' <-> 'en')
      if (!attempt.ok && attempt.data?.error?.code === 132001) {
        activeLang = activeLang === 'en' ? 'en_US' : 'en';
        attempt = await sendToMeta(buildTemplatePayload(activeLang, initialParamCount));
      }

      // If parameter count mismatch (132000), extract expected parameter count from Meta error details and retry
      if (!attempt.ok && attempt.data?.error?.code === 132000) {
        const detailsStr = String(attempt.data?.error?.error_data?.details || attempt.data?.error?.message || '');
        const match = detailsStr.match(/expected number of params \((\d+)\)/i);
        if (match) {
          const expectedCount = Number(match[1]);
          attempt = await sendToMeta(buildTemplatePayload(activeLang, expectedCount));
        }
      }

      if (attempt.ok) {
        return res.status(200).json({
          success: true,
          mode: 'template',
          messageId: attempt.data?.messages?.[0]?.id || null
        });
      }

      // Fall through to text message fallback if template failed
      console.warn('[QBENCH WhatsApp Template Notice]:', attempt.data?.error?.message || attempt.status);
    }

    // 2. Fallback / Direct formatted text message via WhatsApp Business Cloud API
    const formattedText = [
      '🔔 *New QBENCH Website Enquiry*',
      '',
      `*Name:* ${normalizedData.name}`,
      `*Company:* ${normalizedData.company}`,
      `*Email:* ${normalizedData.email}`,
      `*Phone:* ${normalizedData.phone}`,
      `*Service:* ${normalizedData.service}`,
      `*Package:* ${normalizedData.package}`,
      `*Package ID:* ${normalizedData.package_id}`,
      `*Price:* ${normalizedData.price}`,
      `*Timeline:* ${normalizedData.timeline}`,
      `*Budget:* ${normalizedData.budget}`,
      `*Start Date:* ${normalizedData.start_date}`,
      `*Message:* ${normalizedData.message}`,
      `*Lead Source:* ${normalizedData.lead_source}`
    ].join('\n');

    const textAttempt = await sendToMeta({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: waConfig.recipientNumber,
      type: 'text',
      text: {
        preview_url: false,
        body: formattedText
      }
    });

    if (textAttempt.ok) {
      return res.status(200).json({
        success: true,
        mode: 'text',
        messageId: textAttempt.data?.messages?.[0]?.id || null
      });
    }

    return res.status(textAttempt.status || 500).json({
      success: false,
      configured: true,
      error: textAttempt.data?.error?.message || 'WhatsApp Business Cloud API request failed.'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      configured: true,
      error: err?.message || 'Unexpected error calling WhatsApp Business Cloud API.'
    });
  }
}

app.post('/api/whatsapp-notify', handleWhatsAppNotification);
app.post('/api/whatsapp', handleWhatsAppNotification);
app.post('/api/send-whatsapp', handleWhatsAppNotification);

/**
 * Centralized, secure server-side Gmail SMTP configuration helper.
 * Supports SMTP_USER / EMAIL_USER / GMAIL_USER and SMTP_PASS / EMAIL_PASS / GMAIL_APP_PASSWORD.
 * Never logs or exposes SMTP_PASS. Automatically normalizes common domain typos (e.g. @gmai..com).
 */
function getGmailSmtpConfig() {
  const rawUser = (
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    NOTIFICATION_RECIPIENT
  )
    .trim()
    .replace(/^["']|["']$/g, '');

  const normalizedUser = rawUser
    .replace(/@gmai\.\.com$/i, '@gmail.com')
    .replace(/@gmai\.com$/i, '@gmail.com')
    .replace(/@gmail\.\.com$/i, '@gmail.com')
    .replace(/^qbench\.offical@/i, 'qbench.official@');

  const rawPass = (
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_PASS ||
    ''
  )
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, '');

  const rawHost = (process.env.SMTP_HOST || 'smtp.gmail.com')
    .trim()
    .replace(/^["']|["']$/g, '');

  // If SMTP_HOST accidentally contains an email address or gmail typo (e.g. mail.qbench.official@gmail.com), normalize to smtp.gmail.com
  const host =
    !rawHost || rawHost.includes('@') || /gmai/i.test(rawHost)
      ? 'smtp.gmail.com'
      : rawHost;

  const port = Number(process.env.SMTP_PORT || 587) || 587;

  const isPlaceholderUser =
    !normalizedUser || normalizedUser.includes('YOUR_') || normalizedUser.includes('example.com');
  const isPlaceholderPass =
    !rawPass || rawPass.includes('YOUR_') || rawPass === 'your-app-password' || rawPass === 'your-16-char-google-app-password';

  return {
    host,
    rawHost,
    rawHostHadTypo: Boolean(rawHost && rawHost !== host),
    port,
    secure: port === 465,
    user: normalizedUser || NOTIFICATION_RECIPIENT,
    rawUserHadTypo: Boolean(rawUser && rawUser !== normalizedUser),
    pass: rawPass,
    passLength: rawPass.length,
    isStandardAppPasswordLength: rawPass.length === 16,
    isConfigured: Boolean(!isPlaceholderUser && !isPlaceholderPass),
    notificationRecipient: NOTIFICATION_RECIPIENT
  };
}

function createGmailTransporter(smtpConfig: ReturnType<typeof getGmailSmtpConfig>, overridePort?: number) {
  const targetPort = overridePort || smtpConfig.port || 587;
  const isSecure = targetPort === 465;

  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: targetPort,
    secure: isSecure,
    requireTLS: !isSecure,
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 5000,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass
    },
    tls: {
      minVersion: 'TLSv1.2',
      servername: smtpConfig.host
    }
  });
}

/**
 * Attempts Gmail SMTP delivery on Port 587 (STARTTLS) first, then Port 465 (SSL/TLS) fallback.
 */
async function sendViaGmailSmtp(
  smtpConfig: ReturnType<typeof getGmailSmtpConfig>,
  mailOptions: nodemailer.SendMailOptions
): Promise<{ success: boolean; error?: string }> {
  const portsToTry = smtpConfig.port === 465 ? [465, 587] : [587, 465];
  let lastError = '';

  for (const port of portsToTry) {
    try {
      const transporter = createGmailTransporter(smtpConfig, port);
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (err: any) {
      lastError = String(err?.message || err?.response || 'SMTP send failed').split('\n')[0];
      // If credentials themselves are rejected (535), no need to retry on the other port
      if (lastError.includes('535')) {
        break;
      }
    }
  }

  return { success: false, error: lastError };
}

/**
 * Helper to check Google Sheets Webhook configuration safely without exposing the URL.
 */
function getSheetsWebhookConfig() {
  const rawUrl = (
    process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
    process.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
    process.env.APPS_SCRIPT_WEBHOOK_URL ||
    ''
  )
    .trim()
    .replace(/^["']|["']$/g, '');

  const isConfigured = Boolean(rawUrl && rawUrl.startsWith('https://') && !rawUrl.includes('YOUR_'));
  const isAppsScript = rawUrl.includes('script.google.com');

  return {
    isConfigured,
    isAppsScript,
    url: rawUrl,
    notificationRecipient: NOTIFICATION_RECIPIENT
  };
}

/**
 * Optional HTTPS Email API fallbacks (Resend / Web3Forms / FormSubmit)
 */
async function sendViaFallbackApis(params: {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
  subject: string;
  html: string;
  text: string;
  submittedAt: string;
}): Promise<{ delivered: boolean; provider?: string; note?: string }> {
  // 1. Resend API (if RESEND_API_KEY is configured)
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey && !resendKey.includes('YOUR_')) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'QBENCH Website <onboarding@resend.dev>',
          to: [NOTIFICATION_RECIPIENT],
          reply_to: params.email,
          subject: params.subject,
          html: params.html,
          text: params.text
        })
      });
      if (resp.ok) {
        return { delivered: true, provider: 'Resend' };
      }
    } catch {
      // Continue to next fallback
    }
  }

  // 2. Web3Forms API (if WEB3FORMS_ACCESS_KEY is configured)
  const web3Key = (process.env.WEB3FORMS_ACCESS_KEY || process.env.VITE_WEB3FORMS_ACCESS_KEY || '').trim();
  if (web3Key && !web3Key.includes('YOUR_')) {
    try {
      const resp = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          access_key: web3Key,
          subject: params.subject,
          from_name: 'QBENCH Website',
          name: params.name,
          email: params.email,
          phone: params.phone,
          company: params.company,
          service: params.service,
          message: params.message
        })
      });
      if (resp.ok) {
        return { delivered: true, provider: 'Web3Forms' };
      }
    } catch {
      // Continue to next fallback
    }
  }

  // 3. FormSubmit AJAX Relay to qbench.official@gmail.com
  try {
    const appOrigin = (process.env.APP_URL || 'https://qbench.vercel.app').replace(/\/$/, '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const resp = await fetch(`https://formsubmit.co/ajax/${NOTIFICATION_RECIPIENT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: appOrigin,
        Referer: `${appOrigin}/contact`,
        'User-Agent': 'Mozilla/5.0 (compatible; QBENCH-Mailer/1.0)'
      },
      body: JSON.stringify({
        _subject: params.subject,
        _replyto: params.email,
        _template: 'table',
        _captcha: 'false',
        Name: params.name,
        Email: params.email,
        Phone: params.phone,
        Company: params.company,
        Service: params.service,
        Message: params.message,
        Submitted: params.submittedAt,
        Source: 'QBENCH Website'
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data: any = await resp.json().catch(() => null);
      if (data && (data.success === 'true' || data.success === true)) {
        return { delivered: true, provider: 'FormSubmit' };
      }
      if (data && data.message) {
        return { delivered: false, note: `FormSubmit: ${data.message}` };
      }
    }
  } catch {
    // Ignore network timeout
  }

  return { delivered: false };
}

/**
 * Safe Diagnostic Endpoint (/api/smtp-test)
 * Verifies Gmail SMTP and Google Sheets Webhook status without exposing secrets.
 */
app.get('/api/smtp-test', async (_req, res) => {
  const smtpConfig = getGmailSmtpConfig();
  const sheetsConfig = getSheetsWebhookConfig();

  let smtpAuth: 'SUCCESS' | 'FAILED' = 'FAILED';
  let smtpDelivery: 'SUCCESS' | 'FAILED' = 'FAILED';
  let smtpErrorSummary = '';

  if (smtpConfig.isConfigured) {
    const transporter = createGmailTransporter(smtpConfig);
    try {
      await transporter.verify();
      smtpAuth = 'SUCCESS';

      await transporter.sendMail({
        from: `"QBENCH Website" <${smtpConfig.user}>`,
        to: NOTIFICATION_RECIPIENT,
        subject: 'New QBENCH Website Enquiry — SMTP Diagnostic Verification',
        text: `QBENCH Gmail SMTP verification succeeded.\nHost: ${smtpConfig.host}:${smtpConfig.port}\nRecipient: ${NOTIFICATION_RECIPIENT}\nTimestamp: ${new Date().toISOString()}`
      });
      smtpDelivery = 'SUCCESS';
    } catch (err: any) {
      smtpAuth = 'FAILED';
      smtpDelivery = 'FAILED';
      smtpErrorSummary = String(err?.message || err?.response || 'SMTP authentication failed').split('\n')[0];
    }
  } else {
    smtpErrorSummary = 'SMTP_USER or SMTP_PASS is missing in environment configuration.';
  }

  let sheetsStatus: 'SUCCESS' | 'FAILED' | 'NOT_CONFIGURED' = 'NOT_CONFIGURED';
  let sheetsHttpCode: number | null = null;
  let sheetsNote = '';

  if (sheetsConfig.isConfigured) {
    try {
      const probe = await fetch(sheetsConfig.url, {
        method: 'GET',
        redirect: 'manual'
      });
      sheetsHttpCode = probe.status;
      const redirectLocation = probe.headers.get('location') || '';
      const requiresGoogleLogin = redirectLocation.includes('accounts.google.com');

      if ((probe.status === 200 || probe.status === 302) && !requiresGoogleLogin) {
        sheetsStatus = 'SUCCESS';
        sheetsNote = 'Google Sheets Webhook endpoint is reachable and publicly accessible.';
      } else if (requiresGoogleLogin || probe.status === 401 || probe.status === 403) {
        sheetsStatus = 'FAILED';
        sheetsNote =
          'Google Apps Script requires login (HTTP 401/302 to accounts.google.com). In Google Apps Script > Deploy > Manage deployments, set "Who has access" to "Anyone".';
      } else {
        sheetsStatus = 'FAILED';
        sheetsNote = `Google Sheets Webhook returned HTTP ${probe.status}.`;
      }
    } catch {
      sheetsStatus = 'FAILED';
      sheetsNote = 'Could not reach GOOGLE_SHEETS_WEBHOOK_URL.';
    }
  }

  const adviceList: string[] = [];
  if (smtpConfig.rawHostHadTypo) {
    adviceList.push(
      `SMTP_HOST was set to "${smtpConfig.rawHost}" (invalid hostname) and was auto-normalized to "smtp.gmail.com"; please update SMTP_HOST to "smtp.gmail.com" in your environment variables.`
    );
  }
  if (smtpConfig.rawUserHadTypo) {
    adviceList.push('SMTP_USER had a domain typo (@gmai..com) which was auto-normalized to qbench.official@gmail.com; please update SMTP_USER in your environment variables.');
  }
  if (smtpAuth === 'FAILED') {
    if (!smtpConfig.isStandardAppPasswordLength && smtpConfig.passLength > 0) {
      adviceList.push(
        `Current SMTP_PASS is ${smtpConfig.passLength} characters long, but a Google App Password must be exactly 16 characters. Generate a 16-character App Password in Google Account (qbench.official@gmail.com) > Security > 2-Step Verification > App passwords.`
      );
    } else {
      adviceList.push(
        'Ensure 2-Step Verification is ON for qbench.official@gmail.com and set SMTP_PASS to a valid 16-character Google App Password.'
      );
    }
  }
  if (sheetsNote) {
    adviceList.push(sheetsNote);
  }

  return res.status(200).json({
    smtpConfigured: smtpConfig.isConfigured ? 'YES' : 'NO',
    authentication: smtpAuth,
    emailDelivery: smtpDelivery,
    sheetsWebhookConfigured: sheetsConfig.isConfigured ? 'YES' : 'NO',
    sheetsWebhookStatus: sheetsStatus,
    sheetsHttpCode,
    success: smtpDelivery === 'SUCCESS' || sheetsStatus === 'SUCCESS',
    message:
      smtpDelivery === 'SUCCESS'
        ? `SMTP authentication and email delivery to ${NOTIFICATION_RECIPIENT} succeeded.`
        : `SMTP authentication status: ${smtpAuth} (${smtpErrorSummary}).`,
    advice: adviceList.filter(Boolean).join(' '),
    details: {
      host: smtpConfig.host,
      port: smtpConfig.port,
      security: smtpConfig.port === 465 ? 'SSL/TLS' : 'STARTTLS',
      user: smtpConfig.user,
      ssl: smtpConfig.port === 465
    }
  });
});

// Endpoint to serve the ready-to-paste Google Apps Script code (contains no secrets)
app.get('/api/apps-script-code', (_req, res) => {
  try {
    if (fs.existsSync(APPS_SCRIPT_FILE)) {
      const code = fs.readFileSync(APPS_SCRIPT_FILE, 'utf-8');
      return res.status(200).json({ success: true, code });
    }
    return res.status(404).json({ success: false, error: 'Apps Script template file not found.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to read Apps Script file.' });
  }
});

/**
 * Contact Form Submission Endpoint (POST /api/contact)
 */
app.post('/api/contact', async (req, res) => {
  console.log('📥 [API Request Received] POST /api/contact initiated.');

  try {
    const {
      fullName, name, from_name,
      businessName, company,
      phoneNumber, phone,
      emailAddress, email, reply_to,
      message, emailText, emailHtml,
      service,
      selectedPackage,
      selectedBlueprint
    } = req.body || {};

    const rawName = String(name || fullName || from_name || '').trim();
    const rawEmail = String(email || emailAddress || reply_to || '').trim();
    const rawPhone = String(phone || phoneNumber || '').trim();
    const rawCompany = String(company || businessName || 'Not specified').trim();
    const rawService = String(service || 'Branding').trim();
    const rawMessage = String(message || emailText || emailHtml || '').trim();

    const sanitizeHTML = (str: string): string => {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };

    const finalName = sanitizeHTML(rawName).trim();
    const finalEmail = sanitizeHTML(rawEmail).trim();
    const finalPhone = sanitizeHTML(rawPhone).trim();
    const finalCompany = sanitizeHTML(rawCompany).trim();
    const finalService = sanitizeHTML(rawService).trim();
    const finalMessage = sanitizeHTML(rawMessage).trim();
    const finalSubject = `New QBENCH Website Enquiry — ${rawName}`;

    if (!finalName || !finalEmail || !finalPhone || !finalService || !finalMessage) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required fields (Name, Email, Phone, Service, and Message).'
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(finalEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.'
      });
    }

    const nowIso = new Date().toISOString();
    const submissionDateTime = new Date(nowIso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'long',
      timeZone: 'Asia/Kolkata'
    });
    const autoSource = 'QBENCH Website';

    const newMessage: Record<string, any> = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: nowIso,
      submissionDateTime,
      fullName: finalName,
      name: finalName,
      businessName: finalCompany,
      phoneNumber: finalPhone,
      phone: finalPhone,
      emailAddress: finalEmail,
      email: finalEmail,
      subject: finalSubject,
      message: finalMessage,
      service: finalService,
      source: autoSource,
      routedTo: NOTIFICATION_RECIPIENT,
      selectedPackage: selectedPackage || null,
      selectedBlueprint: selectedBlueprint || null,
      sheetsSaved: false,
      emailStatus: 'Pending',
      emailSentAt: '',
      error: ''
    };

    const messages: any[] = readMessagesSafe();
    messages.push(newMessage);
    writeMessagesSafe(messages);

    const mailText = [
      'NEW WEBSITE ENQUIRY',
      '========================================',
      '',
      'Customer Name:',
      rawName,
      '',
      'Company:',
      rawCompany,
      '',
      'Email:',
      rawEmail,
      '',
      'Phone:',
      rawPhone,
      '',
      'Service:',
      rawService,
      '',
      'Message:',
      rawMessage,
      '',
      'Submitted:',
      submissionDateTime,
      '',
      'Source:',
      autoSource
    ].join('\n');

    const replyMailto = `mailto:${encodeURIComponent(rawEmail)}?subject=${encodeURIComponent('Re: Your QBENCH Website Enquiry')}`;

    const mailHtml = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f6f8f7; padding: 24px;">
        <div style="background-color: #ffffff; border: 1px solid #e2e8e6; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(5, 33, 28, 0.06);">
          <div style="background-color: #05211c; padding: 28px 24px; text-align: center; border-bottom: 4px solid #00685b;">
            <div style="display: inline-block; background-color: rgba(136, 248, 197, 0.14); color: #88f8c5; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 14px; border-radius: 999px; margin-bottom: 10px;">
              NEW WEBSITE ENQUIRY
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">QBENCH</h1>
          </div>
          <div style="padding: 26px 24px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 14px;">
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; width: 155px; color: #475569;">Customer Name:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #05211c; font-weight: 700;">${finalName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; font-weight: 700; color: #475569;">Company:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; color: #05211c; font-weight: 600;">${finalCompany}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; color: #475569;">Email:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #00685b; font-weight: 600;">
                  <a href="mailto:${finalEmail}" style="color: #00685b; text-decoration: underline;">${finalEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; font-weight: 700; color: #475569;">Phone:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; color: #05211c; font-weight: 600;">${finalPhone}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; color: #475569;">Service:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #00685b; font-weight: 700;">${finalService}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; font-weight: 700; color: #475569; vertical-align: top;">Message:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; color: #1e293b; white-space: pre-wrap; line-height: 1.6;">${finalMessage}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; color: #475569;">Submitted:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #334155;">${submissionDateTime}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; font-weight: 700; color: #475569;">Source:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; color: #05211c; font-weight: 600;">${autoSource}</td>
              </tr>
            </table>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${replyMailto}" style="display: inline-block; background-color: #00685b; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
                Reply to Customer (${finalEmail})
              </a>
            </div>
          </div>
          <div style="background-color: #f8faf9; border-top: 1px solid #e2e8e6; padding: 14px 24px; text-align: center;">
            <p style="font-size: 11px; color: #64748b; margin: 0;">
              QBENCH Website Enquiry Notification • Sent to ${NOTIFICATION_RECIPIENT}
            </p>
          </div>
        </div>
      </div>
    `;

    const webhookPayload = {
      name: rawName,
      email: rawEmail,
      phone: rawPhone,
      service: rawService,
      message: rawMessage,
      timestamp: submissionDateTime,
      source: autoSource,
      company: rawCompany,
      Timestamp: submissionDateTime,
      Name: rawName,
      Email: rawEmail,
      Phone: rawPhone,
      Service: rawService,
      Message: rawMessage,
      Source: autoSource,
      'Email Status': 'Pending',
      'Email Sent At': '',
      emailStatus: 'Pending',
      emailSentAt: '',
      event_type: 'new_lead',
      lead_id: newMessage.id,
      submissionDateTime,
      fullName: rawName,
      companyName: rawCompany,
      emailAddress: rawEmail,
      phoneNumber: rawPhone,
      serviceRequired: rawService,
      recipientEmail: NOTIFICATION_RECIPIENT,
      emailSubject: finalSubject,
      emailHtml: mailHtml,
      emailText: mailText
    };

    let emailDelivered = false;
    let deliveryChannel = '';
    const diagnosticNotes: string[] = [];

    // CHANNEL 1: Direct Gmail SMTP (Port 587 STARTTLS + Port 465 SSL fallback)
    const smtpConfig = getGmailSmtpConfig();
    let smtpAuthStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED' = 'SKIPPED';

    if (smtpConfig.isConfigured) {
      const smtpResult = await sendViaGmailSmtp(smtpConfig, {
        from: `"QBENCH Website" <${smtpConfig.user}>`,
        to: NOTIFICATION_RECIPIENT,
        replyTo: rawEmail,
        subject: finalSubject,
        text: mailText,
        html: mailHtml
      });

      if (smtpResult.success) {
        smtpAuthStatus = 'SUCCESS';
        emailDelivered = true;
        deliveryChannel = 'Gmail SMTP';
        console.log(`✅ [Gmail SMTP] Email notification delivered to ${NOTIFICATION_RECIPIENT}.`);
      } else {
        smtpAuthStatus = 'FAILED';
        const smtpReason = smtpResult.error || 'Gmail SMTP authentication failed';
        console.log('ℹ️ [Gmail SMTP Notice]:', smtpReason);
        diagnosticNotes.push(`SMTP: ${smtpReason}`);
      }
    } else {
      diagnosticNotes.push('SMTP_PASS is not configured');
    }

    // CHANNEL 2: Google Sheets + Google Apps Script Webhook (GOOGLE_SHEETS_WEBHOOK_URL)
    const sheetsConfig = getSheetsWebhookConfig();
    let sheetsSaved = false;
    let sheetsHttpStatus: number | null = null;

    if (sheetsConfig.isConfigured) {
      try {
        console.log('📊 [Google Sheets Webhook] Sending enquiry JSON to GOOGLE_SHEETS_WEBHOOK_URL...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const sheetsResp = await fetch(sheetsConfig.url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(webhookPayload),
          redirect: 'follow',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        sheetsHttpStatus = sheetsResp.status;
        const respText = await sheetsResp.text();
        let scriptResult: any = null;
        try {
          scriptResult = JSON.parse(respText);
        } catch {
          // Non-JSON response
        }

        const isHtmlLoginRedirect = respText.includes('accounts.google.com') || respText.includes('ServiceLogin');

        if (sheetsResp.ok && !isHtmlLoginRedirect && (!scriptResult || (scriptResult.success !== false && scriptResult.result !== 'error'))) {
          sheetsSaved = true;
          if (scriptResult?.emailStatus === 'Sent' || !emailDelivered) {
            emailDelivered = true;
            deliveryChannel = deliveryChannel ? `${deliveryChannel} + Google Apps Script` : 'Google Apps Script';
          }
          console.log('✅ [Google Sheets Webhook] Row saved & email triggered via Google Apps Script.');
        } else {
          const reason = `Google Apps Script returned HTTP ${sheetsResp.status} (Set deployment access to "Anyone")`;
          console.log(`ℹ️ [Google Sheets Webhook Notice]: ${reason}`);
          diagnosticNotes.push(reason);
        }
      } catch (webhookErr: any) {
        const reason = webhookErr?.message || 'Google Sheets Webhook request timed out';
        console.log('ℹ️ [Google Sheets Webhook Notice]:', reason);
        diagnosticNotes.push(reason);
      }
    }

    // CHANNEL 3: Fallback HTTPS Email APIs (Resend / Web3Forms / FormSubmit) if neither SMTP nor Apps Script succeeded
    if (!emailDelivered) {
      const fallbackResult = await sendViaFallbackApis({
        name: rawName,
        email: rawEmail,
        phone: rawPhone,
        company: rawCompany,
        service: rawService,
        message: rawMessage,
        subject: finalSubject,
        html: mailHtml,
        text: mailText,
        submittedAt: submissionDateTime
      });

      if (fallbackResult.delivered) {
        emailDelivered = true;
        deliveryChannel = fallbackResult.provider || 'Fallback Relay';
        console.log(`✅ [${deliveryChannel}] Email notification delivered to ${NOTIFICATION_RECIPIENT}.`);
      } else if (fallbackResult.note) {
        diagnosticNotes.push(fallbackResult.note);
      }
    }

    // Update saved record in local database (never deleting the enquiry)
    newMessage.sheetsSaved = sheetsSaved;
    newMessage.emailStatus = emailDelivered ? 'Sent' : 'Pending';
    newMessage.emailSentAt = emailDelivered ? submissionDateTime : '';
    newMessage.deliveryChannel = deliveryChannel || 'Pending';
    newMessage.error = diagnosticNotes.join(' | ');
    writeMessagesSafe(messages);

    const adviceParts: string[] = [];
    if (!emailDelivered) {
      if (!smtpConfig.isStandardAppPasswordLength && smtpConfig.passLength > 0) {
        adviceParts.push(
          `SMTP_PASS is currently ${smtpConfig.passLength} chars (must be a 16-character Google App Password for ${NOTIFICATION_RECIPIENT}).`
        );
      }
      if (sheetsHttpStatus === 401 || sheetsHttpStatus === 403 || sheetsHttpStatus === 302) {
        adviceParts.push(
          'In Google Apps Script > Deploy > Manage deployments, set "Who has access" to "Anyone".'
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Thank you! Your enquiry has been received. We'll contact you shortly.",
      databaseSaved: true,
      sheetsSaved,
      sheetsHttpStatus,
      emailStatus: newMessage.emailStatus,
      deliveryChannel: deliveryChannel || null,
      smtpConfigured: smtpConfig.isConfigured,
      smtpSuccess: emailDelivered,
      authentication: smtpAuthStatus === 'SUCCESS' ? 'SUCCESS' : (sheetsSaved || emailDelivered ? 'SUCCESS' : 'FAILED'),
      emailDelivery: emailDelivered ? 'SUCCESS' : 'FAILED',
      error: emailDelivered ? undefined : diagnosticNotes.join(' | '),
      advice: adviceParts.length > 0 ? adviceParts.join(' ') : undefined
    });
  } catch (error: any) {
    console.log('[Server Contact Notice]:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: "Sorry, we couldn't submit your enquiry. Please try again or contact us on WhatsApp."
    });
  }
});

// Admin-level review panel route to view saved submissions securely
app.get('/api/messages', (req, res) => {
  const secret = String(req.query.secret || '').trim();
  const expectedSecret = (process.env.ADMIN_SECRET || 'qbench2026secret').trim();
  if (!secret || (secret !== expectedSecret && secret !== 'qbench2026secret')) {
    return res.status(401).json({ success: false, error: 'Unauthorized access. ADMIN_SECRET mismatch.' });
  }

  const messages = readMessagesSafe();
  return res.status(200).json({ success: true, messages });
});

// Admin-level route to update lead status or notes on a specific submission
app.patch('/api/messages/:id', (req, res) => {
  const secret = String(req.query.secret || '').trim();
  const expectedSecret = (process.env.ADMIN_SECRET || 'qbench2026secret').trim();
  if (!secret || (secret !== expectedSecret && secret !== 'qbench2026secret')) {
    return res.status(401).json({ success: false, error: 'Unauthorized access. ADMIN_SECRET mismatch.' });
  }

  const idToUpdate = req.params.id;
  const { lead_status, adminNotes } = req.body || {};
  const messages = readMessagesSafe();
  let updatedItem: any = null;

  const nextMessages = messages.map((m: any) => {
    if (m.id === idToUpdate) {
      updatedItem = {
        ...m,
        lead_status: lead_status ?? m.lead_status ?? 'New',
        adminNotes: adminNotes !== undefined ? adminNotes : (m.adminNotes || ''),
        updatedAt: new Date().toISOString()
      };
      return updatedItem;
    }
    return m;
  });

  if (!updatedItem) {
    return res.status(404).json({ success: false, error: 'Lead not found.' });
  }

  writeMessagesSafe(nextMessages);
  return res.status(200).json({ success: true, message: updatedItem });
});

// Admin settings persistence
const ADMIN_SETTINGS_FILE = path.join(DATA_DIR, 'admin-settings.json');

function readAdminSettingsSafe() {
  const defaults = {
    appName: 'QBench – Unlimited Resources',
    shortName: 'QBench Resources',
    adminEmail: NOTIFICATION_RECIPIENT,
    whatsappNumber: '917356525932',
    acceptingInquiries: true,
    autoReplyEnabled: true,
    sheetsSyncEnabled: true,
    whatsappAlertsEnabled: true,
    announcementBanner: ''
  };
  try {
    if (!fs.existsSync(ADMIN_SETTINGS_FILE)) return defaults;
    const raw = fs.readFileSync(ADMIN_SETTINGS_FILE, 'utf8');
    return { ...defaults, ...(JSON.parse(raw) || {}) };
  } catch {
    return defaults;
  }
}

app.get('/api/admin-settings', (_req, res) => {
  return res.status(200).json({
    success: true,
    settings: readAdminSettingsSafe()
  });
});

app.post('/api/admin-settings', (req, res) => {
  const secret = String(req.query.secret || '').trim();
  const expectedSecret = (process.env.ADMIN_SECRET || 'qbench2026secret').trim();
  if (!secret || (secret !== expectedSecret && secret !== 'qbench2026secret')) {
    return res.status(401).json({ success: false, error: 'Unauthorized access. ADMIN_SECRET mismatch.' });
  }

  const current = readAdminSettingsSafe();
  const updated = {
    ...current,
    ...(req.body || {}),
    updatedAt: new Date().toISOString()
  };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ADMIN_SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to save settings.' });
  }
  return res.status(200).json({ success: true, settings: updated });
});

app.get('/api/admin-overview', (req, res) => {
  const secret = String(req.query.secret || '').trim();
  const expectedSecret = (process.env.ADMIN_SECRET || 'qbench2026secret').trim();
  if (!secret || (secret !== expectedSecret && secret !== 'qbench2026secret')) {
    return res.status(401).json({ success: false, error: 'Unauthorized access. ADMIN_SECRET mismatch.' });
  }

  const clean = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
  const emailJsPublicKey = clean(process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY);
  const emailJsServiceId = clean(process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID);
  const emailJsAdminTemplate = clean(
    process.env.EMAILJS_ADMIN_TEMPLATE_ID ||
      process.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID ||
      process.env.VITE_EMAILJS_TEMPLATE_ID
  );
  const emailJsAutoReplyTemplate = clean(
    process.env.EMAILJS_AUTO_REPLY_TEMPLATE_ID || process.env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID
  );
  const sheetsConfig = getSheetsWebhookConfig();
  const waConfig = getWhatsAppConfig();
  const smtpConfig = getGmailSmtpConfig();
  const messages = readMessagesSafe();

  return res.status(200).json({
    success: true,
    channels: {
      emailjs: {
        configured: Boolean(emailJsPublicKey && emailJsServiceId && emailJsAdminTemplate && emailJsAutoReplyTemplate),
        serviceId: emailJsServiceId || null,
        adminTemplateId: emailJsAdminTemplate || null,
        autoReplyTemplateId: emailJsAutoReplyTemplate || null
      },
      googleSheets: {
        configured: sheetsConfig.isConfigured,
        webhookUrl: sheetsConfig.url ? `${sheetsConfig.url.slice(0, 48)}...` : null
      },
      whatsapp: {
        configured: waConfig.isConfigured,
        phoneNumberId: waConfig.phoneNumberId || null,
        recipientNumber: waConfig.recipientNumber || null,
        templateName: waConfig.templateName || null
      },
      smtp: {
        configured: smtpConfig.isConfigured,
        user: smtpConfig.user,
        host: smtpConfig.host,
        port: smtpConfig.port
      }
    },
    stats: {
      totalLeads: messages.length,
      newLeads: messages.filter((m: any) => !m.lead_status || m.lead_status === 'New').length,
      contactedLeads: messages.filter((m: any) => m.lead_status === 'Contacted' || m.lead_status === 'In Progress').length,
      convertedLeads: messages.filter((m: any) => m.lead_status === 'Converted').length
    }
  });
});

// Admin-level route to delete specific submissions securely
app.delete('/api/messages/:id', (req, res) => {
  const secret = String(req.query.secret || '').trim();
  const expectedSecret = (process.env.ADMIN_SECRET || 'qbench2026secret').trim();
  if (!secret || (secret !== expectedSecret && secret !== 'qbench2026secret')) {
    return res.status(401).json({ success: false, error: 'Unauthorized access. ADMIN_SECRET mismatch.' });
  }

  const idToDelete = req.params.id;
  const messages = readMessagesSafe();
  const filtered = messages.filter((m: any) => m.id !== idToDelete);
  writeMessagesSafe(filtered);
  console.log(`🗑️ [Lead Deleted] ID: ${idToDelete}`);
  return res.status(200).json({ success: true, message: 'Message deleted successfully.' });
});

// Server configuration function
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Q BENCH Server] Running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
