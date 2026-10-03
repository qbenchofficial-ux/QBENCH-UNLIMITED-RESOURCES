import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_WARNING,
} from '../lib/supabase';
import type { SiteSetting, SiteSettings } from '../types/project';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  agency_name: 'QBENCH',
  agency_description:
    'QBENCH is a creative & digital agency specializing in Strategy → Creativity → Execution across branding, social media design, motion graphics, video editing, UI/UX, and web development.',
  email: 'contact@qbench.in',
  phone: '+91 73565 25932',
  whatsapp: '917356525932',
  instagram_url: 'https://www.instagram.com/qbench_official',
  linkedin_url: 'https://www.linkedin.com/company/qbench',
  behance_url:
    'https://www.behance.net/gallery/253620337/The-Journey-of-a-Ring-Luxury-Jewellery-Motion-Design',
  website_url: 'https://www.qbench.in',
};

/**
 * Fetch raw `public.site_settings` key-value rows (`id, setting_key, setting_value, created_at, updated_at`).
 */
export async function getSiteSettingRows(): Promise<SiteSetting[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase.from('site_settings').select('*');

  if (error || !data) {
    return [];
  }

  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id || ''),
    setting_key: String(row.setting_key || ''),
    setting_value:
      row.setting_value !== null && row.setting_value !== undefined
        ? String(row.setting_value)
        : null,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  }));
}

/**
 * Load site settings from `public.site_settings` (supports both key-value rows
 * `setting_key` / `setting_value` and single-row column format).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) {
    return DEFAULT_SITE_SETTINGS;
  }

  const { data, error } = await supabase.from('site_settings').select('*');

  if (error || !data || data.length === 0) {
    return DEFAULT_SITE_SETTINGS;
  }

  const rows = data as Record<string, unknown>[];

  // Check if table is single-row column format (e.g., has `agency_name` or `email` column)
  const firstRow = rows[0];
  if (
    firstRow &&
    !('setting_key' in firstRow) &&
    ('agency_name' in firstRow || 'email' in firstRow)
  ) {
    return {
      id: firstRow.id ? String(firstRow.id) : undefined,
      agency_name: String(
        firstRow.agency_name || DEFAULT_SITE_SETTINGS.agency_name
      ),
      agency_description: String(
        firstRow.agency_description || DEFAULT_SITE_SETTINGS.agency_description
      ),
      email: String(firstRow.email || DEFAULT_SITE_SETTINGS.email),
      phone: String(firstRow.phone || DEFAULT_SITE_SETTINGS.phone),
      whatsapp: String(firstRow.whatsapp || DEFAULT_SITE_SETTINGS.whatsapp),
      instagram_url: String(
        firstRow.instagram_url ?? DEFAULT_SITE_SETTINGS.instagram_url
      ),
      linkedin_url: String(
        firstRow.linkedin_url ?? DEFAULT_SITE_SETTINGS.linkedin_url
      ),
      behance_url: String(
        firstRow.behance_url ?? DEFAULT_SITE_SETTINGS.behance_url
      ),
      website_url: String(
        firstRow.website_url ?? DEFAULT_SITE_SETTINGS.website_url
      ),
      updated_at: firstRow.updated_at ? String(firstRow.updated_at) : undefined,
    };
  }

  // Key-value format (`setting_key`, `setting_value`)
  const kvMap = new Map<string, string>();
  let latestUpdated: string | undefined;

  for (const row of rows) {
    const key = String(row.setting_key || '').trim().toLowerCase();
    const val =
      row.setting_value !== null && row.setting_value !== undefined
        ? String(row.setting_value).trim()
        : '';
    if (key && val) {
      kvMap.set(key, val);
    }
    if (row.updated_at) {
      latestUpdated = String(row.updated_at);
    }
  }

  return {
    agency_name:
      kvMap.get('agency_name') ||
      kvMap.get('name') ||
      DEFAULT_SITE_SETTINGS.agency_name,
    agency_description:
      kvMap.get('agency_description') ||
      kvMap.get('description') ||
      DEFAULT_SITE_SETTINGS.agency_description,
    email: kvMap.get('email') || DEFAULT_SITE_SETTINGS.email,
    phone: kvMap.get('phone') || DEFAULT_SITE_SETTINGS.phone,
    whatsapp: kvMap.get('whatsapp') || DEFAULT_SITE_SETTINGS.whatsapp,
    instagram_url:
      kvMap.get('instagram_url') ||
      kvMap.get('instagram') ||
      DEFAULT_SITE_SETTINGS.instagram_url,
    linkedin_url:
      kvMap.get('linkedin_url') ||
      kvMap.get('linkedin') ||
      DEFAULT_SITE_SETTINGS.linkedin_url,
    behance_url:
      kvMap.get('behance_url') ||
      kvMap.get('behance') ||
      DEFAULT_SITE_SETTINGS.behance_url,
    website_url:
      kvMap.get('website_url') ||
      kvMap.get('website') ||
      DEFAULT_SITE_SETTINGS.website_url,
    updated_at: latestUpdated,
  };
}

/**
 * Save site settings into `public.site_settings`.
 */
export async function saveSiteSettings(
  settings: SiteSettings
): Promise<SiteSettings> {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_WARNING);
  }

  const now = new Date().toISOString();
  const normalized: SiteSettings = {
    agency_name: settings.agency_name.trim() || 'QBENCH',
    agency_description: settings.agency_description.trim(),
    email: settings.email.trim(),
    phone: settings.phone.trim(),
    whatsapp: settings.whatsapp.trim(),
    instagram_url: settings.instagram_url.trim(),
    linkedin_url: settings.linkedin_url.trim(),
    behance_url: settings.behance_url.trim(),
    website_url: settings.website_url.trim(),
    updated_at: now,
  };

  const { data: existingRows, error: fetchError } = await supabase
    .from('site_settings')
    .select('*');

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const rows = (existingRows || []) as Record<string, unknown>[];

  // If the table uses single-row column format (`agency_name`, `email`, etc.)
  if (
    rows.length > 0 &&
    !('setting_key' in rows[0]) &&
    ('agency_name' in rows[0] || 'email' in rows[0])
  ) {
    const rowId = String(rows[0].id);
    const { error } = await supabase
      .from('site_settings')
      .update({
        agency_name: normalized.agency_name,
        agency_description: normalized.agency_description,
        email: normalized.email,
        phone: normalized.phone,
        whatsapp: normalized.whatsapp,
        instagram_url: normalized.instagram_url,
        linkedin_url: normalized.linkedin_url,
        behance_url: normalized.behance_url,
        website_url: normalized.website_url,
        updated_at: now,
      })
      .eq('id', rowId);

    if (error) {
      throw new Error(error.message);
    }

    window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
    return normalized;
  }

  // Key-value format (`setting_key` / `setting_value`)
  const existingByKey = new Map<string, string>();
  for (const row of rows) {
    if (row.setting_key && row.id) {
      existingByKey.set(String(row.setting_key).toLowerCase(), String(row.id));
    }
  }

  const entries: Array<[string, string]> = [
    ['agency_name', normalized.agency_name],
    ['agency_description', normalized.agency_description],
    ['email', normalized.email],
    ['phone', normalized.phone],
    ['whatsapp', normalized.whatsapp],
    ['instagram_url', normalized.instagram_url],
    ['instagram', normalized.instagram_url],
    ['linkedin_url', normalized.linkedin_url],
    ['linkedin', normalized.linkedin_url],
    ['behance_url', normalized.behance_url],
    ['behance', normalized.behance_url],
    ['website_url', normalized.website_url],
    ['website', normalized.website_url],
  ];

  const canonicalKeys = new Set([
    'agency_name',
    'agency_description',
    'email',
    'phone',
    'whatsapp',
    'instagram_url',
    'linkedin_url',
    'behance_url',
    'website_url',
  ]);

  for (const [key, value] of entries) {
    const existingId = existingByKey.get(key);
    if (existingId) {
      const { error } = await supabase
        .from('site_settings')
        .update({ setting_value: value, updated_at: now })
        .eq('id', existingId);
      if (error) {
        throw new Error(error.message);
      }
    } else if (canonicalKeys.has(key)) {
      const { error } = await supabase.from('site_settings').insert([
        {
          setting_key: key,
          setting_value: value,
          updated_at: now,
        },
      ]);
      if (error) {
        throw new Error(error.message);
      }
    }
  }

  window.dispatchEvent(new CustomEvent('qbench-cms-updated'));
  return normalized;
}
