import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import api from '../api/client';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';

export default function Settings() {
  const { data } = useQuery('settings', () => api.get('/settings').then((r) => r.data.settings));
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => { if (data) reset(data); }, [data, reset]);

  async function onSubmit(values) {
    try {
      await api.put('/settings', values);
      toast.success('Settings saved');
      qc.invalidateQueries('settings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  }

  if (!data) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-serif font-bold">Settings</h1>
        <p className="text-sm text-gray-500">
          Everything here prints identically on every invoice — company header, tax IDs, and bank details.
          Guest, booking, and room-charge details are entered manually each time you create an invoice.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Section title="Company Details (fixed on every invoice)">
          <input className="input" placeholder="Company Name" {...register('company_name')} />
          <input className="input" placeholder="GSTIN" {...register('company_gst_number')} />
          <input className="input" placeholder="PAN Number" {...register('company_pan_number')} />
          <input className="input" placeholder="Default Place of Supply (e.g. Gujarat)" {...register('default_place_of_supply')} />
          <input className="input" placeholder="Phone" {...register('company_phone')} />
          <input className="input" placeholder="Email" {...register('company_email')} />
          <textarea className="input sm:col-span-2" placeholder="Address" rows={2} {...register('company_address')} />
        </Section>

        <Section title="Payment / Beneficiary Account Information (fixed on every invoice)">
          <input className="input" placeholder="Account Name" {...register('bank_account_name')} />
          <input className="input" placeholder="Account Number" {...register('bank_account_number')} />
          <input className="input" placeholder="Account Type (e.g. Current)" {...register('bank_account_type')} />
          <input className="input" placeholder="Bank Name" {...register('bank_name')} />
          <input className="input" placeholder="IFSC Code" {...register('bank_ifsc')} />
          <input className="input sm:col-span-2" placeholder="Bank Address" {...register('bank_address')} />
        </Section>

        <Section title="GST & Invoice Numbering">
          <div>
            <label className="label">Default GST Percentage (%)</label>
            <input type="number" step="0.01" className="input" {...register('default_gst_percentage')} />
            <p className="text-[11px] text-gray-400 mt-1">Split evenly as CGST + SGST unless an invoice is marked inter-state (IGST)</p>
          </div>
          <div>
            <label className="label">Invoice Prefix</label>
            <input className="input" {...register('invoice_prefix')} />
          </div>
          <div>
            <label className="label">Financial Year</label>
            <input className="input" placeholder="26-27" {...register('financial_year')} />
          </div>
        </Section>

        <SacCodesSection />

        <Section title="Terms & Conditions (one per line)">
          <textarea className="input sm:col-span-2" rows={5} {...register('terms_and_conditions')} />
        </Section>

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

function SacCodesSection() {
  const { data: sacCodes, refetch } = useQuery('sac-codes', () => api.get('/sac-codes').then((r) => r.data.sacCodes));
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [adding, setAdding] = useState(false);

  async function addCode(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setAdding(true);
    try {
      await api.post('/sac-codes', { code: code.trim(), description: description.trim() || null });
      toast.success('SAC code added');
      setCode('');
      setDescription('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add SAC code');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-sm">SAC Codes</h3>
      <p className="text-xs text-gray-500">
        SAC codes are picked per room-charge row when billing, not fixed company-wide. Add any new codes here — they'll show up in the dropdown on the Manual Billing page.
      </p>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {(sacCodes || []).map((s) => (
          <div key={s.id} className="flex justify-between text-xs px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="font-medium">{s.code}</span>
            <span className="text-gray-500">{s.description || '—'}</span>
          </div>
        ))}
        {(sacCodes || []).length === 0 && <p className="text-xs text-gray-400">No SAC codes yet.</p>}
      </div>
      <form onSubmit={addCode} className="flex gap-2 flex-wrap">
        <input className="input flex-1 min-w-[100px]" placeholder="Code (e.g. 996311)" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className="input flex-1 min-w-[140px]" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit" disabled={adding} className="btn-secondary flex items-center gap-1.5 text-xs px-3">
          <Plus size={14} /> Add
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-sm">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}
