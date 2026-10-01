import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_WARNING,
} from '../lib/supabase';
import type {
  ProjectInquiry,
  ProjectInquiryInput,
  InquiryStatus,
} from '../types/project';

const INQUIRY_SELECT_COLUMNS =
  'id, name, email, phone, company, service, budget, message, status, created_at, updated_at';

function normalizeInquiryStatus(raw: unknown): InquiryStatus {
  if (raw === 'contacted') return 'contacted';
  if (raw === 'closed') return 'closed';
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
    message: row.message ? String(row.message) : null,
    status: normalizeInquiryStatus(row.status),
    created_at: row.created_at
      ? String(row.created_at)
      : new Date().toISOString(),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

/**
 * Insert a new inquiry into `public.project_inquiries`.
 */
export async function createProjectInquiry(
  input: ProjectInquiryInput
): Promise<ProjectInquiry> {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const service = input.service.trim();

  if (!name || !email || !phone || !service) {
    throw new Error('Name, Email, Phone, and Service are required.');
  }

  // Combine optional timeline / project_description / reference_url into message if provided
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

  const combinedMessage = messageParts.join('\n\n') || null;

  const payload = {
    name,
    email,
    phone,
    company: input.company?.trim() || null,
    service,
    budget: input.budget?.trim() || null,
    message: combinedMessage,
    status: 'new' as InquiryStatus,
  };

  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  // Insert into public.project_inquiries. Since public visitors have INSERT permission
  // (and only admins have SELECT permission under RLS), we do not chain .select() for anonymous visitors.
  const { error } = await supabase.from('project_inquiries').insert([payload]);

  if (error) {
    throw new Error(error.message);
  }

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
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_inquiries')
    .select(INQUIRY_SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
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
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const { error } = await supabase
    .from('project_inquiries')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}

/**
 * Delete a project inquiry by ID.
 */
export async function deleteProjectInquiry(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const { error } = await supabase
    .from('project_inquiries')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
}
