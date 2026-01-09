'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

// Routes that don't need the sidebar/main layout (public auth pages)
const authRoutes = ['/login', '/forgot-password'];

// Admin routes that need sidebar but are admin-only
const adminRoutes = ['/register'];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();

  const isAuthRoute = authRoutes.includes(pathname);
  const isAdminRoute = adminRoutes.includes(pathname);

  // Theme-aware background classes
  const bgClasses = theme === 'dark' 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50';
  
  const cardClasses = theme === 'dark'
    ? 'bg-slate-900/50 border-slate-800/50'
    : 'bg-white/80 border-slate-200/80';

  const textClasses = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClasses} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-500 mx-auto mb-4" size={48} />
          <p className={textClasses}>Loading...</p>
        </div>
      </div>
    );
  }

  // Public auth routes (login) - render without sidebar
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Admin routes (register) - render with sidebar if admin
  if (isAdminRoute && isAuthenticated) {
    return (
      <div className={`flex min-h-screen ${bgClasses} transition-colors duration-300`}>
        <Sidebar />
        <main className="flex-1 ml-72 overflow-y-auto">
          <div className="min-h-screen">
            <div className="max-w-[1600px] mx-auto p-6">
              <div className={`rounded-2xl ${cardClasses} border shadow-xl backdrop-blur-sm overflow-hidden transition-colors duration-300`}>
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Protected routes - render with sidebar if authenticated
  if (isAuthenticated) {
    return (
      <div className={`flex min-h-screen ${bgClasses} transition-colors duration-300`}>
        <Sidebar />
        <main className="flex-1 ml-72 overflow-y-auto">
          <div className="min-h-screen">
            <div className="max-w-[1600px] mx-auto p-6">
              <div className={`rounded-2xl ${cardClasses} border shadow-xl backdrop-blur-sm overflow-hidden transition-colors duration-300`}>
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Not authenticated and not on auth route - will be redirected by AuthContext
  return (
    <div className={`min-h-screen ${bgClasses} flex items-center justify-center transition-colors duration-300`}>
      <div className="text-center">
        <Loader2 className="animate-spin text-amber-500 mx-auto mb-4" size={48} />
        <p className={textClasses}>Redirecting to login...</p>
      </div>
    </div>
  );
}
