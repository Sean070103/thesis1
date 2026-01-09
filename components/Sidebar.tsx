'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FileText, AlertTriangle, Bell, Box, DollarSign, BarChart3, Settings, ChevronRight, LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  // Get role badge styles
  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'admin': 
        return {
          bg: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          glow: 'shadow-amber-500/20'
        };
      case 'manager': 
        return {
          bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          glow: 'shadow-blue-500/20'
        };
      case 'staff': 
        return {
          bg: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          glow: 'shadow-emerald-500/20'
        };
      default: 
        return {
          bg: 'bg-slate-500/20',
          text: 'text-slate-400',
          border: 'border-slate-500/30',
          glow: ''
        };
    }
  };

  return (
    <React.Fragment>
      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout? You will need to sign in again to access the system."
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
      />

      <aside className="fixed left-0 top-0 h-full w-72 z-50 overflow-hidden">
        {/* Background with glass effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-black/95 backdrop-blur-2xl" />
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        {/* Right border glow */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-700/50 to-transparent" />
        
        {/* Content */}
        <div className="relative flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-slate-800/30">
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              {/* Logo glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative p-2.5 bg-gradient-to-br from-amber-500 via-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/30">
                <Box className="text-white" size={22} />
              </div>
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight">Autocarpets Inc.</h1>
              <p className="text-slate-500 text-xs font-medium">Inventory Management</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-4 border-b border-slate-800/30">
            <div className="relative group">
              {/* Card glow on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              
              <div className="relative flex items-center gap-3 px-3.5 py-3.5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/30 backdrop-blur-sm">
                {/* Avatar */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-full blur-md" />
                  <div className="relative w-11 h-11 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center border border-slate-600/50 shadow-inner">
                    <User size={20} className="text-slate-300" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const styles = getRoleBadgeStyles(user.role);
                      return (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border} shadow-sm ${styles.glow}`}>
                          <Sparkles size={8} />
                          {user.role.toUpperCase()}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Main Menu Section */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3 flex items-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-slate-700 to-transparent" />
              Main Menu
            </p>
            <nav className="space-y-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Active background */}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent rounded-xl" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full shadow-lg shadow-amber-500/50" />
                      </>
                    )}
                    
                    {/* Hover background */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-slate-800/0 group-hover:bg-slate-800/50 rounded-xl transition-colors duration-300" />
                    )}
                    
                    <div className="relative flex items-center space-x-3">
                      <div className={`relative p-1.5 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-amber-500/20' 
                          : 'bg-transparent group-hover:bg-slate-700/50'
                      }`}>
                        <Icon 
                          size={17} 
                          className={`transition-all duration-300 ${
                            isActive 
                              ? 'text-amber-400' 
                              : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    
                    {isActive && (
                      <ChevronRight size={16} className="relative text-amber-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Other Menu Section */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3 flex items-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-slate-700 to-transparent" />
              Other
            </p>
            <nav className="space-y-1">
              {otherItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    style={{ animationDelay: `${(navItems.length + index) * 50}ms` }}
                  >
                    {/* Active background */}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent rounded-xl" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full shadow-lg shadow-amber-500/50" />
                      </>
                    )}
                    
                    {/* Hover background */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-slate-800/0 group-hover:bg-slate-800/50 rounded-xl transition-colors duration-300" />
                    )}
                    
                    <div className="relative flex items-center space-x-3">
                      <div className={`relative p-1.5 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-amber-500/20' 
                          : 'bg-transparent group-hover:bg-slate-700/50'
                      }`}>
                        <Icon 
                          size={17} 
                          className={`transition-all duration-300 ${
                            isActive 
                              ? 'text-amber-400' 
                              : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    
                    {isActive && (
                      <ChevronRight size={16} className="relative text-amber-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/30 space-y-3">
          {/* System Status Card */}
          <div className="relative overflow-hidden px-4 py-3.5 bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl border border-slate-700/20">
            {/* Subtle pulse animation background */}
            <div className="absolute top-2 right-2 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl animate-pulse" />
            
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-40" />
                <div className="relative w-2.5 h-2.5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
              </div>
              <span className="text-xs text-emerald-400 font-semibold">All systems operational</span>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="group relative w-full overflow-hidden flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-300"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/60 to-slate-800/40 group-hover:from-red-950/40 group-hover:to-red-900/30 transition-all duration-300" />
            
            {/* Border */}
            <div className="absolute inset-0 rounded-xl border border-slate-700/40 group-hover:border-red-700/40 transition-colors duration-300" />
            
            {/* Content */}
            <LogOut size={17} className="relative text-slate-400 group-hover:text-red-400 transition-colors duration-300" />
            <span className="relative text-sm font-semibold text-slate-400 group-hover:text-red-400 transition-colors duration-300">
              Logout
            </span>
          </button>
        </div>
      </div>
      </aside>
    </React.Fragment>
  );
}
