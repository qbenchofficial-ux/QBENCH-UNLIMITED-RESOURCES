import { supabase } from '../lib/supabase';
import type {
  ZohoDatePeriod,
  ZohoConnectionStatus,
  ZohoDashboardSummary,
  ZohoInvoice,
  ZohoCustomerPayment,
  ZohoExpense,
  ZohoBill,
  ZohoVendorPayment,
  ZohoContact,
  ZohoItem,
  ZohoBankAccount,
  ZohoFinancialReport,
} from '../types/zoho';

export const ZOHO_TARGET_ORG_ID = '60072580070';
export const ZOHO_EXTERNAL_DASHBOARD_URL = `https://books.zoho.in/app/${ZOHO_TARGET_ORG_ID}#/home/dashboard?dashboard_id=defaultdashboard`;

// Calculate start & end dates based on Indian Financial Year & standard intervals
export function computeZohoDateRange(
  period: ZohoDatePeriod,
  customFrom?: string,
  customTo?: string
): { fromDate: string; toDate: string; label: string } {
  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed: 0 = Jan, 3 = April

  switch (period) {
    case 'Today': {
      const d = formatYMD(now);
      return { fromDate: d, toDate: d, label: 'Today' };
    }
    case 'Yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const d = formatYMD(yesterday);
      return { fromDate: d, toDate: d, label: 'Yesterday' };
    }
    case 'This Week': {
      const currentDay = now.getDay();
      const diffToMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      return { fromDate: formatYMD(monday), toDate: formatYMD(new Date()), label: 'This Week' };
    }
    case 'Last Week': {
      const prevMonday = new Date();
      prevMonday.setDate(prevMonday.getDate() - prevMonday.getDay() - 6);
      const prevSunday = new Date(prevMonday);
      prevSunday.setDate(prevMonday.getDate() + 6);
      return { fromDate: formatYMD(prevMonday), toDate: formatYMD(prevSunday), label: 'Last Week' };
    }
    case 'This Month': {
      const start = new Date(y, m, 1);
      return { fromDate: formatYMD(start), toDate: formatYMD(now), label: 'This Month' };
    }
    case 'Last Month': {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return { fromDate: formatYMD(start), toDate: formatYMD(end), label: 'Last Month' };
    }
    case 'This Quarter': {
      const qMonth = Math.floor(m / 3) * 3;
      const start = new Date(y, qMonth, 1);
      return { fromDate: formatYMD(start), toDate: formatYMD(now), label: 'This Quarter' };
    }
    case 'This Financial Year': {
      // Indian FY starts April 1st
      const fyStartYear = m >= 3 ? y : y - 1;
      const start = new Date(fyStartYear, 3, 1);
      return { fromDate: formatYMD(start), toDate: formatYMD(now), label: `FY ${fyStartYear}-${fyStartYear + 1}` };
    }
    case 'Last Financial Year': {
      const fyStartYear = m >= 3 ? y - 1 : y - 2;
      const start = new Date(fyStartYear, 3, 1);
      const end = new Date(fyStartYear + 1, 2, 31);
      return { fromDate: formatYMD(start), toDate: formatYMD(end), label: `FY ${fyStartYear}-${fyStartYear + 1}` };
    }
    case 'Last 30 Days': {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      return { fromDate: formatYMD(start), toDate: formatYMD(now), label: 'Last 30 Days' };
    }
    case 'Last 90 Days': {
      const start = new Date(now);
      start.setDate(now.getDate() - 90);
      return { fromDate: formatYMD(start), toDate: formatYMD(now), label: 'Last 90 Days' };
    }
    case 'Custom':
    default:
      return {
        fromDate: customFrom || formatYMD(new Date(y, m, 1)),
        toDate: customTo || formatYMD(now),
        label: 'Custom Period',
      };
  }
}

// Low-level caller to invoke backend function
async function callZohoBackend(action: string, payload: Record<string, any> = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    throw new Error('User is not authenticated. Please log in as administrator.');
  }

  // 1. Try Supabase Edge Function directly
  try {
    const { data, error } = await supabase.functions.invoke('zoho-dashboard', {
      body: { action, ...payload },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!error && data) {
      return data;
    }
  } catch {
    // Continue to proxy fallback
  }

  // 2. Fallback to Express backend proxy /api/zoho-dashboard
  const res = await fetch('/api/zoho-dashboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Zoho Books request failed (${res.status})`);
  }

  return res.json();
}

/**
 * Get current Zoho connection status for Org 60072580070
 */
export async function getZohoConnectionStatus(): Promise<ZohoConnectionStatus> {
  try {
    const res = await callZohoBackend('status');
    return {
      connected: Boolean(res.connected),
      orgId: res.orgId || ZOHO_TARGET_ORG_ID,
      orgName: res.orgName || 'QBENCH (Creative, Digital & Events)',
      currency: res.currency || 'INR',
      lastSynchronized: res.lastSynchronized || new Date().toISOString(),
      connectedAt: res.connectedAt,
      message: res.message,
    };
  } catch (err: any) {
    return {
      connected: false,
      orgId: ZOHO_TARGET_ORG_ID,
      orgName: 'QBENCH',
      currency: 'INR',
      message: err.message || 'Unable to communicate with Zoho Books service',
    };
  }
}

/**
 * Fetch complete dashboard financial KPIs and summary for selected period
 */
export async function getZohoDashboardSummary(
  period: ZohoDatePeriod,
  customFrom?: string,
  customTo?: string
): Promise<ZohoDashboardSummary> {
  const { fromDate, toDate } = computeZohoDateRange(period, customFrom, customTo);
  const data = await callZohoBackend('summary', { period, fromDate, toDate });

  // Map API response to KPI metrics
  const invoicesContext = data.invoicesPageContext || {};
  const expensesContext = data.expensesPageContext || {};
  const billsContext = data.billsPageContext || {};
  const contactsContext = data.contactsPageContext || {};
  const bankAccounts: ZohoBankAccount[] = data.bankAccounts || [];

  const totalBankBalance = bankAccounts.reduce((acc, b) => acc + (Number(b.balance) || 0), 0);

  return {
    connected: Boolean(data.connected),
    orgId: ZOHO_TARGET_ORG_ID,
    orgName: data.orgName || 'QBENCH',
    period,
    fromDate,
    toDate,
    lastSynchronized: data.lastSynchronized || new Date().toISOString(),
    currency: 'INR',
    kpis: {
      totalSales: Number(invoicesContext.total_sales || invoicesContext.total_amount || 0),
      totalInvoiceCount: Number(invoicesContext.total || 0),
      amountCollected: Number(invoicesContext.amount_received || 0),
      outstandingReceivables: Number(invoicesContext.outstanding_receivables || 0),
      overdueReceivables: Number(invoicesContext.overdue_amount || 0),
      draftInvoicesCount: Number(invoicesContext.draft_count || 0),
      sentInvoicesCount: Number(invoicesContext.sent_count || 0),
      partiallyPaidInvoicesCount: Number(invoicesContext.partially_paid_count || 0),
      paidInvoicesCount: Number(invoicesContext.paid_count || 0),
      voidInvoicesCount: Number(invoicesContext.void_count || 0),

      totalExpenses: Number(expensesContext.total_expenses || expensesContext.total_amount || 0),
      totalBills: Number(billsContext.total_bills || billsContext.total_amount || 0),
      outstandingPayables: Number(billsContext.outstanding_payables || 0),
      overdueBills: Number(billsContext.overdue_amount || 0),
      vendorPaymentsTotal: Number(billsContext.amount_paid || 0),
      creditNotesTotal: Number(data.creditNotesTotal || 0),

      totalCustomersCount: Number(contactsContext.customer_count || 0),
      totalVendorsCount: Number(contactsContext.vendor_count || 0),
      totalActiveItemsCount: Number(data.itemsCount || 0),
      totalInventoryValue: data.inventoryValue !== undefined ? Number(data.inventoryValue) : null,
      totalBankBalance,
      cashReceiptsTotal: Number(data.cashReceiptsTotal || invoicesContext.amount_received || 0),
    },
    chartData: data.chartData,
  };
}

/**
 * Fetch Paginated Invoices
 */
export async function getZohoInvoices(options: {
  page?: number;
  perPage?: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ invoices: ZohoInvoice[]; pageContext: any }> {
  const data = await callZohoBackend('invoices', options);
  return {
    invoices: data.invoices || [],
    pageContext: data.page_context || {},
  };
}

/**
 * Fetch Customer Payments
 */
export async function getZohoCustomerPayments(options: {
  page?: number;
  perPage?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ payments: ZohoCustomerPayment[]; pageContext: any }> {
  const data = await callZohoBackend('customerpayments', options);
  return {
    payments: data.customerpayments || [],
    pageContext: data.page_context || {},
  };
}

/**
 * Fetch Expenses
 */
export async function getZohoExpenses(options: {
  page?: number;
  perPage?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ expenses: ZohoExpense[]; pageContext: any }> {
  const data = await callZohoBackend('expenses', options);
  return {
    expenses: data.expenses || [],
    pageContext: data.page_context || {},
  };
}

/**
 * Fetch Bills
 */
export async function getZohoBills(options: {
  page?: number;
  perPage?: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ bills: ZohoBill[]; pageContext: any }> {
  const data = await callZohoBackend('bills', options);
  return {
    bills: data.bills || [],
    pageContext: data.page_context || {},
  };
}

/**
 * Fetch Vendor Payments
 */
export async function getZohoVendorPayments(options: {
  page?: number;
  perPage?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ vendorPayments: ZohoVendorPayment[]; pageContext: any }> {
  const data = await callZohoBackend('vendorpayments', options);
  return {
    vendorPayments: data.vendorpayments || [],
    pageContext: data.page_context || {},
  };
}

/**
 * Fetch Contacts (Customers or Vendors)
 */
export async function getZohoContacts(
  type: 'customer' | 'vendor',
  options: { page?: number; perPage?: number; search?: string } = {}
): Promise<{ contacts: ZohoContact[]; pageContext: any }> {
  const data = await callZohoBackend('contacts', { contact_type: type, ...options });
  return {
    contacts: data.contacts || [],
    pageContext: data.page_context || {},
  };
}

/**
 * Fetch Items / Inventory
 */
export async function getZohoItems(options: {
  page?: number;
  perPage?: number;
  search?: string;
} = {}): Promise<{ items: ZohoItem[]; pageContext: any }> {
  const data = await callZohoBackend('items', options);
  return {
    items: data.items || [],
    pageContext: data.page_context || {},
  };
}

/**
 * Fetch Bank Accounts & Cash Balances
 */
export async function getZohoBankAccounts(): Promise<{ bankAccounts: ZohoBankAccount[] }> {
  const data = await callZohoBackend('banking');
  return {
    bankAccounts: data.bankaccounts || [],
  };
}

/**
 * Fetch Official Zoho Financial Reports
 */
export async function getZohoReport(
  reportType: ZohoFinancialReport['report_type'],
  fromDate?: string,
  toDate?: string
): Promise<ZohoFinancialReport> {
  const data = await callZohoBackend('report', { reportType, fromDate, toDate });
  return data.report;
}

/**
 * Initiate OAuth Authorization flow
 */
export async function initiateZohoOAuth(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    throw new Error('Admin authentication required to connect Zoho Books');
  }

  // Invoke zoho-oauth-start Edge Function or Express route
  let authUrl: string | null = null;

  try {
    const { data, error } = await supabase.functions.invoke('zoho-oauth-start', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!error && data?.authUrl) {
      authUrl = data.authUrl;
    }
  } catch {
    // Ignore and fallback to express
  }

  if (!authUrl) {
    const res = await fetch('/api/zoho-oauth-start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await res.json();
    if (!res.ok || !body.authUrl) {
      throw new Error(body.error || 'Failed to initiate Zoho Books authorization');
    }
    authUrl = body.authUrl;
  }

  // Redirect to verified Zoho Accounts consent screen
  if (authUrl) {
    window.location.href = authUrl;
  }
}
