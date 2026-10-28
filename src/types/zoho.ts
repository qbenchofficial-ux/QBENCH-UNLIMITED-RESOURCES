// Type definitions for Zoho Books India API integration (Org 60072580070)
// Strictly typed for read-only financial tracking, reporting, and dashboard analytics

export type ZohoDatePeriod =
  | 'Today'
  | 'Yesterday'
  | 'This Week'
  | 'Last Week'
  | 'This Month'
  | 'Last Month'
  | 'This Quarter'
  | 'This Financial Year'
  | 'Last Financial Year'
  | 'Last 30 Days'
  | 'Last 90 Days'
  | 'Custom';

export interface ZohoConnectionStatus {
  connected: boolean;
  orgId: string;
  orgName: string;
  currency: string;
  lastSynchronized?: string;
  connectedAt?: string;
  message?: string;
}

export interface ZohoKpiMetric {
  id: string;
  label: string;
  amount?: number;
  count?: number;
  currency?: string;
  periodLabel: string;
  tooltip: string;
  category: 'sales' | 'purchases' | 'business';
  status?: 'normal' | 'warning' | 'alert' | 'success';
}

export interface ZohoDashboardSummary {
  connected: boolean;
  orgId: string;
  orgName: string;
  period: ZohoDatePeriod;
  fromDate?: string;
  toDate?: string;
  lastSynchronized: string;
  kpis: {
    // Sales & Revenue
    totalSales: number;
    totalInvoiceCount: number;
    amountCollected: number;
    outstandingReceivables: number;
    overdueReceivables: number;
    draftInvoicesCount: number;
    sentInvoicesCount: number;
    partiallyPaidInvoicesCount: number;
    paidInvoicesCount: number;
    voidInvoicesCount: number;

    // Purchases & Expenses
    totalExpenses: number;
    totalBills: number;
    outstandingPayables: number;
    overdueBills: number;
    vendorPaymentsTotal: number;
    creditNotesTotal: number;

    // Business Overview
    totalCustomersCount: number;
    totalVendorsCount: number;
    totalActiveItemsCount: number;
    totalInventoryValue: number | null; // null if unmanaged
    totalBankBalance: number;
    cashReceiptsTotal: number;
  };
  currency: string;
  chartData?: {
    revenueTimeline?: Array<{ label: string; amount: number; invoiceCount: number }>;
    expenseTimeline?: Array<{ label: string; amount: number }>;
    statusDistribution?: Array<{ status: string; count: number; total: number }>;
    expenseCategories?: Array<{ category: string; amount: number }>;
  };
}

export interface ZohoInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'void';
  total: number;
  balance: number;
  currency_code: string;
  currency_symbol?: string;
  created_time?: string;
  last_modified_time?: string;
  reference_number?: string;
}

export interface ZohoCustomerPayment {
  payment_id: string;
  payment_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  amount: number;
  currency_code: string;
  payment_mode?: string;
  reference_number?: string;
  invoices?: Array<{ invoice_id: string; invoice_number: string; amount_applied: number }>;
  description?: string;
}

export interface ZohoExpense {
  expense_id: string;
  expense_number?: string;
  date: string;
  account_name: string;
  paid_through_account_name?: string;
  vendor_name?: string;
  customer_name?: string;
  description: string;
  amount: number;
  currency_code: string;
  status?: string;
  reference_number?: string;
}

export interface ZohoBill {
  bill_id: string;
  bill_number: string;
  vendor_id: string;
  vendor_name: string;
  date: string;
  due_date: string;
  status: 'draft' | 'open' | 'paid' | 'partially_paid' | 'overdue' | 'void';
  total: number;
  balance: number;
  currency_code: string;
  created_time?: string;
}

export interface ZohoVendorPayment {
  payment_id: string;
  payment_number: string;
  vendor_id: string;
  vendor_name: string;
  date: string;
  amount: number;
  currency_code: string;
  payment_mode?: string;
  reference_number?: string;
  bills?: Array<{ bill_id: string; bill_number: string; amount_applied: number }>;
}

export interface ZohoContact {
  contact_id: string;
  contact_name: string;
  company_name?: string;
  contact_type: 'customer' | 'vendor';
  email?: string;
  phone?: string;
  outstanding_receivable_amount?: number;
  outstanding_payable_amount?: number;
  currency_code: string;
  status: string;
}

export interface ZohoItem {
  item_id: string;
  name: string;
  sku?: string;
  product_type: 'goods' | 'service';
  rate: number;
  purchase_rate?: number;
  stock_on_hand?: number;
  reorder_level?: number;
  unit?: string;
  status: 'active' | 'inactive';
  description?: string;
  inventory_account_id?: string;
}

export interface ZohoBankAccount {
  account_id: string;
  account_name: string;
  account_type: 'bank' | 'cash' | 'credit_card';
  currency_code: string;
  balance: number;
  uncatagorized_transactions?: number;
  last_reconciled_date?: string;
}

export interface ZohoFinancialReport {
  report_type:
    | 'profit_and_loss'
    | 'balance_sheet'
    | 'cash_flow'
    | 'ar_summary'
    | 'ar_aging'
    | 'ap_summary'
    | 'ap_aging'
    | 'sales_by_customer'
    | 'sales_by_item'
    | 'expense_summary';
  title: string;
  from_date?: string;
  to_date?: string;
  currency: string;
  sections: Array<{
    name: string;
    total?: number;
    rows: Array<{
      label: string;
      value: number | string;
      code?: string;
      isTotal?: boolean;
    }>;
  }>;
  netValue?: number;
  generated_at: string;
}
