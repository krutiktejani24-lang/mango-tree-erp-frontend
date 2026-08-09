import React from 'react';
import { useQuery } from 'react-query';
import api from '../api/client';
import StatCard from '../components/StatCard';
import {
  IndianRupee, BedDouble, DoorOpen, CalendarCheck, CalendarX, AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const COLORS = ['#1F5C3F', '#B8860B', '#2E7D50'];

export default function Dashboard() {
  const { data: dash } = useQuery('dashboard', () => api.get('/dashboard').then((r) => r.data));
  const { data: revenue } = useQuery('revenue-chart', () => api.get('/dashboard/revenue-chart').then((r) => r.data.data));
  const { data: dist } = useQuery('payment-dist', () => api.get('/dashboard/payment-distribution').then((r) => r.data.data));
  const { data: trends } = useQuery('booking-trends', () => api.get('/dashboard/booking-trends').then((r) => r.data.data));

  const c = dash?.collections || {};
  const rooms = dash?.rooms || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of today's resort operations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Collection" value={`₹${Number(c.today || 0).toLocaleString('en-IN')}`} icon={IndianRupee} accent="forest" />
        <StatCard label="Weekly Collection" value={`₹${Number(c.weekly || 0).toLocaleString('en-IN')}`} icon={IndianRupee} accent="gold" />
        <StatCard label="Monthly Collection" value={`₹${Number(c.monthly || 0).toLocaleString('en-IN')}`} icon={IndianRupee} accent="forest" />
        <StatCard label="Yearly Collection" value={`₹${Number(c.yearly || 0).toLocaleString('en-IN')}`} icon={IndianRupee} accent="gold" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Occupied Rooms" value={rooms.occupied || 0} icon={BedDouble} accent="red" />
        <StatCard label="Available Rooms" value={rooms.available || 0} icon={DoorOpen} accent="forest" />
        <StatCard label="Today's Check-In" value={dash?.today_checkins || 0} icon={CalendarCheck} accent="blue" />
        <StatCard label="Today's Check-Out" value={dash?.today_checkouts || 0} icon={CalendarX} accent="gold" />
      </div>

      {dash?.pending_payments?.total > 0 && (
        <div className="card flex items-center gap-3 border-l-4 border-l-red-500">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-sm">
            <span className="font-semibold">₹{Number(dash.pending_payments.total).toLocaleString('en-IN')}</span> pending across{' '}
            <span className="font-semibold">{dash.pending_payments.count}</span> invoice(s)
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-4 text-sm">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenue || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#1F5C3F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4 text-sm">Payment Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={dist || []} dataKey="total" nameKey="payment_mode" cx="50%" cy="50%" outerRadius={90} label>
                {(dist || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-semibold mb-4 text-sm">Booking Trends (last 14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trends || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#B8860B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
