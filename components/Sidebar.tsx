'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FileText, AlertTriangle, Bell, Box, DollarSign, BarChart3, Settings, ChevronRight, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/materials', label: 'Material Records', icon: Package },
  { href: '/transactions', label: 'Transactions', icon: FileText },
  { href: '/defects', label: 'Defects', icon: AlertTriangle },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

const otherItems = [
  { href: '/cost-analysis', label: 'Cost Analysis', icon: DollarSign },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'manager': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'staff': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800/50 z-50">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
              <Box className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight">Autocarpets Inc.</h1>
              <p className="text-slate-500 text-xs">Inventory Management</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-4 border-b border-slate-800/50">
            <div className="flex items-center gap-3 px-3 py-3 bg-slate-800/30 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center border border-slate-600">
                <User size={20} className="text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                    {user.role.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General Section */}
        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Main Menu</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-white border-l-2 border-amber-500'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon 
                        size={18} 
                        className={`transition-colors ${isActive ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'}`}
                      />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={16} className="text-amber-500" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Other Menu Section */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Other</p>
            <nav className="space-y-1">
              {otherItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-white border-l-2 border-amber-500'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon 
                        size={18} 
                        className={`transition-colors ${isActive ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'}`}
                      />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={16} className="text-amber-500" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-slate-800/50 space-y-3">
          <div className="px-3 py-3 bg-slate-800/30 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-emerald-400 font-medium">All systems operational</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800/50 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-all duration-200 border border-slate-700/50 hover:border-red-700/50"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
