import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BedDouble, Users, ChevronDown, ChevronUp } from 'lucide-react';

const statusStyle = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  occupied: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  reserved: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  maintenance: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const CATEGORIES = [
  { type: 'Double Occupancy', code: 'D', capacity: 2 },
  { type: 'Triple Occupancy', code: 'T', capacity: 3 },
];

export default function Rooms() {
  const { isOwner } = useAuth();
  const [expanded, setExpanded] = useState(null); // 'Double Occupancy' | 'Triple Occupancy' | null
  const [statusFilter, setStatusFilter] = useState('');

  const { data, refetch } = useQuery('all-rooms', () => api.get('/rooms').then((r) => r.data.rooms));

  const grouped = useMemo(() => {
    const g = { 'Double Occupancy': [], 'Triple Occupancy': [] };
    (data || []).forEach((r) => { if (g[r.room_type]) g[r.room_type].push(r); });
    return g;
  }, [data]);

  function summarize(rooms) {
    return {
      total: rooms.length,
      available: rooms.filter((r) => r.status === 'available').length,
      occupied: rooms.filter((r) => r.status === 'occupied').length,
      reserved: rooms.filter((r) => r.status === 'reserved').length,
      maintenance: rooms.filter((r) => r.status === 'maintenance').length,
    };
  }

  async function changeStatus(room, newStatus) {
    if (!isOwner || newStatus === room.status) return;
    await api.put(`/rooms/${room.id}`, { status: newStatus });
    refetch();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Rooms</h1>
        <p className="text-sm text-gray-500">Room rate is set manually at check-in — no fixed pricing</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        {CATEGORIES.map(({ type, code, capacity }) => {
          const rooms = grouped[type];
          const s = summarize(rooms);
          const isOpen = expanded === type;
          return (
            <button
              key={type}
              onClick={() => setExpanded(isOpen ? null : type)}
              className={`card text-left space-y-3 transition-colors ${isOpen ? 'border-forest ring-1 ring-forest' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-serif font-bold">
                    {code}
                  </div>
                  <div>
                    <p className="font-semibold">{type}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Users size={12} /> Up to {capacity} adults</p>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
              <div className="flex gap-4 text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">{s.total} total</span>
                <span className="text-green-600 dark:text-green-400">{s.available} available</span>
                <span className="text-red-600 dark:text-red-400">{s.occupied} occupied</span>
                {s.reserved > 0 && <span className="text-amber-600 dark:text-amber-400">{s.reserved} reserved</span>}
                {s.maintenance > 0 && <span className="text-gray-500">{s.maintenance} maintenance</span>}
              </div>
            </button>
          );
        })}
      </div>

      {expanded && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold flex items-center gap-2">
              <BedDouble size={18} className="text-forest" /> {expanded} — Rooms
            </h2>
            <div className="flex gap-2">
              {['', 'available', 'occupied', 'reserved', 'maintenance'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${statusFilter === s ? 'bg-forest text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
            {grouped[expanded]
              .filter((r) => !statusFilter || r.status === statusFilter)
              .map((room) => (
                <div key={room.id} className="card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm">{room.room_number}</span>
                  </div>
                  <span className={`badge ${statusStyle[room.status]} text-[10px]`}>{room.status}</span>
                  <p className="text-[11px] text-gray-500">{room.floor}</p>
                  {room.current_guest && <p className="text-[11px] text-gray-500 truncate" title={room.current_guest}>{room.current_guest}</p>}
                  {isOwner && (
                    <select
                      value={room.status}
                      onChange={(e) => changeStatus(room, e.target.value)}
                      className="text-[10px] border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded px-1 py-0.5 w-full"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                      {room.status === 'reserved' && <option value="reserved">Reserved</option>}
                    </select>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
