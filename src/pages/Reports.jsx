import React, { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../api/client';
import { Download } from 'lucide-react';

const periods = [
  ['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly'], ['custom', 'Custom'],
];

export default function Reports() {
  const [tab, setTab] = useState('revenue');
  const [period, setPeriod] = useState('monthly');
  const [range, setRange] = useState({ from: '', to: '' });

  const params = period === 'custom' ? { from: range.from, to: range.to } : { period };

  const { data: revenue } = useQuery(['report-revenue', params], () =>
    api.get('/reports/revenue', { params }).then((r) => r.data), { enabled: tab === 'revenue' });
  const { data: gst } = useQuery(['report-gst', params], () =>
    api.get('/reports/gst', { params }).then((r) => r.data), { enabled: tab === 'gst' });
  const { data: occ } = useQuery(['report-occ', params], () =>
    api.get('/reports/occupancy', { params }).then((r) => r.data), { enabled: tab === 'occupancy' });

  function exportFile(type) {
    const q = new URLSearchParams(params).toString();
    window.open(`${api.defaults.baseURL}/reports/export/${type}?${q}`, '_blank');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Reports</h1>
        <p className="text-sm text-gray-500">Revenue, GST, and occupancy reports with export</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {[['revenue', 'Revenue / Invoice'], ['gst', 'GST'], ['occupancy', 'Occupancy']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tab === k ? 'bg-forest text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {periods.map(([k, l]) => (
            <button key={k} onClick={() => setPeriod(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === k ? 'bg-gold text-obsidian' : 'bg-gray-100 dark:bg-gray-800'}`}>{l}</button>
          ))}
          {period === 'custom' && (
            <>
              <input type="date" className="input !w-auto" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
              <input type="date" className="input !w-auto" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
            </>
          )}
        </div>
      </div>

      {tab === 'revenue' && revenue && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat label="Invoices" value={revenue.totals.invoice_count} />
            <MiniStat label="Total Revenue" value={`₹${Number(revenue.totals.total_revenue).toLocaleString('en-IN')}`} />
            <MiniStat label="Collected" value={`₹${Number(revenue.totals.total_collected).toLocaleString('en-IN')}`} />
            <MiniStat label="Pending" value={`₹${Number(revenue.totals.total_pending).toLocaleString('en-IN')}`} />
          </div>
          <div className="card overflow-x-auto p-0">
            <div className="flex justify-end p-3">
              <button onClick={() => exportFile('invoices')} className="btn-secondary text-xs flex items-center gap-1.5"><Download size={14} /> Export Excel</button>
            </div>
            <table className="table-base">
              <thead><tr><th>Invoice #</th><th>Date</th><th>Guest</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
              <tbody>
                {revenue.invoices.map((inv) => (
                  <tr key={inv.invoice_number}>
                    <td>{inv.invoice_number}</td>
                    <td>{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                    <td>{inv.full_name}</td>
                    <td>₹{Number(inv.grand_total).toLocaleString('en-IN')}</td>
                    <td>₹{Number(inv.amount_paid).toLocaleString('en-IN')}</td>
                    <td>₹{Number(inv.balance_due).toLocaleString('en-IN')}</td>
                    <td className="capitalize">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'gst' && gst && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <MiniStat label="Total CGST" value={`₹${Number(gst.totals.total_cgst).toLocaleString('en-IN')}`} />
            <MiniStat label="Total SGST" value={`₹${Number(gst.totals.total_sgst).toLocaleString('en-IN')}`} />
            <MiniStat label="Total GST" value={`₹${Number(gst.totals.total_gst).toLocaleString('en-IN')}`} />
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="table-base">
              <thead><tr><th>Invoice #</th><th>Date</th><th>Guest</th><th>GSTIN</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>Total</th></tr></thead>
              <tbody>
                {gst.rows.map((r) => (
                  <tr key={r.invoice_number}>
                    <td>{r.invoice_number}</td><td>{new Date(r.invoice_date).toLocaleDateString('en-IN')}</td>
                    <td>{r.full_name}</td><td>{r.gst_number || '—'}</td>
                    <td>₹{Number(r.subtotal).toLocaleString('en-IN')}</td>
                    <td>₹{Number(r.cgst_amount).toLocaleString('en-IN')}</td>
                    <td>₹{Number(r.sgst_amount).toLocaleString('en-IN')}</td>
                    <td>₹{Number(r.grand_total).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'occupancy' && occ && (
        <>
          <MiniStat label="Current Occupancy" value={`${occ.occupancy.current_occupancy_pct || 0}%`} />
          <div className="card overflow-x-auto p-0 mt-4">
            <table className="table-base">
              <thead><tr><th>Room</th><th>Type</th><th>Booking</th><th>Guest</th><th>Check-In</th><th>Check-Out</th><th>Status</th></tr></thead>
              <tbody>
                {occ.rows.map((r) => (
                  <tr key={r.booking_code}>
                    <td>{r.room_number}</td><td>{r.room_type}</td><td>{r.booking_code}</td><td>{r.full_name}</td>
                    <td>{new Date(r.check_in_date).toLocaleDateString('en-IN')}</td>
                    <td>{r.actual_check_out_date ? new Date(r.actual_check_out_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="capitalize">{r.status.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
