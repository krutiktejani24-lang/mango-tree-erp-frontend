import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import api from '../api/client';
import { toast } from 'react-toastify';
import InvoiceForm from '../components/InvoiceForm';

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery(['invoice', id], () => api.get(`/invoices/${id}`).then((r) => r.data));

  async function handleUpdate(payload) {
    try {
      await api.put(`/invoices/${id}`, payload);
      toast.success('Invoice updated');
      qc.invalidateQueries(['invoice', id]);
      qc.invalidateQueries('available-rooms');
      qc.invalidateQueries('all-rooms');
      navigate(`/invoices/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update invoice');
    }
  }

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!data) return <p className="text-sm text-gray-500">Invoice not found.</p>;

  const { invoice, roomCharges } = data;

  if (!invoice.is_editable) {
    return (
      <div className="card max-w-lg mx-auto text-center space-y-2 py-8">
        <p className="font-semibold">This invoice can no longer be edited</p>
        <p className="text-sm text-gray-500">
          {invoice.status === 'cancelled'
            ? 'Cancelled invoices cannot be edited.'
            : 'The 24-hour edit window for this invoice has closed.'}
        </p>
        <button onClick={() => navigate(`/invoices/${id}`)} className="btn-secondary mt-2">Back to Invoice</button>
      </div>
    );
  }

  const defaultValues = {
    guest: {
      full_name: invoice.full_name || '',
      contact_person: invoice.contact_person || '',
      mobile: invoice.mobile || '',
      email: invoice.email || '',
      address: invoice.address || '',
      gst_number: invoice.gst_number || '',
    },
    booking_ref: invoice.booking_ref || '',
    number_of_pax: invoice.number_of_pax || 1,
    place_of_supply: invoice.place_of_supply || '',
    is_gst_applicable: !!invoice.is_gst_applicable,
    is_igst: !!invoice.is_igst,
    gst_percentage: Number(invoice.gst_percentage),
    discount: Number(invoice.discount || 0),
    room_charges: roomCharges.map((r) => ({
      description: r.description || 'Tariff',
      room_label: r.room_label,
      sac_code: r.sac_code || '',
      check_in_date: r.check_in_date ? r.check_in_date.slice(0, 10) : '',
      check_out_date: r.check_out_date ? r.check_out_date.slice(0, 10) : '',
      rate: Number(r.rate),
      adults: r.adults ?? '',
      children: r.children ?? '',
      // Child charge can't be split back out of the stored basic amount reliably,
      // so it starts unchecked here — re-enable and re-enter it if you need to change it.
      child_charge_applicable: false,
      child_charge_amount: 0,
    })),
  };

  const minutesLeft = Math.max(0, Math.round((new Date(invoice.edit_window_ends_at) - Date.now()) / 60000));
  const hoursLeft = Math.floor(minutesLeft / 60);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Edit Invoice — {invoice.invoice_number}</h1>
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Editable for {hoursLeft}h {minutesLeft % 60}m more — locks automatically after that.
        </p>
      </div>

      <InvoiceForm
        defaultValues={defaultValues}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
        submittingLabel="Saving…"
        showPaymentStatus={false}
      />
    </div>
  );
}
