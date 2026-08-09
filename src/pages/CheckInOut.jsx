import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import api from '../api/client';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function CheckInOut() {
  const [tab, setTab] = useState('checkin');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Check-In / Check-Out</h1>
        <p className="text-sm text-gray-500">Register arriving guests or settle departing bills</p>
      </div>
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {[['checkin', 'Check-In'], ['checkout', 'Check-Out']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === key ? 'border-forest text-forest' : 'border-transparent text-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'checkin' ? <CheckInForm /> : <CheckOutPanel />}
    </div>
  );
}

function CheckInForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const { data: rooms } = useQuery('available-rooms', () =>
    api.get('/rooms', { params: { status: 'available' } }).then((r) => r.data.rooms)
  );
  const qc = useQueryClient();

  async function onSubmit(values) {
    try {
      await api.post('/bookings/check-in', {
        ...values,
        adults: Number(values.adults),
        children: Number(values.children || 0),
        children_above_10: Number(values.children_above_10 || 0),
        room_id: Number(values.room_id),
        room_rate: Number(values.room_rate),
      });
      toast.success('Guest checked in successfully');
      reset();
      qc.invalidateQueries('available-rooms');
      qc.invalidateQueries('rooms');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Guest Name" error={errors.full_name}>
          <input className="input" {...register('full_name', { required: true })} />
        </Field>
        <Field label="Mobile Number" error={errors.mobile}>
          <input className="input" {...register('mobile', { required: true })} />
        </Field>
        <Field label="Email">
          <input type="email" className="input" {...register('email')} />
        </Field>
        <Field label="Address">
          <input className="input" {...register('address')} />
        </Field>
        <Field label="City">
          <input className="input" {...register('city')} />
        </Field>
        <Field label="State">
          <input className="input" {...register('state')} />
        </Field>
        <Field label="Country">
          <input className="input" defaultValue="India" {...register('country')} />
        </Field>
        <Field label="ID Proof Type">
          <select className="input" {...register('id_proof_type')}>
            <option value="">Select</option>
            <option>Aadhaar</option>
            <option>Passport</option>
            <option>Driving License</option>
            <option>Voter ID</option>
          </select>
        </Field>
        <Field label="ID Proof Number">
          <input className="input" {...register('id_proof_number')} />
        </Field>
        <Field label="Company Name">
          <input className="input" {...register('company_name')} />
        </Field>
        <Field label="GST Number">
          <input className="input" {...register('gst_number')} />
        </Field>
      </div>

      <hr className="border-gray-200 dark:border-gray-800" />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Room" error={errors.room_id}>
          <select className="input" {...register('room_id', { required: true })}>
            <option value="">Select available room</option>
            {(rooms || []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_number} — {r.room_type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Room Rate (₹/night)" error={errors.room_rate}>
          <input type="number" min={0} step="0.01" placeholder="Enter agreed nightly rate" className="input" {...register('room_rate', { required: true })} />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Adults">
            <input type="number" min={1} defaultValue={1} className="input" {...register('adults', { required: true })} />
          </Field>
          <Field label="Children">
            <input type="number" min={0} defaultValue={0} className="input" {...register('children')} />
          </Field>
          <Field label="Children >10y">
            <input type="number" min={0} defaultValue={0} className="input" {...register('children_above_10')} />
          </Field>
        </div>
        <Field label="Check-In Date" error={errors.check_in_date}>
          <input type="datetime-local" className="input" {...register('check_in_date', { required: true })} />
        </Field>
        <Field label="Expected Check-Out" error={errors.expected_check_out_date}>
          <input type="datetime-local" className="input" {...register('expected_check_out_date', { required: true })} />
        </Field>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? 'Processing…' : 'Check In Guest'}
      </button>
    </form>
  );
}

function CheckOutPanel() {
  const navigate = useNavigate();
  const { data: bookings, refetch } = useQuery('active-bookings', () =>
    api.get('/bookings', { params: { status: 'checked_in' } }).then((r) => r.data.bookings)
  );
  const [selected, setSelected] = useState(null);
  const [bill, setBill] = useState(null);
  const [extras, setExtras] = useState({ extra_adult_charges: 0, extra_child_charges: 0, food_charges: 0, laundry_charges: 0, other_charges: 0, discount: 0 });
  const [hasChildCharge, setHasChildCharge] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [loadingBill, setLoadingBill] = useState(false);

  async function loadPreview(booking) {
    setSelected(booking);
    setLoadingBill(true);
    try {
      const { data } = await api.get(`/bookings/${booking.id}/check-out/preview`, { params: extras });
      setBill(data.bill);
    } finally {
      setLoadingBill(false);
    }
  }

  async function refreshPreview() {
    if (selected) await loadPreview(selected);
  }

  async function finalizeCheckout() {
    try {
      const { data } = await api.post(`/bookings/${selected.id}/check-out`, { ...extras, payment_status: paymentStatus });
      toast.success(`Invoice ${data.invoice_number} generated`);
      setSelected(null);
      setBill(null);
      refetch();
      navigate(`/invoices/${data.invoice_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="font-semibold mb-3 text-sm">Currently Checked-In Guests</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {(bookings || []).length === 0 && <p className="text-sm text-gray-500">No active guests.</p>}
          {(bookings || []).map((b) => (
            <button
              key={b.id}
              onClick={() => loadPreview(b)}
              className={`w-full text-left p-3 rounded-lg border text-sm ${selected?.id === b.id ? 'border-forest bg-forest/5' : 'border-gray-200 dark:border-gray-800'}`}
            >
              <p className="font-medium">{b.full_name} · Room {b.room_number}</p>
              <p className="text-xs text-gray-500">{b.booking_code} · In: {new Date(b.check_in_date).toLocaleDateString('en-IN')}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3 text-sm">Checkout Bill</h3>
        {!selected && <p className="text-sm text-gray-500">Select a guest to calculate the bill.</p>}
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <ExtraField label="Extra Adult (₹)" value={extras.extra_adult_charges} onChange={(v) => setExtras((e) => ({ ...e, extra_adult_charges: v }))} onBlur={refreshPreview} />
              <ExtraField label="Food (₹)" value={extras.food_charges} onChange={(v) => setExtras((e) => ({ ...e, food_charges: v }))} onBlur={refreshPreview} />
              <ExtraField label="Laundry (₹)" value={extras.laundry_charges} onChange={(v) => setExtras((e) => ({ ...e, laundry_charges: v }))} onBlur={refreshPreview} />
              <ExtraField label="Other (₹)" value={extras.other_charges} onChange={(v) => setExtras((e) => ({ ...e, other_charges: v }))} onBlur={refreshPreview} />
              <ExtraField label="Discount (₹)" value={extras.discount} onChange={(v) => setExtras((e) => ({ ...e, discount: v }))} onBlur={refreshPreview} />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={hasChildCharge}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasChildCharge(checked);
                    if (!checked) setExtras((ex) => ({ ...ex, extra_child_charges: 0 }));
                  }}
                  onBlur={refreshPreview}
                />
                Children above 10y — add extra charge
              </label>
              {hasChildCharge && (
                <input
                  type="number" min={0} className="input !w-32 !py-1 text-xs"
                  placeholder="Charge ₹" value={extras.extra_child_charges}
                  onChange={(e) => setExtras((ex) => ({ ...ex, extra_child_charges: Number(e.target.value) }))}
                  onBlur={refreshPreview}
                />
              )}
            </div>

            {loadingBill && <p className="text-sm text-gray-500">Calculating…</p>}
            {bill && !loadingBill && (
              <div className="text-sm space-y-1.5 border-t border-gray-200 dark:border-gray-800 pt-3">
                <Row label={`Room Charges (${bill.nights} nights)`} value={bill.room_charges} />
                {bill.extra_adult_charges > 0 && <Row label="Extra Adult Charges" value={bill.extra_adult_charges} />}
                {bill.extra_child_charges > 0 && <Row label="Extra Child Charges" value={bill.extra_child_charges} />}
                {bill.food_charges > 0 && <Row label="Food" value={bill.food_charges} />}
                {bill.laundry_charges > 0 && <Row label="Laundry" value={bill.laundry_charges} />}
                {bill.other_charges > 0 && <Row label="Other" value={bill.other_charges} />}
                {bill.discount > 0 && <Row label="Discount" value={-bill.discount} />}
                <Row label="Subtotal" value={bill.subtotal} />
                <Row label={`GST (${bill.gst_percentage}%)`} value={bill.cgst_amount + bill.sgst_amount} />
                <Row label="Round Off" value={bill.round_off} />
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-800">
                  <span>Grand Total</span><span>₹{Number(bill.grand_total).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
            <div>
              <label className="label text-[11px]">Payment Status</label>
              <div className="grid grid-cols-2 gap-2">
                <label className={`text-center text-xs py-1.5 rounded-lg border cursor-pointer ${paymentStatus === 'pending' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium' : 'border-gray-200 dark:border-gray-800'}`}>
                  <input type="radio" name="checkoutPaymentStatus" className="hidden" checked={paymentStatus === 'pending'} onChange={() => setPaymentStatus('pending')} /> Pending
                </label>
                <label className={`text-center text-xs py-1.5 rounded-lg border cursor-pointer ${paymentStatus === 'paid' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium' : 'border-gray-200 dark:border-gray-800'}`}>
                  <input type="radio" name="checkoutPaymentStatus" className="hidden" checked={paymentStatus === 'paid'} onChange={() => setPaymentStatus('paid')} /> Paid
                </label>
              </div>
            </div>
            <button onClick={finalizeCheckout} disabled={!bill} className="btn-primary w-full">
              Confirm Check-Out & Generate Invoice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-gray-600 dark:text-gray-300">
      <span>{label}</span><span>₹{Number(value).toLocaleString('en-IN')}</span>
    </div>
  );
}

function ExtraField({ label, value, onChange, onBlur }) {
  return (
    <div>
      <label className="label text-[11px]">{label}</label>
      <input
        type="number"
        min={0}
        className="input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onBlur}
      />
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">This field is required</p>}
    </div>
  );
}
