import React from 'react';

export default function StatCard({ label, value, icon: Icon, accent = 'forest', sub }) {
  const accentClasses = {
    forest: 'bg-forest/10 text-forest dark:bg-forest/20',
    gold: 'bg-gold/10 text-gold dark:bg-gold/20',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  };
  return (
    <div className="card flex items-center gap-4 animate-[fadeIn_0.3s_ease]">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentClasses[accent]}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}
