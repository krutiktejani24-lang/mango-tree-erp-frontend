import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('mt_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('mt_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
      <div />
      <div className="flex items-center gap-4">
        <button
          onClick={() => setDark((d) => !d)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-forest text-white flex items-center justify-center font-semibold text-sm">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
