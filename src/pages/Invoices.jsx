import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Search } from 'lucide-react';

const statusStyle = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  draft: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Invoices() {
  const [search, setSearch] = useState('');
  const { data } = useQuery(['invoices', search], () =>
    api.get('/invoices', { params: search ? { search } : {} }).then((r) => r.data.invoices)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold">Invoices</h1>
          <p className="text-sm text-gray-500">Search by guest, invoice number, room, or booking ID</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input pl-9 w-72"
            placeholder="Search invoices…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Invoice #</th><th>Date</th><th>Guest</th><th>Booking ID</th><th>Rooms</th><th>Total</th><th>Balance</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((inv) => (
              <tr key={inv.id}>
                <td className="font-medium">{inv.invoice_number}</td>
                <td>{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                <td>{inv.full_name}</td>
                <td>{inv.booking_ref || '—'}</td>
                <td>{inv.rooms_summary || '—'}</td>
                <td>₹{Number(inv.grand_total).toLocaleString('en-IN')}</td>
                <td>{inv.balance_due > 0 ? `₹${Number(inv.balance_due).toLocaleString('en-IN')}` : '—'}</td>
                <td><span className={`badge ${statusStyle[inv.status]}`}>{inv.status}</span></td>
                <td>
                  <Link to={`/invoices/${inv.id}`} className="text-forest text-xs hover:underline">View</Link>
                </td>
              </tr>
            ))}
            {(data || []).length === 0 && (
              <tr><td colSpan={9} className="text-center text-gray-500 py-6">No invoices found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
