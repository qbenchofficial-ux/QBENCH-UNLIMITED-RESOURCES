/**
 * ============================================================================
 * QBENCH WEBSITE — GOOGLE SHEETS + EMAIL NOTIFICATION APPS SCRIPT (Code.gs)
 * ============================================================================
 * Required Flow:
 *   Visitor fills the form
 *   ↓
 *   Clicks Submit
 *   ↓
 *   Website sends the data to Google Apps Script (GOOGLE_SHEETS_WEBHOOK_URL)
 *   ↓
 *   Google Apps Script saves the data to Google Sheets
 *   ↓
 *   Google Apps Script automatically sends an email to qbench.official@gmail.com
 *   ↓
 *   Visitor sees: "Thank you! Your enquiry has been received. We'll contact you shortly."
 *
 * Google Sheets Columns:
 *   Timestamp | Name | Email | Phone | Service | Message | Source | Email Status | Email Sent At
 * ============================================================================
 */

// Always send the notification to qbench.official@gmail.com (never the customer's email)
const NOTIFICATION_EMAIL = 'qbench.official@gmail.com';
const DEFAULT_SOURCE = 'QBENCH Website';

// Required Google Sheets columns
const DEFAULT_HEADERS = [
  'Timestamp',
  'Name',
  'Email',
  'Phone',
  'Service',
  'Message',
  'Source',
  'Email Status',
  'Email Sent At'
];

/**
 * 1. WEBHOOK ENTRY POINT (POST GOOGLE_SHEETS_WEBHOOK_URL)
 * Receives enquiry data from the QBENCH website, appends a new row to Google Sheets
 * FIRST, then sends the HTML email notification to qbench.official@gmail.com,
 * and updates Email Status ("Sent" or "Failed") and Email Sent At.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);

  try {
    const payload = parseWebhookPayload_(e);

    const name = String(
      payload.name || payload.Name || payload.fullName || ''
    ).trim();
    const email = String(
      payload.email || payload.Email || payload.emailAddress || ''
    ).trim();
    const phone = String(
      payload.phone || payload.Phone || payload.phoneNumber || ''
    ).trim();
    const service = String(
      payload.service || payload.Service || payload.serviceRequired || 'General Enquiry'
    ).trim();
    const message = String(
      payload.message || payload.Message || ''
    ).trim();

    if (!name || !email || !phone || !service || !message) {
      return jsonResponse_({
        success: false,
        error: "Sorry, we couldn't submit your enquiry. Please try again or contact us on WhatsApp."
      });
    }

    const timestamp = formatSubmissionDate_(new Date());
    const source = DEFAULT_SOURCE;
    const leadId = String(payload.lead_id || payload.id || ('QB-' + new Date().getTime())).trim();

    // STEP 1: Open the Google Sheet and ensure required columns exist
    const sheet = getOrInitializeSheet_();
    const colMap = ensureHeaders_(sheet);

    // STEP 2: Save the enquiry to Google Sheets FIRST (never overwrite existing rows)
    const lastCol = Math.max(sheet.getLastColumn(), DEFAULT_HEADERS.length);
    const rowValues = new Array(lastCol).fill('');

    setCellByHeader_(rowValues, colMap, ['timestamp', 'date', 'submitted', 'submission date/time', 'submitted at'], timestamp);
    setCellByHeader_(rowValues, colMap, ['name', 'customer name', 'full name', 'fullname'], name);
    setCellByHeader_(rowValues, colMap, ['email', 'email address', 'emailaddress'], email);
    setCellByHeader_(rowValues, colMap, ['phone', 'phone number', 'phonenumber', 'whatsapp', 'phone/whatsapp'], phone);
    setCellByHeader_(rowValues, colMap, ['service', 'service requested', 'servicerequired'], service);
    setCellByHeader_(rowValues, colMap, ['message', 'enquiry', 'inquiry', 'details'], message);
    setCellByHeader_(rowValues, colMap, ['source'], source);
    setCellByHeader_(rowValues, colMap, ['status', 'lead status'], 'New');
    setCellByHeader_(rowValues, colMap, ['email status'], 'Pending');
    setCellByHeader_(rowValues, colMap, ['email sent at'], '');

    sheet.appendRow(rowValues);
    SpreadsheetApp.flush();

    const newRowIndex = sheet.getLastRow();

    // STEP 3: Automatically send email notification to qbench.official@gmail.com
    // Never delete the Google Sheet row if email delivery fails.
    const emailResult = sendEmailForRow_(sheet, newRowIndex, colMap, {
      leadId: leadId,
      customerName: name,
      email: email,
      phone: phone,
      service: service,
      message: message,
      submittedAt: timestamp,
      source: source
    });

    return jsonResponse_({
      success: true,
      message: "Thank you! Your enquiry has been received. We'll contact you shortly.",
      row: newRowIndex,
      leadId: leadId,
      timestamp: timestamp,
      source: source,
      emailStatus: emailResult.status,
      emailSentAt: emailResult.sentAt || ''
    });
  } catch (err) {
    const errorMsg = err && err.message ? err.message : String(err);
    console.error('[QBENCH doPost Error]: ' + errorMsg);
    return jsonResponse_({
      success: false,
      error: "Sorry, we couldn't submit your enquiry. Please try again or contact us on WhatsApp."
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 2. INSTALLABLE TRIGGER HANDLER (Optional fallback for On Change / On Form Submit)
 * Scans for any rows where "Email Status" is not yet "Sent" or "Failed"
 * and sends the email notification to qbench.official@gmail.com.
 */
function processPendingEnquiryEmails(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    return;
  }

  try {
    const sheet = getOrInitializeSheet_();
    const colMap = ensureHeaders_(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;

    const lastCol = sheet.getLastColumn();
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    const values = dataRange.getValues();

    for (let i = 0; i < values.length; i++) {
      const rowNumber = i + 2;
      const row = values[i];

      const emailStatusVal = String(getCellByHeader_(row, colMap, ['email status']) || '').trim();
      if (emailStatusVal === 'Sent' || emailStatusVal === 'Failed') {
        continue;
      }

      const name = String(getCellByHeader_(row, colMap, ['name', 'customer name', 'full name', 'fullname']) || '').trim();
      const email = String(getCellByHeader_(row, colMap, ['email', 'email address', 'emailaddress']) || '').trim();
      const phone = String(getCellByHeader_(row, colMap, ['phone', 'phone number', 'phonenumber', 'whatsapp', 'phone/whatsapp']) || '').trim();
      const service = String(getCellByHeader_(row, colMap, ['service', 'service requested', 'servicerequired']) || 'General Enquiry').trim();
      const message = String(getCellByHeader_(row, colMap, ['message', 'enquiry', 'inquiry', 'details']) || '').trim();
      const source = String(getCellByHeader_(row, colMap, ['source']) || DEFAULT_SOURCE).trim();
      const rawTimestamp = getCellByHeader_(row, colMap, ['timestamp', 'date', 'submitted', 'submission date/time', 'submitted at']);
      const submittedAt = formatSubmissionDate_(rawTimestamp || new Date());
      const leadId = 'ROW-' + rowNumber;

      if (!name && !email && !message) {
        continue;
      }

      sendEmailForRow_(sheet, rowNumber, colMap, {
        leadId: leadId,
        customerName: name || 'Website Visitor',
        email: email || 'Not provided',
        phone: phone || 'Not provided',
        service: service,
        message: message || 'No message provided.',
        submittedAt: submittedAt,
        source: source
      });
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * 3. MANUAL AUTHORIZATION & TEST FUNCTION
 * Run this function once in the Apps Script editor to authorize MailApp & SpreadsheetApp
 * and send a test notification email to qbench.official@gmail.com.
 */
function testQBenchEmailNotification() {
  const sheet = getOrInitializeSheet_();
  ensureHeaders_(sheet);

  const testDate = formatSubmissionDate_(new Date());
  const subject = 'New QBENCH Website Enquiry — Test Customer';
  const htmlBody = buildQBenchHtmlEmail_({
    customerName: 'Test Customer',
    email: 'customer@example.com',
    phone: '+91 7356525932',
    service: 'Branding',
    message: 'This is a verification test confirming that QBENCH Google Apps Script email notifications to qbench.official@gmail.com are authorized and working.',
    submittedAt: testDate,
    source: DEFAULT_SOURCE
  });

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    htmlBody: htmlBody,
    name: 'QBENCH Website'
  });

  Logger.log('Test email sent to ' + NOTIFICATION_EMAIL);
}

/**
 * Sends the HTML notification email to qbench.official@gmail.com
 * and updates "Email Status" ("Sent" | "Failed") and "Email Sent At".
 * Never deletes the Google Sheet row if email delivery fails.
 */
function sendEmailForRow_(sheet, rowNumber, colMap, data) {
  if (isAlreadySent_(data.leadId)) {
    const existingTime = formatSubmissionDate_(new Date());
    updateRowStatus_(sheet, rowNumber, colMap, 'Sent', existingTime, '');
    return { status: 'Sent', sentAt: existingTime };
  }

  // Subject: New QBENCH Website Enquiry — [Customer Name]
  const subject = 'New QBENCH Website Enquiry — ' + data.customerName;
  const htmlBody = buildQBenchHtmlEmail_(data);
  const plainTextBody = [
    'NEW WEBSITE ENQUIRY',
    '========================================',
    '',
    'Customer Name:',
    data.customerName,
    '',
    'Email:',
    data.email,
    '',
    'Phone:',
    data.phone,
    '',
    'Service:',
    data.service,
    '',
    'Message:',
    data.message,
    '',
    'Submitted:',
    data.submittedAt,
    '',
    'Source:',
    data.source || DEFAULT_SOURCE
  ].join('\n');

  try {
    const mailOptions = {
      to: NOTIFICATION_EMAIL, // Always qbench.official@gmail.com
      subject: subject,
      body: plainTextBody,
      htmlBody: htmlBody,
      name: 'QBENCH Website'
    };

    if (data.email && data.email.indexOf('@') !== -1) {
      mailOptions.replyTo = data.email;
    }

    MailApp.sendEmail(mailOptions);

    const sentAt = formatSubmissionDate_(new Date());
    updateRowStatus_(sheet, rowNumber, colMap, 'Sent', sentAt, '');
    markAsSent_(data.leadId);
    return { status: 'Sent', sentAt: sentAt };
  } catch (err) {
    const errorMessage = err && err.message ? err.message : String(err);
    console.error('[QBENCH Email Send Failed for Row ' + rowNumber + ']: ' + errorMessage);
    // Keep the row in Google Sheets and mark Email Status = Failed
    updateRowStatus_(sheet, rowNumber, colMap, 'Failed', '', errorMessage);
    return { status: 'Failed', sentAt: '', error: errorMessage };
  }
}

/**
 * Builds the QBENCH HTML email with:
 * - NEW WEBSITE ENQUIRY heading
 * - Customer Name, Email, Phone, Service, Message, Submitted, Source
 * - "Reply to Customer" mailto button link using the customer's submitted email address
 */
function buildQBenchHtmlEmail_(data) {
  const safeName = escapeHtml_(data.customerName);
  const safeEmail = escapeHtml_(data.email);
  const safePhone = escapeHtml_(data.phone);
  const safeService = escapeHtml_(data.service);
  const safeMessage = escapeHtml_(data.message);
  const safeSubmitted = escapeHtml_(data.submittedAt);
  const safeSource = escapeHtml_(data.source || DEFAULT_SOURCE);
  const replySubject = encodeURIComponent('Re: Your QBENCH Website Enquiry');
  const replyMailto = 'mailto:' + encodeURIComponent(String(data.email || '').trim()) + '?subject=' + replySubject;

  return [
    '<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f6f8f7; padding: 24px;">',
      '<div style="background-color: #ffffff; border: 1px solid #e2e8e6; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(5, 33, 28, 0.06);">',
        '<!-- Header -->',
        '<div style="background-color: #05211c; padding: 28px 24px; text-align: center; border-bottom: 4px solid #00685b;">',
          '<div style="display: inline-block; background-color: rgba(136, 248, 197, 0.14); color: #88f8c5; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 14px; border-radius: 999px; margin-bottom: 10px;">',
            'NEW WEBSITE ENQUIRY',
          '</div>',
          '<h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">QBENCH</h1>',
        '</div>',

        '<!-- Enquiry Details -->',
        '<div style="padding: 26px 24px;">',
          '<table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 14px;">',
            '<tr>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; width: 155px; color: #475569;">Customer Name:</td>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #05211c; font-weight: 700;">' + safeName + '</td>',
            '</tr>',
            '<tr>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; font-weight: 700; color: #475569;">Email:</td>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; color: #00685b; font-weight: 600;">',
                '<a href="mailto:' + safeEmail + '" style="color: #00685b; text-decoration: underline;">' + safeEmail + '</a>',
              '</td>',
            '</tr>',
            '<tr>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; color: #475569;">Phone:</td>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #05211c; font-weight: 600;">' + safePhone + '</td>',
            '</tr>',
            '<tr>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; font-weight: 700; color: #475569;">Service:</td>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; color: #00685b; font-weight: 700;">' + safeService + '</td>',
            '</tr>',
            '<tr>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; color: #475569; vertical-align: top;">Message:</td>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #1e293b; white-space: pre-wrap; line-height: 1.6;">' + safeMessage + '</td>',
            '</tr>',
            '<tr>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; font-weight: 700; color: #475569;">Submitted:</td>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; color: #334155;">' + safeSubmitted + '</td>',
            '</tr>',
            '<tr>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; font-weight: 700; color: #475569;">Source:</td>',
              '<td style="padding: 12px 14px; border-bottom: 1px solid #edf2f0; background-color: #f8faf9; color: #05211c; font-weight: 600;">' + safeSource + '</td>',
            '</tr>',
          '</table>',

          '<!-- Reply to Customer CTA -->',
          '<div style="text-align: center; margin-top: 24px;">',
            '<a href="' + replyMailto + '" style="display: inline-block; background-color: #00685b; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px;">',
              'Reply to Customer (' + safeEmail + ')',
            '</a>',
          '</div>',
        '</div>',

        '<!-- Footer -->',
        '<div style="background-color: #f8faf9; border-top: 1px solid #e2e8e6; padding: 14px 24px; text-align: center;">',
          '<p style="font-size: 11px; color: #64748b; margin: 0;">',
            'QBENCH Website Enquiry Notification • Sent to ' + NOTIFICATION_EMAIL,
          '</p>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');
}

/**
 * Ensures required columns exist on Row 1:
 * Timestamp | Name | Email | Phone | Service | Message | Source | Email Status | Email Sent At
 */
function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(DEFAULT_HEADERS);
    SpreadsheetApp.flush();
  }

  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const colMap = {};

  for (let c = 0; c < rawHeaders.length; c++) {
    const h = String(rawHeaders[c] || '').trim().toLowerCase();
    if (h) {
      colMap[h] = c + 1;
    }
  }

  const requiredColumns = [
    { title: 'Timestamp', aliases: ['timestamp', 'date', 'submitted', 'submission date/time', 'submitted at'] },
    { title: 'Name', aliases: ['name', 'customer name', 'full name', 'fullname'] },
    { title: 'Email', aliases: ['email', 'email address', 'emailaddress'] },
    { title: 'Phone', aliases: ['phone', 'phone number', 'phonenumber', 'whatsapp', 'phone/whatsapp'] },
    { title: 'Service', aliases: ['service', 'service requested', 'servicerequired'] },
    { title: 'Message', aliases: ['message', 'enquiry', 'inquiry', 'details'] },
    { title: 'Source', aliases: ['source'] },
    { title: 'Email Status', aliases: ['email status'] },
    { title: 'Email Sent At', aliases: ['email sent at'] }
  ];

  let nextCol = rawHeaders.filter(Boolean).length === 0 ? 1 : lastCol + 1;

  for (let i = 0; i < requiredColumns.length; i++) {
    const spec = requiredColumns[i];
    let found = false;
    for (let a = 0; a < spec.aliases.length; a++) {
      if (colMap[spec.aliases[a]]) {
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.getRange(1, nextCol).setValue(spec.title);
      colMap[spec.title.toLowerCase()] = nextCol;
      nextCol++;
    }
  }

  return colMap;
}

function getOrInitializeSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getActiveSheet() || ss.getSheets()[0];
}

function updateRowStatus_(sheet, rowNumber, colMap, status, sentAt, errorText) {
  if (colMap['email status']) {
    sheet.getRange(rowNumber, colMap['email status']).setValue(status);
  }
  if (colMap['email sent at']) {
    sheet.getRange(rowNumber, colMap['email sent at']).setValue(sentAt || '');
  }
  if (colMap['error'] && errorText !== undefined) {
    sheet.getRange(rowNumber, colMap['error']).setValue(errorText || '');
  }
  SpreadsheetApp.flush();
}

function setCellByHeader_(rowArray, colMap, candidateHeaders, value) {
  for (let i = 0; i < candidateHeaders.length; i++) {
    const colIndex = colMap[candidateHeaders[i].toLowerCase()];
    if (colIndex) {
      rowArray[colIndex - 1] = value;
      return true;
    }
  }
  return false;
}

function getCellByHeader_(rowArray, colMap, candidateHeaders) {
  for (let i = 0; i < candidateHeaders.length; i++) {
    const colIndex = colMap[candidateHeaders[i].toLowerCase()];
    if (colIndex && colIndex - 1 < rowArray.length) {
      return rowArray[colIndex - 1];
    }
  }
  return '';
}

function parseWebhookPayload_(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (_) {
      // Fallback to parameter parsing if form-urlencoded
    }
  }
  return e.parameter || {};
}

function isAlreadySent_(leadId) {
  if (!leadId) return false;
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('SENT_' + leadId) === 'true';
}

function markAsSent_(leadId) {
  if (!leadId) return;
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SENT_' + leadId, 'true');
}

function formatSubmissionDate_(input) {
  try {
    const d = input instanceof Date ? input : new Date(input);
    return Utilities.formatDate(d, 'Asia/Kolkata', 'dd MMM yyyy, hh:mm:ss a \'IST\'');
  } catch (_) {
    return String(input);
  }
}

function escapeHtml_(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
