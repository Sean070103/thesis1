'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FileText, AlertTriangle, Bell, Box, DollarSign, BarChart3, Settings, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/materials', label: 'Material Records', icon: Package },
  { href: '/transactions', label: 'Transactions', icon: FileText },
  { href: '/defects', label: 'Defects', icon: AlertTriangle },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50 z-50 shadow-2xl">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg blur opacity-50" />
              <div className="relative p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg">
                <Box className="text-white" size={22} />
              </div>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">MaterialIMS</h1>
              <p className="text-slate-400 text-xs font-medium">admin@materialims.com</p>
            </div>
          </div>
        </div>

        {/* General Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">General</p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800/80 text-white shadow-lg shadow-slate-900/50 border border-slate-700/50'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-r-full" />
                  )}
                  <Icon 
                    size={18} 
                    className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                  />
                  <span className="text-sm font-semibold">{item.label}</span>
                  {isActive && (
                    <Sparkles className="ml-auto text-amber-400" size={14} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Other Menu Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3 px-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Other Menu</p>
              <button className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800/50 rounded">
                <span className="text-lg font-bold">+</span>
              </button>
            </div>
            <nav className="space-y-1.5">
              <Link href="/cost-analysis" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200 border border-transparent hover:border-slate-700/50">
                <DollarSign size={18} />
                <span className="text-sm font-semibold">Cost Analysis</span>
              </Link>
              <Link href="/analytics" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200 border border-transparent hover:border-slate-700/50">
                <BarChart3 size={18} />
                <span className="text-sm font-semibold">Analytics</span>
              </Link>
              <Link href="/settings" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200 border border-transparent hover:border-slate-700/50">
                <Settings size={18} />
                <span className="text-sm font-semibold">Settings</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
