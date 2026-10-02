import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_WARNING,
  ensureSupabaseConfig,
  getSupabaseClientDiagnostics,
  isValidUuid,
} from '../lib/supabase';
import type {
  ProjectInquiry,
  ProjectInquiryInput,
  InquiryStatus,
} from '../types/project';

export class SupabaseInquiryError extends Error {
  code?: string;
  details?: string;
  hint?: string;

  constructor(params: {
    message: string;
    code?: string | null;
    details?: string | null;
    hint?: string | null;
  }) {
    super(params.message);
    this.name = 'SupabaseInquiryError';
    this.code = params.code || undefined;
    this.details = params.details || undefined;
    this.hint = params.hint || undefined;
  }
}

export function formatSupabaseError(err: unknown): {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  formatted: string;
} {
  if (err instanceof SupabaseInquiryError) {
    const parts = [`Message: ${err.message}`];
    if (err.code) parts.push(`Code: ${err.code}`);
    if (err.details) parts.push(`Details: ${err.details}`);
    if (err.hint) parts.push(`Hint: ${err.hint}`);
    return {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
      formatted: parts.join(' | '),
    };
  }

  if (err && typeof err === 'object') {
    const rec = err as Record<string, unknown>;
    const message = String(
      rec.message || rec.error_description || 'Supabase request failed.'
    );
    const code = rec.code ? String(rec.code) : undefined;
    const details = rec.details ? String(rec.details) : undefined;
    let hint = rec.hint ? String(rec.hint) : undefined;

    if (code === '42501' && !hint) {
      hint =
        'Row Level Security (RLS) blocked anonymous INSERT on public.project_inquiries. Run the RLS policy and GRANT INSERT for role "anon" in the Supabase SQL Editor.';
    } else if (code === '23502' && !hint) {
      hint =
        'A required NOT NULL column in public.project_inquiries received a null value.';
    } else if ((code === 'PGRST204' || code === '42703') && !hint) {
      hint =
        'One of the submitted fields does not match the columns in public.project_inquiries.';
    }

    const parts = [`Message: ${message}`];
    if (code) parts.push(`Code: ${code}`);
    if (details) parts.push(`Details: ${details}`);
    if (hint) parts.push(`Hint: ${hint}`);

    return {
      message,
      code,
      details,
      hint,
      formatted: parts.join(' | '),
    };
  }

  const fallbackMsg = err instanceof Error ? err.message : String(err);
  return {
    message: fallbackMsg,
    formatted: fallbackMsg,
  };
}

function normalizeInquiryStatus(raw: unknown): InquiryStatus {
  if (raw === 'contacted') return 'contacted';
  if (raw === 'closed' || raw === 'archived') return 'closed';
  return 'new';
}

function normalizeInquiry(row: Record<string, unknown>): ProjectInquiry {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    company: row.company ? String(row.company) : null,
    service: String(row.service || ''),
    budget: row.budget ? String(row.budget) : null,
    message: row.message
      ? String(row.message)
      : row.project_description
      ? String(row.project_description)
      : null,
    status: normalizeInquiryStatus(row.status),
    created_at: row.created_at
      ? String(row.created_at)
      : new Date().toISOString(),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

/**
 * Insert a new inquiry into `public.project_inquiries`.
 * Only reports success when Supabase confirms the row was inserted without error.
 */
export async function createProjectInquiry(
  input: ProjectInquiryInput
): Promise<ProjectInquiry> {
  const name = (input.name || '').trim();
  const email = (input.email || '').trim();
  const phone = (input.phone || '').trim();
  const service = (input.service || 'Branding').trim();
  const company = (input.company || '').trim();
  const budget = (input.budget || '').trim();

  if (!name || !email || !phone || !service) {
    throw new SupabaseInquiryError({
      message: 'Required fields (Name, Email, Phone, and Service) are missing.',
      code: 'VALIDATION_ERROR',
      details: `Received name=${Boolean(name)}, email=${Boolean(email)}, phone=${Boolean(phone)}, service=${Boolean(service)}`,
      hint: 'Please fill in all required fields before submitting.',
    });
  }

  await ensureSupabaseConfig();
  const diag = getSupabaseClientDiagnostics();

  if (!isSupabaseConfigured) {
    console.error('[QBENCH Supabase Inquiry Error] Client not configured:', diag);
    throw new SupabaseInquiryError({
      message: SUPABASE_CONFIG_WARNING,
      code: 'SUPABASE_ENV_MISSING',
      details: `Project URL: ${diag.projectUrl}, Anon Key Present: ${diag.anonKeyPresent} (${diag.anonKeyFormat})`,
      hint: 'In Vercel > Project Settings > Environment Variables, set VITE_SUPABASE_URL=https://zsbpxqzmkhcvxdvjoabp.supabase.co and VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>, then redeploy.',
    });
  }

  const messageParts: string[] = [];
  if (input.message?.trim()) {
    messageParts.push(input.message.trim());
  } else if (input.project_description?.trim()) {
    messageParts.push(input.project_description.trim());
  }
  if (
    input.project_description?.trim() &&
    input.message?.trim() &&
    input.project_description.trim() !== input.message.trim()
  ) {
    messageParts.push(`Project Description: ${input.project_description.trim()}`);
  }
  if (input.timeline?.trim()) {
    messageParts.push(`Timeline: ${input.timeline.trim()}`);
  }
  if (input.reference_url?.trim()) {
    messageParts.push(`Reference URL: ${input.reference_url.trim()}`);
  }

  // Ensure message is always a non-empty string so NOT NULL constraints on `message` never fail
  const combinedMessage =
    messageParts.join('\n\n').trim() ||
    `Project enquiry for ${service}${budget ? ` (Budget: ${budget})` : ''}.`;

  // Exact columns in public.project_inquiries:
  // name, email, phone, company, service, budget, message, status
  const payload = {
    name,
    email,
    phone,
    company: company || null,
    service,
    budget: budget || null,
    message: combinedMessage,
    status: 'new' as InquiryStatus,
  };

  console.info('[QBENCH Supabase Inquiry] Submitting to public.project_inquiries', {
    projectUrl: diag.projectUrl,
    anonKeyFormat: diag.anonKeyFormat,
    fields: Object.keys(payload),
  });

  // Note: Do not chain .select() on anonymous insert because public visitors only have
  // INSERT permission (not SELECT permission) under RLS on public.project_inquiries.
  let { error } = await supabase.from('project_inquiries').insert([payload]);

  // If a NOT NULL constraint exists on company or budget (code 23502), retry with empty strings instead of null
  if (error && error.code === '23502') {
    console.warn(
      '[QBENCH Supabase Inquiry] Retrying insert with non-null string defaults due to 23502:',
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );
    const nonNullPayload = {
      name,
      email,
      phone,
      company: company || 'Not specified',
      service,
      budget: budget || 'Not specified',
      message: combinedMessage,
      status: 'new' as InquiryStatus,
    };
    const retry = await supabase
      .from('project_inquiries')
      .insert([nonNullPayload]);
    error = retry.error;
  }

  if (error) {
    const formatted = formatSupabaseError(error);
    console.error('[QBENCH Supabase Inquiry INSERT Failed]:', {
      message: formatted.message,
      code: formatted.code,
      details: formatted.details,
      hint: formatted.hint,
      diagnostics: diag,
    });

    throw new SupabaseInquiryError({
      message: formatted.message,
      code: formatted.code,
      details: formatted.details,
      hint: formatted.hint,
    });
  }

  console.info(
    '[QBENCH Supabase Inquiry] Successfully inserted into public.project_inquiries'
  );
  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));

  return {
    id: `inq-${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString(),
  };
}

/**
 * Fetch all project inquiries for `/admin/inquiries`, newest first.
 */
export async function getProjectInquiries(): Promise<ProjectInquiry[]> {
  await ensureSupabaseConfig();

  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    const formatted = formatSupabaseError(error);
    console.error('[QBENCH Supabase getProjectInquiries Failed]:', formatted);
    throw new SupabaseInquiryError(formatted);
  }

  return (data || []).map((row) =>
    normalizeInquiry(row as Record<string, unknown>)
  );
}

/**
 * Update the status of a project inquiry ('new' | 'contacted' | 'closed').
 */
export async function updateProjectInquiryStatus(
  id: string,
  status: InquiryStatus
): Promise<void> {
  await ensureSupabaseConfig();

  if (!isSupabaseConfigured) {
    throw new SupabaseInquiryError({
      message: SUPABASE_CONFIG_WARNING,
      code: 'SUPABASE_ENV_MISSING',
    });
  }

  if (!isValidUuid(id)) {
    window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
    return;
  }

  const cleanId = id.trim();

  const { error } = await supabase
    .from('project_inquiries')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cleanId);

  if (error) {
    const retry = await supabase
      .from('project_inquiries')
      .update({ status })
      .eq('id', cleanId);
    if (retry.error) {
      const formatted = formatSupabaseError(retry.error);
      throw new SupabaseInquiryError(formatted);
    }
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}

/**
 * Delete a project inquiry by ID.
 */
export async function deleteProjectInquiry(id: string): Promise<void> {
  await ensureSupabaseConfig();

  if (!isSupabaseConfigured) {
    throw new SupabaseInquiryError({
      message: SUPABASE_CONFIG_WARNING,
      code: 'SUPABASE_ENV_MISSING',
    });
  }

  if (!isValidUuid(id)) {
    window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
    return;
  }

  const { error } = await supabase
    .from('project_inquiries')
    .delete()
    .eq('id', id.trim());

  if (error) {
    const formatted = formatSupabaseError(error);
    throw new SupabaseInquiryError(formatted);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}
