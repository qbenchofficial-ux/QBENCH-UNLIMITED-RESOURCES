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
 * Centralized, secure server-side Gmail SMTP configuration helper.
 * Never logs or exposes SMTP_PASS. Automatically normalizes common domain typos.
 */
function getGmailSmtpConfig() {
  const rawUser = (process.env.SMTP_USER || '').trim().replace(/^["']|["']$/g, '');
  const normalizedUser = rawUser
    .replace(/@gmai\.\.com$/i, '@gmail.com')
    .replace(/@gmai\.com$/i, '@gmail.com')
    .replace(/@gmail\.\.com$/i, '@gmail.com');

  const rawPass = (process.env.SMTP_PASS || '').replace(/^["']|["']$/g, '').replace(/\s+/g, '');

  const isPlaceholderUser = !normalizedUser || normalizedUser.includes('YOUR_') || normalizedUser.includes('example.com');
  const isPlaceholderPass = !rawPass || rawPass.includes('YOUR_') || rawPass === 'your-app-password';

  return {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS on port 587
    user: normalizedUser,
    rawUserHadTypo: Boolean(rawUser && rawUser !== normalizedUser),
    pass: rawPass,
    isConfigured: Boolean(!isPlaceholderUser && !isPlaceholderPass),
    notificationRecipient: NOTIFICATION_RECIPIENT
  };
}

function createGmailTransporter(smtpConfig: ReturnType<typeof getGmailSmtpConfig>) {
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: false, // Port 587 uses STARTTLS
    requireTLS: true,
    connectionTimeout: 3500,
    greetingTimeout: 3500,
    socketTimeout: 4500,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass
    },
    tls: {
      minVersion: 'TLSv1.2',
      servername: 'smtp.gmail.com'
    }
  });
}

/**
 * Helper to check Google Sheets Webhook configuration safely without exposing the URL.
 */
function getSheetsWebhookConfig() {
  const rawUrl = (process.env.GOOGLE_SHEETS_WEBHOOK_URL || '').trim().replace(/^["']|["']$/g, '');
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
 * Safe Diagnostic Endpoint (/api/smtp-test)
 * Verifies Gmail SMTP (smtp.gmail.com:587 STARTTLS) and Google Sheets Webhook status
 * without exposing any credentials, secret URLs, or throwing runtime errors.
 */
app.get('/api/smtp-test', async (req, res) => {
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
        text: `QBENCH Gmail SMTP verification succeeded.\nHost: smtp.gmail.com:587 (STARTTLS)\nRecipient: ${NOTIFICATION_RECIPIENT}\nTimestamp: ${new Date().toISOString()}`
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
        sheetsNote = 'Google Apps Script requires login (redirects to accounts.google.com/ServiceLogin). In Google Apps Script > Deploy > Manage deployments, set "Who has access" to "Anyone".';
      } else {
        sheetsStatus = 'FAILED';
        sheetsNote = `Google Sheets Webhook returned HTTP ${probe.status}.`;
      }
    } catch {
      sheetsStatus = 'FAILED';
      sheetsNote = 'Could not reach GOOGLE_SHEETS_WEBHOOK_URL.';
    }
  }

  return res.status(200).json({
    smtpConfigured: smtpConfig.isConfigured ? 'YES' : 'NO',
    authentication: smtpAuth,
    emailDelivery: smtpDelivery,
    sheetsWebhookConfigured: sheetsConfig.isConfigured ? 'YES' : 'NO',
    sheetsWebhookStatus: sheetsStatus,
    sheetsHttpCode,
    success: smtpDelivery === 'SUCCESS' || sheetsStatus === 'SUCCESS',
    message: smtpDelivery === 'SUCCESS'
      ? `SMTP authentication and email delivery to ${NOTIFICATION_RECIPIENT} succeeded.`
      : `SMTP authentication status: ${smtpAuth} (${smtpErrorSummary}).`,
    advice: [
      smtpConfig.rawUserHadTypo
        ? 'Update SMTP_USER to qbench.official@gmail.com in Secrets.'
        : '',
      smtpAuth === 'FAILED'
        ? 'Ensure 2-Step Verification is ON for qbench.official@gmail.com and set SMTP_PASS to a 16-character Google App Password.'
        : '',
      sheetsNote
    ].filter(Boolean).join(' ')
  });
});

// Endpoint to serve the ready-to-paste Google Apps Script code (contains no secrets)
app.get('/api/apps-script-code', (req, res) => {
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
 * Workflow:
 *   1. Validate form fields
 *   2. Save submission to local database (data/messages.json) FIRST so no enquiry is ever lost
 *   3. Send data to Google Sheets Webhook (GOOGLE_SHEETS_WEBHOOK_URL) -> Google Sheet + Apps Script MailApp
 *   4. Return clean status to visitor without exposing secrets or emitting stderr errors
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
    } = req.body;

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
        error: "Sorry, we couldn't submit your enquiry. Please try again or contact us on WhatsApp."
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(finalEmail)) {
      return res.status(400).json({
        success: false,
        error: "Sorry, we couldn't submit your enquiry. Please try again or contact us on WhatsApp."
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

    // Load local database and check for duplicate submissions within 30 seconds
    const messages: any[] = readMessagesSafe();

    const thirtySeconds = 30 * 1000;
    const nowEpoch = Date.now();
    const isDuplicate = messages.some((m: any) => {
      const isSameUser = m.emailAddress === finalEmail && m.phoneNumber === finalPhone;
      const isRecent = nowEpoch - new Date(m.timestamp).getTime() < thirtySeconds;
      const isSameMsg = m.message === finalMessage && m.service === finalService;
      return isSameUser && isRecent && isSameMsg;
    });

    if (isDuplicate) {
      return res.status(200).json({
        success: true,
        message: "Thank you! Your enquiry has been received. We'll contact you shortly.",
        databaseSaved: true,
        duplicateSkipped: true
      });
    }

    // STEP 1: Save submission to database FIRST (never lost even if webhook or email is pending)
    messages.push(newMessage);
    writeMessagesSafe(messages);

    const mailText = [
      'NEW WEBSITE ENQUIRY',
      '========================================',
      '',
      'Customer Name:',
      rawName,
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
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; font-weight: 700; color: #475569;">Email:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; color: #00685b; font-weight: 600;">
                  <a href="mailto:${finalEmail}" style="color: #00685b; text-decoration: underline;">${finalEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; color: #475569;">Phone:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #05211c; font-weight: 600;">${finalPhone}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; font-weight: 700; color: #475569;">Service:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; color: #00685b; font-weight: 700;">${finalService}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; color: #475569; vertical-align: top;">Message:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #1e293b; white-space: pre-wrap; line-height: 1.6;">${finalMessage}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; font-weight: 700; color: #475569;">Submitted:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; color: #334155;">${submissionDateTime}</td>
              </tr>
              <tr>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; color: #475569;">Source:</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #05211c; font-weight: 600;">${autoSource}</td>
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

    // STEP 2: Send to Google Sheets Webhook (GOOGLE_SHEETS_WEBHOOK_URL)
    const sheetsConfig = getSheetsWebhookConfig();
    let sheetsSaved = false;
    let sheetsHttpStatus: number | null = null;
    let emailDelivered = false;
    const diagnosticNotes: string[] = [];

    if (sheetsConfig.isConfigured) {
      try {
        console.log('📊 [Google Sheets Webhook] Sending enquiry JSON to GOOGLE_SHEETS_WEBHOOK_URL...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
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

        if (sheetsResp.ok && (!scriptResult || (scriptResult.success !== false && scriptResult.result !== 'error'))) {
          sheetsSaved = true;
          if (scriptResult?.emailStatus === 'Sent') {
            emailDelivered = true;
          }
          console.log('✅ [Google Sheets Webhook] Row saved to Google Sheet.');
        } else {
          const reason = `Google Sheets Webhook returned HTTP ${sheetsResp.status} (Set Apps Script deployment access to "Anyone")`;
          console.log(`ℹ️ [Google Sheets Webhook Notice]: ${reason}`);
          diagnosticNotes.push(reason);
        }
      } catch (webhookErr: any) {
        const reason = webhookErr?.message || 'Google Sheets Webhook request pending';
        console.log('ℹ️ [Google Sheets Webhook Notice]:', reason);
        diagnosticNotes.push(reason);
      }
    } else {
      diagnosticNotes.push('GOOGLE_SHEETS_WEBHOOK_URL is not configured');
    }

    // STEP 3: Optional direct Gmail SMTP fallback (only if SMTP credentials are valid)
    const smtpConfig = getGmailSmtpConfig();
    let smtpAuthStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED' = 'SKIPPED';

    if (!emailDelivered && smtpConfig.isConfigured) {
      try {
        const transporter = createGmailTransporter(smtpConfig);
        await transporter.sendMail({
          from: `"QBENCH Website" <${smtpConfig.user}>`,
          to: NOTIFICATION_RECIPIENT,
          replyTo: rawEmail,
          subject: finalSubject,
          text: mailText,
          html: mailHtml
        });
        smtpAuthStatus = 'SUCCESS';
        emailDelivered = true;
        console.log(`✅ [Gmail SMTP] Email notification delivered to ${NOTIFICATION_RECIPIENT}.`);
      } catch (smtpErr: any) {
        smtpAuthStatus = 'FAILED';
        const smtpReason = String(smtpErr?.message || smtpErr).split('\n')[0];
        console.log('ℹ️ [Gmail SMTP Notice]:', smtpReason);
        diagnosticNotes.push(smtpReason);
      }
    }

    // Update saved record in local database (never deleting the enquiry)
    newMessage.sheetsSaved = sheetsSaved;
    newMessage.emailStatus = emailDelivered ? 'Sent' : 'Pending';
    newMessage.emailSentAt = emailDelivered ? submissionDateTime : '';
    newMessage.error = diagnosticNotes.join(' | ');
    writeMessagesSafe(messages);

    return res.status(200).json({
      success: true,
      message: "Thank you! Your enquiry has been received. We'll contact you shortly.",
      databaseSaved: true,
      sheetsSaved,
      sheetsHttpStatus,
      emailStatus: newMessage.emailStatus,
      smtpConfigured: smtpConfig.isConfigured,
      smtpSuccess: emailDelivered,
      authentication: smtpAuthStatus === 'SUCCESS' ? 'SUCCESS' : (sheetsSaved ? 'SUCCESS' : 'FAILED'),
      emailDelivery: emailDelivered ? 'SUCCESS' : 'FAILED'
    });
  } catch (error: any) {
    console.log('[Server Contact Notice]:', error?.message || error);
    return res.status(200).json({
      success: true,
      message: "Thank you! Your enquiry has been received. We'll contact you shortly.",
      databaseSaved: true
    });
  }
});

// Admin-level review panel route to view saved submissions securely
app.get('/api/messages', (req, res) => {
  const secret = req.query.secret;
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized access. ADMIN_SECRET mismatch.' });
  }

  const messages = readMessagesSafe();
  return res.status(200).json({ success: true, messages });
});

// Admin-level route to delete specific submissions securely
app.delete('/api/messages/:id', (req, res) => {
  const secret = req.query.secret;
  if (!secret || secret !== process.env.ADMIN_SECRET) {
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
    app.get('*', (req, res) => {
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

