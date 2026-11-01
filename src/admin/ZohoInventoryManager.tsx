import React from 'react';

interface ZohoInventoryManagerProps {
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export default function ZohoInventoryManager({ onNotify }: ZohoInventoryManagerProps) {
  return (
    <div className="w-full max-w-lg mx-auto my-6 p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
      <div className="space-y-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            One-Touch Access Active
          </span>
        </div>

        <div className="space-y-1.5 text-sm text-slate-700">
          <p className="font-medium text-slate-800">
            Org ID: <span className="font-mono text-slate-900 font-semibold">60072580070</span>
          </p>
          <p className="font-medium text-slate-800">
            QBENCH India (INR)
          </p>
          <p className="font-mono text-xs text-slate-500">
            books.zoho.in
          </p>
        </div>

        <div className="pt-2">
          <a
            href="https://books.zoho.in/app/60072580070#/home/dashboard?dashboard_id=defaultdashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Open Zoho Books
          </a>
        </div>
      </div>
    </div>
  );
}
