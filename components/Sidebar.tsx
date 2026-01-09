'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FileText, AlertTriangle, Bell, Box, DollarSign, BarChart3, Settings, ChevronRight, LogOut, User, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { theme, toggleTheme } = useTheme();
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
        <div className={`absolute inset-0 backdrop-blur-2xl transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-black/95' 
            : 'bg-gradient-to-b from-white/95 via-slate-50/98 to-slate-100/95'
        }`} />
        
        {/* Subtle gradient overlay */}
        <div className={`absolute inset-0 pointer-events-none ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5'
            : 'bg-gradient-to-br from-amber-500/10 via-transparent to-blue-500/5'
        }`} />
        
        {/* Right border glow */}
        <div className={`absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent to-transparent ${
          theme === 'dark' ? 'via-slate-700/50' : 'via-slate-300/80'
        }`} />
        
        {/* Content */}
        <div className="relative flex flex-col h-full">
          {/* Logo/Brand */}
          <div className={`p-6 border-b transition-colors duration-300 ${
            theme === 'dark' ? 'border-slate-800/30' : 'border-slate-200/80'
          }`}>
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              {/* Logo glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative p-2.5 bg-gradient-to-br from-amber-500 via-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/30">
                <Box className="text-white" size={22} />
              </div>
            </div>
            <div>
              <h1 className={`font-bold text-base tracking-tight transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>Autocarpets Inc.</h1>
              <p className={`text-xs font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
              }`}>Inventory Management</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className={`px-4 py-4 border-b transition-colors duration-300 ${
            theme === 'dark' ? 'border-slate-800/30' : 'border-slate-200/80'
          }`}>
            <div className="relative group">
              {/* Card glow on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              
              <div className={`relative flex items-center gap-3 px-3.5 py-3.5 rounded-xl border backdrop-blur-sm transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/30'
                  : 'bg-gradient-to-br from-white/80 to-slate-50/80 border-slate-200/80'
              }`}>
                {/* Avatar */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-full blur-md" />
                  <div className={`relative w-11 h-11 rounded-full flex items-center justify-center shadow-inner transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50'
                      : 'bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/50'
                  }`}>
                    <User size={20} className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}>{user.name}</p>
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
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-3 flex items-center gap-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span className={`w-8 h-px bg-gradient-to-r to-transparent ${
                theme === 'dark' ? 'from-slate-700' : 'from-slate-300'
              }`} />
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
                        ? theme === 'dark' ? 'text-white' : 'text-slate-900'
                        : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Active background */}
                    {isActive && (
                      <>
                        <div className={`absolute inset-0 rounded-xl ${
                          theme === 'dark'
                            ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent'
                            : 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent'
                        }`} />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full shadow-lg shadow-amber-500/50" />
                      </>
                    )}
                    
                    {/* Hover background */}
                    {!isActive && (
                      <div className={`absolute inset-0 rounded-xl transition-colors duration-300 ${
                        theme === 'dark'
                          ? 'bg-slate-800/0 group-hover:bg-slate-800/50'
                          : 'bg-slate-200/0 group-hover:bg-slate-200/70'
                      }`} />
                    )}
                    
                    <div className="relative flex items-center space-x-3">
                      <div className={`relative p-1.5 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-amber-500/20' 
                          : theme === 'dark'
                            ? 'bg-transparent group-hover:bg-slate-700/50'
                            : 'bg-transparent group-hover:bg-slate-300/50'
                      }`}>
                        <Icon 
                          size={17} 
                          className={`transition-all duration-300 ${
                            isActive 
                              ? 'text-amber-400' 
                              : theme === 'dark'
                                ? 'text-slate-500 group-hover:text-slate-300'
                                : 'text-slate-500 group-hover:text-slate-700'
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
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-3 flex items-center gap-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span className={`w-8 h-px bg-gradient-to-r to-transparent ${
                theme === 'dark' ? 'from-slate-700' : 'from-slate-300'
              }`} />
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
                        ? theme === 'dark' ? 'text-white' : 'text-slate-900'
                        : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    style={{ animationDelay: `${(navItems.length + index) * 50}ms` }}
                  >
                    {/* Active background */}
                    {isActive && (
                      <>
                        <div className={`absolute inset-0 rounded-xl ${
                          theme === 'dark'
                            ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent'
                            : 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent'
                        }`} />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full shadow-lg shadow-amber-500/50" />
                      </>
                    )}
                    
                    {/* Hover background */}
                    {!isActive && (
                      <div className={`absolute inset-0 rounded-xl transition-colors duration-300 ${
                        theme === 'dark'
                          ? 'bg-slate-800/0 group-hover:bg-slate-800/50'
                          : 'bg-slate-200/0 group-hover:bg-slate-200/70'
                      }`} />
                    )}
                    
                    <div className="relative flex items-center space-x-3">
                      <div className={`relative p-1.5 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-amber-500/20' 
                          : theme === 'dark'
                            ? 'bg-transparent group-hover:bg-slate-700/50'
                            : 'bg-transparent group-hover:bg-slate-300/50'
                      }`}>
                        <Icon 
                          size={17} 
                          className={`transition-all duration-300 ${
                            isActive 
                              ? 'text-amber-400' 
                              : theme === 'dark'
                                ? 'text-slate-500 group-hover:text-slate-300'
                                : 'text-slate-500 group-hover:text-slate-700'
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
        <div className={`p-4 border-t space-y-3 transition-colors duration-300 ${
          theme === 'dark' ? 'border-slate-800/30' : 'border-slate-200/80'
        }`}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="group relative w-full overflow-hidden flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300"
          >
            {/* Background */}
            <div className={`absolute inset-0 transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-slate-800/60 to-slate-800/40 group-hover:from-amber-950/40 group-hover:to-amber-900/30'
                : 'bg-gradient-to-r from-slate-100 to-slate-50 group-hover:from-amber-100/60 group-hover:to-amber-50/60'
            }`} />
            
            {/* Border */}
            <div className={`absolute inset-0 rounded-xl border transition-colors duration-300 ${
              theme === 'dark'
                ? 'border-slate-700/40 group-hover:border-amber-700/40'
                : 'border-slate-200 group-hover:border-amber-400/60'
            }`} />
            
            {/* Content */}
            <div className="relative flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Moon size={17} className="text-amber-400" />
              ) : (
                <Sun size={17} className="text-amber-500" />
              )}
              <span className={`text-sm font-semibold transition-colors duration-300 ${
                theme === 'dark'
                  ? 'text-slate-400 group-hover:text-amber-400'
                  : 'text-slate-600 group-hover:text-amber-600'
              }`}>
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            
            {/* Toggle Switch */}
            <div className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-slate-700' 
                : 'bg-amber-500'
            }`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
                theme === 'dark' ? 'left-1' : 'left-6'
              }`} />
            </div>
          </button>

          {/* System Status Card */}
          <div className={`relative overflow-hidden px-4 py-3.5 rounded-xl border transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/20'
              : 'bg-gradient-to-br from-white/80 to-slate-50/80 border-slate-200/80'
          }`}>
            {/* Subtle pulse animation background */}
            <div className="absolute top-2 right-2 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl animate-pulse" />
            
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>System Status</p>
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-40" />
                <div className="relative w-2.5 h-2.5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
              </div>
              <span className={`text-xs font-semibold ${
                theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
              }`}>All systems operational</span>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="group relative w-full overflow-hidden flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-300"
          >
            {/* Background */}
            <div className={`absolute inset-0 transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-slate-800/60 to-slate-800/40 group-hover:from-red-950/40 group-hover:to-red-900/30'
                : 'bg-gradient-to-r from-slate-100 to-slate-50 group-hover:from-red-100/60 group-hover:to-red-50/60'
            }`} />
            
            {/* Border */}
            <div className={`absolute inset-0 rounded-xl border transition-colors duration-300 ${
              theme === 'dark'
                ? 'border-slate-700/40 group-hover:border-red-700/40'
                : 'border-slate-200 group-hover:border-red-400/60'
            }`} />
            
            {/* Content */}
            <LogOut size={17} className={`relative transition-colors duration-300 ${
              theme === 'dark'
                ? 'text-slate-400 group-hover:text-red-400'
                : 'text-slate-500 group-hover:text-red-500'
            }`} />
            <span className={`relative text-sm font-semibold transition-colors duration-300 ${
              theme === 'dark'
                ? 'text-slate-400 group-hover:text-red-400'
                : 'text-slate-600 group-hover:text-red-500'
            }`}>
              Logout
            </span>
          </button>
        </div>
      </div>
      </aside>
    </React.Fragment>
  );
}
