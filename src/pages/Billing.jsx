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


const DEFAULT_VALUES = {
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
};

export default function Billing() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleCreate(payload) {
    try {
      const { data } = await api.post('/invoices', payload);
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

      <InvoiceForm
        defaultValues={DEFAULT_VALUES}
        onSubmit={handleCreate}
        submitLabel="Generate Invoice"
        submittingLabel="Creating…"
        showPaymentStatus
      />
    </div>
  );
}

