// Supabase Edge Function: zoho-dashboard
// Secure server-side gateway to Zoho Books India API for QBENCH
// Target Organization: 60072580070
// Region: India (https://www.zohoapis.in)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const ZOHO_ACCOUNTS_DOMAIN = 'https://accounts.zoho.in';
const ZOHO_API_DOMAIN = 'https://www.zohoapis.in';
const REQUIRED_ORG_ID = '60072580070';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AES-256-GCM decryption helper
async function decryptToken(ciphertextHex: string, ivHex: string, secretKeyStr: string): Promise<string> {
  const enc = new TextEncoder();
  const keyHash = await crypto.subtle.digest('SHA-256', enc.encode(secretKeyStr));
  const key = await crypto.subtle.importKey('raw', keyHash, 'AES-GCM', false, ['decrypt']);

  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  const ciphertext = new Uint8Array(ciphertextHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// Refresh Zoho Books Access Token
async function refreshZohoAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });

  const res = await fetch(`${ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || 'Failed to refresh Zoho Books access token');
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 3600,
  };
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
    const zohoClientSecret = Deno.env.get('ZOHO_CLIENT_SECRET') || '';
    const encryptionKey = Deno.env.get('ZOHO_ENCRYPTION_KEY') || zohoClientSecret || 'qbench-zoho-secret-salt';

    // 1. Verify user session and check admin role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin status in public.admin_profiles
    const { data: adminProfile } = await supabaseAdmin
      .from('admin_profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminProfile) {
      return new Response(JSON.stringify({ error: 'Forbidden: Administrator privileges required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';
    const dateRange = body.dateRange || 'This Month';
    const fromDate = body.fromDate;
    const toDate = body.toDate;
    const page = Math.max(1, body.page || 1);
    const perPage = Math.min(100, Math.max(10, body.perPage || 25));

    // 2. Fetch stored connection from public.zoho_connections
    const { data: connection } = await supabaseAdmin
      .from('zoho_connections')
      .select('*')
      .eq('org_id', REQUIRED_ORG_ID)
      .maybeSingle();

    // If connection is not configured yet
    if (!connection) {
      return new Response(
        JSON.stringify({
          connected: false,
          orgId: REQUIRED_ORG_ID,
          orgName: 'QBENCH',
          message: 'Zoho Books is not connected. Administrator authorization required.',
          action,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Decrypt refresh token
    const refreshToken = await decryptToken(
      connection.refresh_token_ciphertext,
      connection.refresh_token_iv,
      encryptionKey
    );

    // 4. Obtain fresh access token
    const { accessToken } = await refreshZohoAccessToken(refreshToken, zohoClientId, zohoClientSecret);

    // Helper to query Zoho Books v3 API
    const fetchZoho = async (endpoint: string, queryParams: Record<string, string> = {}) => {
      const url = new URL(`${ZOHO_API_DOMAIN}/books/v3/${endpoint}`);
      url.searchParams.set('organization_id', REQUIRED_ORG_ID);
      for (const [k, v] of Object.entries(queryParams)) {
        if (v) url.searchParams.set(k, v);
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return res.json();
    };

    // 5. Handle action
    if (action === 'status') {
      const orgInfo = await fetchZoho('organizations/' + REQUIRED_ORG_ID).catch(() => null);
      return new Response(
        JSON.stringify({
          connected: true,
          orgId: REQUIRED_ORG_ID,
          orgName: orgInfo?.organization?.name || connection.org_name || 'QBENCH',
          currency: orgInfo?.organization?.currency_code || 'INR',
          lastSynchronized: new Date().toISOString(),
          connectedAt: connection.connected_at,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'summary') {
      const queryParams: Record<string, string> = {};
      if (fromDate) queryParams.from_date = fromDate;
      if (toDate) queryParams.to_date = toDate;

      // Invoices & Receivables
      const invoicesData = await fetchZoho('invoices', { ...queryParams, per_page: '1' });
      // Expenses
      const expensesData = await fetchZoho('expenses', { ...queryParams, per_page: '1' });
      // Bills & Payables
      const billsData = await fetchZoho('bills', { ...queryParams, per_page: '1' });
      // Bank accounts
      const bankData = await fetchZoho('bankaccounts', { per_page: '50' }).catch(() => null);
      // Contacts count
      const contactsData = await fetchZoho('contacts', { per_page: '1' }).catch(() => null);

      return new Response(
        JSON.stringify({
          connected: true,
          orgId: REQUIRED_ORG_ID,
          period: dateRange,
          invoicesPageContext: invoicesData?.page_context,
          expensesPageContext: expensesData?.page_context,
          billsPageContext: billsData?.page_context,
          bankAccounts: bankData?.bankaccounts || [],
          contactsPageContext: contactsData?.page_context,
          lastSynchronized: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'invoices') {
      const queryParams: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        sort_column: 'date',
        sort_order: 'D',
      };
      if (fromDate) queryParams.from_date = fromDate;
      if (toDate) queryParams.to_date = toDate;
      if (body.status && body.status !== 'all') queryParams.status = body.status;
      if (body.search) queryParams.search_text = body.search;

      const data = await fetchZoho('invoices', queryParams);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'customerpayments') {
      const queryParams: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        sort_column: 'date',
        sort_order: 'D',
      };
      if (fromDate) queryParams.from_date = fromDate;
      if (toDate) queryParams.to_date = toDate;
      if (body.search) queryParams.search_text = body.search;

      const data = await fetchZoho('customerpayments', queryParams);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'expenses') {
      const queryParams: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        sort_column: 'date',
        sort_order: 'D',
      };
      if (fromDate) queryParams.from_date = fromDate;
      if (toDate) queryParams.to_date = toDate;
      if (body.search) queryParams.search_text = body.search;

      const data = await fetchZoho('expenses', queryParams);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'bills') {
      const queryParams: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        sort_column: 'date',
        sort_order: 'D',
      };
      if (fromDate) queryParams.from_date = fromDate;
      if (toDate) queryParams.to_date = toDate;
      if (body.search) queryParams.search_text = body.search;

      const data = await fetchZoho('bills', queryParams);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'vendorpayments') {
      const queryParams: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        sort_column: 'date',
        sort_order: 'D',
      };
      if (fromDate) queryParams.from_date = fromDate;
      if (toDate) queryParams.to_date = toDate;

      const data = await fetchZoho('vendorpayments', queryParams);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'contacts' || action === 'customers' || action === 'vendors') {
      const queryParams: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
      };
      if (action === 'customers') queryParams.contact_type = 'customer';
      if (action === 'vendors') queryParams.contact_type = 'vendor';
      if (body.search) queryParams.search_text = body.search;

      const data = await fetchZoho('contacts', queryParams);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'items') {
      const queryParams: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
      };
      if (body.search) queryParams.search_text = body.search;

      const data = await fetchZoho('items', queryParams);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'banking') {
      const data = await fetchZoho('bankaccounts', { per_page: '50' });
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'report') {
      const reportName = body.reportName || 'profitandloss';
      const queryParams: Record<string, string> = {};
      if (fromDate) queryParams.from_date = fromDate;
      if (toDate) queryParams.to_date = toDate;

      const data = await fetchZoho(`reports/${reportName}`, queryParams);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || 'An error occurred while connecting to Zoho Books API',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
