// Supabase Edge Function: zoho-oauth-start
// Initiates OAuth 2.0 flow with Zoho Accounts India for QBENCH (Org: 60072580070)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const ZOHO_ACCOUNTS_DOMAIN = 'https://accounts.zoho.in';
const REQUIRED_SCOPES = [
  'ZohoBooks.settings.READ',
  'ZohoBooks.contacts.READ',
  'ZohoBooks.invoices.READ',
  'ZohoBooks.customerpayments.READ',
  'ZohoBooks.estimates.READ',
  'ZohoBooks.creditnotes.READ',
  'ZohoBooks.expenses.READ',
  'ZohoBooks.bills.READ',
  'ZohoBooks.vendorpayments.READ',
  'ZohoBooks.banking.READ',
  'ZohoBooks.salesorders.READ',
  'ZohoBooks.purchaseorders.READ',
].join(',');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function computeStateHash(token: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const zohoClientId = Deno.env.get('ZOHO_CLIENT_ID') || '';
    const zohoRedirectUri = Deno.env.get('ZOHO_REDIRECT_URI') || `${supabaseUrl}/functions/v1/zoho-oauth-callback`;

    if (!zohoClientId) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: ZOHO_CLIENT_ID missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: adminProfile } = await supabaseAdmin
      .from('admin_profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminProfile) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate secure random state token
    const state = crypto.randomUUID();
    const stateHash = await computeStateHash(state);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store state_hash in public.zoho_oauth_states
    const { error: insertError } = await supabaseAdmin.from('zoho_oauth_states').insert({
      state_hash: stateHash,
      admin_user_id: user.id,
      expires_at: expiresAt,
      consumed_at: null,
    });

    if (insertError) {
      console.error('Failed to insert oauth state:', insertError);
      return new Response(JSON.stringify({ error: `Failed to store OAuth state: ${insertError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authUrl = new URL(`${ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/auth`);
    authUrl.searchParams.set('client_id', zohoClientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', REQUIRED_SCOPES);
    authUrl.searchParams.set('redirect_uri', zohoRedirectUri);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return new Response(
      JSON.stringify({
        authUrl: authUrl.toString(),
        state,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
