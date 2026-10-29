// Supabase Edge Function: zoho-oauth-callback
// Handles OAuth 2.0 redirect from Zoho Accounts India for QBENCH
// Stores encrypted refresh token in public.zoho_connections for Org 60072580070

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const ZOHO_ACCOUNTS_DOMAIN = 'https://accounts.zoho.in';
const ZOHO_API_DOMAIN = 'https://www.zohoapis.in';
const TARGET_ORG_ID = '60072580070';

// AES-256-GCM encryption helper
async function encryptToken(plainText: string, secretKeyStr: string): Promise<{ ciphertextHex: string; ivHex: string }> {
  const enc = new TextEncoder();
  const keyHash = await crypto.subtle.digest('SHA-256', enc.encode(secretKeyStr));
  const key = await crypto.subtle.importKey('raw', keyHash, 'AES-GCM', false, ['encrypt']);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );

  const ciphertextHex = Array.from(new Uint8Array(ciphertextBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { ciphertextHex, ivHex };
}

async function computeStateHash(token: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const zohoClientId = Deno.env.get('ZOHO_CLIENT_ID') || '';
  const zohoClientSecret = Deno.env.get('ZOHO_CLIENT_SECRET') || '';
  const encryptionKey = Deno.env.get('ZOHO_ENCRYPTION_KEY') || zohoClientSecret || 'qbench-zoho-secret-salt';
  const siteUrl = Deno.env.get('SITE_URL') || 'https://qbench-unlimited-resources.vercel.app';

  const returnRedirect = (statusParam: string, message?: string) => {
    const dest = new URL('/admin/zoho', siteUrl);
    dest.searchParams.set('zoho_status', statusParam);
    if (message) dest.searchParams.set('zoho_msg', encodeURIComponent(message));
    return Response.redirect(dest.toString(), 302);
  };

  if (errorParam) {
    return returnRedirect('error', `Zoho OAuth error: ${errorParam}`);
  }

  if (!code || !state) {
    return returnRedirect('error', 'Missing code or state parameter');
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Validate state from database (look up by state_hash, check expiration and consumed_at)
    const stateHash = await computeStateHash(state);
    const { data: stateRecord, error: stateError } = await supabaseAdmin
      .from('zoho_oauth_states')
      .select('state_hash, admin_user_id, expires_at, consumed_at')
      .eq('state_hash', stateHash)
      .maybeSingle();

    if (stateError || !stateRecord) {
      return returnRedirect('error', 'Invalid OAuth state parameter');
    }

    if (stateRecord.consumed_at) {
      return returnRedirect('error', 'OAuth state parameter has already been used');
    }

    if (new Date(stateRecord.expires_at).getTime() < Date.now()) {
      return returnRedirect('error', 'OAuth state parameter has expired');
    }

    // Single-use consumption: mark consumed_at without deleting existing data
    const { error: consumeError } = await supabaseAdmin
      .from('zoho_oauth_states')
      .update({ consumed_at: new Date().toISOString() })
      .eq('state_hash', stateHash)
      .is('consumed_at', null);

    if (consumeError) {
      return returnRedirect('error', 'Failed to consume OAuth state');
    }

    // 2. Exchange code for access_token & refresh_token
    const redirectUri = Deno.env.get('ZOHO_REDIRECT_URI') || `${supabaseUrl}/functions/v1/zoho-oauth-callback`;
    const tokenParams = new URLSearchParams({
      code,
      client_id: zohoClientId,
      client_secret: zohoClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch(`${ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.refresh_token) {
      const errMsg = tokenData.error || 'Failed to exchange authorization code for refresh token';
      return returnRedirect('error', errMsg);
    }

    const refreshToken = tokenData.refresh_token;
    const accessToken = tokenData.access_token;

    // 3. Verify organizations available with this token
    let orgName = 'QBENCH';
    let matchedOrg = false;

    if (accessToken) {
      const orgRes = await fetch(`${ZOHO_API_DOMAIN}/books/v3/organizations`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (orgRes.ok) {
        const orgsData = await orgRes.json();
        const orgs = orgsData.organizations || [];
        const found = orgs.find((o: any) => String(o.organization_id) === TARGET_ORG_ID);
        if (found) {
          matchedOrg = true;
          orgName = found.name || 'QBENCH';
        } else if (orgs.length > 0) {
          // If only 1 org exists or none matches, check whether TARGET_ORG_ID was intended
          const primaryOrg = orgs[0];
          if (String(primaryOrg.organization_id) === TARGET_ORG_ID) {
            matchedOrg = true;
            orgName = primaryOrg.name || 'QBENCH';
          }
        }
      }
    }

    // 4. Encrypt the refresh token using AES-256-GCM
    const { ciphertextHex, ivHex } = await encryptToken(refreshToken, encryptionKey);

    // 5. Upsert into public.zoho_connections
    const { error: upsertError } = await supabaseAdmin
      .from('zoho_connections')
      .upsert({
        org_id: TARGET_ORG_ID,
        org_name: orgName,
        api_domain: ZOHO_API_DOMAIN,
        refresh_token_ciphertext: ciphertextHex,
        refresh_token_iv: ivHex,
        created_by: stateRecord.admin_user_id,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id' });

    if (upsertError) {
      return returnRedirect('error', `Failed to save credentials: ${upsertError.message}`);
    }

    return returnRedirect('success', matchedOrg ? 'Connected to Zoho Books Org 60072580070 successfully' : 'Connected to Zoho Books');
  } catch (err: any) {
    return returnRedirect('error', err.message || 'OAuth callback unexpected error');
  }
});
