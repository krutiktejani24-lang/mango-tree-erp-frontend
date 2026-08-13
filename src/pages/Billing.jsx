import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../api/client';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const n = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  return n > 0 ? n : 1;
}

const emptyRow = () => ({
  description: 'Tariff', room_label: '', sac_code: '', check_in_date: '', check_out_date: '',
  rate: 0, adults: '', children: '', child_charge_applicable: false, child_charge_amount: 0,
});


export default function Billing() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: settings } = useQuery('settings', () => api.get('/settings').then((r) => r.data.settings));
  const { data: sacCodes } = useQuery('sac-codes', () => api.get('/sac-codes').then((r) => r.data.sacCodes));
  const { data: availableRooms } = useQuery('available-rooms', () =>
    api.get('/rooms', { params: { status: 'available' } }).then((r) => r.data.rooms)
  );

  const { register, control, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      guest: { full_name: '', contact_person: '', mobile: '', email: '', address: '', gst_number: '' },
      booking_ref: '',
      number_of_pax: 1,
      place_of_supply: '',
      is_gst_applicable: true,
      is_igst: false,
      gst_percentage: 5,
      discount: 0,
      payment_status: 'pending',
      room_charges: [emptyRow()],
    },
  });

  React.useEffect(() => {
    if (settings) {
      setValue('gst_percentage', Number(settings.default_gst_percentage));
      setValue('place_of_supply', settings.default_place_of_supply || '');
    }
  }, [settings, setValue]);

  const { fields, append, remove } = useFieldArray({ control, name: 'room_charges' });
  const rows = watch('room_charges');
  const discount = Number(watch('discount') || 0);
  const gstOn = watch('is_gst_applicable');
  const gstPct = Number(watch('gst_percentage') || 0);
  const isIgst = watch('is_igst');
  const paymentStatus = watch('payment_status');

  const computed = useMemo(() => {
    const computedRows = (rows || []).map((r) => {
      const nights = nightsBetween(r.check_in_date, r.check_out_date);
      const childCharge = r.child_charge_applicable ? Number(r.child_charge_amount || 0) : 0;
      const basic = nights * Number(r.rate || 0) + childCharge;
      const gst = gstOn ? basic * (gstPct / 100) : 0;
      return { ...r, nights, childCharge, basic, gst, total: basic + gst };
    });
    const subtotal = computedRows.reduce((s, r) => s + r.basic, 0);
    const totalGst = computedRows.reduce((s, r) => s + r.gst, 0);
    const rawTotal = subtotal + totalGst - discount;
    const grandTotal = Math.round(rawTotal);
    return { computedRows, subtotal, totalGst, grandTotal };
  }, [rows, gstOn, gstPct, discount]);

  async function onSubmit(values) {
    try {
      const room_charges = computed.computedRows.map((r) => ({
        description: r.description || 'Tariff',
        room_label: r.room_label,
        sac_code: r.sac_code || null,
        check_in_date: r.check_in_date || null,
        check_out_date: r.check_out_date || null,
        nights: r.nights,
        rate: Number(r.rate || 0),
        adults: r.adults === '' ? null : Number(r.adults),
        children: r.children === '' ? null : Number(r.children),
        basic_amount: r.basic,
      }));
      const roomsSummary = room_charges.map((r) => r.room_label).filter(Boolean).join(', ');

      const { data } = await api.post('/invoices', {
        guest: values.guest,
        booking_ref: values.booking_ref || null,
        rooms_summary: roomsSummary,
        number_of_pax: Number(values.number_of_pax) || null,
        place_of_supply: values.place_of_supply,
        is_gst_applicable: values.is_gst_applicable,
        gst_percentage: Number(values.gst_percentage),
        is_igst: values.is_igst,
        discount: Number(values.discount || 0),
        payment_status: values.payment_status,
        room_charges,
      });
      toast.success(`Invoice ${data.invoice_number} created`);
      qc.invalidateQueries('available-rooms');
      qc.invalidateQueries('all-rooms');
      navigate(`/invoices/${data.invoice_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Manual Billing</h1>
        <p className="text-sm text-gray-500">Company & bank details print automatically — everything below is entered per invoice</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-4">
            <h3 className="font-semibold text-sm">Guest Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <input className="input" placeholder="Guest / Company Name *" {...register('guest.full_name', { required: true })} />
              <input className="input" placeholder="Contact Person" {...register('guest.contact_person')} />
              <input className="input" placeholder="Mobile Number *" {...register('guest.mobile', { required: true })} />
              <input className="input" placeholder="Email" {...register('guest.email')} />
              <input className="input sm:col-span-2" placeholder="Address" {...register('guest.address')} />
              <input className="input" placeholder="GSTIN" {...register('guest.gst_number')} />
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="font-semibold text-sm">Booking Details</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <input className="input" placeholder="Booking ID (e.g. MT-026)" {...register('booking_ref')} />
              <input type="number" min={1} className="input" placeholder="Number of Pax" {...register('number_of_pax')} />
              <input className="input" placeholder="Place of Supply" {...register('place_of_supply')} />
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Room Charges</h3>
              <button
                type="button"
                onClick={() => append(emptyRow())}
                className="text-forest text-xs flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Add Row
              </button>
            </div>
            {fields.map((f, i) => (
              <RoomChargeRow
                key={f.id}
                index={i}
                register={register}
                remove={() => remove(i)}
                computedRow={computed.computedRows[i]}
                sacCodes={sacCodes}
                availableRooms={availableRooms}
                selectedRoom={rows[i]?.room_label}
                childApplicable={rows[i]?.child_charge_applicable}
                onSacAdded={() => qc.invalidateQueries('sac-codes')}
              />
            ))}
          </div>
        </div>

        <div className="card h-fit space-y-4">
          <h3 className="font-semibold text-sm">Tax & Summary</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('is_gst_applicable')} /> GST Applicable
          </label>
          <div>
            <label className="label">GST Percentage (%)</label>
            <input type="number" step="0.01" className="input" {...register('gst_percentage')} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('is_igst')} /> Inter-state (IGST instead of CGST+SGST)
          </label>
          <div>
            <label className="label">Discount (₹)</label>
            <input type="number" min={0} className="input" {...register('discount')} />
          </div>

          <div>
            <label className="label">Payment Status</label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`text-center text-sm py-2 rounded-lg border cursor-pointer ${paymentStatus === 'pending' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium' : 'border-gray-200 dark:border-gray-800'}`}>
                <input type="radio" value="pending" {...register('payment_status')} className="hidden" /> Pending
              </label>
              <label className={`text-center text-sm py-2 rounded-lg border cursor-pointer ${paymentStatus === 'paid' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium' : 'border-gray-200 dark:border-gray-800'}`}>
                <input type="radio" value="paid" {...register('payment_status')} className="hidden" /> Paid
              </label>
            </div>
          </div>

          <div className="text-sm space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between"><span>Basic</span><span>₹{computed.subtotal.toLocaleString('en-IN')}</span></div>
            {discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-₹{discount.toLocaleString('en-IN')}</span></div>}
            {gstOn && (
              isIgst ? (
                <div className="flex justify-between"><span>IGST ({gstPct}%)</span><span>₹{computed.totalGst.toFixed(2)}</span></div>
              ) : (
                <>
                  <div className="flex justify-between"><span>CGST ({(gstPct / 2).toFixed(2)}%)</span><span>₹{(computed.totalGst / 2).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>SGST ({(gstPct / 2).toFixed(2)}%)</span><span>₹{(computed.totalGst / 2).toFixed(2)}</span></div>
                </>
              )
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-800">
              <span>Grand Total</span><span>₹{computed.grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating…' : 'Generate Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}

function RoomChargeRow({ index: i, register, remove, computedRow, sacCodes, availableRooms, selectedRoom, childApplicable, onSacAdded }) {
  const [addingSac, setAddingSac] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [savingSac, setSavingSac] = useState(false);

  async function saveNewSac() {
    if (!newCode.trim()) return;
    setSavingSac(true);
    try {
      await api.post('/sac-codes', { code: newCode.trim() });
      toast.success('SAC code added');
      setNewCode('');
      setAddingSac(false);
      onSacAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add SAC code');
    } finally {
      setSavingSac(false);
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        <input className="input col-span-2 sm:col-span-1" placeholder="Description" {...register(`room_charges.${i}.description`)} />
        <select className="input" {...register(`room_charges.${i}.room_label`, { required: true })}>
          <option value="">Select room</option>
          {(availableRooms || []).map((r) => (
            <option key={r.id} value={r.room_number}>{r.room_number} — {r.room_type}</option>
          ))}
          {selectedRoom && !(availableRooms || []).some((r) => r.room_number === selectedRoom) && (
            <option value={selectedRoom}>{selectedRoom}</option>
          )}
        </select>
        <input type="date" className="input" {...register(`room_charges.${i}.check_in_date`)} />
        <input type="date" className="input" {...register(`room_charges.${i}.check_out_date`)} />
        <input type="number" min={0} step="0.01" className="input" placeholder="Rate ₹" {...register(`room_charges.${i}.rate`, { required: true })} />
        <button type="button" onClick={remove} className="text-red-500 flex items-center justify-center"><Trash2 size={16} /></button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-start">
        <input type="number" min={0} className="input" placeholder="Adults" {...register(`room_charges.${i}.adults`)} />
        <input type="number" min={0} className="input" placeholder="Children" {...register(`room_charges.${i}.children`)} />
        {!addingSac ? (
          <div className="flex gap-1">
            <select className="input" {...register(`room_charges.${i}.sac_code`)}>
              <option value="">SAC Code</option>
              {(sacCodes || []).map((s) => (
                <option key={s.id} value={s.code}>{s.code}{s.description ? ` — ${s.description}` : ''}</option>
              ))}
            </select>
            <button type="button" onClick={() => setAddingSac(true)} className="text-forest text-xs px-2 whitespace-nowrap">+ New</button>
          </div>
        ) : (
          <div className="flex gap-1">
            <input className="input" placeholder="New code" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
            <button type="button" onClick={saveNewSac} disabled={savingSac} className="btn-secondary text-xs px-2">Save</button>
            <button type="button" onClick={() => setAddingSac(false)} className="text-xs text-gray-500 px-1">✕</button>
          </div>
        )}
        <div className="text-xs text-gray-500 flex items-center justify-center">
          {computedRow?.nights || 1} night(s)
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" {...register(`room_charges.${i}.child_charge_applicable`)} />
          Children above 10y — add extra charge
        </label>
        {childApplicable && (
          <input
            type="number" min={0} step="0.01" className="input !w-32 !py-1 text-xs"
            placeholder="Charge ₹" {...register(`room_charges.${i}.child_charge_amount`)}
          />
        )}
      </div>

      <div className="text-right text-xs text-gray-500">
        Basic: ₹{(computedRow?.basic || 0).toLocaleString('en-IN')} · GST: ₹{(computedRow?.gst || 0).toFixed(2)} · Total: ₹{(computedRow?.total || 0).toFixed(2)}
      </div>
    </div>
  );
}
