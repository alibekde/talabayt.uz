import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, History, FileBarChart } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { to: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
    { to: '/rooms', label: 'Xonalar', icon: Building2 },
    { to: '/students', label: 'Talabalar', icon: Users },
    { to: '/logs', label: 'Tarix', icon: History },
    { to: '/reports', label: 'Hisobot', icon: FileBarChart },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-gray-200/80 dark:border-slate-800 lg:hidden shadow-lg pb-safe transition-colors">
      <nav className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
