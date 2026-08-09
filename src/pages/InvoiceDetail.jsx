import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import api from '../api/client';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { amountInWords } from '../utils/numberToWords';
import { Printer, Download, Trash2 } from 'lucide-react';

const STATUS_LABEL = { draft: 'PENDING', partial: 'PENDING', paid: 'PAID', cancelled: 'CANCELLED' };
const STATUS_COLOR = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const [showPay, setShowPay] = useState(false);

  const { data } = useQuery(['invoice', id], () => api.get(`/invoices/${id}`).then((r) => r.data));

  async function cancelInvoice() {
    if (!confirm('Cancel this invoice? This cannot be undone.')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice cancelled');
      qc.invalidateQueries(['invoice', id]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  }

async function downloadPDF() {
  try {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/pdf',
    });

    const pdfUrl = window.URL.createObjectURL(blob);

    window.open(pdfUrl, '_blank');

    // થોડા સમય પછી memory release
    setTimeout(() => {
      window.URL.revokeObjectURL(pdfUrl);
    }, 60000);
  } catch (err) {
    console.error('PDF download error:', err);
    toast.error(
      err.response?.data?.message || 'Failed to generate PDF'
    );
  }
}

  if (!data) return <p className="text-sm text-gray-500">Loading…</p>;
  const { invoice, roomCharges, settings } = data;
  const statusLabel = STATUS_LABEL[invoice.status] || invoice.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-serif font-bold">{invoice.invoice_number}</h1>
          <p className="text-sm text-gray-500">{new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5 text-sm"><Printer size={15} /> Print</button>
          <button onClick={downloadPDF} className="btn-secondary flex items-center gap-1.5 text-sm"><Download size={15} /> PDF</button>
          {invoice.balance_due > 0 && (
            <button onClick={() => setShowPay(true)} className="btn-primary text-sm">Record Payment</button>
          )}
          {isOwner && invoice.status !== 'cancelled' && (
            <button onClick={cancelInvoice} className="btn-secondary flex items-center gap-1.5 text-sm text-red-600"><Trash2 size={15} /> Cancel</button>
          )}
        </div>
      </div>

      {/* PRINTABLE INVOICE */}
      <div id="invoice-print" className="card max-w-4xl mx-auto print:shadow-none print:border-none text-sm">
        <div className="flex justify-between items-start border-b-2 border-forest pb-4 mb-4">
            <div className="flex items-start gap-3">
              <img src="/logo/logo.jpeg" alt="Mango Tree Logo" className="w-14 h-14 object-contain"/>
          <div>
            <h2 className="font-serif text-xl font-bold text-forest">{settings.company_name}</h2>
            <p className="text-xs text-gray-500 max-w-xs">{settings.company_address}</p>
            <p className="text-xs text-gray-500">GSTIN: {settings.company_gst_number || '-'} · PAN: {settings.company_pan_number || '-'}</p>
          </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-forest">TAX INVOICE</p>
            <p className="text-xs">Bill No: {invoice.invoice_number}</p>
            <p className="text-xs">Booked ID: {invoice.booking_ref || '-'}</p>
            <p className="text-xs">Date: {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</p>
            <span className={`badge ${STATUS_COLOR[invoice.status]} mt-1 inline-block`}>{statusLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="font-semibold text-forest text-xs mb-1.5 border-b border-gray-200 dark:border-gray-800 pb-1">GUEST DETAILS</p>
            <Detail label="Guest Name" value={invoice.full_name} />
            {invoice.contact_person && <Detail label="Contact Person" value={invoice.contact_person} />}
            <Detail label="Phone" value={invoice.mobile} />
            {invoice.gst_number && <Detail label="GSTIN" value={invoice.gst_number} />}
            <Detail label="Address" value={invoice.address || '-'} />
          </div>
          <div>
            <p className="font-semibold text-forest text-xs mb-1.5 border-b border-gray-200 dark:border-gray-800 pb-1">BOOKING DETAILS</p>
            <Detail label="Booking ID" value={invoice.booking_ref || '-'} />
            <Detail label="Rooms" value={invoice.rooms_summary || '-'} />
            <Detail label="Number of Pax" value={invoice.number_of_pax ?? '-'} />
            <Detail label="Place of Supply" value={invoice.place_of_supply || '-'} />
          </div>
        </div>

        <p className="font-semibold text-forest text-xs mb-2">ROOM CHARGES</p>
        <table className="table-base mb-1 text-xs">
          <thead>
            <tr>
              <th>Description</th><th>Room</th><th>SAC</th><th>Check In</th><th>Check Out</th><th>Nights</th>
              <th>Rate</th><th>Adults</th><th>Child</th><th className="text-right">Basic</th>
              <th className="text-right">GST@{Number(invoice.gst_percentage)}%</th><th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {roomCharges.map((r) => (
              <tr key={r.id}>
                <td>{r.description}</td>
                <td>{r.room_label}</td>
                <td>{r.sac_code || '-'}</td>
                <td>{r.check_in_date ? new Date(r.check_in_date).toLocaleDateString('en-IN') : '-'}</td>
                <td>{r.check_out_date ? new Date(r.check_out_date).toLocaleDateString('en-IN') : '-'}</td>
                <td>{r.nights}</td>
                <td>₹{Number(r.rate).toLocaleString('en-IN')}</td>
                <td>{r.adults ?? '-'}</td>
                <td>{r.children ?? '-'}</td>
                <td className="text-right">₹{Number(r.basic_amount).toLocaleString('en-IN')}</td>
                <td className="text-right">₹{Number(r.gst_amount).toLocaleString('en-IN')}</td>
                <td className="text-right">₹{Number(r.total_amount).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end bg-forest text-white rounded-lg px-4 py-2 mb-4 mt-3">
          <span className="font-bold mr-4">Grand Total</span>
          <span className="font-bold">₹{Number(invoice.grand_total).toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-gold/10 rounded-lg px-4 py-2.5 text-xs mb-5">
          <span className="font-semibold">Amount Chargeable (in words): </span>
          {invoice.grand_total ? amountInWords(invoice.grand_total) : '—'}
        </div>

        <table className="table-base text-xs mb-5">
          <thead>
            <tr>
              <th>Basic</th>
              <th>{invoice.is_igst ? `IGST@${Number(invoice.gst_percentage)}%` : 'IGST@0%'}</th>
              <th>CGST@{invoice.is_igst ? 0 : (Number(invoice.gst_percentage) / 2).toFixed(2)}%</th>
              <th>SGST@{invoice.is_igst ? 0 : (Number(invoice.gst_percentage) / 2).toFixed(2)}%</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>₹{Number(invoice.subtotal).toLocaleString('en-IN')}</td>
              <td>₹{Number(invoice.igst_amount).toLocaleString('en-IN')}</td>
              <td>₹{Number(invoice.cgst_amount).toLocaleString('en-IN')}</td>
              <td>₹{Number(invoice.sgst_amount).toLocaleString('en-IN')}</td>
              <td>₹{Number(invoice.grand_total).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="font-semibold text-forest text-xs mb-1.5 border-b border-gray-200 dark:border-gray-800 pb-1">
              PAYMENT / BENEFICIARY ACCOUNT INFORMATION
            </p>
            <Detail label="Account Name" value={settings.bank_account_name || '-'} />
            <Detail label="Account Number" value={settings.bank_account_number || '-'} />
            <Detail label="Account Type" value={settings.bank_account_type || '-'} />
            <Detail label="Bank Name" value={settings.bank_name || '-'} />
            <Detail label="IFSC" value={settings.bank_ifsc || '-'} />
            <Detail label="Bank Address" value={settings.bank_address || '-'} />
          </div>
          <div>
            <div className="text-xs space-y-1">
              <Row label="Payment Status" value={statusLabel} />
              <Row label="Invoice Date" value={new Date(invoice.invoice_date).toLocaleDateString('en-IN')} />
              <Row label="Bill No" value={invoice.invoice_number} />
              <Row label="Booked ID" value={invoice.booking_ref || '-'} />
              <div className="flex justify-between bg-forest text-white rounded px-2 py-1.5 mt-1">
                <span className="font-semibold">Amount Due</span>
                <span className="font-semibold">₹{Number(invoice.balance_due).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <p className="text-right mt-6 text-xs">For {settings.company_name?.toUpperCase()}</p>
            <p className="text-right mt-8 border-t border-gray-400 pt-1 text-xs w-40 ml-auto">Authorised Signatory</p>
          </div>
        </div>

        <p className="text-center font-serif font-bold text-forest">Thank You For Choosing {settings.company_name}</p>
        <p className="text-center text-xs text-gray-500 mb-4">We sincerely appreciate your stay with us.</p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2 text-[11px] text-gray-500 text-center italic mb-4">
          Note: Guest having GSTIN number must be intimated before billing. Once our invoice is raised, we will not amend our bills at any point in time.
        </div>

        <p className="text-center font-semibold text-forest text-xs mb-1">Terms & Conditions</p>
        {(settings.terms_and_conditions || '').split('\n').filter(Boolean).map((t, i) => (
          <p key={i} className="text-center text-[11px] text-gray-500">• {t.trim()}</p>
        ))}
      </div>

      {showPay && (
        <PaymentModal
          invoiceId={id}
          balance={invoice.balance_due}
          onClose={() => setShowPay(false)}
          onSaved={() => { setShowPay(false); qc.invalidateQueries(['invoice', id]); }}
        />
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <p className="text-xs mb-1"><span className="font-medium">{label} : </span>{value}</p>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
      <span className="text-gray-500">{label}</span><span className="font-medium">{value}</span>
    </div>
  );
}

function PaymentModal({ invoiceId, balance, onClose, onSaved }) {
  const [mode, setMode] = useState('cash');
  const [amount, setAmount] = useState(balance);
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await api.post('/payments', { invoice_id: invoiceId, payment_mode: mode, amount, ...fields });
      toast.success('Payment recorded');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
      <div className="card w-full max-w-sm space-y-4">
        <h3 className="font-semibold">Record Payment</h3>
        <div>
          <label className="label">Amount (₹)</label>
          <input type="number" className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Payment Mode</label>
          <select className="input" value={mode} onChange={(e) => { setMode(e.target.value); setFields({}); }}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>
        {mode === 'upi' && (
          <div className="space-y-2">
            <input className="input" placeholder="UPI ID" onChange={(e) => setFields((f) => ({ ...f, upi_id: e.target.value }))} />
            <input className="input" placeholder="UTR Number" onChange={(e) => setFields((f) => ({ ...f, utr_number: e.target.value }))} />
            <input className="input" placeholder="Payment App (GPay/PhonePe...)" onChange={(e) => setFields((f) => ({ ...f, payment_app: e.target.value }))} />
          </div>
        )}
        {mode === 'card' && (
          <div className="space-y-2">
            <input className="input" placeholder="Last 4 Digits" maxLength={4} onChange={(e) => setFields((f) => ({ ...f, card_last4: e.target.value }))} />
            <input className="input" placeholder="Card Type (Visa/Mastercard...)" onChange={(e) => setFields((f) => ({ ...f, card_type: e.target.value }))} />
            <input className="input" placeholder="Bank Name" onChange={(e) => setFields((f) => ({ ...f, bank_name: e.target.value }))} />
          </div>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Payment'}</button>
        </div>
      </div>
    </div>
  );
}
