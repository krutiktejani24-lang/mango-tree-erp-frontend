import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BedDouble, LogIn, Receipt, FileText, BarChart3, Settings, Users, TreePalm,
} from 'lucide-react';

const ownerLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/check-in', label: 'Check-In / Out', icon: LogIn },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/billing', label: 'Manual Billing', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const staffLinks = [
  { to: '/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/check-in', label: 'Check-In / Out', icon: LogIn },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/billing', label: 'Manual Billing', icon: FileText },
];

export default function Sidebar() {
  const { isOwner } = useAuth();
  const links = isOwner ? ownerLinks : staffLinks;

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-forest-dark text-white flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <img src="/logo/logo.jpeg" alt="Mango Tree Resort ERP" className="w-14 h-14 object-contain"/>
        <div>
          <p className="font-serif font-bold leading-tight">Mango Tree</p>
          <p className="text-[10px] tracking-widest text-gold/80 uppercase">Resort ERP</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-gold text-obsidian font-semibold' : 'text-white/80 hover:bg-white/10'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-[11px] text-white/40 border-t border-white/10">
        © {new Date().getFullYear()} Mango Tree Resort
      </div>
    </aside>
  );
}
